module.exports = {
    icon: 'hominggo',
    body: `        // 巣へ帰る矢
        ring(3, 3, cell * 0.7, '#f97316', 2.4);
        dot(3, 3, '#f97316', '#c2410c', cell * 0.22);
        seg(1, 1, 2.2, 2.2, '#57534e', 1.8);
        tri(2.4, 2.4, cell * 0.2, '#57534e', '#44403c', Math.PI / 4);
        dot(0.8, 0.8, P1, P1S, cell * 0.28);`,
};
