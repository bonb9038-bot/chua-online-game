// Chùa Online 3D — client phòng chung (Three.js + Socket.io)
// Đi bộ WASD, kéo chuột xoay camera, chạm để đi, làm lễ như thật.
const AVATARS = [
  { emoji: '🧒', label: 'Chú tiểu', robe: 0x8d6e63, skin: 0xf2c89b, hair: 'topknot' },
  { emoji: '👩‍🦲', label: 'Sư cô', robe: 0x6d4c41, skin: 0xf2c89b, hair: 'none' },
  { emoji: '🧑‍🦲', label: 'Sư thầy', robe: 0xd4a017, skin: 0xf2c89b, hair: 'none' },
  { emoji: '👨', label: 'Phật tử nam', robe: 0x3b6ea5, skin: 0xf2c89b, hair: 'short' },
  { emoji: '👩', label: 'Phật tử nữ', robe: 0xc25b7a, skin: 0xf2c89b, hair: 'bun' },
  { emoji: '👵', label: 'Bà cụ', robe: 0x4a5d7a, skin: 0xeec39a, hair: 'greybun' },
  { emoji: '👴', label: 'Ông cụ', robe: 0x5d6d5a, skin: 0xeec39a, hair: 'grey' },
  { emoji: '🧘', label: 'Thiền sinh', robe: 0x5a7d4f, skin: 0xf2c89b, hair: 'band' },
];
const ACTION_LABELS = {
  huong: '🪔 đang thắp hương', le: '🙏 đang lễ Phật', lePhat: '🙏 đang lễ Phật — Phật phát sáng',
  chuong: '🔔 đang gõ chuông', nen: '🕯️ đang thắp nến', hoa: '🌸 đang dâng hoa',
  thien: '🧘 đang ngồi thiền', niemPhat: '📿 đang niệm Phật',
};
const CHANT_LINES = [
  'Nam Mô A Di Đà Phật',
  'Nam Mô Quán Thế Âm Bồ Tát',
  'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật',
  'Nguyện đem công đức này, hướng về khắp tất cả',
  'Đệ tử và chúng sanh, đều trọn thành Phật đạo',
];
// Điểm làm lễ: vị trí vật, bán kính đứng gần, điểm đứng của người, hướng mặt
const SPOTS = {
  huong:  { x: 0,    z: -8,   r: 4.2, stand: { x: 0, z: -5.2 },  rot: Math.PI, label: '🪔 Thắp hương',  verb: 'thắp hương' },
  lePhat: { x: 0,    z: -13,  r: 4.5, stand: { x: 0, z: -10.8 }, rot: Math.PI, label: '🙏 Lễ Phật',    verb: 'lễ Phật' },
  chuong: { x: -14,  z: -10,  r: 3.8, stand: { x: -11.8, z: -10 }, rot: -Math.PI / 2, label: '🔔 Gõ chuông', verb: 'gõ chuông' },
  nen:    { x: 2.5,  z: -12.5, r: 4.2, stand: { x: 2.5, z: -10.6 }, rot: Math.PI, label: '🕯️ Thắp nến', verb: 'thắp nến' },
  hoa:    { x: -2.5, z: -12.5, r: 4.2, stand: { x: -2.5, z: -10.6 }, rot: Math.PI, label: '🌸 Dâng hoa', verb: 'dâng hoa' },
  thien:  { x: 8,    z: -4,   r: 3.2, stand: { x: 8, z: -4 },    rot: Math.PI, label: '🧘 Ngồi thiền', verb: 'ngồi thiền' },
};

let socket = null;
let myId = null;
let myName = '';
let myAvatar = AVATARS[0];
let selectedAvatar = AVATARS[0];
let bubbleTimers = {};
let audioCtx = null;
let soundOn = true;
let chanting = false;
let chantTimer = null;
let chantCount = 0;
let chantLineIdx = 0;
let lastGlowAt = 0;

const $ = (id) => document.getElementById(id);
const loginScreen = $('loginScreen'), gameScreen = $('gameScreen');

// ---- Âm thanh chuông / mõ / tụng bằng Web Audio (không cần file ngoài) ----
function ensureAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* trình duyệt chặn âm thanh thì bỏ qua */ }
}
function playBell() {
  if (!soundOn) return;
  ensureAudio(); if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    [523.25, 783.99, 1046.5].forEach((freq, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18 / (i + 1), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 2.5);
    });
  } catch (e) { /* bỏ qua */ }
}
function playDeepBell() {
  if (!soundOn) return;
  ensureAudio(); if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    [98, 147, 196, 294].forEach((freq, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.22 / (i + 1), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 4.5);
    });
  } catch (e) { /* bỏ qua */ }
}
function playChantTone(step) {
  if (!soundOn) return;
  ensureAudio(); if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
    o1.type = 'triangle'; o1.frequency.value = step % 2 === 0 ? 392 : 330;
    g1.gain.setValueAtTime(0.16, t); g1.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o1.connect(g1); g1.connect(audioCtx.destination); o1.start(t); o1.stop(t + 0.7);
    const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
    o2.type = 'sine'; o2.frequency.value = 880;
    g2.gain.setValueAtTime(0.06, t + 0.35); g2.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    o2.connect(g2); g2.connect(audioCtx.destination); o2.start(t + 0.35); o2.stop(t + 1.6);
  } catch (e) { /* bỏ qua */ }
}
$('soundBtn').onclick = () => {
  soundOn = !soundOn;
  $('soundBtn').textContent = soundOn ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt';
  if (soundOn) playBell();
};

// ---- Màn hình đăng nhập ----
const grid = $('avatarGrid');
AVATARS.forEach((a) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'avatar-btn' + (a.emoji === selectedAvatar.emoji ? ' selected' : '');
  b.innerHTML = a.emoji + '<small>' + a.label + '</small>';
  b.onclick = () => {
    selectedAvatar = a;
    document.querySelectorAll('.avatar-btn').forEach((el) => el.classList.remove('selected'));
    b.classList.add('selected');
  };
  grid.appendChild(b);
});

function join() {
  const name = $('nameInput').value.trim() || 'Phật tử';
  myName = name.slice(0, 20);
  myAvatar = selectedAvatar;
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  $('meLabel').textContent = myAvatar.emoji + ' ' + myName;
  initThree().then(() => {
    socket = io();
    socket.on('connect', () => {
      myId = socket.id;
      socket.emit('join', { name: myName, avatar: myAvatar.emoji });
    });
    socket.on('joined', (state) => { applyRoomState(state); });
    socket.on('roomState', (state) => applyRoomState(state));
    socket.on('playerMoved', (d) => onPlayerMoved(d));
    socket.on('chatMessage', (msg) => { addChat(msg); showBubble(msg.name, msg.text); });
    socket.on('actionDone', (data) => {
      updateCounters(data.counters);
      renderFeed(data.feed);
      if (data.type === 'chuong') { playBell(); swingBell(); }
      if (data.type === 'huong') { showIncenseSticks(); burstSmoke(); }
      if (data.type === 'lePhat' || data.type === 'le') triggerBuddhaGlow(data.name);
      if (data.type === 'niemPhat') setPose(data.id, 'chant');
      if (data.type === 'thien') setPose(data.id, 'sit');
      if (data.type === 'hoa') addFlowers();
      showActionLabel(data.id, data.type);
    });
    socket.on('buddhaGlow', (data) => triggerBuddhaGlow(data.name));
    socket.on('chantTick', (data) => {
      updateCounters(data.counters);
      renderFeed(data.feed);
      setPose(data.id, 'chant');
      showBubble(data.name, data.phrase);
      showActionLabel(data.id, 'niemPhat');
      if (data.id === myId) {
        $('chantPhrase').textContent = data.phrase;
        $('chantCount').textContent = data.count;
        highlightBead(data.count);
        playChantTone(data.count);
      } else if (soundOn) {
        playChantTone(data.count);
      }
    });
    socket.on('chantStopped', (data) => {
      renderFeed(data.feed);
      setPose(data.id, null);
      if (data.id === myId) { chanting = false; $('chantPanel').classList.add('hidden'); $('chantBtn').classList.remove('active'); $('chantBtn').textContent = '📿 Đọc kinh / Niệm Phật'; }
    });
    socket.on('disconnect', () => { /* tự động nối lại khi server lên lại */ });
    setInterval(() => socket.emit('heartbeat'), 20000);
  }).catch((err) => {
    $('loadingBox').innerHTML = '⚠️ Không tải được cảnh 3D (cần mạng để tải Three.js).<br><small>Vui lòng kiểm tra mạng rồi tải lại trang.</small>';
    console.error(err);
  });
}

