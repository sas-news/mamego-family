module.exports = {
    icon: 'horagaigo',
    body: `        // 法螺貝: 渦巻く貝殻と吹き口
        c.beginPath(); c.arc(at(3.1, 3.4).x, at(3.1, 3.4).y, cell * 1.05, Math.PI * 0.4, Math.PI * 1.95); c.strokeStyle = '#ea580c'; c.lineWidth = 2.4; c.stroke();
        c.beginPath(); c.arc(at(3.1, 3.4).x, at(3.1, 3.4).y, cell * 0.6, Math.PI * 0.4, Math.PI * 1.9); c.strokeStyle = '#c2410c'; c.lineWidth = 2; c.stroke();
        dot(3.3, 3.3, '#fdba74', '#ea580c', cell * 0.26); // 貝の芯
        seg(1.6, 3.9, 2.4, 3.6, '#9a3412', 2.2);   // 吹き口
        dot(1.6, 4, '#78350f', '#451a03', cell * 0.22);`,
};
