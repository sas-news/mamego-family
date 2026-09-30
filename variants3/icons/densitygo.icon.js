module.exports = {
    icon: 'densitygo',
    body: `        // 相転移: 密な区域
        blk(1.4, 1.4, '#fde68a', '#d97706');
        dot(1.4, 1.4, P1, P1S, cell * 0.28);
        dot(0.9, 1.9, P1, P1S, cell * 0.28);
        dot(1.9, 0.9, P1, P1S, cell * 0.28);
        dot(4.4, 4.2, P2, P2S, cell * 0.3);
        dot(4.9, 3.6, P2, P2S, cell * 0.3);
        seg(0.4, 4.8, 5.6, 0.8, '#94a3b8', 1.2);`,
};
