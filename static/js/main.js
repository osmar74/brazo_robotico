const DEG = Math.PI / 180;

/* ── Renderer ── */
const container = document.getElementById('canvas-container');
const renderer  = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

function resize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* ── Scene ── */
const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x0f1117);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(6, 5, 7);
camera.lookAt(0, 2, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dLight = new THREE.DirectionalLight(0xffffff, 0.9);
dLight.position.set(5, 10, 5);
dLight.castShadow = true;
scene.add(dLight);
const fill = new THREE.DirectionalLight(0x88aaff, 0.3);
fill.position.set(-5, 3, -3);
scene.add(fill);

/* ── Grid ── */
scene.add(new THREE.GridHelper(10, 20, 0x222233, 0x1a1a2e));

/* ── Ejes ── */
const axMat = {
  x: new THREE.LineBasicMaterial({ color: 0xff4444 }),
  y: new THREE.LineBasicMaterial({ color: 0x44ff44 }),
  z: new THREE.LineBasicMaterial({ color: 0x4488ff }),
};

function makeLine(a, b, mat) {
  const g = new THREE.BufferGeometry().setFromPoints(
    [new THREE.Vector3(...a), new THREE.Vector3(...b)]
  );
  return new THREE.Line(g, mat);
}
scene.add(makeLine([0,0,0],[2,0,0], axMat.x));
scene.add(makeLine([0,0,0],[0,2,0], axMat.y));
scene.add(makeLine([0,0,0],[0,0,2], axMat.z));

/* ── Materiales ── */
const matBase  = new THREE.MeshStandardMaterial({ color:0x334455, roughness:0.4, metalness:0.7 });
const matArm   = new THREE.MeshStandardMaterial({ color:0x2277cc, roughness:0.3, metalness:0.6 });
const matJoint = new THREE.MeshStandardMaterial({ color:0xeeaa22, roughness:0.2, metalness:0.8 });
const matGrip  = new THREE.MeshStandardMaterial({ color:0xcc3322, roughness:0.5, metalness:0.4 });
const matDot   = new THREE.MeshStandardMaterial({
  color:0xff0000, emissive:0xff0000, emissiveIntensity:0.6
});

function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.castShadow = true;
  return m;
}
function cyl(rt, rb, h, mat, seg=16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), mat);
  m.castShadow = true;
  return m;
}
function sph(r, mat) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r,16,16), mat);
  m.castShadow = true;
  return m;
}

/* ── Construcción del brazo ── */
const base = new THREE.Group();
const basePlate = cyl(1.0, 1.2, 0.3, matBase);
basePlate.position.y = 0.15;
const basePost = cyl(0.35, 0.35, 0.6, matBase);
basePost.position.y = 0.6;
base.add(basePlate, basePost);
scene.add(base);

const shoulder = new THREE.Group();
shoulder.position.y = 0.9;
base.add(shoulder);
shoulder.add(sph(0.28, matJoint));

const upperArm = new THREE.Group();
shoulder.add(upperArm);
const armUpper = box(0.2, 2.2, 0.2, matArm);
armUpper.position.y = 1.1;
upperArm.add(armUpper);
const elbowSph = sph(0.22, matJoint);
elbowSph.position.y = 2.2;
upperArm.add(elbowSph);

const forearmGroup = new THREE.Group();
forearmGroup.position.y = 2.2;
upperArm.add(forearmGroup);
const armFore = box(0.18, 1.8, 0.18, matArm);
armFore.position.y = 0.9;
forearmGroup.add(armFore);
const wristSph = sph(0.18, matJoint);
wristSph.position.y = 1.8;
forearmGroup.add(wristSph);

const gripGroup = new THREE.Group();
gripGroup.position.y = 1.8;
forearmGroup.add(gripGroup);
const gripBase2 = box(0.3, 0.15, 0.15, matArm);
gripBase2.position.y = 0.07;
gripGroup.add(gripBase2);

const finger1 = box(0.08, 0.4, 0.08, matGrip);
finger1.position.set(0.15, 0.27, 0);
gripGroup.add(finger1);

const finger2 = box(0.08, 0.4, 0.08, matGrip);
finger2.position.set(-0.15, 0.27, 0);
gripGroup.add(finger2);

const effDot = sph(0.07, matDot);
effDot.position.y = 0.6;
gripGroup.add(effDot);

/* ── Aplicar ángulos a la escena ── */
function applyAngles(t1, t2, t3, grip) {
  base.rotation.y         =  t1 * DEG;
  upperArm.rotation.z     = -t2 * DEG;
  forearmGroup.rotation.z = (180 - t3) * DEG;

  const spread = 0.1 + grip * 0.0015;
  finger1.position.x =  spread;
  finger2.position.x = -spread;

  document.getElementById('v1').textContent = Math.round(t1) + '°';
  document.getElementById('v2').textContent = Math.round(t2) + '°';
  document.getElementById('v3').textContent = Math.round(t3) + '°';
  document.getElementById('vg').textContent =
    grip < 20 ? 'abierta' : grip > 80 ? 'cerrada' : 'parcial';
}

