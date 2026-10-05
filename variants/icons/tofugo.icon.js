module.exports = {
    icon: 'tofugo',
    body: `        // 豆腐: 白い豆腐丁とにがりの雫
        blk(2.4, 3, '#fafaf9', '#d6d3d1');
        blk(3.8, 3.6, '#f5f5f4', '#d6d3d1');
        seg(4.6, 1.2, 4.6, 2, '#a8a29e', 1.6);
        tri(4.6, 2.6, cell * 0.32, '#e7e5e4', '#a8a29e', Math.PI);
        dot(1.6, 1.4, P2, P2S, cell * 0.22);`,
};
