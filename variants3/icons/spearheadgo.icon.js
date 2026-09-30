module.exports = {
    icon: 'spearheadgo',
    body: `        // 矛先: 3連の石と突き出た矛
        dot(1.4, 3.6, P1, P1S); dot(2.6, 3.6, P1, P1S); dot(3.8, 3.6, P1, P1S);
        seg(4.3, 3.6, 5.4, 3.6, '#92400e', cell * 0.16);
        tri(5.5, 3.6, cell * 0.42, '#d1d5db', '#4b5563', Math.PI / 2);
        dot(5.4, 1.4, P2, P2S, cell * 0.28); dot(2, 1.2, P2, P2S, cell * 0.28);
    `,
};
