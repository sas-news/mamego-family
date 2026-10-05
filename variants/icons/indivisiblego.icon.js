module.exports = {
    icon: 'indivisiblego',
    body: `        // 素数: 割れない塊
        dot(3, 3, P1, P1S, cell * 0.62);
        ring(3, 3, cell * 0.95, '#fbbf24', 2);
        txt('7', 3, 3, '#fde68a', cell * 0.8);
        seg(1, 1, 2, 2, '#94a3b8', 1.4);
        seg(5, 5, 4.2, 4.2, '#94a3b8', 1.4);`,
};
