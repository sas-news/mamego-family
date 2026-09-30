module.exports = {
    icon: 'dualphasego',
    body: `        blk(2, 2, "rgba(255,255,255,0.85)", "#a8a29e");
        blk(3, 2, "#3f3f46", "#18181b");
        blk(2, 3, "#3f3f46", "#18181b");
        blk(3, 3, "rgba(255,255,255,0.85)", "#a8a29e");
        dot(2, 2, P1, P1S, R * 0.7);
        dot(3, 3, P2, P2S, R * 0.7);
        txt("2x", 4.3, 1.6, "#0ea5e9", cell * 0.9);
        txt("½", 4.3, 4.4, "#f59e0b", cell * 0.9);`,
};