$('joinBtn').onclick = join;
$('nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
$('leaveBtn').onclick = () => location.reload();
// Hook kiểm thử: mở ?autotest=1 sẽ tự vào chùa với tên test (để chụp màn hình/kiểm tra 3D)
if (new URLSearchParams(location.search).has('autotest')) {
  setTimeout(() => { $('nameInput').value = 'Test 3D'; join(); }, 300);
}

// ---- Hiển thị phòng (bảng bên phải) ----
function applyRoomState(state) {
  if (!state) return;
  updateCounters(state.counters);
  renderFeed(state.feed || []);
  syncPlayers(state.players || []);
  (state.chat || []).forEach(addChat);
  updateOnline(state.players || []);
}
function updateCounters(c) {
  if (!c) return;
  $('countHuong').textContent = c.huong || 0;
  $('countChuong').textContent = c.chuong || 0;
  $('countNen').textContent = c.nen || 0;
  $('countHoa').textContent = c.hoa || 0;
  const n = $('countNiemPhat'); if (n) n.textContent = c.niemPhat || 0;
  const l = $('countLePhat'); if (l) l.textContent = c.lePhat || 0;
}
function updateOnline(players) {
  $('onlineCount').textContent = '🟢 ' + players.length + ' người đang online';
  $('playerCount').textContent = players.length;
  $('playerList').innerHTML = players.map((p) =>
    '<li>' + escapeHtml(p.avatar) + ' <b>' + escapeHtml(p.name) + '</b>' + (p.id === myId ? ' (bạn)' : '') + '</li>').join('');
}
function renderFeed(feed) {
  $('feedList').innerHTML = feed.map((f) => '<li>' + escapeHtml(f.text) + ' <span>• ' + escapeHtml(f.time || '') + '</span></li>').join('');
}
function addChat(msg) {
  const box = $('chatBox');
  const div = document.createElement('div');
  div.innerHTML = '<b>' + escapeHtml(msg.avatar) + ' ' + escapeHtml(msg.name) + ':</b> ' + escapeHtml(msg.text) + ' <span>' + escapeHtml(msg.time || '') + '</span>';
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
$('chatForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('chatInput').value.trim();
  if (!text || !socket) return;
  socket.emit('chat', { text });
  $('chatInput').value = '';
});

// ---- Niệm Phật / Đọc kinh ----
function buildBeads() {
  const box = $('chantBeads');
  box.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    s.className = 'bead';
    s.textContent = '●';
    box.appendChild(s);
  }
}
function highlightBead(count) {
  const beads = document.querySelectorAll('#chantBeads .bead');
  beads.forEach((b, i) => b.classList.toggle('active', i === (count - 1) % 10));
}
function chantTick() {
  if (!chanting || !socket) return;
  chantCount += 1;
  const phrase = CHANT_LINES[chantLineIdx % CHANT_LINES.length];
  chantLineIdx += 1;
  socket.emit('action', { type: 'niemPhat', count: chantCount, phrase });
}
function startChant() {
  if (!socket || chanting) return;
  ensureAudio();
  chanting = true;
  chantCount = 0;
  chantLineIdx = 0;
  buildBeads();
  $('chantPanel').classList.remove('hidden');
  $('chantCount').textContent = '0';
  $('chantPhrase').textContent = 'Đang đi tới trước tượng Phật...';
  $('chantBtn').classList.add('active');
  $('chantBtn').textContent = '📿 Đang niệm Phật — bấm để dừng';
  walkToSpot('lePhat', () => {
    setPose(myId, 'chant');
    setTimeout(() => { if (chanting) { chantTick(); chantTimer = setInterval(chantTick, 2800); } }, 800);
  });
}
function stopChant() {
  if (!chanting) return;
  chanting = false;
  clearInterval(chantTimer);
  if (socket) socket.emit('stopChant');
  setPose(myId, null);
  $('chantPanel').classList.add('hidden');
  $('chantBtn').classList.remove('active');
  $('chantBtn').textContent = '📿 Đọc kinh / Niệm Phật';
}
$('chantBtn').onclick = () => { if (chanting) stopChant(); else startChant(); };
$('stopChantBtn').onclick = stopChant;

// ---- Làm lễ ----
function doAction(type) {
  if (!socket) return;
  if (type === 'niemPhat') { if (chanting) stopChant(); else startChant(); return; }
  if (chanting) stopChant();
  if (type === 'chuong') playBell();
  socket.emit('action', { type });
}
document.querySelectorAll('[data-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.action;
    if (type === 'niemPhat') { doAction(type); return; }
    walkToSpot(type, () => doAction(type));
  });
});
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// ================= PHẦN 3D (Three.js) =================
let THREE = null;
let renderer, scene, camera, clock;
let threeReady = false;
let buddhaGroup, buddhaLight, buddhaRays, buddhaBaseY = 0.9;
let bellPivot, bellSwing = 0;
let lanterns = [];
let smokePool = [], petalPool = [], flowerGroups = [];
let candleFlames = [], candleLight;
let incenseSticks;
let glowT = 0, glowActive = false;
let clouds = [];
let interactiveRoots = [];
let groundPlane;

// Vật cản: hình tròn {x,z,r} và hình hộp {minX,maxX,minZ,maxZ}
const CIRCLE_COLLIDERS = [
  { x: 0, z: -8, r: 2.1 },      // lư hương lớn
  { x: -14, z: -10, r: 1.9 },   // giá chuông
  { x: 14, z: -10, r: 1.9 },    // trống
  { x: 17, z: 9, r: 5.1 },      // ao sen
  { x: -18, z: 6, r: 0.9 }, { x: -20, z: -4, r: 0.9 }, { x: 19, z: -4, r: 0.9 },
  { x: -8, z: 14, r: 0.9 }, { x: 10, z: 14, r: 0.9 }, // cây bonsai
  { x: -6, z: -2, r: 0.7 }, { x: 6, z: -2, r: 0.7 }, { x: -12, z: 12, r: 0.7 }, { x: 12, z: 12, r: 0.7 }, // đèn đá
  { x: -2.6, z: 19.5, r: 0.7 }, { x: 2.6, z: 19.5, r: 0.7 }, { x: -6.5, z: 19.5, r: 0.7 }, { x: 6.5, z: 19.5, r: 0.7 }, // trụ cổng
  { x: -9.6, z: -11.3, r: 0.5 }, { x: -7, z: -11.3, r: 0.5 }, { x: -3.5, z: -11.3, r: 0.5 },
  { x: 3.5, z: -11.3, r: 0.5 }, { x: 7, z: -11.3, r: 0.5 }, { x: 9.6, z: -11.3, r: 0.5 }, // cột chính điện
];
const BOX_COLLIDERS = [
  { minX: -2.4, maxX: 2.4, minZ: -17.6, maxZ: -14.2 }, // bệ tượng Phật
  { minX: -3.4, maxX: 3.4, minZ: -14.1, maxZ: -12.3 }, // bàn thờ
  { minX: -10.2, maxX: -9.5, minZ: -20, maxZ: -11.5 }, // tường trái chính điện
  { minX: 9.5, maxX: 10.2, minZ: -20, maxZ: -11.5 },   // tường phải chính điện
];

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });
}
function box(w, h, d, color, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, color, opts, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function sph(r, color, opts, w = 16, h = 12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat(color, opts));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function place(mesh, x, y, z, ry = 0) {
  mesh.position.set(x, y, z);
  if (ry) mesh.rotation.y = ry;
  return mesh;
}
function canvasTexture(draw, w = 512, h = 512) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

async function initThree() {
  if (threeReady) return;
  THREE = await import('three');
  const container = $('scene');
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf2a35e, 45, 115);
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300);

  // --- Ánh sáng hoàng hôn ---
  const sun = new THREE.DirectionalLight(0xffb36b, 2.6);
  sun.position.set(-28, 26, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -35; sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35;
  sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffd9b0, 0.55));
  const hemi = new THREE.HemisphereLight(0xffc98a, 0x4a5d3a, 0.5);
  scene.add(hemi);

  // --- Bầu trời hoàng hôn + mặt trời + mây ---
  const skyTex = canvasTexture((g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3d2350'); gr.addColorStop(0.35, '#8a3d5c');
    gr.addColorStop(0.62, '#e2574c'); gr.addColorStop(0.8, '#ff9a3c'); gr.addColorStop(1, '#ffc46b');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 16, 512);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(7, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd98a, fog: false }));
  sunDisc.position.set(-34, 15, -80);
  sunDisc.lookAt(0, 10, 0);
  scene.add(sunDisc);
  for (let i = 0; i < 6; i++) {
    const cl = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const s = sph(1.6 + Math.random(), 0xfff2e0, { roughness: 1 });
      s.material = new THREE.MeshBasicMaterial({ color: 0xffe8d0, transparent: true, opacity: 0.75, fog: false });
      s.scale.y = 0.45;
      s.position.set(j * 2.2 - 2.2, Math.random() * 0.5, Math.random());
      s.castShadow = false;
      cl.add(s);
    }
    cl.position.set(-50 + i * 20 + Math.random() * 6, 22 + Math.random() * 8, -60 - Math.random() * 20);
    clouds.push(cl);
    scene.add(cl);
  }

  // --- Núi xa ---
  const mountainCols = [0x5b4a6b, 0x6b5570, 0x4a3d5e, 0x63506a, 0x54455f];
  [[-38, -52, 22, 18], [-12, -58, 26, 22], [12, -52, 20, 16], [36, -56, 24, 20], [0, -66, 30, 24]].forEach((m, i) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(m[2], m[3], 7), mat(mountainCols[i % mountainCols.length], { roughness: 1 }));
    cone.position.set(m[0], m[3] / 2 - 1, m[1]);
    scene.add(cone);
  });

  buildGround();
  buildTemple();
  buildBuddha();
  buildAltar();
  buildBurner();
  buildBellAndDrum();
  buildLanterns();
  buildPond();
  buildTreesAndStoneLanterns();
  buildGateAndFence();
  buildSmokeAndPetals();

  // --- Nền cỏ ngoài hàng rào ---
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat(0x3f6b34, { roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.08;
  grass.receiveShadow = true;
  scene.add(grass);

  // Resize theo khung
  const resize = () => {
    const w = container.clientWidth || 800, h = container.clientHeight || 560;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  $('loadingBox').classList.add('hidden');
  threeReady = true;
  initPlayerControls();
  animate();
}

// ---- Sân gạch + lối đi ----
function buildGround() {
  const tileTex = canvasTexture((g, w, h) => {
    const n = 8, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = 150 + Math.floor(Math.random() * 40);
      g.fillStyle = `rgb(${v},${Math.floor(v * 0.82)},${Math.floor(v * 0.62)})`;
      g.fillRect(i * s, j * s, s, s);
      g.strokeStyle = 'rgba(90,60,40,.55)'; g.lineWidth = 3;
      g.strokeRect(i * s + 1, j * s + 1, s - 2, s - 2);
      g.fillStyle = 'rgba(0,0,0,.06)';
      for (let k = 0; k < 5; k++) g.fillRect(i * s + Math.random() * s, j * s + Math.random() * s, 6, 4);
    }
  });
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(7, 5);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(56, 44),
    new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  groundPlane = ground;

  const pathTex = canvasTexture((g, w, h) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = 190 + Math.floor(Math.random() * 25);
      g.fillStyle = `rgb(${v},${Math.floor(v * 0.9)},${Math.floor(v * 0.75)})`;
      g.fillRect(i * s, j * s, s, s);
      g.strokeStyle = 'rgba(120,90,60,.6)'; g.lineWidth = 4;
      g.strokeRect(i * s + 1, j * s + 1, s - 2, s - 2);
    }
  });
  pathTex.wrapS = pathTex.wrapT = THREE.RepeatWrapping;
  pathTex.repeat.set(1, 8);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 32),
    new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.9 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.02, 3.5);
  path.receiveShadow = true;
  scene.add(path);
}

