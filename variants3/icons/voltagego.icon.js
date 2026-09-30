module.exports = {
    icon: 'voltagego',
    body: `        dot(2.2, 3, P1, P1S, R * 0.95);
        dot(3.8, 3, P2, P2S, R * 0.95);
        txt("+", 2.2, 3, "#fbbf24", cell * 0.55);
        txt("−", 3.8, 3, "#60a5fa", cell * 0.6);
        seg(2.8, 2.4, 3.2, 3, "#fde047", 1.8);
        seg(3.2, 3, 2.8, 3.6, "#fde047", 1.8);
        seg(3.2, 3, 3.5, 3.8, "#fde047", 1.4);`,
};
