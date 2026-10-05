module.exports = {
    icon: 'shellgo',
    body: `        ring(2.4, 3, cell * 0.75, "#7dd3fc", 2);
        ring(2.4, 3, cell * 1.25, "#38bdf8", 1.4);
        ring(3.8, 3, cell * 0.75, "#7dd3fc", 2);
        dot(2.4, 3, P1, P1S, R * 0.8);
        dot(3.8, 3, P2, P2S, R * 0.8);
        seg(2.9, 3, 3.3, 3, "#7dd3fc", 2);`,
};
