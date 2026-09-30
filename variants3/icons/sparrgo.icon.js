module.exports = {
    icon: 'sparrgo',
    body: `                    // ぶつかり合う二石と火花
                    dot(2.2, 3, P1, P1S); dot(3.8, 3, P2, P2S);
                    c.strokeStyle = '#f59e0b'; c.lineWidth = 2; c.lineCap = 'round';
                    [[-0.5, -0.9], [0, -1.1], [0.5, -0.9], [-0.5, 0.9], [0.5, 0.9]].forEach(([dx, dy]) => {
                        c.beginPath();
                        c.moveTo(at(3 + dx * 0.6, 3 + dy * 0.6).x, at(3 + dx * 0.6, 3 + dy * 0.6).y);
                        c.lineTo(at(3 + dx * 1.4, 3 + dy * 1.4).x, at(3 + dx * 1.4, 3 + dy * 1.4).y);
                        c.stroke();
                    });`,
};