// ---- Chính điện: bệ, cột, tường, mái ngói cong ----
function buildTemple() {
  const g = new THREE.Group();
  // Bệ tam cấp
  [0.3, 0.6, 0.9].forEach((h, i) => {
    const step = box(22 - i * 1.2, 0.3, 11 - i * 0.8, 0xb8a88e);
    step.position.set(0, h - 0.15, -15.5);
    g.add(step);
  });
  // Tường sau + tường hai bên
  const backWall = box(20, 5.6, 0.4, 0xf3e2c2); backWall.position.set(0, 0.9 + 2.8, -19.8); g.add(backWall);
  const trim = box(20.4, 0.35, 0.5, 0x8c2f26); trim.position.set(0, 0.9 + 5.5, -19.8); g.add(trim);
  [-1, 1].forEach((s) => {
    const wall = box(0.4, 4.6, 8.6, 0xf3e2c2); wall.position.set(s * 9.9, 0.9 + 2.3, -15.7); g.add(wall);
  });
  // Cột đỏ mặt tiền (chừa lối giữa)
  [-9.6, -7, -3.5, 3.5, 7, 9.6].forEach((x) => {
    const col = cyl(0.26, 0.3, 4.6, 0x9e2b25); col.position.set(x, 0.9 + 2.3, -11.3); g.add(col);
    const cap = cyl(0.36, 0.3, 0.25, 0xd4af37, { metalness: 0.7, roughness: 0.35 }); cap.position.set(x, 0.9 + 4.7, -11.3); g.add(cap);
    const base = cyl(0.36, 0.4, 0.3, 0x8a7d68); base.position.set(x, 0.9 + 0.15, -11.3); g.add(base);
  });
  // Mái ngói 2 tầng cong
  const roofMat = { color: 0x7f1d1d, roughness: 0.7 };
  const mkSlope = (w, d, x, y, z, rx) => {
    const s = box(w, 0.35, d, 0x7f1d1d, roofMat);
    s.position.set(x, y, z); s.rotation.x = rx;
    g.add(s);
    return s;
  };
  mkSlope(23, 7.6, 0, 7.4, -12.1, -0.62); // mái trước
  mkSlope(23, 7.6, 0, 7.4, -18.9, 0.62);  // mái sau
  mkSlope(24.6, 3.4, 0, 5.9, -10.6, -0.32); // diềm mái trước cong lên
  mkSlope(24.6, 3.4, 0, 5.9, -20.4, 0.32);  // diềm mái sau
  // Đầu đao cong 4 góc
  [[-12, -10.2, 0.5], [12, -10.2, -0.5], [-12, -20.8, -0.5], [12, -20.8, 0.5]].forEach(([x, z, r]) => {
    const tip = box(1.6, 0.3, 0.9, 0xd4af37, { metalness: 0.7, roughness: 0.3 });
    tip.position.set(x, 6.1, z); tip.rotation.z = r * 0.4; tip.rotation.y = r * 0.3;
    g.add(tip);
  });
  // Nóc + đầu rồng vàng
  const ridge = cyl(0.22, 0.22, 23, 0xd4af37, { metalness: 0.75, roughness: 0.3 });
  ridge.rotation.z = Math.PI / 2; ridge.position.set(0, 8.9, -15.5); g.add(ridge);
  [-11.2, 11.2].forEach((x) => { const f = sph(0.5, 0xd4af37, { metalness: 0.8, roughness: 0.25 }); f.position.set(x, 9.1, -15.5); g.add(f); });
  // Tầng mái thứ hai
  mkSlope(13, 5.4, 0, 10.4, -13.4, -0.62);
  mkSlope(13, 5.4, 0, 10.4, -17.6, 0.62);
  const ridge2 = cyl(0.18, 0.18, 13, 0xd4af37, { metalness: 0.75, roughness: 0.3 });
  ridge2.rotation.z = Math.PI / 2; ridge2.position.set(0, 11.9, -15.5); g.add(ridge2);
  const finial = sph(0.45, 0xd4af37, { metalness: 0.8, roughness: 0.25 }); finial.position.set(0, 12.4, -15.5); g.add(finial);
  // Hồi tam giác hai bên
  const tri = new THREE.Shape();
  tri.moveTo(-4.4, 0); tri.lineTo(4.4, 0); tri.lineTo(0, 3.4); tri.closePath();
  [-1, 1].forEach((s) => {
    const geo = new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false });
    const m = new THREE.Mesh(geo, mat(0xf3e2c2));
    m.castShadow = true;
    // Xoay 90° để tam giác nằm trong mặt phẳng ZY (hồi mái hai bên hông chùa)
    m.rotation.y = Math.PI / 2;
    m.position.set(s * 11.1, 5.6, -15.5);
    g.add(m);
  });
  // Biển hiệu chùa trên mái hiên
  const signTex = canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#7c2d12'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 10; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 64px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CHÙA AN NHIÊN', w / 2, h / 2);
  }, 512, 128);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.7 }));
  sign.position.set(0, 5.0, -10.9);
  g.add(sign);
  scene.add(g);
  buildLogoPlaque();
}

// ---- Logo NOVASKY trên tường chùa, chính giữa phía trên tượng Phật ----
function buildLogoPlaque() {
  const loader = new THREE.TextureLoader();
  loader.load('logo-novasky.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const frame = box(4.0, 2.1, 0.1, 0xd4af37, { metalness: 0.7, roughness: 0.3 });
    frame.position.set(0, 5.9, -19.56);
    scene.add(frame);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 1.8),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    plaque.position.set(0, 5.9, -19.5);
    scene.add(plaque);
  });
}

