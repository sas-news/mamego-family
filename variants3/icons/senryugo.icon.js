module.exports = {
    icon: 'senryugo',
    body: `        // 川柳: 山なりの三連
        dot(1.6, 3.6, P1, P1S, cell * 0.3);
        dot(3, 2.4, P1, P1S, cell * 0.3);
        dot(4.4, 3.6, P1, P1S, cell * 0.3);
        seg(1.6, 3.6, 3, 2.4, '#4ade80', 1.6);
        seg(3, 2.4, 4.4, 3.6, '#4ade80', 1.6);
        dot(3, 4.8, P2, P2S, cell * 0.22);`,
};
