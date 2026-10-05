module.exports = {
    icon: 'paintergo',
    body: `        // 絵画: 筆の軌跡と2つの石
        c.strokeStyle = '#7c3aed'; c.lineWidth = cell * 0.28; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(1, 4.6).x, at(1, 4.6).y); c.quadraticCurveTo(at(3, 4).x, at(3, 4).y, at(3.4, 2).x, at(3.4, 2).y); c.stroke();
        c.strokeStyle = '#a78bfa'; c.lineWidth = cell * 0.16;
        c.beginPath(); c.moveTo(at(1.6, 4.8).x, at(1.6, 4.8).y); c.quadraticCurveTo(at(4.4, 4.2).x, at(4.4, 4.2).y, at(4.8, 2.6).x, at(4.8, 2.6).y); c.stroke();
        dot(1.8, 1.6, P1, P1S); dot(4.6, 1.2, P2, P2S);
        tri(3.6, 1.6, cell * 0.4, '#c084fc', '#7e22ce');
    `,
};