// ---- Tượng Phật vàng ngồi thiền ----
function buildBuddha() {
  const gold = { color: 0xe8b923, metalness: 0.85, roughness: 0.28, emissive: 0x2a1500, emissiveIntensity: 0.4 };
  buddhaGroup = new THREE.Group();
  // Đài sen
  const base = cyl(1.7, 1.9, 0.4, 0x8a6d1f, { metalness: 0.6, roughness: 0.4 });
  base.position.y = 0.2; buddhaGroup.add(base);
  for (let i = 0; i < 12; i++) {
    const p = sph(0.34, 0xd4af37, { metalness: 0.7, roughness: 0.35 });
    p.scale.set(1, 0.55, 1.4);
    const a = (i / 12) * Math.PI * 2;
    p.position.set(Math.sin(a) * 1.55, 0.42, Math.cos(a) * 1.55);
    p.rotation.y = a;
    p.rotation.x = -0.35;
    buddhaGroup.add(p);
  }
  // Chân kiết già
  const legs = sph(1.15, 0xe8b923, gold); legs.scale.set(1.15, 0.45, 0.85); legs.position.y = 0.75; buddhaGroup.add(legs);
  // Thân
  const torso = sph(0.85, 0xe8b923, gold); torso.scale.set(0.95, 1.15, 0.7); torso.position.y = 1.5; buddhaGroup.add(torso);
  const sash = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 10, 24), mat(0xb8860b, { metalness: 0.7, roughness: 0.35 }));
  sash.position.y = 1.75; sash.rotation.x = Math.PI / 2 - 0.25; buddhaGroup.add(sash);
  // Tay thiền định trong lòng
  [-1, 1].forEach((s) => {
    const arm = cyl(0.16, 0.13, 1.0, 0xe8b923, gold);
    arm.position.set(s * 0.72, 1.35, 0.35);
    arm.rotation.z = s * 0.55; arm.rotation.x = -0.5;
    buddhaGroup.add(arm);
  });
  const handL = sph(0.2, 0xe8b923, gold); handL.position.set(-0.18, 0.95, 0.62); buddhaGroup.add(handL);
  const handR = sph(0.2, 0xe8b923, gold); handR.position.set(0.18, 0.98, 0.62); buddhaGroup.add(handR);
  // Đầu + nhục kế + tai dài
  const head = sph(0.52, 0xe8b923, gold); head.position.y = 2.5; buddhaGroup.add(head);
  const ushnisha = sph(0.18, 0xe8b923, gold); ushnisha.position.y = 2.98; buddhaGroup.add(ushnisha);
  [-1, 1].forEach((s) => {
    const ear = sph(0.1, 0xe8b923, gold); ear.scale.set(0.6, 1.6, 0.6); ear.position.set(s * 0.5, 2.42, 0.05); buddhaGroup.add(ear);
  });
  // Hào quang sau đầu
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.3 }));
  halo.position.set(0, 2.5, -0.35); buddhaGroup.add(halo);
  const haloDisc = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
  haloDisc.position.set(0, 2.5, -0.38); buddhaGroup.add(haloDisc);
  // Tia sáng xoay khi Phật phát sáng
  buddhaRays = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const ray = new THREE.Mesh(new THREE.ConeGeometry(0.16, 2.6, 4),
      new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.75 }));
    const a = (i / 10) * Math.PI * 2;
    ray.position.set(Math.sin(a) * 1.9, 1.8, Math.cos(a) * 1.9 - 0.2);
    ray.rotation.z = -a;
    ray.rotation.x = 0.5;
    buddhaRays.add(ray);
  }
  buddhaRays.visible = false;
  buddhaGroup.add(buddhaRays);
  // Đèn vàng chiếu Phật
  buddhaLight = new THREE.PointLight(0xffc23d, 0, 22, 1.6);
  buddhaLight.position.set(0, 4.5, -13.5);
  scene.add(buddhaLight);
  buddhaGroup.position.set(0, buddhaBaseY, -16.2);
  scene.add(buddhaGroup);
}

// ---- Bàn thờ + đồ lễ ----
function buildAltar() {
  const g = new THREE.Group();
  const table = box(6.8, 0.22, 1.9, 0x6b1f1a); table.position.set(0, 1.75, -13.2); g.add(table);
  [-3.1, 3.1].forEach((x) => {
    const leg = box(0.22, 1.65, 1.7, 0x6b1f1a); leg.position.set(x, 0.9, -13.2); g.add(leg);
  });
  const cloth = box(6.9, 0.5, 2.0, 0xd4af37, { roughness: 0.9 }); cloth.position.set(0, 1.55, -13.2); g.add(cloth);
  // Mâm ngũ quả
  const fruits = [[0xff7f00, 0], [0xd43d2a, 1], [0x7cb342, 2], [0xffd54f, 3], [0x8e44ad, 4]];
  fruits.forEach(([c, i]) => {
    const f = sph(0.22, c, { roughness: 0.35 });
    f.position.set(-1.9 + i * 0.42, 2.1, -13.0);
    g.add(f);
  });
  const tray = cyl(0.85, 0.7, 0.08, 0xd4af37, { metalness: 0.7, roughness: 0.3 });
  tray.position.set(-1.06, 1.92, -13.0); g.add(tray);
  // Bình hoa sen
  [-1, 1].forEach((s) => {
    const vase = cyl(0.16, 0.22, 0.55, 0x2e6b8a, { roughness: 0.4 });
    vase.position.set(s * 2.4, 2.15, -13.3); g.add(vase);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = sph(0.12, 0xf48fb1, { roughness: 0.6 });
      petal.position.set(s * 2.4 + Math.sin(a) * 0.16, 2.55, -13.3 + Math.cos(a) * 0.16);
      g.add(petal);
    }
    const bud = sph(0.14, 0xffd54f, { roughness: 0.5 }); bud.position.set(s * 2.4, 2.58, -13.3); g.add(bud);
  });
  // Nến trên bàn thờ (lửa cháy sẵn)
  candleLight = new THREE.PointLight(0xffa040, 1.2, 9, 1.8);
  candleLight.position.set(1.2, 2.6, -12.6);
  scene.add(candleLight);
  [-0.4, 1.2].forEach((x) => {
    const stick = cyl(0.07, 0.07, 0.5, 0xfff8e7, { roughness: 0.5 });
    stick.position.set(x, 2.15, -12.6); g.add(stick);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb020 }));
    flame.position.set(x, 2.5, -12.6);
    candleFlames.push(flame);
    g.add(flame);
  });
  // Đệm ngồi thiền
  [[8, -4], [9.4, -3.2], [6.6, -3.2]].forEach(([x, z]) => {
    const c = cyl(0.55, 0.65, 0.18, 0x8c2f26, { roughness: 0.95 });
    c.position.set(x, 0.09, z); g.add(c);
  });
  scene.add(g);
  // Đánh dấu vật tương tác: bàn thờ (nến/hoa/lễ Phật)
  g.traverse((o) => { o.userData.spot = 'nen'; });
  interactiveRoots.push(g);
}

// ---- Lư hương lớn + nhang ----
function buildBurner() {
  const g = new THREE.Group();
  const body = cyl(1.05, 0.85, 1.1, 0x6b4a2f, { metalness: 0.75, roughness: 0.35 });
  body.position.y = 1.15; g.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.09, 10, 28), mat(0xd4af37, { metalness: 0.8, roughness: 0.3 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 1.7; g.add(rim);
  [-0.6, 0.6].forEach((x) => {
    const leg = cyl(0.09, 0.12, 0.7, 0x6b4a2f, { metalness: 0.7, roughness: 0.4 });
    leg.position.set(x, 0.35, 0.3); g.add(leg);
  });
  const legB = cyl(0.09, 0.12, 0.7, 0x6b4a2f, { metalness: 0.7, roughness: 0.4 });
  legB.position.set(0, 0.35, -0.65); g.add(legB);
  // 3 cây nhang (ẩn cho tới khi có người thắp)
  incenseSticks = new THREE.Group();
  [-0.3, 0, 0.3].forEach((x) => {
    const s = cyl(0.02, 0.02, 1.1, 0x8d2f23, { roughness: 0.6 });
    s.position.set(x, 2.2, 0); s.rotation.z = (Math.random() - 0.5) * 0.2;
    incenseSticks.add(s);
    const tip = sph(0.035, 0xff6d00, { emissive: 0xff4400, emissiveIntensity: 2 });
    tip.position.set(x, 2.76, 0);
    incenseSticks.add(tip);
  });
  incenseSticks.visible = false;
  g.add(incenseSticks);
  g.position.set(0, 0, -8);
  scene.add(g);
  g.traverse((o) => { o.userData.spot = 'huong'; });
  interactiveRoots.push(g);
}

// ---- Chuông lớn + trống ----
function buildBellAndDrum() {
  // Giá chuông
  const frame = new THREE.Group();
  [-1.3, 1.3].forEach((x) => {
    const post = box(0.32, 4.6, 0.32, 0x7c2d12); post.position.set(x, 2.3, 0); frame.add(post);
  });
  const beam = box(3.4, 0.35, 0.4, 0x7c2d12); beam.position.set(0, 4.7, 0); frame.add(beam);
  const roof1 = box(4.0, 0.25, 1.6, 0x7f1d1d); roof1.position.set(0, 5.2, 0); roof1.rotation.x = -0.25; frame.add(roof1);
  const roof2 = box(4.0, 0.25, 1.6, 0x7f1d1d); roof2.position.set(0, 5.2, 0); roof2.rotation.x = 0.25; frame.add(roof2);
  // Chuông đồng (lathe)
  const pts = [];
  [[0.01, 0], [0.5, 0], [0.58, 0.12], [0.52, 0.5], [0.42, 0.9], [0.3, 1.15], [0.16, 1.3], [0.01, 1.32]].forEach(([x, y]) => pts.push(new THREE.Vector2(x, y)));
  const bellGeo = new THREE.LatheGeometry(pts, 24);
  const bell = new THREE.Mesh(bellGeo, mat(0xb08d2f, { metalness: 0.85, roughness: 0.3 }));
  bell.castShadow = true;
  bell.position.y = -1.45;
  bellPivot = new THREE.Group();
  bellPivot.position.set(0, 4.55, 0);
  bellPivot.add(bell);
  frame.add(bellPivot);
  // Dùi chuông
  const mallet = cyl(0.05, 0.05, 1.1, 0x6b4a2f); mallet.position.set(1.0, 2.6, 0.4); mallet.rotation.z = 0.4; frame.add(mallet);
  frame.position.set(-14, 0, -10);
  scene.add(frame);
  frame.traverse((o) => { o.userData.spot = 'chuong'; });
  interactiveRoots.push(frame);

  // Trống
  const drum = new THREE.Group();
  const body = cyl(0.95, 0.95, 1.3, 0x9e2b25, { roughness: 0.6 });
  body.rotation.z = Math.PI / 2; body.position.y = 1.6; drum.add(body);
  [-1, 1].forEach((s) => {
    const skin = cyl(0.96, 0.96, 0.06, 0xf3e2c2, { roughness: 0.8 });
    skin.rotation.z = Math.PI / 2; skin.position.set(s * 0.66, 1.6, 0); drum.add(skin);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.05, 8, 24), mat(0xd4af37, { metalness: 0.7, roughness: 0.3 }));
    ring.rotation.y = Math.PI / 2; ring.position.set(s * 0.68, 1.6, 0); drum.add(ring);
  });
  [-0.7, 0.7].forEach((x) => {
    const leg = box(0.25, 1.6, 0.25, 0x6b4a2f); leg.position.set(x, 0.8, 0); leg.rotation.z = -x * 0.25; drum.add(leg);
  });
  drum.position.set(14, 0, -10);
  scene.add(drum);
}

