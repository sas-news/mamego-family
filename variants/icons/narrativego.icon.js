module.exports = {
    icon: 'narrativego',
    body: `        // 物語: 開いた本と文字行
        c.strokeStyle = '#92400e'; c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(at(1.2, 2).x, at(1.2, 2).y); c.quadraticCurveTo(at(3, 1.4).x, at(3, 1.4).y, at(3, 2).x, at(3, 2).y);
        c.quadraticCurveTo(at(3, 1.4).x, at(3, 1.4).y, at(4.8, 2).x, at(4.8, 2).y);
        c.lineTo(at(4.8, 4.6).x, at(4.8, 4.6).y); c.quadraticCurveTo(at(3, 4).x, at(3, 4).y, at(3, 4.6).x, at(3, 4.6).y);
        c.quadraticCurveTo(at(3, 4).x, at(3, 4).y, at(1.2, 4.6).x, at(1.2, 4.6).y);
        c.closePath(); c.stroke();
        [[1.8, 2.6, 2.6], [1.8, 3.2, 2.6], [3.4, 2.6, 4.2], [3.4, 3.2, 4.2]].forEach(([x, y, x2]) => {
            seg(x, y, x2, y, 'rgba(146,64,14,0.6)', 1.4);
        });
        dot(3, 0.9, P2, P2S, cell * 0.3);
    `,
};
