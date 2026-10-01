module.exports = {
    icon: 'darwingo',
    body: `        // 淘汰: 生き残る連と消える弱い石
        dot(2.2, 2.2, P1, P1S, cell * 0.4);
        dot(3.0, 3.0, P1, P1S, cell * 0.4);
        dot(3.8, 3.8, P1, P1S, cell * 0.4);
        dot(4.8, 1.8, '#d4d4d4', '#a3a3a3', cell * 0.26, 0.55);
        seg(4.5, 1.5, 5.1, 2.1, '#ef4444', 1.6);
        seg(5.1, 1.5, 4.5, 2.1, '#ef4444', 1.6);`,
};
