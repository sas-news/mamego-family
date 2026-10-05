module.exports = {
    icon: 'scrabblogo',
    body: `        // 文字碁: 文字タイル3枚で単語
        [[1.4, 'ア'], [3, 'イ'], [4.6, 'ウ']].forEach(([x, ch]) => {
            const p = at(x, 3);
            c.fillStyle = '#fef3c7'; c.strokeStyle = '#78350f'; c.lineWidth = 1.4;
            c.beginPath();
            if (c.roundRect) c.roundRect(p.x - cell * 0.7, p.y - cell * 0.7, cell * 1.4, cell * 1.4, cell * 0.15); else c.rect(p.x - cell * 0.7, p.y - cell * 0.7, cell * 1.4, cell * 1.4);
            c.fill(); c.stroke();
            txt(ch, x, 3, '#78350f', cell * 0.8);
        });
        dot(1.4, 4.8, P1, P1S, cell * 0.26); dot(4.6, 4.8, P2, P2S, cell * 0.26);
    `,
};
