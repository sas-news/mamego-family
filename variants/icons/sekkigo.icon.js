module.exports = {
    icon: "sekkigo",
    body: `// 四半分に色分けされた節気盤と太陽
const q = [[P1,'rgba(74,222,128,0.85)'],[P2S,'rgba(250,204,21,0.85)'],[P1S,'rgba(248,113,113,0.85)'],[P2,'rgba(96,165,250,0.85)']];
ctx.fillStyle=q[0][1]; ctx.fillRect(0,0,cell*3,cell*3);
ctx.fillStyle=q[1][1]; ctx.fillRect(cell*3,0,cell*3,cell*3);
ctx.fillStyle=q[2][1]; ctx.fillRect(0,cell*3,cell*3,cell*3);
ctx.fillStyle=q[3][1]; ctx.fillRect(cell*3,cell*3,cell*3,cell*3);
dot(3,3,'#fde68a','#b45309',cell*0.55,1);
seg(1,3,5,3,'rgba(120,60,10,0.8)',1.2);
seg(3,1,3,5,'rgba(120,60,10,0.8)',1.2);`,
};
