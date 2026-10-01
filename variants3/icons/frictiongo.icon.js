module.exports = {
    icon: "frictiongo",
    body: `// 摩擦する2石と静電火花
dot(2.4,3,P1,P1S,cell*0.55,1);
dot(3.7,3,P2,P2S,cell*0.55,1);
seg(3.0,2.0,3.1,1.4,'#fbbf24',1.5);
seg(3.1,1.4,2.9,1.6,'#fbbf24',1.3);
seg(3.05,2.2,3.3,1.9,'#fde68a',1.2);
dot(3.05,2.2,'#fde68a','#f59e0b',cell*0.12,1);`,
};
