module.exports = {
    icon: 'dreamgo',
    body: `        // 夢幻: 二つの盤が入れ替わる + 月
        c.strokeStyle = '#a78bfa'; c.lineWidth = 2;
        c.strokeRect(at(1, 1).x - cell * 0.4, at(1, 1).y - cell * 0.4, cell * 2.4, cell * 2.4);
        c.strokeStyle = 'rgba(167,139,250,0.45)'; c.setLineDash([3, 3]);
        c.strokeRect(at(3.6, 3.4).x - cell * 0.4, at(3.6, 3.4).y - cell * 0.4, cell * 2.4, cell * 2.4);
        c.setLineDash([]);
        dot(2, 2, P1, P1S, cell * 0.34); dot(4.6, 4.6, P2, P2S, cell * 0.34);
        // 交換の矢
        c.strokeStyle = '#c4b5fd'; c.lineWidth = 1.8; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(2.6, 1.4).x, at(2.6, 1.4).y); c.quadraticCurveTo(at(4.6, 1).x, at(4.6, 1).y, at(5.4, 2.6).x, at(5.4, 2.6).y); c.stroke();
        c.beginPath(); c.arc(at(1.2, 4.8).x, at(1.2, 4.8).y, cell * 0.55, 0.6, Math.PI * 1.7); c.stroke();
    `,
};
