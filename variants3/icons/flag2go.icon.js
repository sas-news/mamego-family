module.exports = {
    icon: 'flag2go',
    body: `                    // 3本の旗
                    [1.4, 3, 4.6].forEach((fx, i) => {
                        c.strokeStyle = '#57534e'; c.lineWidth = 1.6;
                        c.beginPath(); c.moveTo(at(fx, 4.6).x, at(fx, 4.6).y); c.lineTo(at(fx, 1.8).x, at(fx, 1.8).y); c.stroke();
                        tri(fx + 0.38, 2.0, cell * 0.34, i === 1 ? '#ef4444' : P1, i === 1 ? '#b91c1c' : P1S, Math.PI / 2);
                    });
                    dot(2, 4.9, P2, P2S);`,
};
