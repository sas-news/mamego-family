module.exports = {
    icon: 'compassgo',
    body: `        // 方位: 羅針盤の針とN極印
        ring(3, 3, cell * 1.85, '#0369a1', 2); // 盤
        ring(3, 3, cell * 1.5, 'rgba(3,105,161,0.4)', 1.2);
        for (let k = 0; k < 8; k++) { // 方位目盛
            const a = k * Math.PI / 4;
            seg(3 + Math.cos(a) * 1.55, 3 + Math.sin(a) * 1.55,
                3 + Math.cos(a) * (k % 2 === 0 ? 1.35 : 1.45),
                3 + Math.sin(a) * (k % 2 === 0 ? 1.35 : 1.45), '#0369a1', k % 2 === 0 ? 2 : 1.2);
        }
        tri(3, 2.0, cell * 0.6, '#ef4444', '#991b1b'); // 北針
        tri(3, 4.0, cell * 0.6, '#e2e8f0', '#64748b', Math.PI / 2); // 南針
        dot(3, 3, '#f8fafc', '#0369a1', R * 0.3);
        txt('N', 3, 0.7, '#0369a1', cell * 0.6);`,
};
