module.exports = {
    icon: 'wakago',
    body: `        // 和歌: 短冊と結ばれた句 (2点空けの石)
        blk(2, 2.2, '#fdf2f8', '#be185d');
        seg(1.8, 1.8, 2.2, 1.8, '#be185d', 1);
        seg(1.8, 2.4, 2.2, 2.4, '#be185d', 1);
        dot(4, 3.4, P1, P1S, cell * 0.3);
        seg(4, 3.4, 4, 4.8, '#f472b6', 1.4);
        dot(4, 4.8, P1, P1S, cell * 0.3);`,
};
