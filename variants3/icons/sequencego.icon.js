module.exports = {
    icon: 'sequencego',
    body: `        // フィボナッチ: 増えていく珠
        dot(1.2, 4, P2, P2S, cell * 0.18);
        dot(2.2, 4, P2, P2S, cell * 0.26);
        dot(3.5, 4, P2, P2S, cell * 0.36);
        ring(4.9, 4, cell * 0.5, P2S, 1.4);
        txt('1,1,2,3', 3, 1.6, '#92400e', cell * 0.62);`,
};
