module.exports = {
    icon: 'bouncygo',
    body: `        // 弾み: 弾む石 + 跳ね返り弧 + 押される石
        dot(2.2, 1.6, P1, P1S, cell * 0.46);
        seg(1.0, 3.0, 2.8, 3.0, '#f59e0b', 2.0);
        ring(2.9, 3.0, cell * 0.62, '#f59e0b', 1.6);
        dot(4.2, 3.0, P2, P2S, cell * 0.4);
        seg(4.6, 2.6, 5.3, 2.3, '#94a3b8', 1.5);`,
};
