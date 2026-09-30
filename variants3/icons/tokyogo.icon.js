module.exports = {
    icon: 'tokyogo',
    body: `        // 斗栱: 柱と受け材の組物
        seg(3.0, 1.0, 3.0, 5.4, '#57534e', 5);
        bond(1.6, 2.2, 4.4, 2.2, 5);
        bond(2.2, 3.4, 3.8, 3.4, 4);
        dot(1.6, 2.2, P1, P1S, cell * 0.28);
        dot(4.4, 2.2, P1, P1S, cell * 0.28);`,
};
