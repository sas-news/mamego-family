module.exports = {
    icon: 'gradientgo',
    body: `        // 転がり落ちる珠
        dot(1, 1, P1, P1S, cell * 0.3);
        seg(1.4, 1.4, 4.4, 4.4, '#94a3b8', 1.4);
        tri(4.7, 4.7, cell * 0.22, '#64748b', '#475569', Math.PI * 0.75);
        dot(4.8, 4.8, P2, P2S, cell * 0.3);
        dot(2.6, 2.6, P1, P1S, cell * 0.2, 0.5);`,
};