// ---- Đèn lồng đỏ treo ----
function makeLantern(x, y, z, s = 1) {
  const g = new THREE.Group();
  const capT = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.2 * s, 10), mat(0xd4af37, { metalness: 0.7, roughness: 0.3 }));
  capT.position.y = 0.42 * s; g.add(capT);
  const body = cyl(0.42 * s, 0.42 * s, 0.62 * s, 0xc62828, { emissive: 0x7a1010, emissiveIntensity: 0.85, roughness: 0.5 });
  body.scale.y = 1; g.add(body);
  const capB = cyl(0.2 * s, 0.14 * s, 0.12 * s, 0xd4af37, { metalness: 0.7, roughness: 0.3 });
  capB.position.y = -0.36 * s; g.add(capB);
  const tassel = cyl(0.03 * s, 0.03 * s, 0.35 * s, 0xffd700, { metalness: 0.6, roughness: 0.4 });
  tassel.position.y = -0.58 * s; g.add(tassel);
  const light = new THREE.PointLight(0xff5040, 0.7, 5, 2);
  g.add(light);
  g.position.set(x, y, z);
  lanterns.push(g);
  scene.add(g);
  return g;
}
function buildLanterns() {
  makeLantern(-7.5, 4.4, -10.9, 1.1);
  makeLantern(7.5, 4.4, -10.9, 1.1);
  makeLantern(-4.5, 4.4, -10.9, 0.9);
  makeLantern(4.5, 4.4, -10.9, 0.9);
  makeLantern(0, 4.0, 19.3, 1.2);
  makeLantern(-6.5, 3.9, 19.3, 0.9);
  makeLantern(6.5, 3.9, 19.3, 0.9);
}

// ---- Ao sen ----
function buildPond() {
  const g = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(4.5, 36),
    new THREE.MeshStandardMaterial({ color: 0x3b82c4, roughness: 0.12, metalness: 0.25 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.07; water.receiveShadow = true; g.add(water);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.55, 0.22, 10, 40), mat(0x9a8d7a, { roughness: 0.95 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.1; g.add(rim);
  // Lá sen + hoa sen
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 2.8;
    const pad = cyl(0.55 + Math.random() * 0.3, 0.55, 0.05, 0x2e7d32, { roughness: 0.9 });
    pad.position.set(Math.sin(a) * r, 0.1, Math.cos(a) * r);
    g.add(pad);
  }
  [[-1.5, 1], [1.8, -0.8], [0.4, 2.2]].forEach(([x, z]) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), mat(0xf48fb1, { roughness: 0.6 }));
      petal.position.set(x + Math.sin(a) * 0.2, 0.28, z + Math.cos(a) * 0.2);
      petal.rotation.z = -Math.sin(a) * 0.5; petal.rotation.x = Math.cos(a) * 0.5;
      g.add(petal);
    }
    const heart = sph(0.14, 0xffd54f, { roughness: 0.5 }); heart.position.set(x, 0.3, z); g.add(heart);
  });
  // Đá quanh ao
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const rock = sph(0.3 + Math.random() * 0.2, 0x8a8d90, { roughness: 1 });
    rock.scale.y = 0.6;
    rock.position.set(Math.sin(a) * 5.1, 0.15, Math.cos(a) * 5.1);
    g.add(rock);
  }
  g.position.set(17, 0, 9);
  scene.add(g);
}

// ---- Cây bonsai + đèn đá ----
function makeBonsai(x, z, s = 1) {
  const g = new THREE.Group();
  let px = 0, py = 0;
  for (let i = 0; i < 3; i++) {
    const seg = cyl(0.16 * s, 0.22 * s, 1.1 * s, 0x5d4037, { roughness: 1 });
    px += (Math.random() - 0.5) * 0.3;
    seg.position.set(px, py + 0.55 * s, 0);
    seg.rotation.z = (Math.random() - 0.5) * 0.25;
    g.add(seg);
    py += 1.0 * s;
  }
  [[0, 3.4, 0, 1.5], [-0.7, 2.8, 0.3, 1.1], [0.7, 2.9, -0.2, 1.0]].forEach(([ox, oy, oz, r]) => {
    const f = sph(r * s, 0x2f6b2f, { roughness: 1 });
    f.scale.y = 0.55;
    f.position.set(ox * s, oy * s, oz * s);
    g.add(f);
  });
  const rock = sph(0.5 * s, 0x8a8d90, { roughness: 1 }); rock.scale.y = 0.5; rock.position.set(0.4 * s, 0.15, 0.3); g.add(rock);
  g.position.set(x, 0, z);
  scene.add(g);
}
function makeStoneLantern(x, z) {
  const g = new THREE.Group();
  const base = box(0.7, 0.25, 0.7, 0x9a8d7a); base.position.y = 0.12; g.add(base);
  const pillar = box(0.3, 0.9, 0.3, 0x9a8d7a); pillar.position.y = 0.7; g.add(pillar);
  const lightBox = box(0.6, 0.55, 0.6, 0x8a7d68); lightBox.position.y = 1.4; g.add(lightBox);
  const win = box(0.62, 0.35, 0.62, 0xffb020, { emissive: 0xff8c00, emissiveIntensity: 1.2 });
  win.position.y = 1.4; g.add(win);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.4, 4), mat(0x7a6d5a, { roughness: 1 }));
  roof.position.y = 1.9; roof.rotation.y = Math.PI / 4; g.add(roof);
  const top = sph(0.12, 0x8a7d68); top.position.y = 2.15; g.add(top);
  g.position.set(x, 0, z);
  scene.add(g);
}
function buildTreesAndStoneLanterns() {
  makeBonsai(-18, 6, 1.2); makeBonsai(-20, -4, 1); makeBonsai(19, -4, 1.1);
  makeBonsai(-8, 14, 0.9); makeBonsai(10, 14, 1);
  makeStoneLantern(-6, -2); makeStoneLantern(6, -2);
  makeStoneLantern(-12, 12); makeStoneLantern(12, 12);
}

