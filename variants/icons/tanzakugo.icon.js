module.exports = {
    icon: 'tanzakugo',
    body: `        seg(2.4, 0.6, 2.4, 5.4, "#b45309", 3);
        seg(3.6, 0.6, 3.6, 5.4, "#b45309", 3);
        dot(2.4, 1.5, P1, P1S, R * 0.85);
        dot(3.6, 3.0, P2, P2S, R * 0.85);
        dot(2.4, 4.5, P1, P1S, R * 0.85);
        tri(2.4, 0.5, cell * 0.22, "#3b82f6", "#1d4ed8", Math.PI);
        tri(3.6, 5.5, cell * 0.22, "#3b82f6", "#1d4ed8");`,
};
