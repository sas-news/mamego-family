module.exports = {
    icon: 'templego',
    body: `                    // 寺院: 屋根と柱と囲む石
                    tri(3, 1.6, cell * 1.15, '#b45309', '#78350f');
                    c.fillStyle = '#d4af37'; c.fillRect(at(3, 3.4).x - cell * 0.55, at(3, 3.4).y - cell * 0.45, cell * 1.1, cell * 0.9);
                    c.fillStyle = '#78350f';
                    c.fillRect(at(3, 3.4).x - cell * 0.38, at(3, 3.4).y - cell * 0.38, cell * 0.14, cell * 0.76);
                    c.fillRect(at(3, 3.4).x + cell * 0.24, at(3, 3.4).y - cell * 0.38, cell * 0.14, cell * 0.76);
                    dot(1.4, 4.8, P1, P1S); dot(2.6, 5.1, P1, P1S); dot(3.8, 5.1, P1, P1S); dot(5, 4.8, P1, P1S);`,
};
