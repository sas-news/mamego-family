module.exports = {
    icon: "getsureigo",
    body: `// 月齢と夜の帯
ctx.fillStyle='rgba(30,27,75,0.75)';
ctx.fillRect(0,0,cell*6,cell*2.2);
dot(4.6,1.1,'#fde68a','#d97706',cell*0.55,1);
dot(4.85,0.9,'rgba(30,27,75,0.9)','rgba(30,27,75,0.9)',cell*0.5,1);
dot(1.5,3.4,P1,P1S,cell*0.5,1);
dot(3.2,3.6,P2,P2S,cell*0.5,1);
dot(4.9,3.8,P1,P1S,cell*0.4,1);
dot(1.2,1.0,'#e0e7ff','#818cf8',cell*0.08,1);
dot(2.2,1.6,'#e0e7ff','#818cf8',cell*0.06,1);`,
};
