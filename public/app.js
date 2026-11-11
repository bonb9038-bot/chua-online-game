// Chùa Online — client phòng chung (Socket.io)
const AVATARS = [
  { emoji: '🧒', label: 'Chú tiểu' },
  { emoji: '👩‍🦲', label: 'Sư cô' },
  { emoji: '🧑‍🦲', label: 'Sư thầy' },
  { emoji: '👨', label: 'Phật tử nam' },
  { emoji: '👩', label: 'Phật tử nữ' },
  { emoji: '👵', label: 'Bà cụ' },
  { emoji: '👴', label: 'Ông cụ' },
  { emoji: '🧘', label: 'Thiền sinh' },
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

let socket = null;
let myId = null;
let myName = '';
let myAvatar = AVATARS[0].emoji;
let myPos = { x: 50, y: 75 };
let selectedAvatar = AVATARS[0].emoji;
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
const courtyard = $('courtyard'), playersLayer = $('playersLayer'), smokeLayer = $('smokeLayer');

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
// Chuông trầm khi Phật phát sáng: âm trầm, vang lâu
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
// Tiếng tụng nhịp nhàng: mõ gỗ trầm + chuông nhỏ, xen kẽ cao/thấp theo câu
function playChantTone(step) {
  if (!soundOn) return;
  ensureAudio(); if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    // Tiếng mõ: sóng vuông ngắn, trầm
    const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
    o1.type = 'triangle'; o1.frequency.value = step % 2 === 0 ? 392 : 330;
    g1.gain.setValueAtTime(0.16, t); g1.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o1.connect(g1); g1.connect(audioCtx.destination); o1.start(t); o1.stop(t + 0.7);
    // Chuông nhỏ vang theo sau nửa nhịp
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
  b.type = 'button'; b.className = 'avatar-btn' + (a.emoji === selectedAvatar ? ' selected' : '');
  b.innerHTML = a.emoji + '<small>' + a.label + '</small>';
  b.onclick = () => {
    selectedAvatar = a.emoji;
    document.querySelectorAll('.avatar-btn').forEach((el) => el.classList.remove('selected'));
    b.classList.add('selected');
  };
  grid.appendChild(b);
});

function join() {
  const name = $('nameInput').value.trim() || 'Phật tử';
  myName = name.slice(0, 20);
  myAvatar = selectedAvatar;
  socket = io();
  socket.on('connect', () => {
    myId = socket.id;
    socket.emit('join', { name: myName, avatar: myAvatar });
  });
  socket.on('joined', (state) => { applyRoomState(state); showGame(); });
  socket.on('roomState', (state) => applyRoomState(state));
  socket.on('playerMoved', ({ id, x, y }) => movePlayerEl(id, x, y));
  socket.on('chatMessage', (msg) => { addChat(msg); showBubble(msg); });
  socket.on('actionDone', (data) => {
    updateCounters(data.counters);
    renderFeed(data.feed);
    if (data.type === 'chuong') playBell();
    if (data.type === 'huong') spawnSmoke(data.id);
    if (data.type === 'lePhat' || data.type === 'le') triggerBuddhaGlow(data.name);
    if (data.type === 'niemPhat') markChanting(data.id, true);
    showActionLabel(data.id, data.type);
  });
  // Phật phát sáng: server broadcast cho CẢ PHÒNG cùng lúc
  socket.on('buddhaGlow', (data) => triggerBuddhaGlow(data.name));
  // Niệm Phật: mỗi câu kinh của người khác cũng hiện cho cả phòng
  socket.on('chantTick', (data) => {
    updateCounters(data.counters);
    renderFeed(data.feed);
    markChanting(data.id, true);
    showBubble({ name: data.name, text: data.phrase });
    showActionLabel(data.id, 'niemPhat');
    if (data.id === myId) {
      $('chantPhrase').textContent = data.phrase;
      $('chantCount').textContent = data.count;
      highlightBead(data.count);
      playChantTone(data.count);
    } else if (soundOn) {
      playChantTone(data.count); // nghe tiếng tụng chung của phòng, nhỏ nhẹ
    }
  });
  socket.on('chantStopped', (data) => {
    renderFeed(data.feed);
    markChanting(data.id, false);
    if (data.id === myId) { chanting = false; $('chantPanel').classList.add('hidden'); $('chantBtn').classList.remove('active'); $('chantBtn').textContent = '📿 Đọc kinh / Niệm Phật'; }
  });
  socket.on('disconnect', () => { /* tự động nối lại khi server lên lại */ });
  setInterval(() => socket.emit('heartbeat'), 20000);
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  $('meLabel').textContent = myAvatar + ' ' + myName;
}

function showGame() {
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
}

