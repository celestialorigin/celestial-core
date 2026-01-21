; (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const slotId = parts[parts.length - 2]; // CS-001

    // ✅ 常に /games/slot/_shared/thumbs/ を見る（celestial-project の有無に影響されない）
    const thumbUrl = `../_shared/thumbs/${slotId}.png`;

    const L = document.getElementById('side-thumb-left');
    const R = document.getElementById('side-thumb-right');

    function attach(img) {
        if (!img) return;
        img.src = thumbUrl;
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
            const side = img.closest('.side');
            if (side) side.style.display = 'none';
        };
    }

    attach(L);
    attach(R);
})();
