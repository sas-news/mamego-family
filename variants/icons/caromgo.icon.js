module.exports = {
    icon: 'caromgo',
    body: `        // 撞球: 手球が敵球をポケットへ
        dot(1.4, 2.2, P1, P1S, cell * 0.44);
        dot(3.2, 3.0, P2, P2S, cell * 0.42);
        ring(5.0, 5.0, cell * 0.6, '#1c1917', 3.0);
        seg(3.6, 3.4, 4.6, 4.4, '#94a3b8', 1.6);`,
};
