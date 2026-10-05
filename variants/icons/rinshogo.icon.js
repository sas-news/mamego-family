module.exports = {
    icon: 'rinshogo',
    body: `        // 手本(円)と筆で写す一字
        ring(3.0, 3.0, cell * 2.0, '#a8a29e', 2);
        dot(3.0, 3.0, P1, P1S);
        dot(1.2, 4.6, P2, P2S, cell * 0.3);
        seg(4.6, 1.4, 5.4, 3.0, '#78350f', 4);
        txt('書', 5.0, 5.0, '#44403c', cell * 1.0);`,
};
