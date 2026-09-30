module.exports = {
    icon: 'carbongo',
    body: `        // 炭素: 高圧でダイヤに変わる石炭
        dot(1.6, 4, '#44403c', '#1c1917', R * 0.9);
        seg(2.4, 3.6, 3.4, 2.6, '#f59e0b', 2);
        c.fillStyle = '#7dd3fc'; c.strokeStyle = '#0284c7'; c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(at(4.2,1.4).x, at(4.2,1.4).y); c.lineTo(at(5,2.4).x, at(5,2.4).y);
        c.lineTo(at(4.2,4).x, at(4.2,4).y); c.lineTo(at(3.4,2.4).x, at(3.4,2.4).y);
        c.closePath(); c.fill(); c.stroke();
        dot(1.6, 1.6, P2, P2S, R * 0.7);`,
};
