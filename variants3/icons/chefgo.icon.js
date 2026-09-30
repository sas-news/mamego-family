module.exports = {
    icon: 'chefgo',
    body: `        // 料理: 鍋と食材の石
        dot(2, 2, P1, P1S); dot(4, 2, P2, P2S);
        // フライパン
        c.strokeStyle = '#78350f'; c.lineWidth = cell * 0.22; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(3.2, 4.2).x, at(3.2, 4.2).y); c.lineTo(at(4.8, 4.2).x, at(4.8, 4.2).y); c.stroke();
        c.fillStyle = '#f97316'; c.strokeStyle = '#c2410c'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(at(2.8, 4).x, at(2.8, 4).y, cell * 0.9, 0, Math.PI * 2); c.fill(); c.stroke();
        txt('♨', 2.8, 4, '#fef3c7', cell * 0.9);
    `,
};
