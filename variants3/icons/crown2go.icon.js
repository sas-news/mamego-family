module.exports = {
    icon: 'crown2go',
    body: `                    // 王冠
                    c.fillStyle = '#facc15'; c.strokeStyle = '#a16207'; c.lineWidth = 1.4;
                    c.beginPath();
                    c.moveTo(at(1.4, 4.4).x, at(1.4, 4.4).y);
                    c.lineTo(at(1.4, 2.4).x, at(1.4, 2.4).y);
                    c.lineTo(at(2.5, 3.2).x, at(2.5, 3.2).y);
                    c.lineTo(at(3, 1.8).x, at(3, 1.8).y);
                    c.lineTo(at(3.5, 3.2).x, at(3.5, 3.2).y);
                    c.lineTo(at(4.6, 2.4).x, at(4.6, 2.4).y);
                    c.lineTo(at(4.6, 4.4).x, at(4.6, 4.4).y);
                    c.closePath(); c.fill(); c.stroke();
                    dot(1.4, 2.1, '#fde68a', '#a16207', cell * 0.16); dot(3, 1.5, '#fde68a', '#a16207', cell * 0.16); dot(4.6, 2.1, '#fde68a', '#a16207', cell * 0.16);
                    dot(3, 5.1, P1, P1S, cell * 0.3);`,
};
