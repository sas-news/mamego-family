module.exports = {
    icon: 'joyago',
    body: `        // 除夜: 除夜の鐘と響き
        c.fillStyle = '#78350f';
        c.beginPath(); c.arc(at(3,3).x, at(3,3).y - cell * 0.1, cell * 0.95, Math.PI, 0);
        c.rect(at(3,3).x - cell * 0.95, at(3,3).y - cell * 0.1, cell * 1.9, cell * 0.9); c.fill(); // 鐘
        c.fillStyle = '#fde047'; c.fillRect(at(3,3).x - cell * 0.12, at(3,3).y - cell * 0.7, cell * 0.24, cell * 0.4); // 撞座
        ring(3, 3, cell * 1.5, 'rgba(180,83,9,0.7)', 1.4); // 響き
        ring(3, 3, cell * 2.0, 'rgba(180,83,9,0.4)', 1.2);
        txt('108', 3, 5.1, '#b45309', cell * 0.6);`,
};
