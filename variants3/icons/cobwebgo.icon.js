module.exports = {
    icon: 'cobwebgo',
    body: `        ring(3, 3, cell * 0.9, "#e2e8f0", 1.2);
        ring(3, 3, cell * 1.9, "#e2e8f0", 1.2);
        seg(3, 0.9, 3, 5.1, "#e2e8f0", 1.1);
        seg(0.9, 3, 5.1, 3, "#e2e8f0", 1.1);
        seg(1.5, 1.5, 4.5, 4.5, "#e2e8f0", 1.1);
        seg(4.5, 1.5, 1.5, 4.5, "#e2e8f0", 1.1);
        dot(3, 3, P1, P1S, R * 0.7);
        dot(3.95, 3, P2, P2S, R * 0.6);`,
};
