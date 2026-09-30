module.exports = {
    icon: 'knight2go',
    body: `        // 跳馬: 桂馬の跳び筋と石
        dot(1.6, 3.6, P1, P1S);
        c.strokeStyle = '#34d399'; c.lineWidth = 2; c.lineCap = 'round';
        c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(at(1.6, 3.6).x, at(1.6, 3.6).y); c.lineTo(at(3.6, 2.6).x, at(3.6, 2.6).y); c.stroke();
        c.setLineDash([]);
        tri(3.6, 2.6, cell * 0.32, '#34d399', '#047857', Math.PI / 4);
        dot(4.8, 1.6, P2, P2S, cell * 0.3);
        txt('桂', 4.8, 4.6, '#047857', cell * 1.1);
    `,
};
