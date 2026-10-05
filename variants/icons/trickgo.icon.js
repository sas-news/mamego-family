module.exports = {
    icon: 'trickgo',
    body: `        // 悪戯: インクの飛沫と笑い顔
        const p = at(3, 2.6);
        c.fillStyle = '#ec4899';
        c.beginPath(); c.arc(p.x, p.y, cell * 0.7, 0, Math.PI * 2); c.fill();
        [[-0.9, -0.6], [0.8, -0.9], [1, 0.7], [-0.7, 0.9]].forEach(([ox, oy]) => {
            c.beginPath(); c.arc(p.x + ox * cell * 0.9, p.y + oy * cell * 0.9, cell * 0.22, 0, Math.PI * 2); c.fill();
        });
        // 目と口
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(p.x - cell * 0.2, p.y - cell * 0.15, cell * 0.12, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(p.x + cell * 0.2, p.y - cell * 0.15, cell * 0.12, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 1.6;
        c.beginPath(); c.arc(p.x, p.y + cell * 0.15, cell * 0.3, 0.2, Math.PI - 0.2); c.stroke();
        dot(1.2, 4.8, P1, P1S, cell * 0.3); dot(4.8, 4.8, P2, P2S, cell * 0.3);
    `,
};
