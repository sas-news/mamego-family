module.exports = {
    icon: 'dicebuildgo',
    body: `        // 骰子建築: サイコロと積まれた石
        const p = at(2, 2);
        c.fillStyle = '#fef3c7'; c.strokeStyle = '#1c1917'; c.lineWidth = 1.6;
        c.beginPath();
        if (c.roundRect) c.roundRect(p.x - cell * 0.7, p.y - cell * 0.7, cell * 1.4, cell * 1.4, cell * 0.2); else c.rect(p.x - cell * 0.7, p.y - cell * 0.7, cell * 1.4, cell * 1.4);
        c.fill(); c.stroke();
        [[-0.35, -0.35], [0.35, -0.35], [0, 0], [-0.35, 0.35], [0.35, 0.35]].forEach(([ox, oy]) => {
            c.fillStyle = '#1c1917';
            c.beginPath(); c.arc(p.x + ox * cell, p.y + oy * cell, cell * 0.11, 0, Math.PI * 2); c.fill();
        });
        // 積まれた石
        dot(4.4, 4.6, P1, P1S, cell * 0.3); dot(4.4, 3.7, P1, P1S, cell * 0.3); dot(4.4, 2.8, P2, P2S, cell * 0.3);
    `,
};
