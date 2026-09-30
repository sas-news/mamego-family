module.exports = {
    icon: 'jumpropego',
    body: `        // 縄跳び: 跳ぶ石 + 縄の弧
        dot(3, 1.6, P1, P1S, cell * 0.5);
        ring(3, 3.0, cell * 1.9, '#38bdf8', 2.0);
        seg(1.2, 4.9, 4.8, 4.9, '#38bdf8', 2.0);
        dot(0.9, 1.4, '#94a3b8', '#64748b', cell * 0.14);
        dot(5.1, 1.4, '#94a3b8', '#64748b', cell * 0.14);`,
};
