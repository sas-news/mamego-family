module.exports = {
    icon: 'lungego',
    body: `        // 突撃: 接する敵を押し返す
        dot(2, 3, P1, P1S); dot(3, 3, P2, P2S);
        c.strokeStyle = '#f97316'; c.lineWidth = 2.4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(3.4, 3).x, at(3.4, 3).y); c.lineTo(at(5.2, 3).x, at(5.2, 3).y); c.stroke();
        tri(5.3, 3, cell * 0.36, '#f97316', '#c2410c', Math.PI / 2);
        dot(2, 1.6, P2, P2S, cell * 0.28); dot(1, 4.6, P1, P1S, cell * 0.28);
    `,
};
