module.exports = {
    icon: 'pendulum2go',
    body: `                    // 振子: 支点から吊るした石と往復矢印
                    seg(3, 0.9, 2, 3.4, '#78716c', 1.6);
                    dot(3, 0.9, '#a8a29e', '#57534e', cell * 0.24);
                    dot(2, 3.4, P1, P1S);
                    c.strokeStyle = '#78716c'; c.lineWidth = 1.4; c.setLineDash([2, 2]);
                    c.beginPath(); c.arc(at(3, 0.9).x, at(3, 0.9).y, cell * 2.55, Math.PI * 0.42, Math.PI * 0.58); c.stroke();
                    c.setLineDash([]);
                    txt('⇄', 3, 5.1, '#57534e', cell * 1.2);
                    dot(4.4, 4.4, P2, P2S, cell * 0.34);`,
};
