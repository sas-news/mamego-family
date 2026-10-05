module.exports = {
    icon: "sunpillargo",
    body: `// 縦に立つ光柱と石
ctx.fillStyle='rgba(253,224,71,0.45)';
ctx.fillRect(cell*2.2,0,cell*1.6,cell*6);
ctx.strokeStyle='rgba(251,191,36,0.9)'; ctx.lineWidth=1.4;
ctx.strokeRect(cell*2.2,0,cell*1.6,cell*6);
dot(3,1.2,P1,P1S,cell*0.42,1);
dot(3,2.8,P1,P1S,cell*0.42,1);
dot(3,4.4,P1,P1S,cell*0.42,1);
dot(0.8,3.2,P2,P2S,cell*0.4,1);
dot(5.2,3.0,P2,P2S,cell*0.4,1);`,
};