/* ── Comunicación con el API ── */
async function fetchKinematics(t1, t2, t3, grip) {
  try {
    const res = await fetch('/kinematics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theta1:t1, theta2:t2, theta3:t3, grip }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    document.getElementById('ex').textContent = data.x.toFixed(2);
    document.getElementById('ey').textContent = data.y.toFixed(2);
    document.getElementById('ez').textContent = data.z.toFixed(2);
    setStatus('ok', 'API conectada');
  } catch (e) {
    setStatus('err', 'Error API: ' + e.message);
  }
}

function setStatus(type, msg) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status ' + type;
}

/* ── Lectura de sliders ── */
function getSliders() {
  return {
    t1:   parseFloat(document.getElementById('s1').value),
    t2:   parseFloat(document.getElementById('s2').value),
    t3:   parseFloat(document.getElementById('s3').value),
    grip: parseFloat(document.getElementById('sg').value),
  };
}

function onSlider() {
  const { t1, t2, t3, grip } = getSliders();
  applyAngles(t1, t2, t3, grip);
  fetchKinematics(t1, t2, t3, grip);
}

/* ── Reset a posición home ── */
async function resetHome() {
  stopDemo();
  try {
    const res  = await fetch('/reset');
    const data = await res.json();
    document.getElementById('s1').value = data.theta1;
    document.getElementById('s2').value = data.theta2;
    document.getElementById('s3').value = data.theta3;
    document.getElementById('sg').value = 0;
    applyAngles(data.theta1, data.theta2, data.theta3, 0);
    document.getElementById('ex').textContent = data.x.toFixed(2);
    document.getElementById('ey').textContent = data.y.toFixed(2);
    document.getElementById('ez').textContent = data.z.toFixed(2);
  } catch (e) {
    setStatus('err', 'Error reset: ' + e.message);
  }
}

/* ── Demo automático ── */
let demoRaf = null, demoT = 0;

function toggleDemo() {
  if (demoRaf) { stopDemo(); return; }
  document.getElementById('btn-demo').classList.add('active');
  document.getElementById('btn-demo').textContent = '⏹ Detener';
  function step() {
    demoT += 0.02;
    const t1   = Math.sin(demoT) * 120;
    const t2   = 45 + Math.sin(demoT * 1.3) * 40;
    const t3   = 90 + Math.sin(demoT * 0.8 + 1) * 60;
    const grip = (Math.sin(demoT * 2) + 1) * 50;
    document.getElementById('s1').value = t1;
    document.getElementById('s2').value = t2;
    document.getElementById('s3').value = t3;
    document.getElementById('sg').value = grip;
    applyAngles(t1, t2, t3, grip);
    fetchKinematics(t1, t2, t3, grip);
    demoRaf = requestAnimationFrame(step);
  }
  demoRaf = requestAnimationFrame(step);
}

function stopDemo() {
  if (demoRaf) { cancelAnimationFrame(demoRaf); demoRaf = null; }
  document.getElementById('btn-demo').classList.remove('active');
  document.getElementById('btn-demo').textContent = '▶ Demo';
}

/* ── Órbita con mouse ── */
let drag = false, prevX = 0, prevY = 0;
let azimuth = Math.PI / 4, elevation = 0.6, radius = 10;

function updateCamera() {
  camera.position.x = radius * Math.sin(azimuth) * Math.cos(elevation);
  camera.position.y = radius * Math.sin(elevation) + 2;
  camera.position.z = radius * Math.cos(azimuth) * Math.cos(elevation);
  camera.lookAt(0, 2, 0);
}
updateCamera();

const cvs = renderer.domElement;
cvs.addEventListener('mousedown',  e => { drag=true; prevX=e.clientX; prevY=e.clientY; });
cvs.addEventListener('mousemove',  e => {
  if (!drag) return;
  azimuth   -= (e.clientX - prevX) * 0.01;
  elevation  = Math.max(-0.2, Math.min(1.2, elevation + (e.clientY - prevY) * 0.01));
  prevX = e.clientX; prevY = e.clientY;
  updateCamera();
});
cvs.addEventListener('mouseup',    () => drag = false);
cvs.addEventListener('mouseleave', () => drag = false);
cvs.addEventListener('wheel', e => {
  radius = Math.max(4, Math.min(18, radius + e.deltaY * 0.01));
  updateCamera();
  e.preventDefault();
}, { passive: false });

/* ── Touch ── */
let tPrev = null;
cvs.addEventListener('touchstart', e => { tPrev = e.touches[0]; });
cvs.addEventListener('touchmove',  e => {
  if (!tPrev) return;
  azimuth   -= (e.touches[0].clientX - tPrev.clientX) * 0.01;
  elevation  = Math.max(-0.2, Math.min(1.2, elevation + (e.touches[0].clientY - tPrev.clientY) * 0.01));
  tPrev = e.touches[0];
  updateCamera();
});

/* ── Loop de render ── */
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

/* ── Inicio ── */
resize();
render();
onSlider();