// public/games/slot/_engine/boot.js
import { createEngine } from "./engine.js";
import { createFeverSystem } from "./fever.js";
import { createEffects } from "./effects.js";
import { createAudio } from "./audio.js";

function getSlotIdFromPath() {
    // .../games/slot/CS-001/index.html => CS-001
    const parts = location.pathname.split("/").filter(Boolean);
    const idx = parts.lastIndexOf("slot");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    // fallback: folder name before index.html
    return parts[parts.length - 2] || "UNKNOWN";
}

async function fetchJsonSafe(url, timeoutMs = 1500) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
        return await res.json();
    } catch (e) {
        console.warn("[boot] fetchJsonSafe failed:", url, e);
        return null;
    } finally {
        clearTimeout(t);
    }
}

function pad2(n) {
    const s = String(n);
    return s.length >= 2 ? s : "0" + s;
}

function buildAutoSymbolPaths(count, base = "assets/slotimages") {
    const out = [];
    for (let i = 1; i <= count; i++) out.push(`${base}/${pad2(i)}_symbol.png`);
    return out;
}

function normalizeConfigToSlotDef(slotId, configJson, symbolsJson) {
    // --- Defaults (10年固定の“正規形”) ---
    const slotDef = {
        id: slotId,
        displayName: "~LUKIA SLOT ver~",
        machineTitle: "CELESTIAL SLOT UNIT",
        links: {
            partnerLabel: "COLLAB",
            partnerName: "PARTNER",
            partnerUrl: "https://celestial-observers.com",
            celestialUrl: "https://celestial-observers.com",
            celestialButtonLabel: "CELESTIAL Web Site",
        },
        theme: {
            accent: "#b000ff",
            bg: "#050008",
        },
        ui: {
            showSideThumbs: true,
            showScanlines: true,
        },
        symbols: {
            // “symbols.json が無くても” 9枚を規定で読む
            paths: buildAutoSymbolPaths(9),
            // ジャックポット絵柄（9枚目= index 8）
            jackpotIndex: 8,
        },
        rates: {
            win: 0.14,
            feverStartOnWin: 0.10, // 当たり時にFEVER抽選
        },
        auto: {
            enabledByDefault: false,
            intervalMs: 800,
        },
        audio: {
            normalBgm: "assets/audio/bgm_normal.wav",
            // Feverは catalog のBGMを使う。fallbackとして1本
            fallbackFeverBgm: "assets/audio/bgm_fever.wav",
            master: 0.7,
            bgm: 0.65,
            se: 0.7,
        },
        feverCatalog: [],
    };

    // --- Merge from existing config.json (互換) ---
    if (configJson && typeof configJson === "object") {
        if (configJson.slotDisplayName) slotDef.displayName = String(configJson.slotDisplayName);
        if (configJson.machineTitle) slotDef.machineTitle = String(configJson.machineTitle);

        // links
        if (configJson.partnerLabel) slotDef.links.partnerLabel = String(configJson.partnerLabel);
        if (configJson.partnerName) slotDef.links.partnerName = String(configJson.partnerName);
        if (configJson.partnerUrl) slotDef.links.partnerUrl = String(configJson.partnerUrl);
        if (configJson.celestialUrl) slotDef.links.celestialUrl = String(configJson.celestialUrl);
        if (configJson.celestialButtonLabel) slotDef.links.celestialButtonLabel = String(configJson.celestialButtonLabel);

        // theme
        if (configJson.theme?.accent) slotDef.theme.accent = String(configJson.theme.accent);
        if (configJson.theme?.bg) slotDef.theme.bg = String(configJson.theme.bg);

        // rates
        if (typeof configJson.winRate === "number") slotDef.rates.win = configJson.winRate;

        // auto
        if (typeof configJson.autoSpinIntervalMs === "number") slotDef.auto.intervalMs = configJson.autoSpinIntervalMs;

        // bgm
        if (typeof configJson.masterVolume === "number") slotDef.audio.master = configJson.masterVolume;
        if (typeof configJson.bgmVolume === "number") slotDef.audio.bgm = configJson.bgmVolume;
        if (typeof configJson.sfxVolume === "number") slotDef.audio.se = configJson.sfxVolume;
        if (typeof configJson.bgm?.normal === "string") slotDef.audio.normalBgm = configJson.bgm.normal;

        // fever start rate (旧: fever.randomFeverOnAnyWin.rate)
        const rate = configJson.fever?.randomFeverOnAnyWin?.rate;
        if (typeof rate === "number") slotDef.rates.feverStartOnWin = rate;

        // fever BGM list (旧: bgm.fever = ["...","..."])
        const feverList = Array.isArray(configJson.bgm?.fever) ? configJson.bgm.fever.filter(x => typeof x === "string") : [];
        if (feverList.length > 0) slotDef.audio.fallbackFeverBgm = feverList[0];

        // fever count (旧: fever.visual.sceneCount)
        const sceneCount = configJson.fever?.visual?.sceneCount;
        const commonCount = (typeof sceneCount === "number" && sceneCount >= 1) ? Math.min(12, Math.max(1, Math.floor(sceneCount))) : 9;

        // 9 + ultra(1) の器を今日ここで生成（後日いくらでも差し替え可）
        // ※既存の BGM(feverList) をローテーションして割り当て
        const bgmPick = (i) => feverList.length ? feverList[i % feverList.length] : slotDef.audio.fallbackFeverBgm;

        const COMMON_IDS = [
            "FVR_CRIMSON",
            "FVR_AZURE",
            "FVR_VIOLET",
            "FVR_GOLD",
            "FVR_NEON",
            "FVR_VOID",
            "FVR_ANGEL",
            "FVR_BEAST",
            "FVR_CELESTIAL",
        ];

        const COMMON_LABELS = [
            "CRIMSON FEVER",
            "AZURE FEVER",
            "VIOLET FEVER",
            "GOLD FEVER",
            "NEON FEVER",
            "VOID FEVER",
            "ANGEL FEVER",
            "BEAST FEVER",
            "CELESTIAL FEVER",
        ];

        const COMMON_AURAS = [
            "aura_crimson",
            "aura_azure",
            "aura_violet",
            "aura_gold",
            "aura_neon",
            "aura_void",
            "aura_angel",
            "aura_beast",
            "aura_celestial",
        ];

        const winPools = [
            ["flashGrid", "neonFrame", "symbolBurst"],
            ["scanline", "burst", "tripleZoom"],
            ["roulette", "splitPanels", "neonFrame"],
            ["burst", "flashGrid", "tripleZoom"],
            ["neonFrame", "scanline", "roulette"],
            ["splitPanels", "scanline", "flashGrid"],
            ["tripleZoom", "burst", "neonFrame"],
            ["symbolBurst", "splitPanels", "burst"],
            ["flashGrid", "roulette", "symbolBurst"],
        ];

        slotDef.feverCatalog = [];

        const nCommon = Math.min(commonCount, 9);
        for (let i = 0; i < nCommon; i++) {
            slotDef.feverCatalog.push({
                id: COMMON_IDS[i],
                rarity: "common",
                label: COMMON_LABELS[i],
                priority: 10 + i,
                spins: 10,
                guaranteeWin: true,
                extend: { chance: 0.35, addSpins: 3, maxSpins: 20 },
                audio: { bgm: bgmPick(i), duckNormalBgm: true },
                effects: {
                    onEnter: ["fvr_banner", COMMON_AURAS[i], "fvr_screenCrack"],
                    onWinPool: winPools[i],
                    onExtend: ["fvr_extendPulse"],
                    onExit: ["fvr_fadeOut"],
                },
            });
        }

        // 超レア1個（オメガ）
        slotDef.feverCatalog.push({
            id: "FVR_OMEGA",
            rarity: "ultra",
            label: "OMEGA FEVER",
            priority: 999,
            spins: 12,
            guaranteeWin: true,
            extend: { chance: 0.55, addSpins: 4, maxSpins: 30 },
            audio: { bgm: bgmPick(99), duckNormalBgm: true },
            effects: {
                onEnter: ["omega_intrusion", "omega_timeSlow", "omega_cutinThumb"],
                onWinPool: ["omega_realityRip", "omega_corePulse", "omega_glyphStorm"],
                onExtend: ["omega_overheat"],
                onExit: ["omega_afterglow"],
            },
        });
    }

    // --- Merge symbols.json if present ---
    if (symbolsJson && Array.isArray(symbolsJson.symbols) && symbolsJson.symbols.every(s => typeof s === "string")) {
        slotDef.symbols.paths = symbolsJson.symbols;
    }

    return slotDef;
}

