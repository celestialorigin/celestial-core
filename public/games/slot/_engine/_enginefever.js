// public/games/slot/_engine/fever.js
export function createFeverSystem(slotDef, effects, audio) {
    const state = {
        active: null,        // {def, remaining, total, mode}
        lastFeverId: null,
    };

    function isActive() {
        return !!state.active;
    }

    function current() {
        return state.active?.def || null;
    }

    function remaining() {
        return state.active?.remaining ?? 0;
    }

    function pickFeverDef(isJackpot = false) {
        // jackpotは超レア抽選を優遇（ただし確率は“10年設計上”ここで調整可能）
        const catalog = slotDef.feverCatalog || [];
        if (!catalog.length) return null;

        if (isJackpot) {
            const omega = catalog.find(x => x.rarity === "ultra");
            if (omega && Math.random() < 0.25) return omega; // jackpotの25%でOMEGA
        }

        // ultraは通常だと薄め
        const commons = catalog.filter(x => x.rarity !== "ultra");
        const omega = catalog.find(x => x.rarity === "ultra");

        if (omega && Math.random() < 0.02) return omega; // 通常2%で出現
        return commons[Math.floor(Math.random() * commons.length)];
    }

    async function enter({ isJackpot = false } = {}) {
        const def = pickFeverDef(isJackpot);
        if (!def) return null;

        state.active = {
            def,
            remaining: def.spins ?? 10,
            total: def.spins ?? 10,
            mode: def.id === "FVR_OMEGA" ? "OMEGA" : "NORMAL",
        };
        state.lastFeverId = def.id;

        document.body.classList.add("fever-mode");
        document.body.setAttribute("data-fever", def.id);

        // BGM
        if (def.audio?.bgm) {
            await audio.playBgmFever(def.audio.bgm);
        }

        // onEnter effects
        const onEnter = def.effects?.onEnter || [];
        // auraは setAura として扱う（effects側に実装してある）
        for (const id of onEnter) effects.play(id, {});

        return def;
    }

    async function exit() {
        const def = state.active?.def;
        if (!def) return;

        const onExit = def.effects?.onExit || [];
        for (const id of onExit) effects.play(id, {});

        state.active = null;
        document.body.classList.remove("fever-mode");
        document.body.removeAttribute("data-fever");

        effects.setAura(null);
        await audio.playBgmNormal();
    }

    function consumeSpin() {
        if (!state.active) return;
        state.active.remaining = Math.max(0, state.active.remaining - 1);
    }

    function canExtend() {
        const def = state.active?.def;
        if (!def) return false;
        const ex = def.extend;
        return ex && typeof ex.chance === "number" && typeof ex.addSpins === "number" && typeof ex.maxSpins === "number";
    }

    function tryExtend() {
        const a = state.active;
        if (!a || !canExtend()) return { extended: false, reason: "no-extend" };

        const def = a.def;
        const ex = def.extend;
        if (a.remaining >= ex.maxSpins) return { extended: false, reason: "max" };

        if (Math.random() < ex.chance) {
            a.remaining = Math.min(ex.maxSpins, a.remaining + ex.addSpins);
            (def.effects?.onExtend || []).forEach(id => effects.play(id, {}));
            return { extended: true, reason: "hit" };
        }
        return { extended: false, reason: "miss" };
    }

    function getWinEffectsPool() {
        const def = state.active?.def;
        if (!def) return [];
        return def.effects?.onWinPool || [];
    }

    return {
        isActive,
        current,
        remaining,
        enter,
        exit,
        consumeSpin,
        tryExtend,
        getWinEffectsPool,
    };
}
