module.exports = {
    icon: 'dragon2go',
    body: `        // 竜巻: 渦を巻く竜巻と吹き飛ぶ石
        c.strokeStyle = '#94a3b8'; c.lineWidth = cell * 0.26; c.lineCap = 'round';
        c.beginPath();
        for (let t = 0; t <= 1; t += 0.05) {
            const r = 2.2 - t * 1.6;
            const a = t * Math.PI * 3.4;
            const x = 3 + Math.cos(a) * r * 0.6;
            const y = 1 + t * 4;
            t === 0 ? c.moveTo(at(x, y).x, at(x, y).y) : c.lineTo(at(x, y).x, at(x, y).y);
        }
        c.stroke();
        dot(5, 2, P1, P1S, cell * 0.26); dot(5.2, 3.4, P2, P2S, cell * 0.26); dot(0.9, 1.4, P1, P1S, cell * 0.26);
    `,
};