// ---- Cổng tam quan + hàng rào ----
function buildGateAndFence() {
  const g = new THREE.Group();
  // Trụ cổng
  [[-2.6, 5.2], [2.6, 5.2], [-6.5, 4.4], [6.5, 4.4]].forEach(([x, h]) => {
    const p = box(0.7, h, 0.7, 0x9e2b25); p.position.set(x, h / 2, 19.5); g.add(p);
    const cap = box(0.9, 0.25, 0.9, 0xd4af37, { metalness: 0.7, roughness: 0.3 }); cap.position.set(x, h + 0.12, 19.5); g.add(cap);
  });
  // Dầm ngang + mái cổng
  const beamC = box(6.6, 0.4, 0.5, 0x7c2d12); beamC.position.set(0, 4.9, 19.5); g.add(beamC);
  [-1, 1].forEach((s) => {
    const beam = box(3.6, 0.35, 0.45, 0x7c2d12); beam.position.set(s * 4.55, 4.2, 19.5); g.add(beam);
  });
  const mkRoof = (w, y) => {
    const r1 = box(w, 0.25, 2.2, 0x7f1d1d); r1.position.set(0, y, 18.9); r1.rotation.x = -0.4; g.add(r1);
    const r2 = box(w, 0.25, 2.2, 0x7f1d1d); r2.position.set(0, y, 20.1); r2.rotation.x = 0.4; g.add(r2);
  };
  mkRoof(8.6, 6.0); mkRoof(4.6, 5.3);
  const ridge = cyl(0.14, 0.14, 8.6, 0xd4af37, { metalness: 0.75, roughness: 0.3 });
  ridge.rotation.z = Math.PI / 2; ridge.position.set(0, 6.5, 19.5); g.add(ridge);
  scene.add(g);
  // Hàng rào thấp quanh sân (chừa lối cổng)
  const fence = (x, z, w, d) => {
    const f = box(w, 1.1, d, 0xf3e2c2); f.position.set(x, 0.55, z); scene.add(f);
    const t = box(w === 0.3 ? 0.4 : w, 0.12, d === 0.3 ? 0.4 : d, 0x8c2f26); t.position.set(x, 1.15, z); scene.add(t);
  };
  fence(-26, 0, 0.3, 40); fence(26, 0, 0.3, 40);
  fence(-17, 20, 18, 0.3); fence(17, 20, 18, 0.3);
  fence(0, -20, 52, 0.3);
}

// ---- Khói nhang + cánh sen rơi ----
function buildSmokeAndPetals() {
  const softTex = canvasTexture((ctx, w, h) => {
    const gr = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,.9)');
    gr.addColorStop(0.5, 'rgba(255,255,255,.35)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  }, 128, 128);
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, transparent: true, opacity: 0, depthWrite: false }));
    sp.scale.set(0.6, 0.6, 1);
    sp.visible = false;
    scene.add(sp);
    smokePool.push({ sp, life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
  }
  const petalMat = new THREE.MeshBasicMaterial({ color: 0xf8a8c8, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
  for (let i = 0; i < 24; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.16), petalMat);
    p.visible = false;
    scene.add(p);
    petalPool.push({ m: p, life: 0, x: 0, y: 0, z: 0, sway: Math.random() * 6, speed: 0.9 + Math.random() * 0.5 });
  }
}
function spawnSmoke(x, y, z, n) {
  let c = 0;
  for (const p of smokePool) {
    if (p.life > 0) continue;
    p.life = p.max = 2.5 + Math.random() * 1.5;
    p.x = x + (Math.random() - 0.5) * 0.4;
    p.y = y; p.z = z + (Math.random() - 0.5) * 0.4;
    p.vx = (Math.random() - 0.5) * 0.2; p.vy = 0.55 + Math.random() * 0.3; p.vz = (Math.random() - 0.5) * 0.2;
    p.sp.visible = true;
    if (++c >= n) break;
  }
}
function burstSmoke() { spawnSmoke(0, 2.9, -8, 12); }
function showIncenseSticks() { if (incenseSticks) incenseSticks.visible = true; }
function addFlowers() {
  if (flowerGroups.length >= 12) return;
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petal = sph(0.13, [0xf48fb1, 0xffd54f, 0xce93d8][i % 3], { roughness: 0.6 });
    petal.position.set(Math.sin(a) * 0.18, 0.15, Math.cos(a) * 0.18);
    g.add(petal);
  }
  const stem = cyl(0.03, 0.03, 0.3, 0x2e7d32); stem.position.y = -0.05; g.add(stem);
  g.position.set(-2.5 + Math.random() * 5 - 2.5, 1.9, -13.2 + (Math.random() - 0.5) * 0.6);
  scene.add(g);
  flowerGroups.push(g);
}
function swingBell() { bellSwing = 1; }

// ================= NHÂN VẬT & ĐIỀU KHIỂN =================
const avatars = new Map(); // id -> avatar object
let me = null;
let myPos = { x: 0, z: 16, rot: Math.PI };
let camYaw = 0, camPitch = 0.42, camDist = 9;
let keys = {};
let joyVec = { x: 0, y: 0 };
let moveTarget = null;
let pendingAction = null;
let lastMoveSent = 0;
let movingNow = false;
let nearestSpot = null;
let promptType = null;
let buddhaMats = null;
let ambientSmokeTimer = 0;

function avatarDefByEmoji(emoji) {
  return AVATARS.find((a) => a.emoji === emoji) || AVATARS[0];
}
function makeTextSprite(text, opts = {}) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  const draw = (t) => {
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath(); ctx.roundRect(6, 8, 244, 48, 24); ctx.fill();
    ctx.fillStyle = opts.color || '#fff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t, 128, 33);
  };
  draw(text);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(2.6, 0.65, 1);
  return { sp, redraw: draw, tex, canvas: c };
}
function makeBubbleSprite() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 170;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(3.6, 1.2, 1);
  sp.visible = false;
  return { sp, tex, canvas: c };
}
function drawBubble(av, text, bg = '#ffffff', fg = '#222222') {
  const ctx = av.bubble.canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 170);
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(8, 8, 496, 128, 24); ctx.fill();
  ctx.beginPath(); ctx.moveTo(236, 136); ctx.lineTo(276, 136); ctx.lineTo(256, 166); ctx.closePath(); ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > 440 && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 2);
  shown.forEach((l, i) => ctx.fillText(l, 256, 50 + i * 42));
  av.bubble.tex.needsUpdate = true;
  av.bubble.sp.visible = true;
}
function createAvatar(def, name, isMe) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  // Áo cà sa / áo dài
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.58, 1.15, 12), mat(def.robe, { roughness: 0.9 }));
  robe.position.y = 0.58; robe.castShadow = true;
  body.add(robe);
  const shoulders = sph(0.3, def.robe, { roughness: 0.9 });
  shoulders.scale.set(1.15, 0.6, 0.9); shoulders.position.y = 1.18;
  body.add(shoulders);
  // Đầu
  const head = sph(0.27, def.skin, { roughness: 0.7 });
  head.position.y = 1.55;
  body.add(head);
  // Tóc / mũ theo nhân vật
  if (def.hair === 'short' || def.hair === 'grey') {
    const hair = sph(0.28, def.hair === 'grey' ? 0xaaaaaa : 0x222222, { roughness: 1 });
    hair.scale.set(1, 0.62, 1); hair.position.set(0, 1.66, -0.04);
    body.add(hair);
  } else if (def.hair === 'bun' || def.hair === 'greybun') {
    const hair = sph(0.28, def.hair === 'greybun' ? 0xaaaaaa : 0x222222, { roughness: 1 });
    hair.scale.set(1, 0.62, 1); hair.position.set(0, 1.66, -0.04);
    body.add(hair);
    const bun = sph(0.13, def.hair === 'greybun' ? 0xaaaaaa : 0x222222, { roughness: 1 });
    bun.position.set(0, 1.86, -0.16);
    body.add(bun);
  } else if (def.hair === 'topknot') {
    const knot = sph(0.09, 0x222222, { roughness: 1 });
    knot.position.set(0, 1.84, 0);
    body.add(knot);
  } else if (def.hair === 'band') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 8, 20), mat(0xd4af37, { metalness: 0.6, roughness: 0.4 }));
    band.rotation.x = Math.PI / 2; band.position.y = 1.62;
    body.add(band);
  }
  // Tay (đung đưa khi đi, chắp lại khi niệm)
  const mkArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.4, 1.32, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.68, 10), mat(def.robe, { roughness: 0.9 }));
    arm.position.y = -0.34; arm.castShadow = true;
    pivot.add(arm);
    const hand = sph(0.09, def.skin, { roughness: 0.7 });
    hand.position.y = -0.7;
    pivot.add(hand);
    body.add(pivot);
    return pivot;
  };
  const armL = mkArm(-1), armR = mkArm(1);
  // Tràng hạt cầm tay (hiện khi niệm Phật)
  const beads = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const b = sph(0.045, 0x4a2c14, { roughness: 0.5 });
    b.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0);
    beads.add(b);
  }
  beads.position.set(0, -0.7, 0.08);
  beads.visible = false;
  armR.add(beads);
  // Bảng tên + bong bóng chat
  const nameTag = makeTextSprite(name, { color: isMe ? '#ffd700' : '#ffffff' });
  nameTag.sp.position.y = 2.35;
  root.add(nameTag.sp);
  const bubble = makeBubbleSprite();
  bubble.sp.position.y = 3.15;
  root.add(bubble.sp);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(root);
  return {
    id: null, name, def, isMe, root, body, armL, armR, beads,
    nameTag, bubble, walkPhase: Math.random() * 6, pose: null, bowT: -1,
    target: null, moving: false,
  };
}
function setPose(id, pose) {
  const av = avatars.get(id);
  if (!av) return;
  if (pose === 'bow') { av.bowT = 0; av.pose = null; return; }
  av.pose = pose;
  av.beads.visible = pose === 'chant';
  if (!pose) av.beads.visible = false;
}
function showBubble(name, text) {
  for (const av of avatars.values()) {
    if (av.name === name) {
      drawBubble(av, text);
      clearTimeout(bubbleTimers[name]);
      bubbleTimers[name] = setTimeout(() => { av.bubble.sp.visible = false; }, 4000);
      return;
    }
  }
}
function showActionLabel(id, type) {
  const av = avatars.get(id);
  if (!av) return;
  drawBubble(av, ACTION_LABELS[type] || '', '#fde68a', '#7c2d12');
  clearTimeout(bubbleTimers['act-' + id]);
  bubbleTimers['act-' + id] = setTimeout(() => { av.bubble.sp.visible = false; }, 4000);
  if (type === 'lePhat' || type === 'le') setPose(id, 'bow');
}

