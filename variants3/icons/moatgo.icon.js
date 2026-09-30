module.exports = {
    icon: 'moatgo',
    body: `        // 内堀: 城を囲む四角い堀
        blk(3, 3, '#a8a29e', '#57534e');
        c.strokeStyle = '#38bdf8'; c.lineWidth = 2.6;
        c.strokeRect(cell * 1.1, cell * 1.1, cell * 3.8, cell * 3.8);
        dot(1.6, 1.6, P1, P1S, R * 0.7);
        dot(4.4, 4.4, P2, P2S, R * 0.7);
        txt('天', 3, 3, '#292524', cell * 0.7);`,
};
