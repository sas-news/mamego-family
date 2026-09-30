module.exports = {
    icon: 'dustbombgo',
    body: `        // 粉塵爆発: 塵の雲+中心の閃光
        dot(2.0, 3.6, '#ca8a04', '#a16207', cell * 0.2);
        dot(3.8, 3.4, '#ca8a04', '#a16207', cell * 0.24);
        dot(2.6, 4.2, '#ca8a04', '#a16207', cell * 0.16);
        tri(3.0, 2.0, cell * 0.5, '#fbbf24', '#f97316');
        seg(1.6, 1.6, 4.4, 1.6, '#f97316', 1.4);`,
};
