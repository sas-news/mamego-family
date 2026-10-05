module.exports = {
    icon: "byakuyago",
    body: `// 白夜の太陽と消えた夜帯
ctx.fillStyle='rgba(30,27,75,0.35)';
ctx.fillRect(0,0,cell*6,cell*1.6);
dot(3,0.9,'#fde68a','#d97706',cell*0.55,1);
seg(1,0.9,5,0.9,'rgba(253,224,71,0.7)',1.4);
dot(1.5,3.6,P1,P1S,cell*0.5,1);
dot(3.4,3.8,P2,P2S,cell*0.5,1);
dot(5.0,3.4,P1,P1S,cell*0.42,1);`,
};
