module.exports = {
    icon: 'temizugo',
    body: `        // 手水: 水盤・柄杓・清めの滴
        ring(3, 3.4, cell * 1.15, '#0e7490', 2.4); // 水盤の縁
        c.fillStyle = 'rgba(125,211,252,0.55)';
        c.beginPath(); c.arc(at(3,3.4).x, at(3,3.4).y, cell * 0.95, 0, Math.PI * 2); c.fill(); // 水
        seg(4.6, 1.6, 3.6, 2.9, '#a16207', cell * 0.16); // 柄杓の柄
        ring(4.75, 1.4, cell * 0.34, '#a16207', cell * 0.16); // 柄杓の枡
        dot(2.3, 2.6, '#7dd3fc', '#0284c7', R * 0.34); // 滴
        dot(3.4, 1.9, '#7dd3fc', '#0284c7', R * 0.28);`,
};
