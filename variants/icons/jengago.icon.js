module.exports = {
    icon: 'jengago',
    body: `        // 抜積: 積み木の塔と抜き出し中の1個
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
            if (x === 1 && y === 1) continue;
            blk(1.6 + x * 1, 1.8 + y * 1, '#fcd34d', '#b45309');
        }
        const p = at(4.9, 2.8);
        c.fillStyle = '#fbbf24'; c.strokeStyle = '#b45309'; c.lineWidth = 1.2;
        c.fillRect(p.x - cell * 0.43, p.y - cell * 0.43, cell * 0.86, cell * 0.86);
        c.strokeRect(p.x - cell * 0.43, p.y - cell * 0.43, cell * 0.86, cell * 0.86);
        seg(3.7, 2.8, 4.4, 2.8, '#b45309', 2);
    `,
};
