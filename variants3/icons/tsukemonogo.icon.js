module.exports = {
    icon: 'tsukemonogo',
    body: `        // 糠床: 漬物樽と大根 (漬けられた石)
        blk(2, 2.4, '#d6d3d1', '#78716c');
        blk(2.4, 1.8, '#e7e5e4', '#a8a29e');
        seg(1.6, 2.6, 4.4, 2.6, '#a8a29e', 1.4);
        tri(3, 1.4, cell * 0.5, '#fafaf9', '#d6d3d1', 0);
        dot(2.2, 3.4, '#ca8a04', '#a16207', cell * 0.3);
        dot(3.6, 3.8, P2, P2S, cell * 0.24);`,
};
