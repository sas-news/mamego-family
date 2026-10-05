module.exports = {
    icon: 'prunego',
    body: `        // 剪定: 枝の連+鋏の十字
        dot(1.8, 4.0, P1, P1S, cell * 0.3);
        dot(2.8, 3.4, P1, P1S, cell * 0.3);
        dot(3.8, 4.0, P1, P1S, cell * 0.3);
        seg(1.4, 1.6, 3.0, 2.8, '#dc2626', 2);
        seg(3.0, 1.6, 1.4, 2.8, '#dc2626', 2);`,
};
