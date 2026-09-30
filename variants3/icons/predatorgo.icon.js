module.exports = {
    icon: 'predatorgo',
    body: `                    // 捕食: 牙の生えた大きな石が小さな石を追う
                    dot(2.4, 2.4, P1, P1S, cell * 0.62);
                    c.fillStyle = '#fef2f2';
                    [0, 1].forEach(k => {
                        const fx = 2.4 + (k - 0.5) * 0.5;
                        c.beginPath();
                        c.moveTo(at(fx - 0.12, 2.72).x, at(fx - 0.12, 2.72).y);
                        c.lineTo(at(fx + 0.12, 2.72).x, at(fx + 0.12, 2.72).y);
                        c.lineTo(at(fx, 3.05).x, at(fx, 3.05).y);
                        c.closePath(); c.fill();
                    });
                    dot(4.6, 4.4, P2, P2S, cell * 0.34);
                    c.strokeStyle = '#fca5a5'; c.lineWidth = 1.3; c.setLineDash([2, 2]);
                    c.beginPath(); c.moveTo(at(3.1, 3.1).x, at(3.1, 3.1).y); c.quadraticCurveTo(at(4.1, 3.4).x, at(4.1, 3.4).y, at(4.3, 4).x, at(4.3, 4).y); c.stroke();
                    c.setLineDash([]);`,
};
