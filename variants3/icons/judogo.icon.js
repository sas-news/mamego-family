module.exports = {
    icon: 'judogo',
    body: `        // 柔道: 巴投げの弧
        dot(2.4, 4.0, P1, P1S, R * 0.8);
        dot(4.0, 2.6, P2, P2S, R * 0.8);
        ring(3.0, 3.4, cell * 1.0, '#3b82f6', 1.6);
        seg(3.0, 3.4, 4.0, 2.6, '#93c5fd', 1.8);
        tri(4.4, 2.0, cell * 0.3, '#60a5fa', '#3b82f6', -Math.PI / 4);`,
};