// ---- Đồng bộ người chơi ----
function syncPlayers(list) {
  const seen = new Set();
  list.forEach((p) => {
    seen.add(p.id);
    let av = avatars.get(p.id);
    if (!av) {
      av = createAvatar(avatarDefByEmoji(p.avatar), p.name, p.id === myId);
      av.id = p.id;
      av.root.position.set(p.x ?? 0, 0, p.z ?? 16);
      av.root.rotation.y = p.rot ?? Math.PI;
      avatars.set(p.id, av);
      if (p.id === myId) {
        me = av;
        myPos = { x: p.x ?? 0, z: p.z ?? 16, rot: p.rot ?? Math.PI };
        snapCamera();
      }
    }
    av.target = { x: p.x ?? av.root.position.x, z: p.z ?? av.root.position.z, rot: p.rot ?? av.root.rotation.y };
    if (p.action === 'chant' || p.action === 'niemPhat') setPose(p.id, 'chant');
    else if (p.action === 'thien') setPose(p.id, 'sit');
    else if (!p.action) setPose(p.id, null);
  });
  for (const [id, av] of [...avatars]) {
    if (!seen.has(id)) {
      scene.remove(av.root);
      avatars.delete(id);
      if (id === myId) me = null;
    }
  }
  updateOnline(list);
}
function onPlayerMoved(d) {
  const av = avatars.get(d.id);
  if (!av) return;
  av.target = { x: d.x, z: d.z, rot: d.rot ?? av.root.rotation.y };
  if (av.pose) setPose(d.id, null);
}

// ---- Va chạm ----
function resolveCollision(x, z) {
  x = Math.max(-25.4, Math.min(25.4, x));
  z = Math.max(-19.4, Math.min(19.4, z));
  for (const c of CIRCLE_COLLIDERS) {
    const dx = x - c.x, dz = z - c.z;
    const d2 = dx * dx + dz * dz;
    const r = c.r + 0.45;
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      x = c.x + (dx / d) * r;
      z = c.z + (dz / d) * r;
    }
  }
  for (const b of BOX_COLLIDERS) {
    const ex = 0.45;
    if (x > b.minX - ex && x < b.maxX + ex && z > b.minZ - ex && z < b.maxZ + ex) {
      const dxl = x - (b.minX - ex), dxr = (b.maxX + ex) - x;
      const dzl = z - (b.minZ - ex), dzr = (b.maxZ + ex) - z;
      const m = Math.min(dxl, dxr, dzl, dzr);
      if (m === dxl) x = b.minX - ex;
      else if (m === dxr) x = b.maxX + ex;
      else if (m === dzl) z = b.minZ - ex;
      else z = b.maxZ + ex;
    }
  }
  return { x, z };
}

// ---- Đi tới điểm làm lễ ----
function walkToSpot(type, cb) {
  const spot = SPOTS[type];
  if (!spot) { if (cb) cb(); return; }
  const dx = spot.stand.x - myPos.x, dz = spot.stand.z - myPos.z;
  if (Math.hypot(dx, dz) < 1.4) {
    myPos.rot = spot.rot;
    sendMove(true);
    if (cb) cb();
    return;
  }
  moveTarget = { x: spot.stand.x, z: spot.stand.z };
  pendingAction = { type, cb, rot: spot.rot };
}
let lastSent = { x: null, z: null, rot: null };
function sendMove(force) {
  if (!socket || !myId) return;
  const now = performance.now();
  if (!force && now - lastMoveSent < 100) return;
  // Chỉ gửi khi vị trí/góc thực sự đổi — tránh spam làm mất trạng thái hành động
  const moved = lastSent.x === null
    || Math.hypot(myPos.x - lastSent.x, myPos.z - lastSent.z) > 0.02
    || Math.abs(myPos.rot - lastSent.rot) > 0.03;
  if (!force && !moved) return;
  lastMoveSent = now;
  lastSent = { x: myPos.x, z: myPos.z, rot: myPos.rot };
  socket.emit('move', { x: myPos.x, z: myPos.z, rot: myPos.rot });
}

// ---- Phật phát sáng ----
function triggerBuddhaGlow(byName) {
  const now = Date.now();
  if (now - lastGlowAt < 1500) return;
  lastGlowAt = now;
  playDeepBell();
  if (!buddhaMats) {
    buddhaMats = [];
    buddhaGroup.traverse((o) => {
      if (o.isMesh && o.material && o.material.emissive) buddhaMats.push(o.material);
    });
  }
  glowActive = true;
  glowT = 0;
  buddhaRays.visible = true;
  const banner = $('glowBanner');
  banner.textContent = '✨ ' + (byName || 'Ai đó') + ' lễ Phật — Đức Phật phát sáng ✨';
  banner.classList.remove('hidden');
  // Cánh sen rơi
  let i = 0;
  for (const p of petalPool) {
    p.life = 5 + Math.random();
    p.x = -6 + Math.random() * 12;
    p.y = 7 + Math.random() * 3;
    p.z = -16 + (Math.random() - 0.5) * 6;
    p.m.visible = true;
    if (++i >= 24) break;
  }
}

// ---- Điều khiển: bàn phím, chuột, cảm ứng ----
function initPlayerControls() {
  const wrap = $('sceneWrap');
  // Vật tương tác thêm: tượng Phật (lễ Phật) + đệm thiền
  const buddhaHit = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.5, 2.5), new THREE.MeshBasicMaterial({ visible: false }));
  buddhaHit.position.set(0, 2.6, -16.2);
  buddhaHit.userData.spot = 'lePhat';
  scene.add(buddhaHit);
  interactiveRoots.push(buddhaHit);
  const cushionHit = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1, 2), new THREE.MeshBasicMaterial({ visible: false }));
  cushionHit.position.set(8, 0.4, -3.6);
  cushionHit.userData.spot = 'thien';
  scene.add(cushionHit);
  interactiveRoots.push(cushionHit);

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys[e.key.toLowerCase()] = true;
    if ((e.key === 'e' || e.key === 'E') && nearestSpot) {
      const t = promptType;
      walkToSpot(t, () => doAction(t));
    }
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
      if (chanting) stopChant();
      moveTarget = null;
    }
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  // Kéo chuột xoay camera; chạm nhanh = đi tới điểm chạm
  let drag = null;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(interactiveRoots, true);
    if (hits.length) {
      let o = hits[0].object;
      while (o && !o.userData.spot) o = o.parent;
      if (o) return { spot: o.userData.spot };
    }
    const g = raycaster.intersectObject(groundPlane);
    if (g.length) return { point: g[0].point };
    return null;
  };
  wrap.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.joystick')) return;
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, id: e.pointerId };
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    camYaw -= dx * 0.005;
    camPitch = Math.max(0.15, Math.min(1.05, camPitch + dy * 0.004));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  wrap.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const wasTap = drag.moved < 10 && performance.now() - drag.t < 450;
    drag = null;
    if (!wasTap) return;
    if (chanting) stopChant();
    const hit = pick(e);
    if (!hit) return;
    if (hit.spot) {
      walkToSpot(hit.spot, () => doAction(hit.spot));
    } else if (hit.point) {
      const p = resolveCollision(hit.point.x, hit.point.z);
      moveTarget = p;
      pendingAction = null;
    }
  });
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    camDist = Math.max(5, Math.min(14, camDist * (1 + e.deltaY * 0.001)));
  }, { passive: false });

  // Cần gạt ảo (điện thoại)
  if ('ontouchstart' in window) {
    const joy = $('joystick'), knob = $('joyKnob');
    joy.classList.remove('hidden');
    let joyId = null;
    const setKnob = (dx, dy) => {
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    joy.addEventListener('pointerdown', (e) => {
      joyId = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      joyVec = { x: 0, y: 0 };
    });
    joy.addEventListener('pointermove', (e) => {
      if (e.pointerId !== joyId) return;
      const r = joy.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy), max = 36;
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      setKnob(dx, dy);
      joyVec = { x: dx / max, y: dy / max };
      if (chanting) stopChant();
      moveTarget = null;
    });
    const endJoy = () => { joyId = null; joyVec = { x: 0, y: 0 }; setKnob(0, 0); };
    joy.addEventListener('pointerup', endJoy);
    joy.addEventListener('pointercancel', endJoy);
  }

  // Bấm vào gợi ý làm lễ
  $('promptChip').addEventListener('click', () => {
    if (promptType) walkToSpot(promptType, () => doAction(promptType));
  });

  // Kiểm tra điểm làm lễ gần nhất mỗi 0.25s
  setInterval(() => {
    if (!me) return;
    let best = null, bestD = 1e9;
    for (const [type, s] of Object.entries(SPOTS)) {
      const d = Math.hypot(myPos.x - s.x, myPos.z - s.z);
      if (d < s.r && d < bestD) { best = type; bestD = d; }
    }
    nearestSpot = best;
    promptType = best;
    const chip = $('promptChip');
    if (best) {
      chip.textContent = SPOTS[best].label + ' — bấm E hoặc chạm vào đây';
      chip.classList.remove('hidden');
    } else {
      chip.classList.add('hidden');
    }
  }, 250);
}

