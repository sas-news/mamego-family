module.exports = {
    icon: 'roulette2go',
    body: `        // 回転盤: 4分割のルーレットと停止マーカー
        const p = at(3, 3);
        const colors = ['#ef4444', '#1c1917', '#ef4444', '#1c1917'];
        for (let i = 0; i < 4; i++) {
            c.fillStyle = colors[i];
            c.beginPath(); c.moveTo(p.x, p.y);
            c.arc(p.x, p.y, cell * 1.7, i * Math.PI / 2, (i + 1) * Math.PI / 2);
            c.closePath(); c.fill();
        }
        c.strokeStyle = '#fef3c7'; c.lineWidth = 1.4;
        c.beginPath(); c.arc(p.x, p.y, cell * 1.7, 0, Math.PI * 2); c.stroke();
        tri(3, 0.7, cell * 0.4, '#fbbf24', '#b45309', Math.PI);
        dot(3, 3, P2, P2S, cell * 0.3);
    `,
};
