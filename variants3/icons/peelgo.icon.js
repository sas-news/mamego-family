module.exports = {
    icon: 'peelgo',
    body: `        // 表面が剥がれる石
        dot(3, 3, P1, P1S, cell * 0.52);
        ring(3.4, 2.6, cell * 0.4, '#d6d3d1', 2.4);
        seg(3.6, 2.2, 4.4, 1.4, '#a8a29e', 1.8);
        dot(4.6, 1.2, '#d6d3d1', '#a8a29e', cell * 0.16);
        dot(1.4, 4.6, '#d6d3d1', '#a8a29e', cell * 0.14);`,
};
