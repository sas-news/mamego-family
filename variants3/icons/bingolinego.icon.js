module.exports = {
    icon: 'bingolinego',
    body: `        // 釣合(ビンゴ): 斜めの5連ライン
        [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]].forEach(([x, y], i) => {
            dot(x, y, i === 4 ? P2 : P1, i === 4 ? P2S : P1S);
        });
        c.strokeStyle = '#f59e0b'; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(1, 1).x, at(1, 1).y); c.lineTo(at(5, 5).x, at(5, 5).y); c.stroke();
        txt('B', 5, 1, '#f59e0b', cell * 0.8);
    `,
};
