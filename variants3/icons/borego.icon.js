module.exports = {
    icon: 'borego',
    body: `        // 削岩機: 岩塊+ドリル+岩屑
        blk(4.0, 3.4, '#78716c', '#44403c');
        tri(2.0, 3.4, cell * 0.4, '#a8a29e', '#57534e', Math.PI);
        seg(1.0, 3.4, 1.8, 3.4, '#57534e', 3);
        dot(3.6, 2.4, '#d6d3d1', '#a8a29e', cell * 0.12);
        dot(4.6, 2.6, '#d6d3d1', '#a8a29e', cell * 0.1);`,
};
