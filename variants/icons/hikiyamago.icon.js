module.exports = {
    icon: 'hikiyamago',
    body: `        // 山車: 大きな屋根付き車体と車輪、沿道の客石
        seg(1.4, 1.6, 4.6, 1.6, '#b45309', 2.2);
        tri(3.0, 1.1, cell * 0.5, '#dc2626', '#7f1d1d');
        blk(3.0, 3.0, '#b91c1c', '#7f1d1d');
        dot(2.2, 4.6, P1, P1S, cell * 0.34);
        dot(3.8, 4.6, P1, P1S, cell * 0.34);
        dot(0.9, 5.0, P2, P1S, cell * 0.2);
        dot(5.1, 5.0, P2, P1S, cell * 0.2);`,
};
