module.exports = {
    icon: 'formularygo',
    body: `        // 処方: 3連の処方線 + 上下の治癒対象
        dot(1.6, 3, P1, P1S); dot(3, 3, P1, P1S); dot(4.4, 3, P1, P1S);
        seg(1.6, 3, 4.4, 3, '#0d9488', 1.6);
        dot(3, 1.4, P2, P2S); dot(3, 4.6, P2, P2S);
        ring(3, 1.4, cell * 0.6, '#0d9488', 1.4);
        ring(3, 4.6, cell * 0.6, '#0d9488', 1.4);`,
};
