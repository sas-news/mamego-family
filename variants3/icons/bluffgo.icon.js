module.exports = {
    icon: 'bluffgo',
    body: `        // 詐称: 大きく見せた石と看破マーク
        dot(2, 3, P1, P1S, cell * 0.42);
        ring(2, 3, cell * 0.85, '#f87171', 2);
        txt('!', 2, 3, '#fef3c7', cell * 0.7);
        // 見抜く目
        c.strokeStyle = '#0ea5e9'; c.lineWidth = 1.8;
        c.beginPath(); c.ellipse(at(4.4, 2.6).x, at(4.4, 2.6).y, cell * 0.7, cell * 0.42, 0, 0, Math.PI * 2); c.stroke();
        dot(4.4, 2.6, '#0284c7', '#0369a1', cell * 0.2);
        dot(4.4, 4.6, P2, P2S, cell * 0.3);
    `,
};