$('joinBtn').onclick = join;
$('nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
$('leaveBtn').onclick = () => location.reload();

// ---- Hiển thị phòng ----
function applyRoomState(state) {
  if (!state) return;
  updateCounters(state.counters);
  renderFeed(state.feed || []);
  renderPlayers(state.players || []);
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
}
function renderFeed(feed) {
  $('feedList').innerHTML = feed.map((f) => '<li>' + escapeHtml(f.text) + ' <span>• ' + escapeHtml(f.time || '') + '</span></li>').join('');
}
function renderPlayers(players) {
  updateOnline(players);
  $('playerList').innerHTML = players.map((p) =>
    '<li>' + escapeHtml(p.avatar) + ' <b>' + escapeHtml(p.name) + '</b>' + (p.id === myId ? ' (bạn)' : '') + '</li>').join('');
  const seen = new Set();
  players.forEach((p) => {
    seen.add(p.id);
    let el = document.querySelector('[data-player="' + p.id + '"]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'player' + (p.id === myId ? ' me' : '');
      el.dataset.player = p.id;
      el.innerHTML = '<div class="halo"></div><div class="bubble" style="display:none"></div><div class="avatar">' + escapeHtml(p.avatar) + '</div><div class="beads">📿</div><div class="name">' + escapeHtml(p.name) + '</div><div class="act" style="display:none"></div>';
      playersLayer.appendChild(el);
    }
    el.style.left = p.x + '%';
    el.style.top = p.y + '%';
  });
  document.querySelectorAll('.player').forEach((el) => { if (!seen.has(el.dataset.player)) el.remove(); });
}
function movePlayerEl(id, x, y) {
  const el = document.querySelector('[data-player="' + id + '"]');
  if (el) { el.style.left = x + '%'; el.style.top = y + '%'; }
}
function showActionLabel(id, type) {
  const el = document.querySelector('[data-player="' + id + '"] .act');
  if (!el) return;
  el.textContent = ACTION_LABELS[type] || '';
  el.style.display = 'inline-block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
function showBubble(msg) {
  // Tìm người chơi theo tên (tin nhắn mang theo tên + avatar)
  const els = [...document.querySelectorAll('.player')];
  const el = els.find((e) => e.querySelector('.name') && e.querySelector('.name').textContent === msg.name);
  if (!el) return;
  const b = el.querySelector('.bubble');
  b.textContent = msg.text;
  b.style.display = 'inline-block';
  clearTimeout(bubbleTimers[msg.name]);
  bubbleTimers[msg.name] = setTimeout(() => { b.style.display = 'none'; }, 4000);
}
function spawnSmoke(playerId) {
  const el = document.querySelector('[data-player="' + playerId + '"]');
  const s = document.createElement('div');
  s.className = 'smoke';
  s.textContent = '💨';
  if (el) { s.style.left = el.style.left; s.style.top = '52%'; }
  else { s.style.left = '50%'; s.style.top = '52%'; }
  smokeLayer.appendChild(s);
  setTimeout(() => s.remove(), 3200);
}

// ---- Phật phát sáng (cho cả phòng, chống trùng khi nhận cả 2 sự kiện) ----
function triggerBuddhaGlow(byName) {
  const now = Date.now();
  if (now - lastGlowAt < 1500) return; // actionDone + buddhaGlow cùng tới thì chỉ phát 1 lần
  lastGlowAt = now;
  playDeepBell();
  const temple = $('temple'), yard = $('courtyard'), banner = $('glowBanner');
  temple.classList.add('glowing');
  yard.classList.add('buddha-glow');
  banner.textContent = '✨ ' + (byName || 'Ai đó') + ' lễ Phật — Đức Phật phát sáng ✨';
  banner.classList.remove('hidden');
  spawnPetals();
  setTimeout(() => {
    temple.classList.remove('glowing');
    yard.classList.remove('buddha-glow');
    banner.classList.add('hidden');
  }, 6000);
}
function spawnPetals() {
  const layer = $('lotusLayer');
  const petals = ['🌸', '🪷', '🌸', '🪷', '🌺', '🌸'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('div');
    s.className = 'petal';
    s.textContent = petals[i % petals.length];
    s.style.left = (5 + Math.random() * 90) + '%';
    s.style.animationDelay = (Math.random() * 1.5) + 's';
    layer.appendChild(s);
    setTimeout(() => s.remove(), 7000);
  }
}

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
function markChanting(id, on) {
  const el = document.querySelector('[data-player="' + id + '"]');
  if (el) el.classList.toggle('chanting', !!on);
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
  $('chantPhrase').textContent = 'Đang ngồi xuống trước tượng Phật...';
  $('chantBtn').classList.add('active');
  $('chantBtn').textContent = '📿 Đang niệm Phật — bấm để dừng';
  walkTo(50, 47); // ngồi xuống trước tượng Phật
  markChanting(myId, true);
  setTimeout(() => { if (chanting) { chantTick(); chantTimer = setInterval(chantTick, 2800); } }, 1000);
}
function stopChant() {
  if (!chanting) return;
  chanting = false;
  clearInterval(chantTimer);
  if (socket) socket.emit('stopChant');
  markChanting(myId, false);
  $('chantPanel').classList.add('hidden');
  $('chantBtn').classList.remove('active');
  $('chantBtn').textContent = '📿 Đọc kinh / Niệm Phật';
}
$('chantBtn').onclick = () => { if (chanting) stopChant(); else startChant(); };
$('stopChantBtn').onclick = stopChant;

// ---- Di chuyển & làm lễ ----
function walkTo(x, y) {
  myPos = { x, y };
  if (socket) socket.emit('move', { x, y });
  movePlayerEl(myId, x, y);
}
courtyard.addEventListener('click', (e) => {
  if (chanting) stopChant(); // rời chỗ ngồi niệm thì dừng niệm
  const spot = e.target.closest('.spot');
  if (spot) {
    const x = Number(spot.dataset.x), y = Number(spot.dataset.y);
    walkTo(x, y);
    setTimeout(() => doAction(spot.dataset.action), 900);
    return;
  }
  if (e.target.closest('.player')) return;
  const r = courtyard.getBoundingClientRect();
  const x = Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100));
  const y = Math.max(5, Math.min(95, ((e.clientY - r.top) / r.height) * 100));
  walkTo(x, y);
});
function doAction(type) {
  if (!socket) return;
  if (type === 'niemPhat') { if (chanting) stopChant(); else startChant(); return; }
  if (chanting) stopChant();
  if (type === 'chuong') playBell();
  socket.emit('action', { type });
}
document.querySelectorAll('[data-action]').forEach((btn) => {
  if (btn.classList.contains('spot')) return; // spot đã xử lý ở trên
  btn.addEventListener('click', () => doAction(btn.dataset.action));
});

// ---- Chat ----
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
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
