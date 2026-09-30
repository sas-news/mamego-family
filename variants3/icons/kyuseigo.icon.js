module.exports = {
    icon: 'kyuseigo',
    body: `        // 九星: 八方位に散る星と中央の一白水星
        for (let k = 0; k < 8; k++) {
            const a = k * Math.PI / 4;
            dot(3 + Math.cos(a) * 1.85, 3 + Math.sin(a) * 1.85,
                k % 2 === 0 ? '#fde047' : '#a5b4fc', '#713f12', cell * 0.3);
        }
        dot(3, 3, '#f8fafc', '#38bdf8', R * 0.75); // 一白水星
        ring(3, 3, cell * 1.15, 'rgba(165,180,252,0.5)', 1.2);`,
};
