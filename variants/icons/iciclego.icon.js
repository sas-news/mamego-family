module.exports = {
    icon: 'iciclego',
    body: `        // 氷柱: 陽に溶けるつらら
        ring(4.6, 1.4, cell * 0.6, '#fbbf24', 2.4);
        seg(3.8, 0.7, 4.2, 1, '#fbbf24', 1.8);
        seg(5.4, 0.7, 5, 1, '#fbbf24', 1.8);
        c.fillStyle = '#bae6fd'; c.strokeStyle = '#38bdf8'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(at(1.6,1.4).x, at(1.6,1.4).y); c.lineTo(at(2.6,1.4).x, at(2.6,1.4).y); c.lineTo(at(2.1,4.6).x, at(2.1,4.6).y); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(at(3,2).x, at(3,2).y); c.lineTo(at(3.6,2).x, at(3.6,2).y); c.lineTo(at(3.3,4).x, at(3.3,4).y); c.closePath(); c.fill(); c.stroke();
        dot(1.4, 5, P1, P1S, R * 0.7);`,
};
