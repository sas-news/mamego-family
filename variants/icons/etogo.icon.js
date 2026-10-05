module.exports = {
    icon: 'etogo',
    body: `        // 干支: 十二支の環と中心の石
        ring(3, 3, cell * 1.9, '#b45309', 1.6); // 干支環
        for (let k = 0; k < 12; k++) {
            const a = k * Math.PI / 6 - Math.PI / 2;
            dot(3 + Math.cos(a) * 1.9, 3 + Math.sin(a) * 1.9,
                k % 3 === 0 ? '#fbbf24' : '#94a3b8', '#78350f', cell * 0.16);
        }
        dot(3, 3, P1, P1S, R * 0.8); // 中心の石
        txt('子', 3, 1.35, '#78350f', cell * 0.55);`,
};
