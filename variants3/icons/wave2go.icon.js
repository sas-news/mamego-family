module.exports = {
    icon: 'wave2go',
    body: `                    // 波動: 中心石と同心波
                    dot(3, 3, P1, P1S);
                    c.strokeStyle = '#38bdf8'; c.lineWidth = 1.4;
                    [0.9, 1.6, 2.3].forEach(r => {
                        c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * r, -Math.PI * 0.3, Math.PI * 0.3); c.stroke();
                        c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * r, Math.PI * 0.7, Math.PI * 1.3); c.stroke();
                    });
                    dot(4.9, 1.1, P2, P2S, cell * 0.34);`,
};
