module.exports = {
    icon: 'sokuryogo',
    body: `        // 測量: 縄と杭
        seg(1.0, 5.0, 5.0, 1.0, '#0ea5e9', 2);
        dot(1.0, 5.0, P1, P1S, cell * 0.3);
        dot(5.0, 1.0, P2, P2S, cell * 0.3);
        seg(3.0, 3.0, 3.0, 5.4, '#57534e', 3);
        dot(3.0, 3.0, '#dc2626', '#991b1b', cell * 0.2);`,
};
