module.exports = {
    icon: 'handovergo',
    body: `        dot(1.8, 1.8, P1, P1S);
        dot(4.2, 4.2, P2, P2S);
        seg(2.4, 1.8, 3.9, 3.3, '#a78bfa', 2.2);
        seg(3.6, 1.8, 2.1, 3.3, '#a78bfa', 2.2);
        tri(3.9, 3.3, cell * 0.2, '#a78bfa', '#7c3aed', Math.PI * 0.75);
        tri(2.1, 3.3, cell * 0.2, '#a78bfa', '#7c3aed', -Math.PI * 0.25);`,
};
