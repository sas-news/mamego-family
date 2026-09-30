module.exports = {
    icon: 'marblego',
    body: `                    // 転がる玉石と底に集まる玉
                    c.strokeStyle = '#78716c'; c.lineWidth = 1.4; c.setLineDash([2, 2]);
                    c.beginPath(); c.moveTo(at(1.4, 1).x, at(1.4, 1).y); c.lineTo(at(1.4, 4).x, at(1.4, 4).y); c.stroke();
                    c.setLineDash([]);
                    dot(1.4, 1, P2, P2S);
                    dot(1.4, 4.5, P1, P1S); dot(3, 4.5, P1, P1S); dot(4.6, 4.5, P2, P2S);
                    seg(0.5, 5.3, 5.5, 5.3, '#57534e', 1.8);`,
};
