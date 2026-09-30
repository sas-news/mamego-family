module.exports = {
    icon: 'lotterygo',
    body: `        // 宝籤: 福引きのガラポンと当たりの石
        const p = at(3, 3);
        c.fillStyle = '#fbbf24'; c.strokeStyle = '#b45309'; c.lineWidth = 1.6;
        c.beginPath(); c.arc(p.x, p.y, cell * 1.3, 0, Math.PI * 2); c.fill(); c.stroke();
        txt('吉', 3, 3, '#7c2d12', cell * 0.9);
        dot(1.4, 5, P1, P1S, cell * 0.3); dot(4.6, 5, P2, P2S, cell * 0.3);
        seg(4, 1.4, 5.2, 0.8, '#b45309', cell * 0.14);
    `,
};
