module.exports = {
    icon: 'onmyogo',
    body: `        // 陰陽: 五行の五芒星と陰陽の石
        {
            const pts = [];
            for (let k = 0; k < 5; k++) {
                const a = k * Math.PI * 2 / 5 - Math.PI / 2;
                pts.push([3 + Math.cos(a) * 1.9, 3 + Math.sin(a) * 1.9]);
            }
            [[0,2],[2,4],[4,1],[1,3],[3,0]].forEach(([a,b]) =>
                seg(pts[a][0], pts[a][1], pts[b][0], pts[b][1], 'rgba(180,83,9,0.55)', 1.2));
            const cols = ['#22c55e', '#ef4444', '#eab308', '#e2e8f0', '#3b82f6'];
            pts.forEach(([x, y], k) => dot(x, y, cols[k], '#78350f', cell * 0.22));
        }
        dot(2.75, 3, P1, P1S, R * 0.55); dot(3.25, 3, P2, P2S, R * 0.55); // 陰陽`,
};
