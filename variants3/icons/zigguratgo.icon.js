module.exports = {
    icon: 'zigguratgo',
    body: `                    // ジッグラト: 階段ピラミッドと頂点の光
                    c.fillStyle = '#d6b246'; c.strokeStyle = '#92610e'; c.lineWidth = 1.2;
                    [[0.9, 4.6, 4.2, 1.0], [1.4, 3.5, 3.2, 1.0], [1.9, 2.4, 2.2, 1.0], [2.4, 1.3, 1.2, 1.0]].forEach(([x, y, w, h]) => {
                        c.fillRect(at(x, y).x, at(x, y).y, w * cell, h * cell);
                        c.strokeRect(at(x, y).x, at(x, y).y, w * cell, h * cell);
                    });
                    dot(3, 0.85, '#fde68a', '#d97706', cell * 0.3);`,
};
