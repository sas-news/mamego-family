module.exports = {
    icon: 'arithmeticgo',
    body: `        // 等差: 等間隔の珠
        dot(1, 3.6, P1, P1S, cell * 0.3);
        dot(3, 3.6, P1, P1S, cell * 0.3);
        dot(5, 3.6, P1, P1S, cell * 0.3);
        seg(1, 2.2, 5, 2.2, '#64748b', 1.2);
        txt('d', 4, 1.6, '#92400e', cell * 0.7);
        txt('d', 2, 1.6, '#92400e', cell * 0.7);`,
};
