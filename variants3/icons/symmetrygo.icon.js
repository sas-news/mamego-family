module.exports = {
    icon: 'symmetrygo',
    body: `        // 対称軸を挟んで同じ形
        seg(3, 0.4, 3, 5.6, '#a78bfa', 1.6);
        dot(1.6, 2, P1, P1S, cell * 0.34);
        dot(4.4, 2, P1, P1S, cell * 0.34);
        dot(1.6, 4.2, P2, P2S, cell * 0.34);
        dot(4.4, 4.2, P2, P2S, cell * 0.34);`,
};
