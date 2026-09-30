module.exports = {
    icon: 'rammergo',
    body: `        // 重錘: 上の錘 + 下向き矢印 + 潰れる列
        blk(3, 1.2, '#44403c', '#1c1917');
        seg(3, 2.0, 3, 3.0, '#f59e0b', 2.4);
        tri(3, 3.4, cell * 0.34, '#f59e0b', '#b45309', Math.PI / 2);
        dot(3, 4.3, P2, P2S, cell * 0.36);
        dot(3, 5.0, P2, P2S, cell * 0.36, 0.5);`,
};
