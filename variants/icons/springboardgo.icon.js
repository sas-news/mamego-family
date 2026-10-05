module.exports = {
    icon: 'springboardgo',
    body: `                    // トランポリンと跳ねる石
                    c.strokeStyle = '#059669'; c.lineWidth = 1.6;
                    for (let k = 0; k < 3; k++) {
                        c.beginPath();
                        c.arc(at(3, 4.6).x, at(3, 4.6).y - k * cell * 0.28, cell * 1.3 - k * cell * 0.28, Math.PI * 0.15, Math.PI * 0.85);
                        c.stroke();
                    }
                    dot(3, 1.6, P1, P1S);
                    c.strokeStyle = '#6ee7b7'; c.lineWidth = 1.3; c.setLineDash([2, 2]);
                    c.beginPath(); c.moveTo(at(3, 4.4).x, at(3, 4.4).y); c.quadraticCurveTo(at(4.6, 3.4).x, at(4.6, 3.4).y, at(4.2, 2).x, at(4.2, 2).y); c.stroke();
                    c.setLineDash([]);`,
};
