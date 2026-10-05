module.exports = {
    icon: 'kemarigo',
    body: `        // 蹴鞠: 二色の革鞠と蹴り上げの軌道
        dot(3, 3.6, '#d97706', '#78350f', cell * 0.8);
        seg(3, 2.8, 3, 4.4, '#fde68a', 2);
        seg(1.4, 1.2, 2.4, 1.8, '#a8a29e', 1.4);
        seg(2.4, 1.8, 2.8, 2.6, '#a8a29e', 1.4);
        tri(4.8, 1.4, cell * 0.3, P2, P2S, Math.PI / 2);`,
};
