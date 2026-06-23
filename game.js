const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

window.addEventListener("resize", resize);//画面のサイズが変わった時

const keys = {};//押されているキー
document.addEventListener("keydown",e => keys[e.key]=true);//キーが押された時
document.addEventListener("keyup",e => keys[e.key]=false);//キーが押されてない時

const camera =
{
  pos: {x: -1, y: 2, z: -10},
  rot: {x: 0, y: 0, z: 0},
  fov: 300,
  zclip: 0.0001
};

let depthBuffer;
let imageData;
let pixels;

let triangles = 
[
  {
  v1:{x:0,y:0,z:0},
  v2:{x:1,y:0,z:0},
  v3:{x:1,y:1,z:0},
  color:"#FFFFFF"
 },
 {
   v1:{x:0,y:0,z:0},
   v2:{x:1,y:1,z:0},
   v3:{x:0,y:1,z:0},
   color:"#00ff00"
 },
 {
   v1:{x:0,y:0,z:0},
   v2:{x:0,y:0,z:1},
   v3:{x:0,y:1,z:1},
   color:"#ffffff"
 }
];

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


  if(keys["q"]) camera.pos.y +=speed;
  if(keys["e"]) camera.pos.y -=speed;

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

  imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels = imageData.data;

  depthBuffer = new Float32Array(canvas.width * canvas.height);
  for (let i = 0; i < depthBuffer.length; i++) depthBuffer[i] = Infinity;

  
  for(let tri of triangles)
  {
   fillTriangle3D(tri.v1, tri.v2, tri.v3, camera, tri.color);
  }

  ctx.putImageData(imageData, 0, 0);
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


function fillTriangle3D(v1, v2, v3, cam, color )//3Dワールド座標の三角形v1,v2,v3を塗りつぶす
{
  let c1 = worldToCamera(v1, cam);
  let c2 = worldToCamera(v2, cam);
  let c3 = worldToCamera(v3, cam);

  const zc = cam.zclip;

  const isOk1 = c1.z >= zc;
  const isOk2 = c2.z >= zc;
  const isOk3 = c3.z >= zc;

  if(!isOk1&&!isOk2&&!isOk3) return;//nnn

  if(isOk1&&isOk2&&isOk3)//yyy
  {
      drawClippedTriangle(c1, c2, c3, cam, color);
      return;
  }

  //ynn,nyn,nny
  if(isOk1&&!isOk2&&!isOk3)//ynn
  {
    let i2 = intersectZclip(c1, c2, zc);
    let i3 = intersectZclip(c1, c3, zc);
    drawClippedTriangle(c1 , i2, i3, cam, color);
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
  if(!isOk1&&isOk2&&isOk3)//nyy
  {
    let i2 = intersectZclip(c1,c2,zc);
    let i3 = intersectZclip(c1,c3,zc);
    drawClippedTriangle(c2,c3,i2,cam,color);
    drawClippedTriangle(c3,i2,i3,cam,color);
    return;
  }
  if(isOk1&&!isOk2&&isOk3)//yny
  {
    let i1 = intersectZclip(c2,c1,zc);
    let i3 = intersectZclip(c2,c3,zc);
    drawClippedTriangle(c1,c3,i1,cam,color);
    drawClippedTriangle(c3,i1,i3,cam,color);
    return;
  }
  if(isOk1&&isOk2&&!isOk3)//yyn
  {
    let i1 = intersectZclip(c3, c1, zc);
    let i2 = intersectZclip(c3, c2, zc);
    drawClippedTriangle(c1, c2, i1, cam, color);
    drawClippedTriangle(c2, i1, i2, cam, color);
  }
}


function fillTriangle(p1, p2, p3, color)
{
  const x1 = p1.x, y1 = p1.y, z1 = p1.z;
  const x2 = p2.x, y2 = p2.y, z2 = p2.z;
  const x3 = p3.x, y3 = p3.y, z3 = p3.z;

  const minX = Math.max(0, Math.floor(Math.min(x1, x2, x3)));
  const maxX = Math.min(canvas.width - 1, Math.ceil(Math.max(x1, x2, x3)));
  const minY = Math.max(0, Math.floor(Math.min(y1, y2, y3)));
  const maxY = Math.min(canvas.height - 1, Math.ceil(Math.max(y1, y2, y3)));

  const denom =
    (y2 - y3) * (x1 - x3) +
    (x3 - x2) * (y1 - y3);

  if (denom === 0) return;

  // 色をRGBに変換
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  for (let y = minY; y <= maxY; y++)
  {
    for (let x = minX; x <= maxX; x++)
    {
      const w1 =
        ((y2 - y3) * (x - x3) +
         (x3 - x2) * (y - y3)) / denom;
      const w2 =
        ((y3 - y1) * (x - x3) +
         (x1 - x3) * (y - y3)) / denom;
      const w3 = 1 - w1 - w2;

      if (w1 < 0 || w2 < 0 || w3 < 0) continue;

      const z = w1 * z1 + w2 * z2 + w3 * z3;

      const idx = y * canvas.width + x;

      if (z < depthBuffer[idx])
      {
        depthBuffer[idx] = z;

        const p = idx * 4;
        pixels[p] = r;
        pixels[p+1] = g;
        pixels[p+2] = b;
        pixels[p+3] = 255;
      }
    }
  }
}


function drawClippedTriangle(a, b, c, cam, color)
{
  let p1 = project(a);
  let p2 = project(b);
  let p3 = project(c);

  p1.z = a.z;
  p2.z = b.z;
  p3.z = c.z;

  fillTriangle(p1, p2, p3, color);
}


function project(v)//画面の座標に変換
{
  const scale = camera.fov / v.z;
  return{
    x: (canvas.width  / 2) + v.x * scale,
    y: (canvas.height / 2) - v.y * scale
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
