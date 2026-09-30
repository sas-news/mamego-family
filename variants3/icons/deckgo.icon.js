module.exports = {
    icon: 'deckgo',
    body: `        // 山札: 扇状の3枚のカードと石
        c.save();
        [[-0.3, 2.2, 3.6], [0, 3, 3.4], [0.3, 3.8, 3.6]].forEach(([rot, x, y]) => {
            const p = at(x, y);
            c.save(); c.translate(p.x, p.y); c.rotate(rot);
            c.fillStyle = '#fef3c7'; c.strokeStyle = '#92400e'; c.lineWidth = 1.4;
            c.fillRect(-cell * 0.5, -cell * 0.8, cell, cell * 1.6);
            c.strokeRect(-cell * 0.5, -cell * 0.8, cell, cell * 1.6);
            c.restore();
        });
        c.restore();
        txt('♠', 3, 3.4, '#1c1917', cell * 0.7);
        dot(5, 1.4, P1, P1S, cell * 0.32); dot(1.2, 1.4, P2, P2S, cell * 0.32);
    `,
};
