module.exports = {
    icon: 'fiveplanetgo',
    body: `        // 五星: 五行の色の連なり
        dot(1.0, 4.6, '#16a34a', '#14532d', cell * 0.28);
        dot(2.0, 3.4, '#dc2626', '#7f1d1d', cell * 0.28);
        dot(3.0, 2.6, '#a16207', '#713f12', cell * 0.28);
        dot(4.0, 3.4, '#d4d4d8', '#71717a', cell * 0.28);
        dot(5.0, 4.6, '#0ea5e9', '#0c4a6e', cell * 0.28);
        bond(1.0, 4.6, 5.0, 4.6, 2);`,
};
