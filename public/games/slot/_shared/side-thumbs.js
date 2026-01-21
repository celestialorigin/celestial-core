/* =========================================
   CELESTIAL SLOT - Shared Side Thumb Loader
   - Loads side images based on folder name (CS-001)
   - Loads vertical label from ./config.json (slotDisplayName)
   ========================================= */
(function () {
    const parts = location.pathname.split("/").filter(Boolean);
    const slotId = parts[parts.length - 2] || "UNKNOWN";

    // Thumb rule (あなたの現状に合わせて維持)
    // /games/slot/CS-001/index.html -> ../../../wip/games/celestial-slot/thumbs/CS-001.png
    const thumbUrl = `../../../wip/games/celestial-slot/thumbs/${slotId}.png`;

    const leftSide = document.querySelector(".side.left");
    const rightSide = document.querySelector(".side.right");
    const L = document.getElementById("side-thumb-left");
    const R = document.getElementById("side-thumb-right");

    function attachImage(img) {
        if (!img) return;
        img.src = thumbUrl;
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
            const side = img.closest(".side");
            if (side) side.style.display = "none";
        };
    }

    function ensureLabel(sideEl, text) {
        if (!sideEl) return;
        let el = sideEl.querySelector(".side-label");
        if (!el) {
            el = document.createElement("div");
            el.className = "side-label";
            sideEl.appendChild(el);
        }
        el.textContent = text;
    }

    async function loadConfig() {
        // index.html と同階層の config.json
        try {
            const res = await fetch("config.json", { cache: "no-store" });
            if (!res.ok) throw new Error("HTTP " + res.status);
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // まず画像を貼る
    attachImage(L);
    attachImage(R);

    // 次に縦文字（config優先）
    loadConfig().then((cfg) => {
        const label =
            (cfg && (cfg.slotDisplayName || cfg.slotName || cfg.displayName)) ||
            // 最低限のフォールバック
            slotId;

        // 両サイドに同じ縦文字を表示
        ensureLabel(leftSide, label);
        ensureLabel(rightSide, label);
    });
})();
