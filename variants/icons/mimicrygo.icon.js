module.exports = {
    icon: 'mimicrygo',
    body: `        // 擬態: 敵色に紛れる紫の環
        dot(1.6, 3, P2, P2S, cell * 0.36);
        dot(4.4, 3, P2, P2S, cell * 0.36);
        dot(3, 3, P1, P1S, cell * 0.36);
        ring(3, 3, cell * 0.6, '#a78bfa', 1.8);
        seg(2.6, 1.4, 3.4, 1.4, '#a78bfa', 1.4);`,
};
