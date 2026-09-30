module.exports = {
    icon: 'chabakogo',
    body: `        // 茶箱: 葛籠の箱と持ち手、茶碗
        seg(1.8, 2.6, 4.2, 2.6, '#92600e', 2);     // 箱上縁
        seg(1.8, 4.6, 4.2, 4.6, '#92600e', 2);     // 箱下縁
        seg(1.8, 2.6, 1.8, 4.6, '#92600e', 2);     // 左縁
        seg(4.2, 2.6, 4.2, 4.6, '#92600e', 2);     // 右縁
        c.beginPath(); c.arc(at(3, 2.6).x, at(3, 2.6).y - cell * 0.15, cell * 0.5, Math.PI, Math.PI * 2); c.strokeStyle = '#713f12'; c.lineWidth = 2; c.stroke(); // 持ち手
        dot(3, 3.7, '#166534', '#14532d', cell * 0.45); // 中の茶碗`,
};
