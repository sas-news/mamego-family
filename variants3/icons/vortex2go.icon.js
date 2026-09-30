module.exports = {
    icon: 'vortex2go',
    body: `                    // 渦を巻く環流矢印と中心石
                    c.strokeStyle = '#0891b2'; c.lineWidth = 2; c.lineCap = 'round';
                    c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * 1.7, -0.4, Math.PI * 1.55); c.stroke();
                    tri(4.62, 1.62, cell * 0.22, '#0891b2', '#0e7490', Math.PI * 0.85);
                    dot(3, 3, P1, P1S);
                    dot(1.4, 4.5, P2, P2S); dot(4.6, 4.5, P1, P1S);`,
};
