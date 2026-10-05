module.exports = {
    icon: 'tarotgo',
    body: `        // 占札: 1枚のタロットカードに月と星
        const p = at(3, 3);
        c.fillStyle = '#312e81'; c.strokeStyle = '#c4b5fd'; c.lineWidth = 1.6;
        c.beginPath();
        if (c.roundRect) c.roundRect(p.x - cell * 0.8, p.y - cell * 1.3, cell * 1.6, cell * 2.6, cell * 0.18); else c.rect(p.x - cell * 0.8, p.y - cell * 1.3, cell * 1.6, cell * 2.6);
        c.fill(); c.stroke();
        // 三日月
        c.fillStyle = '#fde68a';
        c.beginPath(); c.arc(at(3.2, 2.6).x, at(3.2, 2.6).y, cell * 0.45, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#312e81';
        c.beginPath(); c.arc(at(3.5, 2.5).x, at(3.5, 2.5).y, cell * 0.4, 0, Math.PI * 2); c.fill();
        txt('★', 2.7, 3.7, '#fde68a', cell * 0.55);
        dot(5, 4.8, P1, P1S, cell * 0.28); dot(1, 1.2, P2, P2S, cell * 0.28);
    `,
};
