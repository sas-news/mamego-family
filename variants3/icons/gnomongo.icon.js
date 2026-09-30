module.exports = {
    icon: 'gnomongo',
    body: `        // 圭表: 表(石柱)と伸びる影
        seg(3.0, 1.0, 3.0, 4.2, '#57534e', 5);
        seg(3.0, 4.2, 5.2, 4.9, '#a8a29e', 4);
        dot(3.0, 1.0, P1, P1S, cell * 0.26);
        tri(1.4, 4.9, cell * 0.35, '#57534e', '#292524', Math.PI);`,
};
