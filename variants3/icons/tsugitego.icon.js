module.exports = {
    icon: 'tsugitego',
    body: `        // 継手: 2材を継ぐ楔
        bond(1.0, 2.0, 3.0, 2.0, 5);
        bond(3.0, 2.0, 5.0, 2.0, 5);
        tri(3.0, 2.0, cell * 0.4, '#b45309', '#78350f', Math.PI / 2);
        dot(1.0, 2.0, P1, P1S);
        dot(5.0, 2.0, P1, P1S);
        dot(3.0, 4.6, P2, P2S);`,
};
