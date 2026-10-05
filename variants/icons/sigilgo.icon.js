module.exports = {
    icon: 'sigilgo',
    body: `                    // 3x3の印章と朱枠
                    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) dot(1.6 + x, 1.6 + y, P1, P1S, cell * 0.36);
                    c.strokeStyle = '#dc2626'; c.lineWidth = 2;
                    c.strokeRect(at(0.95, 0.95).x, at(0.95, 0.95).y, cell * 4.1, cell * 4.1);
                    txt('印', 4.7, 4.9, '#dc2626', cell * 1.1);`,
};