function snapCamera() {
  const hd = camDist * Math.cos(camPitch);
  camera.position.set(
    myPos.x + Math.sin(camYaw) * hd,
    camDist * Math.sin(camPitch) + 1.4,
    myPos.z + Math.cos(camYaw) * hd
  );
  camera.lookAt(myPos.x, 1.9, myPos.z);
}

// ---- Vòng lặp chính ----
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // --- Di chuyển người chơi của mình ---
  if (me) {
    let f = 0, s = 0;
    if (keys['w'] || keys['arrowup']) f += 1;
    if (keys['s'] || keys['arrowdown']) f -= 1;
    if (keys['d'] || keys['arrowright']) s += 1;
    if (keys['a'] || keys['arrowleft']) s -= 1;
    if (joyVec.x || joyVec.y) { f += -joyVec.y; s += joyVec.x; }
    let mx = 0, mz = 0;
    if (moveTarget) {
      const dx = moveTarget.x - myPos.x, dz = moveTarget.z - myPos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.5) {
        moveTarget = null;
        if (pendingAction) {
          const pa = pendingAction; pendingAction = null;
          myPos.rot = pa.rot;
          sendMove(true);
          pa.cb();
        }
      } else {
        mx = dx / d; mz = dz / d;
        movingNow = true;
      }
    }
    if (f || s) {
      const len = Math.hypot(f, s);
      f /= len; s /= len;
      const fwdX = -Math.sin(camYaw), fwdZ = -Math.cos(camYaw);
      const rgtX = Math.cos(camYaw), rgtZ = -Math.sin(camYaw);
      mx = fwdX * f + rgtX * s;
      mz = fwdZ * f + rgtZ * s;
      movingNow = true;
    } else if (!moveTarget) {
      movingNow = false;
    }
    if (movingNow && (mx || mz)) {
      const speed = (keys['shift'] ? 8 : 5.5) * dt;
      const np = resolveCollision(myPos.x + mx * speed, myPos.z + mz * speed);
      myPos.x = np.x; myPos.z = np.z;
      const targetRot = Math.atan2(mx, mz);
      let dr = targetRot - myPos.rot;
      while (dr > Math.PI) dr -= Math.PI * 2;
      while (dr < -Math.PI) dr += Math.PI * 2;
      myPos.rot += dr * Math.min(1, dt * 10);
      me.root.position.set(myPos.x, 0, myPos.z);
      me.root.rotation.y = myPos.rot;
      me.moving = true;
      sendMove(false);
    } else {
      me.moving = false;
      sendMove(false);
    }
    // Camera theo sau
    const hd = camDist * Math.cos(camPitch);
    const tx = myPos.x + Math.sin(camYaw) * hd;
    const ty = camDist * Math.sin(camPitch) + 1.4;
    const tz = myPos.z + Math.cos(camYaw) * hd;
    const k = 1 - Math.exp(-10 * dt);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
    camera.lookAt(myPos.x, 1.9, myPos.z);
  }

  // --- Người chơi khác: nội suy vị trí ---
  for (const av of avatars.values()) {
    if (av === me || !av.target) continue;
    const k = 1 - Math.exp(-8 * dt);
    const dx = av.target.x - av.root.position.x;
    const dz = av.target.z - av.root.position.z;
    const dist = Math.hypot(dx, dz);
    av.moving = dist > 0.08;
    av.root.position.x += dx * k;
    av.root.position.z += dz * k;
    let dr = av.target.rot - av.root.rotation.y;
    while (dr > Math.PI) dr -= Math.PI * 2;
    while (dr < -Math.PI) dr += Math.PI * 2;
    av.root.rotation.y += dr * Math.min(1, dt * 8);
  }

  // --- Hoạt ảnh đi bộ / ngồi / lễ ---
  for (const av of avatars.values()) {
    if (av.moving) {
      av.walkPhase += dt * 9;
      av.body.position.y = Math.abs(Math.sin(av.walkPhase)) * 0.07;
      av.armL.rotation.x = Math.sin(av.walkPhase) * 0.7;
      av.armR.rotation.x = -Math.sin(av.walkPhase) * 0.7;
      av.body.rotation.z = Math.sin(av.walkPhase) * 0.04;
    } else {
      av.body.position.y *= 0.9;
      av.armL.rotation.x *= 0.9;
      av.armR.rotation.x *= 0.9;
      av.body.rotation.z *= 0.9;
    }
    if (av.pose === 'chant' || av.pose === 'sit') {
      av.body.position.y = -0.5;
      av.body.rotation.x = 0.28;
      av.armL.rotation.x = -1.05;
      av.armR.rotation.x = -1.05;
      if (av.pose === 'chant') av.beads.rotation.z += dt * 0.8;
    } else if (av.bowT >= 0) {
      av.bowT += dt;
      const bt = av.bowT;
      const k = bt < 1.4 ? Math.sin((bt / 1.4) * Math.PI) : 0;
      av.body.rotation.x = 0.75 * k;
      if (bt >= 1.4) { av.bowT = -1; av.body.rotation.x = 0; }
    } else {
      av.body.rotation.x *= 0.9;
    }
  }

  // --- Phật phát sáng ---
  if (glowActive) {
    glowT += dt;
    const k = glowT < 1 ? glowT : glowT > 5 ? Math.max(0, 6 - glowT) : 1;
    buddhaGroup.position.y = buddhaBaseY + 0.6 * k;
    buddhaGroup.scale.setScalar(1 + 0.08 * k);
    buddhaLight.intensity = 3.5 * k;
    buddhaRays.rotation.y += dt * 1.4;
    if (buddhaMats) for (const m of buddhaMats) m.emissiveIntensity = 0.4 + 1.8 * k;
    if (glowT >= 6) {
      glowActive = false;
      buddhaRays.visible = false;
      buddhaGroup.position.y = buddhaBaseY;
      buddhaGroup.scale.setScalar(1);
      buddhaLight.intensity = 0;
      if (buddhaMats) for (const m of buddhaMats) m.emissiveIntensity = 0.4;
      $('glowBanner').classList.add('hidden');
    }
  }

  // --- Khói nhang ---
  ambientSmokeTimer += dt;
  if (ambientSmokeTimer > 0.7) {
    ambientSmokeTimer = 0;
    spawnSmoke(0, 2.9, -8, 1);
  }
  for (const p of smokePool) {
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.sp.visible = false; continue; }
    p.x += (p.vx + Math.sin(t * 1.5 + p.y) * 0.12) * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.sp.position.set(p.x, p.y, p.z);
    const sc = 0.6 + (p.max - p.life) * 0.5;
    p.sp.scale.set(sc, sc, 1);
    p.sp.material.opacity = Math.min(0.5, (p.life / p.max) * 0.5);
  }
  // --- Cánh sen rơi ---
  for (const p of petalPool) {
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.m.visible = false; continue; }
    p.y -= p.speed * dt;
    p.x += Math.sin(t * 2 + p.sway) * dt * 0.6;
    p.m.position.set(p.x, p.y, p.z);
    p.m.rotation.z += dt * 1.5;
    p.m.rotation.x += dt * 0.8;
  }
  // --- Chuông đung đưa ---
  if (bellSwing > 0.005) {
    bellPivot.rotation.z = Math.sin(t * 7) * 0.38 * bellSwing;
    bellSwing *= Math.pow(0.35, dt);
  } else {
    bellPivot.rotation.z *= 0.9;
  }
  // --- Đèn lồng đung đưa, nến cháy, mây trôi ---
  lanterns.forEach((l, i) => {
    l.rotation.z = Math.sin(t * 0.8 + i * 1.3) * 0.06;
    l.rotation.x = Math.cos(t * 0.6 + i) * 0.04;
  });
  candleFlames.forEach((fl, i) => {
    fl.scale.y = 1 + Math.sin(t * 13 + i * 2) * 0.18;
    fl.scale.x = 1 + Math.cos(t * 11 + i) * 0.1;
  });
  if (candleLight) candleLight.intensity = 1.1 + Math.sin(t * 9) * 0.25;
  clouds.forEach((c) => {
    c.position.x += dt * 0.5;
    if (c.position.x > 80) c.position.x = -80;
  });

  renderer.render(scene, camera);
}
