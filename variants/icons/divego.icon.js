module.exports = {
    icon: 'divego',
    body: `                    // 水面と潜る石
                    c.strokeStyle = '#0ea5e9'; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath();
                    for (let i = 0; i <= 6; i++) {
                        const px = cell * (0.4 + i * 0.9);
                        const py = cell * 2.2 + Math.sin(i * 1.4) * cell * 0.18;
                        i ? c.lineTo(px, py) : c.moveTo(px, py);
                    }
                    c.stroke();
                    dot(3, 3.8, P1, P1S, R, 0.55);
                    dot(1.6, 1.2, P2, P2S);
                    ring(3, 3.8, cell * 0.62, '#38bdf8', 1.4);`,
};
