module.exports = {
    icon: 'conductgo',
    body: `        seg(0.8, 1, 0.8, 5, "#facc15", 3.4);
        seg(5.2, 1, 5.2, 5, "#facc15", 3.4);
        txt("+", 0.8, 0.6, "#eab308", cell * 0.7);
        txt("−", 5.2, 0.6, "#eab308", cell * 0.7);
        dot(1.6, 3, P1, P1S, R * 0.8);
        dot(3, 3, P1, P1S, R * 0.8);
        dot(4.4, 3, P1, P1S, R * 0.8);
        seg(1.6, 3, 4.4, 3, "#fbbf24", 1.8);
        txt("⚡", 3, 1.8, "#facc15", cell * 0.9);`,
};
