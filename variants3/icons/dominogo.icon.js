module.exports = {
    icon: 'dominogo',
    body: `        // 骨牌: 倒れゆくドミノ3枚
        [[1.2, 2.2, 0], [2.8, 2.6, 0.5], [4.4, 3.6, 1.1]].forEach(([x, y, rot]) => {
            const p = at(x, y);
            c.save(); c.translate(p.x, p.y); c.rotate(rot);
            c.fillStyle = '#fef3c7'; c.strokeStyle = '#1c1917'; c.lineWidth = 1.4;
            c.fillRect(-cell * 0.28, -cell * 1, cell * 0.56, cell * 2);
            c.strokeRect(-cell * 0.28, -cell * 1, cell * 0.56, cell * 2);
            c.beginPath(); c.moveTo(-cell * 0.28, 0); c.lineTo(cell * 0.28, 0); c.stroke();
            c.restore();
        });
        dot(1.2, 1.4, P1, P1S, cell * 0.24); dot(5.4, 4.6, P2, P2S, cell * 0.24);
    `,
};
