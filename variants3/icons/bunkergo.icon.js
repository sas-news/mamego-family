module.exports = {
    icon: 'bunkergo',
    body: `        // 地下壕: レンガの壁に囲まれた暗い壕
        blk(2, 2, '#57534e', '#292524'); blk(4, 2, '#57534e', '#292524');
        blk(2, 4, '#57534e', '#292524'); blk(4, 4, '#57534e', '#292524');
        c.fillStyle = '#0c0a09';
        c.fillRect(cell * 2.3, cell * 2.3, cell * 1.4, cell * 1.4);
        dot(3, 3, P1, P1S, R * 0.75);
        dot(1, 5, P2, P2S, R * 0.75);
        dot(5, 5, P2, P2S, R * 0.75);`,
};
