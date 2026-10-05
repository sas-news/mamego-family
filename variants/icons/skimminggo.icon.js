module.exports = {
    icon: 'skimminggo',
    body: `        // 水切: 水面を跳ねる石 + 波紋
        dot(1.6, 1.8, P1, P1S, cell * 0.44);
        ring(2.6, 3.2, cell * 0.5, '#38bdf8', 1.5);
        ring(3.8, 3.6, cell * 0.7, '#38bdf8', 1.5);
        ring(4.9, 4.0, cell * 0.9, '#38bdf8', 1.5);
        seg(0.8, 2.4, 2.2, 2.0, '#94a3b8', 1.4);`,
};
