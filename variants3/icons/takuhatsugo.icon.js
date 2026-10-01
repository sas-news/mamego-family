module.exports = {
    icon: 'takuhatsugo',
    body: `        // 托鉢: 施しを受ける鉢と巡る僧の石
        c.beginPath(); c.fillStyle = '#57534e'; c.strokeStyle = '#292524'; c.lineWidth = 1.4;
        c.arc(3.0 * cell + cell, 3.6 * cell + cell, cell * 0.75, 0, Math.PI); c.fill(); c.stroke();
        dot(3.0, 3.5, '#fbbf24', '#b45309', cell * 0.18);
        dot(2.0, 2.0, P1, P1S, cell * 0.28);
        dot(4.2, 1.7, P2, P1S, cell * 0.28);`,
};
