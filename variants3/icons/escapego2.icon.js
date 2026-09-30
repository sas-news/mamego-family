module.exports = {
    icon: 'escapego2',
    body: `                    // 縦断する黒の一筋と白の妨害
                    dot(3, 1, P1, P1S); dot(3, 2.2, P1, P1S); dot(3, 3.4, P1, P1S); dot(3, 4.6, P1, P1S);
                    bond(3, 1, 3, 4.6, 3);
                    dot(4.4, 2.6, P2, P2S);
                    txt('↕', 1.4, 3, '#dc2626', cell * 1.4);`,
};
