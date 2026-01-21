// public/games/slot/_engine/engine.js
function pad2(n) {
    const s = String(n);
    return s.length >= 2 ? s : "0" + s;
}

function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

async function loadImages(paths) {
    const imgs = [];
    for (const p of paths) {
        const img = new Image();
        img.decoding = "async";
        img.src = p;
        imgs.push(await new Promise((resolve) => {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        }));
    }
    return imgs;
}

function createDummySymbols(n, size = 256) {
    const out = [];
    for (let i = 0; i < n; i++) {
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d");
        ctx.fillStyle = `hsl(${(i / n) * 360}, 90%, 40%)`;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold 64px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`SYM ${i + 1}`, size / 2, size / 2);
        out.push(c);
    }
    return out;
}

export function createEngine(slotDef, dom, fever, effects, audio) {
    const C = {
        REEL_W: 210,
        REEL_H: 630,
        SYMBOL_H: 210,
        VISIBLE_ROWS: 3,
        SPIN_SPEED: 32,
        SNAP_EPS: 6,
        STOP_DELAY_MS: 220,
    };

    const S = {
        running: false,
        status: "IDLE", // IDLE|SPINNING|STOPPING|RESULT
        stopIndex: 0,
        stopRequested: false,
        auto: false,
        autoTimer: null,

        images: [],
        symbolsCount: 9,

        reels: [
            { offset: 0, speed: C.SPIN_SPEED, stopping: false, targetIndex: null },
            { offset: 0, speed: C.SPIN_SPEED, stopping: false, targetIndex: null },
            { offset: 0, speed: C.SPIN_SPEED, stopping: false, targetIndex: null },
        ],
    };

    function setStatus(text) {
        dom.status.textContent = text;
    }

    function setBanner(text, mode = "normal") {
        dom.banner.textContent = text;
        dom.banner.setAttribute("data-mode", mode);
    }

    function setFeverCounter(n) {
        dom.feverCounter.textContent = n > 0 ? `FEVER x${n}` : "";
    }

    async function initAssets() {
        const paths = slotDef.symbols.paths;
        const imgs = await loadImages(paths);
        const good = imgs.filter(Boolean);
        if (good.length >= 3) {
            S.images = imgs.map((x, i) => x || good[i % good.length]);
        } else {
            S.images = createDummySymbols(paths.length || 9);
        }
        S.symbolsCount = S.images.length;

        // randomize offsets
        for (const r of S.reels) {
            r.offset = Math.random() * S.symbolsCount * C.SYMBOL_H;
        }
    }

    function drawReel(ctx, reel) {
        ctx.clearRect(0, 0, C.REEL_W, C.REEL_H);
        const baseIndex = Math.floor(reel.offset / C.SYMBOL_H) % S.symbolsCount;
        const frac = reel.offset % C.SYMBOL_H;

        // draw 4 rows to cover movement
        for (let row = -1; row < C.VISIBLE_ROWS + 1; row++) {
            const idx = (baseIndex + row + S.symbolsCount) % S.symbolsCount;
            const img = S.images[idx];
            const y = (row * C.SYMBOL_H) - frac;

            // cover-fit描画（顔が小さく見えないように）
            coverDraw(ctx, img, 0, y, C.REEL_W, C.SYMBOL_H);
        }

        // center line glow
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, C.SYMBOL_H);
        ctx.lineTo(C.REEL_W, C.SYMBOL_H);
        ctx.stroke();
        ctx.restore();
    }

    function coverDraw(ctx, img, dx, dy, dw, dh) {
        // img can be <img> or <canvas>
        const sw = img.width || img.naturalWidth || 256;
        const sh = img.height || img.naturalHeight || 256;
        const sr = sw / sh;
        const dr = dw / dh;

        let sx = 0, sy = 0, ssw = sw, ssh = sh;
        if (sr > dr) {
            // source is wider -> crop width
            ssw = sh * dr;
            sx = (sw - ssw) / 2;
        } else {
            // source is taller -> crop height
            ssh = sw / dr;
            sy = (sh - ssh) / 2;
        }
        ctx.drawImage(img, sx, sy, ssw, ssh, dx, dy, dw, dh);
    }

    function render() {
        for (let i = 0; i < 3; i++) {
            const canvas = dom.reels[i];
            const ctx = canvas.getContext("2d");
            drawReel(ctx, S.reels[i]);
        }
    }

    function tick() {
        if (!S.running) return;

        // speed (OMEGA = time-slowにより視覚だけ遅くなるが、物理も少し調整可能)
        const speedMul = document.body.classList.contains("time-slow") ? 0.65 : 1.0;

        for (const r of S.reels) {
            if (S.status === "SPINNING") {
                r.offset += r.speed * speedMul;
            }

            if (S.status === "STOPPING" && r.stopping) {
                // snap to targetIndex
                const target = r.targetIndex ?? 0;
                const targetOffset = target * C.SYMBOL_H;
                // normalize current offset within [0, total)
                const total = S.symbolsCount * C.SYMBOL_H;
                let cur = r.offset % total;
                if (cur < 0) cur += total;

                // we want center row == target -> baseIndex should become target-1
                // Our displayed center row corresponds to baseIndex+1
                const desiredBase = (target - 1 + S.symbolsCount) % S.symbolsCount;
                const desired = desiredBase * C.SYMBOL_H;

                let diff = desired - cur;
                // pick shortest wrap
                if (diff > total / 2) diff -= total;
                if (diff < -total / 2) diff += total;

                // approach
                r.offset += diff * 0.22;

                if (Math.abs(diff) < C.SNAP_EPS) {
                    // finalize snap
                    const base = desired;
                    // bring offset to match desired base exactly
                    r.offset = r.offset - (cur - base);
                    r.stopping = false;
                }
            }
        }

        render();

        // stopped?
        if (S.status === "STOPPING") {
            const anyStopping = S.reels.some(r => r.stopping);
            if (!anyStopping) {
                S.status = "RESULT";
                onResult();
            }
        }

        requestAnimationFrame(tick);
    }

    function getCenterSymbolIndex(reel) {
        const baseIndex = Math.floor(reel.offset / C.SYMBOL_H) % S.symbolsCount;
        return (baseIndex + 1 + S.symbolsCount) % S.symbolsCount;
    }

    function computeOutcome() {
        // 1) FEVER中は確定当たり
        if (fever.isActive()) {
            const forced = Math.floor(Math.random() * S.symbolsCount);
            return { win: true, forcedIndex: forced, isJackpot: forced === slotDef.symbols.jackpotIndex };
        }

        // 2) 通常：winRateで抽選
        const win = Math.random() < slotDef.rates.win;
        if (!win) return { win: false, forcedIndex: null, isJackpot: false };

        // 当たり時は “一つの絵柄に強制”
        const forcedIndex = Math.floor(Math.random() * S.symbolsCount);
        const isJackpot = forcedIndex === slotDef.symbols.jackpotIndex;
        return { win: true, forcedIndex, isJackpot };
    }

    async function onResult() {
        const a = getCenterSymbolIndex(S.reels[0]);
        const b = getCenterSymbolIndex(S.reels[1]);
        const c = getCenterSymbolIndex(S.reels[2]);

        const isWin = (a === b && b === c);
        const isJackpot = isWin && (a === slotDef.symbols.jackpotIndex);

        if (isWin) {
            if (isJackpot) {
                setBanner("JACKPOT!!!", "jackpot");
                audio.playWinTone("jackpot");
                // jackpot cutin
                effects.playSeq(["omega_cutinThumb", "burst", "neonFrame"], {});
            } else {
                setBanner("WIN!!", "win");
                audio.playWinTone("win");
            }

            // FEVER中の当たり：延長抽選
            if (fever.isActive()) {
                const ex = fever.tryExtend();
                // FEVER中のwin演出（脳汁）
                const pool = fever.getWinEffectsPool();
                if (pool.length) effects.playPool(pool, {});
                if (isJackpot) {
                    // FEVER中jackpotは “上書きしない” 代わりに追加脳汁
                    effects.play("neonFrame", {});
                    effects.play("symbolBurst", {});
                }
            } else {
                // 通常時当たり：FEVER抽選
                effects.playPool(["flashGrid", "burst", "scanline", "neonFrame", "roulette", "splitPanels", "tripleZoom", "symbolBurst"], {});
                if (Math.random() < slotDef.rates.feverStartOnWin) {
                    await fever.enter({ isJackpot });
                    setBanner("FEVER!!", "fever");
                }
            }
        } else {
            setBanner("TRY AGAIN", "lose");
        }

        // FEVER残カウント更新 / 終了判定
        if (fever.isActive()) {
            setFeverCounter(fever.remaining());
            if (fever.remaining() <= 0) {
                await fever.exit();
                setFeverCounter(0);
                setBanner("BACK TO NORMAL", "normal");
            }
        }

        S.status = "IDLE";
        S.stopIndex = 0;
        S.stopRequested = false;

        if (S.auto) {
            scheduleAutoSpin();
        }
    }

    function scheduleAutoSpin() {
        clearTimeout(S.autoTimer);
        S.autoTimer = setTimeout(() => {
            spin();
        }, slotDef.auto.intervalMs);
    }

    async function spin() {
        await audio.unlock();

        // start bgm if needed
        if (!fever.isActive()) {
            audio.playBgmNormal();
        }

        if (S.status !== "IDLE") return;

        // FEVERなら回数消費
        if (fever.isActive()) {
            fever.consumeSpin();
            setFeverCounter(fever.remaining());
        }

        const outcome = computeOutcome();

        // reset reels
        for (const r of S.reels) {
            r.stopping = false;
            r.targetIndex = null;
        }

        // If win -> force all reels to same symbol
        if (outcome.win) {
            for (const r of S.reels) r.targetIndex = outcome.forcedIndex;
        }

        setStatus("SPINNING");
        setBanner(fever.isActive() ? "FEVER SPIN" : "SPINNING", fever.isActive() ? "fever" : "normal");

        S.status = "SPINNING";
        S.stopIndex = 0;
        S.stopRequested = false;

        // Auto stop sequence (押さなくても止まる)
        setTimeout(() => requestStop(), 420);
    }

    function requestStop() {
        if (S.status !== "SPINNING") return;
        if (S.stopRequested) return;
        S.stopRequested = true;

        setStatus("STOPPING");
        S.status = "STOPPING";

        // stop reels sequentially
        stopReel(0);
        setTimeout(() => stopReel(1), C.STOP_DELAY_MS);
        setTimeout(() => stopReel(2), C.STOP_DELAY_MS * 2);
    }

    function stopReel(i) {
        const r = S.reels[i];
        r.stopping = true;
        // If no forced target, pick random (but we already prepared for lose)
        if (r.targetIndex == null) r.targetIndex = Math.floor(Math.random() * S.symbolsCount);
    }

    function toggleAuto() {
        S.auto = !S.auto;
        dom.btnAuto.setAttribute("data-on", S.auto ? "1" : "0");
        dom.btnAuto.textContent = S.auto ? "AUTO: ON" : "AUTO: OFF";
        if (S.auto && S.status === "IDLE") scheduleAutoSpin();
        if (!S.auto) clearTimeout(S.autoTimer);
    }

    function start() {
        S.running = true;

        // setup canvas sizes
        for (const c of dom.reels) {
            c.width = C.REEL_W;
            c.height = C.REEL_H;
        }

        setStatus("READY");
        setBanner("READY", "normal");
        setFeverCounter(0);

        initAssets().then(() => {
            render();
            requestAnimationFrame(tick);
        });
    }

    return {
        start,
        spin,
        requestStop,
        toggleAuto,
    };
}
