module.exports = {
    icon: 'longlinego',
    body: `        // 延縄: 幹縄に下がる釣針
        seg(0.6, 2, 5.4, 2, '#0369a1', 2);
        seg(1.6, 2, 1.6, 3.2, '#38bdf8', 1.2);
        seg(3, 2, 3, 3.4, '#38bdf8', 1.2);
        seg(4.4, 2, 4.4, 3, '#38bdf8', 1.2);
        ring(1.6, 3.4, cell * 0.18, '#0c4a6e', 1.2);
        ring(3, 3.6, cell * 0.18, '#0c4a6e', 1.2);
        ring(4.4, 3.2, cell * 0.18, '#0c4a6e', 1.2);
        tri(3, 4.8, cell * 0.4, '#fbbf24', '#b45309', Math.PI / 2);`,
};
