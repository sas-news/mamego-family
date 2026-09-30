module.exports = {
    icon: 'armillarygo',
    body: `        // 渾天儀: 2環と経緯
        ring(3.0, 3.0, cell * 1.4, '#b45309', 2);
        ring(3.0, 3.0, cell * 2.2, '#b45309', 2);
        seg(0.6, 3.0, 5.4, 3.0, '#78716c', 2);
        seg(3.0, 0.6, 3.0, 5.4, '#78716c', 2);
        dot(3.0, 3.0, P1, P1S, cell * 0.3);`,
};
