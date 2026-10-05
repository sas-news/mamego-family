module.exports = {
    icon: 'saltfieldgo',
    body: `        // 塩田: 結晶田の畦と白い塩の結晶
        c.strokeStyle = '#94a3b8'; c.lineWidth = 1.6;
        c.strokeRect(cell * 0.4, cell * 2.6, cell * 5.2, cell * 2.8);
        seg(0.6, 3.6, 5.4, 3.6, '#94a3b8', 1.4);
        seg(3, 2.6, 3, 5.4, '#94a3b8', 1.4);
        c.fillStyle = '#fff'; c.strokeStyle = '#38bdf8'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(at(2,3).x, at(2,3).y); c.lineTo(at(2.5,3.4).x, at(2.5,3.4).y); c.lineTo(at(2,4.6).x, at(2,4.6).y); c.lineTo(at(1.5,3.4).x, at(1.5,3.4).y); c.closePath(); c.fill(); c.stroke();
        dot(4.4, 4.4, P1, P1S, R * 0.8);
        dot(4.4, 1.4, P2, P2S, R * 0.8);`,
};
