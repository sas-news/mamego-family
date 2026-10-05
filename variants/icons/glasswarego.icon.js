module.exports = {
    icon: 'glasswarego',
    body: `        // 硝子: 透明な石 (輪郭と光の筋だけ)
        ring(2.2, 2.4, cell * 0.42, '#93c5fd', 2.2);
        seg(1.9, 2, 2.3, 2.4, '#e0f2fe', 1.6);
        ring(4, 3.8, cell * 0.42, '#93c5fd', 2.2);
        seg(3.7, 3.4, 4.1, 3.8, '#e0f2fe', 1.6);
        dot(4.2, 1.4, P2, P2S, R * 0.7);
        dot(1.4, 4.6, P1, P1S, R * 0.7);`,
};
