module.exports = {
    icon: 'sotchigo',
    body: `        // 綴じ目: 環とそれを囲む石
        ring(3.0, 3.0, cell * 0.3, '#78716c', 2);
        dot(3.0, 1.4, P1, P1S);
        dot(3.0, 4.6, P1, P1S);
        dot(1.4, 3.0, P1, P1S);
        dot(4.6, 3.0, P1, P1S);
        bond(1.4, 3.0, 4.6, 3.0, 2);`,
};
