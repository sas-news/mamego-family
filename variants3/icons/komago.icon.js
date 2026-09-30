module.exports = {
    icon: 'komago',
    body: `        // 独楽: 回転する独楽本体 + 回転弧 + 軸
        dot(3, 2.6, P1, P1S, cell * 0.6);
        tri(3, 3.9, cell * 0.55, '#57534e', P1S, Math.PI / 2);
        seg(3, 1.1, 3, 2.0, P1S, 2.4);
        ring(3, 2.9, cell * 0.95, '#38bdf8', 1.4);
        seg(1.5, 4.3, 2.3, 4.7, '#38bdf8', 1.6);
        seg(3.7, 4.7, 4.5, 4.3, '#38bdf8', 1.6);`,
};
