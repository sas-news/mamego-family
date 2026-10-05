module.exports = {
    icon: 'mikoshigo',
    body: `        // 神輿: 屋根 + 担ぎ棒 + 揺れ弧
        tri(3, 1.4, cell * 0.9, '#fbbf24', '#b45309', -Math.PI / 2);
        blk(3, 2.6, '#dc2626', '#991b1b');
        seg(1.0, 3.6, 5.0, 3.6, '#92400e', 3.0);
        dot(1.6, 4.4, P1, P1S, cell * 0.34);
        dot(4.4, 4.4, P2, P2S, cell * 0.34);`,
};
