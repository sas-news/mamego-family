module.exports = {
    icon: 'borrowturngo',
    body: `        dot(2, 2.4, P1, P1S);
        dot(4, 3.8, P2, P2S);
        seg(2.8, 2.8, 3.6, 3.4, '#38bdf8', 1.8);
        tri(3.7, 3.5, cell * 0.15, '#38bdf8', '#38bdf8', Math.PI / 3);
        txt('借', 3, 1.4, '#38bdf8', cell * 0.8);`,
};
