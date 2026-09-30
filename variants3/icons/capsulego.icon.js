module.exports = {
    icon: 'capsulego',
    body: `                    // カプセルと中身
                    c.save();
                    c.fillStyle = '#93c5fd'; c.strokeStyle = '#1d4ed8'; c.lineWidth = 1.4;
                    // カプセル外形 (丸角長方形)
                    c.beginPath();
                    c.moveTo(at(2, 1.6).x, at(2, 1.6).y);
                    c.arc(at(2, 2.6).x, at(2, 2.6).y, cell, -Math.PI / 2, Math.PI / 2, false);
                    c.lineTo(at(4, 3.6).x, at(4, 3.6).y);
                    c.arc(at(4, 2.6).x, at(4, 2.6).y, cell, Math.PI / 2, Math.PI * 1.5, false);
                    c.closePath(); c.fill(); c.stroke();
                    c.restore();
                    dot(4, 2.6, P1, P1S, cell * 0.42);
                    dot(1.4, 4.9, P1, P1S); dot(4.6, 5, P2, P2S, cell * 0.34);`,
};
