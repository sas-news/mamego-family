module.exports = {
    icon: 'apiarygo',
    body: `        // 採蜜: 巣箱と花と蜂
        blk(4.4, 1.8, '#f59e0b', '#92400e');
        seg(4.05, 1.8, 4.75, 1.8, '#92400e', 1.4);
        c.fillStyle = '#f472b6';
        [[2.2,3.4],[1.8,3.8],[2.6,3.8],[2,3],[2.4,3]].forEach(([x,y]) => {
            const p = at(x, y); c.beginPath(); c.arc(p.x, p.y, cell * 0.18, 0, Math.PI * 2); c.fill();
        });
        dot(2.2, 3.4, '#fbbf24', '#b45309', cell * 0.14);
        dot(3.4, 2.6, P1, P1S, cell * 0.2);
        dot(4, 3.6, P1, P1S, cell * 0.2);`,
};