export async function boot() {
    const slotId = getSlotIdFromPath();
    console.log("[boot] slotId =", slotId);

    // Load json
    const configJson = await fetchJsonSafe("./config.json", 1500);
    const symbolsJson = await fetchJsonSafe("./symbols.json", 1500);

    const slotDef = normalizeConfigToSlotDef(slotId, configJson, symbolsJson);

    // Attach theme
    document.documentElement.style.setProperty("--accent", slotDef.theme.accent);
    document.documentElement.style.setProperty("--bg", slotDef.theme.bg);

    // DOM refs
    const dom = {
        root: document.body,
        title: document.getElementById("machine-title"),
        displayName: document.getElementById("slot-display-name"),
        btnSpin: document.getElementById("btn-spin"),
        btnAuto: document.getElementById("btn-auto"),
        btnStop: document.getElementById("btn-stop"),
        status: document.getElementById("status-text"),
        banner: document.getElementById("banner"),
        feverCounter: document.getElementById("fever-counter"),
        fxLayer: document.getElementById("fx-layer"),
        cutinLayer: document.getElementById("cutin-layer"),
        reels: [
            document.getElementById("reel0"),
            document.getElementById("reel1"),
            document.getElementById("reel2"),
        ],
        linkPartner: document.getElementById("partner-link"),
        btnCelestial: document.getElementById("btn-celestial"),
        sideLeft: document.getElementById("side-left"),
        sideRight: document.getElementById("side-right"),
        sideImgLeft: document.getElementById("side-img-left"),
        sideImgRight: document.getElementById("side-img-right"),
    };

    // apply texts/links
    dom.title.textContent = slotDef.machineTitle;
    dom.displayName.textContent = slotDef.displayName;

    dom.linkPartner.textContent = slotDef.links.partnerLabel || "PARTNER";
    dom.linkPartner.addEventListener("click", () => window.open(slotDef.links.partnerUrl, "_blank", "noopener,noreferrer"));
    dom.btnCelestial.textContent = slotDef.links.celestialButtonLabel || "CELESTIAL Web Site";
    dom.btnCelestial.addEventListener("click", () => window.open(slotDef.links.celestialUrl, "_blank", "noopener,noreferrer"));

    // side thumbs (同一thumbを左右に貼る：筐体印刷感)
    const thumbUrl = `./assets/thumb/${slotId}.png`;
    const attachThumb = (img) =>
        new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = thumbUrl;
        });

    if (slotDef.ui.showSideThumbs) {
        const okL = await attachThumb(dom.sideImgLeft);
        const okR = await attachThumb(dom.sideImgRight);
        if (!okL || !okR) {
            dom.sideLeft.style.display = "none";
            dom.sideRight.style.display = "none";
        }
    } else {
        dom.sideLeft.style.display = "none";
        dom.sideRight.style.display = "none";
    }

    // create subsystems
    const audio = createAudio(slotDef, dom);
    const effects = createEffects(slotDef, dom, audio);
    const fever = createFeverSystem(slotDef, effects, audio);
    const engine = createEngine(slotDef, dom, fever, effects, audio);

    // wire UI
    dom.btnSpin.addEventListener("click", () => engine.spin());
    dom.btnAuto.addEventListener("click", () => engine.toggleAuto());
    dom.btnStop.addEventListener("click", () => engine.requestStop());

    // Touch/click anywhere on reels to stop next
    document.getElementById("game-container").addEventListener("pointerdown", (e) => {
        // don't steal clicks from buttons
        const t = e.target;
        if (t && (t.closest(".btn") || t.closest("a"))) return;
        engine.requestStop();
    });

    engine.start();
    window.__CS_ENGINE__ = engine;
    console.log("[boot] ready");
}
