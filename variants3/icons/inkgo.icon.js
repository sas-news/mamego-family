module.exports = {
    icon: 'inkgo',
    body: `        // 墨染: 石の周りに滲みが広がる
        const p = at(3, 3);
        const g = c.createRadialGradient(p.x, p.y, cell * 0.2, p.x, p.y, cell * 2);
        g.addColorStop(0, 'rgba(15,23,42,0.85)'); g.addColorStop(1, 'rgba(15,23,42,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(p.x, p.y, cell * 2, 0, Math.PI * 2); c.fill();
        dot(3, 3, P1, P1S);
        dot(1.2, 4.4, P2, P2S, cell * 0.34);
        dot(4.8, 4.8, P1, P1S, cell * 0.3, 0.5);
    `,
};
