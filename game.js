const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

window.addEventListener("resize", resize);//画面のサイズが変わった時

const keys = {};//押されているキー
document.addEventListener("keydown",e => keys[e.key]=true);//キーが押された時
document.addEventListener("keyup",e => keys[e.key]=false);//キーが押されてない時

const camera =
{
  pos: {x: -1, y: 5, z: -20},
  rot: {x: 0, y: 0, z: 0},
  fov: 500,
  zclip: 1
}


resize();
loop();

function loop() 
{
  move();
  draw();
  requestAnimationFrame(loop);
}

function resize() 
{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function move() 
{
  camera.pos.z +=0.01;
  camera.rot.y +=0.02;
  
  const speed = 0.1;
  
  const sinY = Math.sin(camera.rot.y);
  const cosY = Math.cos(camera.rot.y);

  if(keys["w"]) 
  {
    camera.pos.x += sinY * speed;
    camera.pos.z += cosY * speed;
  }
  if(keys["s"]) 
  {
    camera.pos.x -= sinY * speed;
    camera.pos.z -= cosY * speed;
  }
  if(keys["a"])
  {
    camera.pos.x -= cosY * speed;
    camera.pos.z += sinY * speed;
  }
  if(keys["d"])
  {
    camera.pos.x += cosY * speed;
    camera.pos.z -= sinY * speed;
  }


  if(keys["q"]) camera.pos.y +=1;
  if(keys["e"]) camera.pos.y -=1;

  if(keys["i"]) camera.fov +=3;
  if(keys["k"]) camera.fov -=3;

  if(keys["ArrowLeft"]) camera.rot.y -=0.01;
  if(keys["ArrowRight"]) camera.rot.y +=0.01;
  if(keys["ArrowUp"]) camera.rot.x -=0.01;
  if(keys["ArrowDown"]) camera.rot.x +=0.01;
}


function draw()//メイン描画
{
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let v1 = {x:0,y:0,z:5};
  let v2 = {x:5,y:0,z:5};
  let v3 = {x:5,y:0,z:10};

  fillTriangle3D(v1,v2,v3,camera,"red");

  let v4 = {x:0,y:0,z:5};
  let v5 = {x:5,y:0,z:10};
  let v6 = {x:0,y:0,z:10};

  fillTriangle3D(v4,v5,v6,camera,"red");

  let v7 = {x:0,y:0,z:10};
  let v8 = {x:5,y:0,z:10};
  let v9 = {x:5,y:5,z:10};

  fillTriangle3D(v7,v8,v9,camera,"yellow")

  let v10 = {x:0,y:0,z:10};
  let v11 = {x:5,y:5,z:10};
  let v12 = {x:0,y:5,z:10};

  fillTriangle3D(v10,v11,v12,camera,"yellow")
}


function drawLine(x1, y1, x2, y2, color = "white", width = 1)//線を引く
{
  ctx.strokeStyle = color;
  ctx.lineWidth = width;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function intersectZclip(a,b,zclip)//zclipと線分abの交点計算
{
  const t = (zclip - a.z) / (b.z - a.z);
  
  return{
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: zclip
  };
}


function fillTriangle3D(v1,v2,v3,cam,color)//3Dワールド座標の三角形v1,v2,v3を塗りつぶす
{
  let c1 = worldToCamera(v1,cam);
  let c2 = worldToCamera(v2,cam);
  let c3 = worldToCamera(v3,cam);

  const zc = cam.zclip;

  const isOk1 = c1.z >= zc;
  const isOk2 = c2.z >= zc;
  const isOk3 = c3.z >= zc;

  if(!isOk1&&!isOk2&&!isOk3) return;//nnn

  if(isOk1&&isOk2&&isOk3)//yyy
  {
      drawClippedTriangle(c1,c2,c3,cam,color);
      return;
  }

  //ynn,nyn,nny
  if(isOk1&&!isOk2&&!isOk3)//ynn
  {
    let i2 = intersectZclip(c1, c2, zc);
    let i3 = intersectZclip(c1, c3, zc);
    drawClippedTriangle(c1, i2, i3, cam, color);
    return;
  }
  if(!isOk1&&isOk2&&!isOk3)//nyn
  {
    let i1 = intersectZclip(c2,c1,zc);
    let i3 = intersectZclip(c2,c3,zc);
    drawClippedTriangle(i1,c2,i3,cam,color);
    return;
  }
  if(!isOk1&&!isOk2&&isOk3)
  {
    let i1 = intersectZclip(c3,c1,zc);
    let i2 = intersectZclip(c3,c2,zc);
    drawClippedTriangle(i1,i2,c3,cam,color);
    return;
  }

  //yyn,yny,nyy
  if(!isOk1&&isOk2&&isOk3)
  {
    let i2 = intersectZclip(c1,c2,zc);
    let i3 = intersectZclip(c1,c3,zc);
    drawClippedTriangle(c2,c3,i2,cam,color);
    drawClippedTriangle(c3,i2,i3,cam,color);
    return;
  }
  if(isOk1&&!isOk2&&isOk3)
  {
    let i1 = intersectZclip(c2,c1,zc);
    let i3 = intersectZclip(c2,c3,zc);
    drawClippedTriangle(c1,c3,i1,cam,color);
    drawClippedTriangle(c3,i1,i3,cam,color);
    return;
  }
  if(isOk1&&isOk2&&!isOk3)
  {
    let i1 = intersectZclip(c3,c1,zc);
    let i2 = intersectZclip(c3,c2,zc);
    drawClippedTriangle(c1,c2,i1,cam,color);
    drawClippedTriangle(c2,i1,i2,cam,color);
  }
}


function fillTriangle(x1, y1, x2, y2, x3, y3, color)//実際に画面に描く
{
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}


function drawClippedTriangle(a,b,c,cam,color)
{
  let p1 = project(a);
  let p2 = project(b);
  let p3 = project(c);
  fillTriangle(p1.x,p1.y,p2.x,p2.y,p3.x,p3.y,color);
}


function project(v)//画面の座標に変換
{
  const scale = camera.fov/ v.z;
  return{
    x: canvas.width  / 2 + v.x * scale,
    y: canvas.height / 2 - v.y * scale
  };
}


function worldToCamera(v, cam)//ワールド座標をカメラの座標に変換
{
  let x = v.x - cam.pos.x;
  let y = v.y - cam.pos.y;
  let z = v.z - cam.pos.z;

  //y
  let cosY = Math.cos(-cam.rot.y);
  let sinY = Math.sin(-cam.rot.y);
  let x1 = x * cosY + z * sinY;
  let z1 = -x * sinY + z * cosY;

  //x
  let cosX = Math.cos(-cam.rot.x);
  let sinX = Math.sin(-cam.rot.x);
  let y2 = y * cosX - z1 * sinX;
  let z2 = y * sinX + z1 * cosX;

  //z
  let cosZ = Math.cos(-cam.rot.z);
  let sinZ = Math.sin(-cam.rot.z);
  let x3 = x1 * cosZ - y2 * sinZ;
  let y3 = x1 * sinZ + y2 * cosZ;

  return { x: fix(x3), y: fix(y3), z: fix(z2) };
}


function fix(n)//誤差修正
{
    return Math.abs(n) < 1e-10 ? 0 : n;
}
