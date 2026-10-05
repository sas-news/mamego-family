module.exports = {
    icon: 'glazego',
    body: `        // 釉薬: 窯の炎と釉がかった石
        tri(3, 4.9, cell * 1.5, '#c2410c', '#7c2d12', Math.PI / 2);
        c.fillStyle = '#fb923c';
        c.beginPath(); c.moveTo(at(3,4.2).x, at(3,4.2).y); c.lineTo(at(2.4,5.2).x, at(2.4,5.2).y); c.lineTo(at(3.6,5.2).x, at(3.6,5.2).y); c.closePath(); c.fill();
        dot(2.2, 2, P1, P1S, R * 0.85);
        dot(4, 1.6, P2, P2S, R * 0.85);
        ring(4, 1.6, cell * 0.34, '#7dd3fc', 1.6);`,
};
