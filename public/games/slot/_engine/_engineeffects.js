// public/games/slot/_engine/effects.js
export function createEffects(slotDef, dom, audio) {
    const active = new Set();
    let auraId = null;

    function clearLayer(layerEl) {
        while (layerEl.firstChild) layerEl.removeChild(layerEl.firstChild);
    }

    function clearAllFx() {
        clearLayer(dom.fxLayer);
        clearLayer(dom.cutinLayer);
        active.clear();
        auraId = null;
        document.body.classList.remove("aura-on");
        document.body.removeAttribute("data-aura");
    }

    function setAura(id) {
        auraId = id || null;
        if (!auraId) {
            document.body.classList.remove("aura-on");
            document.body.removeAttribute("data-aura");
            return;
        }
        document.body.classList.add("aura-on");
        document.body.setAttribute("data-aura", auraId);
    }

    function play(id, params = {}) {
        // One-shot effects
        const handler = FX[id];
        if (!handler) {
            console.warn("[fx] unknown:", id);
            return;
        }
        handler(params);
    }

    function playPool(ids, params = {}) {
        if (!Array.isArray(ids) || ids.length === 0) return;
        const pick = ids[Math.floor(Math.random() * ids.length)];
        play(pick, params);
    }

    function playSeq(ids, params = {}) {
        if (!Array.isArray(ids) || ids.length === 0) return Promise.resolve();
        return ids.reduce((p, id) => p.then(() => {
            play(id, params);
            return wait(FX_META[id]?.delayAfter ?? 180);
        }), Promise.resolve());
    }

    function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function mkDiv(cls) {
        const d = document.createElement("div");
        d.className = cls;
        return d;
    }

    function timedRemove(el, ms) {
        setTimeout(() => { try { el.remove(); } catch { } }, ms);
    }

    // ---- FX Implementations (DOM-based, fast, extendable) ----
    const FX_META = {
        flashGrid: { life: 650 },
        scanline: { life: 700 },
        burst: { life: 600 },
        tripleZoom: { life: 650 },
        symbolBurst: { life: 750 },
        splitPanels: { life: 720 },
        neonFrame: { life: 900 },
        roulette: { life: 950 },
        // fever
        fvr_banner: { life: 900, delayAfter: 120 },
        fvr_screenCrack: { life: 700 },
        fvr_extendPulse: { life: 550 },
        fvr_fadeOut: { life: 420 },
        // omega
        omega_intrusion: { life: 1100, delayAfter: 180 },
        omega_timeSlow: { life: 900, delayAfter: 100 },
        omega_cutinThumb: { life: 1200, delayAfter: 220 },
        omega_realityRip: { life: 900 },
        omega_corePulse: { life: 850 },
        omega_glyphStorm: { life: 950 },
        omega_overheat: { life: 750 },
        omega_afterglow: { life: 900 },
    };

    const FX = {
        flashGrid() {
            const el = mkDiv("fx fx-flashGrid");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.flashGrid.life);
        },

        scanline() {
            const el = mkDiv("fx fx-scanline");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.scanline.life);
        },

        burst() {
            const el = mkDiv("fx fx-burst");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.burst.life);
        },

        tripleZoom() {
            const el = mkDiv("fx fx-tripleZoom");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.tripleZoom.life);
        },

        symbolBurst() {
            const el = mkDiv("fx fx-symbolBurst");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.symbolBurst.life);
        },

        splitPanels() {
            const el = mkDiv("fx fx-splitPanels");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.splitPanels.life);
        },

        neonFrame() {
            const el = mkDiv("fx fx-neonFrame");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.neonFrame.life);
        },

        roulette() {
            const el = mkDiv("fx fx-roulette");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.roulette.life);
        },

        // ----- Fever common helpers -----
        fvr_banner({ text = "FEVER!!" } = {}) {
            const el = mkDiv("fx fx-banner");
            el.textContent = text;
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.fvr_banner.life);
        },

        fvr_screenCrack() {
            const el = mkDiv("fx fx-crack");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.fvr_screenCrack.life);
        },

        fvr_extendPulse() {
            const el = mkDiv("fx fx-extendPulse");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.fvr_extendPulse.life);
        },

        fvr_fadeOut() {
            const el = mkDiv("fx fx-fadeOut");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.fvr_fadeOut.life);
        },

        // ----- Aura IDs (setAuraで扱うだけ) -----
        aura_crimson() { setAura("aura_crimson"); },
        aura_azure() { setAura("aura_azure"); },
        aura_violet() { setAura("aura_violet"); },
        aura_gold() { setAura("aura_gold"); },
        aura_neon() { setAura("aura_neon"); },
        aura_void() { setAura("aura_void"); },
        aura_angel() { setAura("aura_angel"); },
        aura_beast() { setAura("aura_beast"); },
        aura_celestial() { setAura("aura_celestial"); },

        // ----- OMEGA -----
        omega_intrusion() {
            const el = mkDiv("fx fx-omegaIntrusion");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.omega_intrusion.life);
        },

        omega_timeSlow() {
            document.body.classList.add("time-slow");
            setTimeout(() => document.body.classList.remove("time-slow"), FX_META.omega_timeSlow.life);
        },

        omega_cutinThumb() {
            // thumb cutin
            const img = document.createElement("img");
            img.className = "cutin-img";
            img.src = `./assets/thumb/${slotDef.id}.png`;
            dom.cutinLayer.appendChild(img);
            timedRemove(img, FX_META.omega_cutinThumb.life);
        },

        omega_realityRip() {
            const el = mkDiv("fx fx-omegaRip");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.omega_realityRip.life);
        },

        omega_corePulse() {
            const el = mkDiv("fx fx-omegaCorePulse");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.omega_corePulse.life);
        },

        omega_glyphStorm() {
            const el = mkDiv("fx fx-omegaGlyphs");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.omega_glyphStorm.life);
        },

        omega_overheat() {
            const el = mkDiv("fx fx-omegaOverheat");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.omega_overheat.life);
        },

        omega_afterglow() {
            const el = mkDiv("fx fx-omegaAfterglow");
            dom.fxLayer.appendChild(el);
            timedRemove(el, FX_META.omega_afterglow.life);
        },
    };

    return {
        clearAllFx,
        play,
        playPool,
        playSeq,
        setAura,
        meta: FX_META,
    };
}
