module.exports = {
    icon: 'potholego',
    body: `        // 甌穴: 底の見えない穴と落ちる石
        c.fillStyle = '#0c0a09';
        c.beginPath(); c.ellipse(at(3,4).x, at(3,4).y, cell * 1.5, cell * 0.9, 0, 0, Math.PI * 2); c.fill();
        ring(3, 4, cell * 1.1, '#44403c', 2.4);
        dot(3, 1.8, P1, P1S, R * 0.85);
        seg(3, 2.6, 3, 3.2, '#78716c', 1.8);
        dot(1.2, 4.6, P2, P2S, R * 0.8);
        dot(4.8, 4.6, P2, P2S, R * 0.8);`,
};
