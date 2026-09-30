module.exports = {
    icon: 'delaygo',
    body: `        dot(2, 3, P1, P1S, cell * 0.34, 0.45);
        dot(4, 3, P1, P1S);
        ring(4, 3, cell * 0.6, 'rgba(165,180,252,0.9)', 1.8);
        seg(4, 3, 4, 1.6, '#a5b4fc', 1.8);
        tri(4, 1.5, cell * 0.18, '#a5b4fc', '#6366f1', -Math.PI / 2);`,
};
