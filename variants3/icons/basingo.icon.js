module.exports = {
    icon: 'basingo',
    body: `        // 窪地: 水の溜まった盆地と溺れる石
        c.fillStyle = 'rgba(30, 110, 170, 0.5)';
        c.beginPath(); c.ellipse(at(3,4.4).x, at(3,4.4).y, cell * 2.4, cell * 1.1, 0, 0, Math.PI * 2); c.fill();
        seg(1.2, 3.4, 3, 5.2, '#78716c', 2.4);
        seg(4.8, 3.4, 3, 5.2, '#78716c', 2.4);
        dot(3, 4.2, P1, P1S, R * 0.8);
        dot(1.4, 2.2, P2, P2S, R * 0.85);
        dot(4.6, 2.2, P2, P2S, R * 0.85);`,
};
