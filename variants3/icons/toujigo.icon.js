module.exports = {
    icon: 'toujigo',
    body: `        // 湯治: 温泉の湯面と湯けむり、浸かる石
        dot(3, 4.2, '#0ea5e9', '#0369a1', cell * 1.5, 0.8);
        dot(3.4, 4.3, '#78716c', '#44403c', cell * 0.5); // 浸かる石
        c.beginPath(); c.moveTo(at(2, 3.2).x, at(2, 3.2).y); c.quadraticCurveTo(at(2.2, 2.7).x, at(2.2, 2.7).y, at(2, 2.3).x, at(2, 2.3).y); c.strokeStyle = '#bae6fd'; c.lineWidth = 1.8; c.stroke(); // 湯けむり1
        c.beginPath(); c.moveTo(at(3, 3).x, at(3, 3).y); c.quadraticCurveTo(at(3.2, 2.5).x, at(3.2, 2.5).y, at(3, 2.1).x, at(3, 2.1).y); c.strokeStyle = '#bae6fd'; c.lineWidth = 1.8; c.stroke(); // 湯けむり2
        c.beginPath(); c.moveTo(at(4, 3.2).x, at(4, 3.2).y); c.quadraticCurveTo(at(4.2, 2.7).x, at(4.2, 2.7).y, at(4, 2.3).x, at(4, 2.3).y); c.strokeStyle = '#bae6fd'; c.lineWidth = 1.8; c.stroke(); // 湯けむり3`,
};
