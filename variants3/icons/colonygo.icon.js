module.exports = {
    icon: 'colonygo',
    body: `                    // 3x3区域グリッドと2色の領有
                    c.strokeStyle = '#92610e'; c.lineWidth = 1.2;
                    for (let i = 1; i < 3; i++) {
                        seg(i * 2, 0.6, i * 2, 5.4, '#92610e', 1.2);
                        seg(0.6, i * 2, 5.4, i * 2, '#92610e', 1.2);
                    }
                    dot(1.4, 1.4, P1, P1S, cell * 0.5); dot(0.8, 0.8, P1, P1S);
                    dot(4.4, 1.4, P2, P2S, cell * 0.5); dot(5.2, 0.8, P2, P2S);
                    dot(1.4, 4.6, P2, P2S); dot(4.4, 4.6, P1, P1S);`,
};
