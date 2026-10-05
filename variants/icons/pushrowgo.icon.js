module.exports = {
    icon: 'pushrowgo',
    body: `        // 列推: 列に並ぶ石と押し出す矢
        dot(3, 1.4, P2, P2S, cell * 0.34); dot(3, 2.6, P2, P2S, cell * 0.34);
        dot(3, 4, P1, P1S);
        c.strokeStyle = '#ef4444'; c.lineWidth = 2.2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(3, 4.9).x, at(3, 4.9).y); c.lineTo(at(3, 1.1).x, at(3, 1.1).y); c.stroke();
        tri(3, 0.9, cell * 0.34, '#ef4444', '#b91c1c');
        dot(5, 4.6, P2, P2S, cell * 0.28);
    `,
};
