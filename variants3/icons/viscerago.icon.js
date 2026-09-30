module.exports = {
    icon: 'viscerago',
    body: `        // 五臓: 4象限の臓器石 + 中臓の菱形
        dot(1.4, 1.4, '#b45309', '#78350f', cell * 0.3);
        dot(4.6, 1.4, '#dc2626', '#991b1b', cell * 0.3);
        dot(1.4, 4.6, '#ca8a04', '#a16207', cell * 0.3);
        dot(4.6, 4.6, '#0284c7', '#075985', cell * 0.3);
        ring(3, 3, cell * 0.5, '#7c3aed', 2);
        dot(3, 3, '#a78bfa', '#5b21b6', cell * 0.22);`,
};
