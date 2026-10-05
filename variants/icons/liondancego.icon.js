module.exports = {
    icon: 'liondancego',
    body: `        // 獅子舞: 獅子頭 (大口) + 噛まれる敵石
        dot(2.4, 2.4, '#dc2626', '#7f1d1d', cell * 0.75);
        dot(1.9, 2.0, '#fef3c7', '#78350f', cell * 0.16);
        dot(2.9, 2.0, '#fef3c7', '#78350f', cell * 0.16);
        seg(1.7, 3.1, 3.1, 3.1, '#fef3c7', 2.2);
        dot(4.4, 4.4, P2, P2S, cell * 0.4);
        seg(3.4, 3.6, 4.0, 4.0, '#f87171', 1.8);`,
};
