module.exports = {
    icon: "polarnightgo",
    body: `// 極夜の星空と沈む盤
ctx.fillStyle='rgba(15,23,42,0.92)';
ctx.fillRect(0,0,cell*6,cell*6);
dot(1.2,1.0,'#e0e7ff','#818cf8',cell*0.09,1);
dot(3.4,0.7,'#e0e7ff','#818cf8',cell*0.07,1);
dot(4.8,1.5,'#e0e7ff','#818cf8',cell*0.08,1);
dot(2.2,2.0,'#c7d2fe','#6366f1',cell*0.06,1);
dot(2,4.0,P1,P1S,cell*0.5,0.8);
dot(4.2,4.2,P2,P2S,cell*0.5,0.8);
seg(0.8,3.0,5.2,3.0,'rgba(129,140,248,0.5)',1.2);`,
};
