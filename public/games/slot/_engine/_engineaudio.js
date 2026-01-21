// public/games/slot/_engine/audio.js
export function createAudio(slotDef, dom) {
    const state = {
        ctx: null,
        unlocked: false,
        bgmNormal: new Audio(slotDef.audio.normalBgm),
        bgmFever: null,
        currentBgm: null,
        master: clamp(slotDef.audio.master, 0, 1),
        bgmVol: clamp(slotDef.audio.bgm, 0, 1),
        seVol: clamp(slotDef.audio.se, 0, 1),
    };

    state.bgmNormal.loop = true;
    state.bgmNormal.volume = state.master * state.bgmVol;

    function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }

    function ensureContext() {
        if (state.ctx) return state.ctx;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        state.ctx = new Ctx();
        return state.ctx;
    }

    async function unlock() {
        if (state.unlocked) return true;
        try {
            ensureContext();
            // iOS/Safari対策：短い無音再生
            const ctx = state.ctx;
            if (ctx && ctx.state === "suspended") await ctx.resume();
            state.unlocked = true;
            return true;
        } catch (e) {
            console.warn("[audio] unlock failed", e);
            return false;
        }
    }

    function setMaster(v) {
        state.master = clamp(v, 0, 1);
        applyVolumes();
    }

    function applyVolumes() {
        if (state.bgmNormal) state.bgmNormal.volume = state.master * state.bgmVol;
        if (state.bgmFever) state.bgmFever.volume = state.master * state.bgmVol;
    }

    async function playBgmNormal() {
        await unlock();
        if (state.currentBgm === state.bgmNormal) return;
        await crossfadeTo(state.bgmNormal);
    }

    async function playBgmFever(url) {
        await unlock();
        if (!url) url = slotDef.audio.fallbackFeverBgm;
        if (!state.bgmFever || state.bgmFever.src !== new URL(url, location.href).href) {
            state.bgmFever = new Audio(url);
            state.bgmFever.loop = true;
            state.bgmFever.volume = 0;
        }
        await crossfadeTo(state.bgmFever);
    }

    async function crossfadeTo(next) {
        const prev = state.currentBgm;
        state.currentBgm = next;

        // start next
        try {
            next.currentTime = 0;
            await next.play();
        } catch (e) {
            // autoplay blocked: user action later will fix
            console.warn("[audio] bgm play blocked", e);
        }

        const target = state.master * state.bgmVol;
        const steps = 12;
        const dur = 280;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            if (prev) prev.volume = (1 - t) * target;
            next.volume = t * target;
            await wait(dur / steps);
        }
        if (prev) {
            try { prev.pause(); } catch { }
        }
    }

    function wait(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    // Simple win tones (WebAudio)
    function playWinTone(kind = "win") {
        const ctx = ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = kind === "jackpot" ? 660 : 440;
        osc.connect(gain);

        const peak = 0.18 * state.master * state.seVol;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    return {
        unlock,
        setMaster,
        playBgmNormal,
        playBgmFever,
        playWinTone,
        applyVolumes,
    };
}
