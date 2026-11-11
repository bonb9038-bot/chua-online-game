const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

// ---- Shared room state (in-memory) ----
const players = {}; // socketId -> { id, name, avatar, x, y, action, actionAt }
const chatMessages = []; // keep last 50: { name, avatar, text, time }
const activityFeed = []; // keep last 30: { text, time }
const counters = { huong: 0, chuong: 0, nen: 0, hoa: 0, niemPhat: 0, lePhat: 0 };
const chantTimers = {}; // socketId -> timeout, clears a chanting label after 10s without a tick

function nowTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function pushFeed(text) {
  activityFeed.unshift({ text, time: nowTime() });
  if (activityFeed.length > 30) activityFeed.length = 30;
}
function roomState() {
  return {
    players: Object.values(players),
    chat: chatMessages,
    counters: { ...counters },
    feed: activityFeed,
  };
}
function broadcastState() {
  io.emit('roomState', roomState());
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.json({ ok: true, online: Object.keys(players).length, counters }));

io.on('connection', (socket) => {
  // Heartbeat: client pings every 20s, server answers; also keeps free hosts awake-ish
  socket.on('heartbeat', () => socket.emit('heartbeatAck', { time: Date.now() }));

  socket.on('join', ({ name, avatar } = {}) => {
    const cleanName = String(name || 'Phật tử').trim().slice(0, 20) || 'Phật tử';
    const cleanAvatar = String(avatar || '🙏').slice(0, 4);
    players[socket.id] = {
      id: socket.id,
      name: cleanName,
      avatar: cleanAvatar,
      x: 50 + (Math.random() * 20 - 10),
      y: 68 + (Math.random() * 10 - 5),
      action: null,
      actionAt: null,
    };
    pushFeed(`🙏 ${cleanName} đã vào chùa`);
    // Full room state to the newcomer, then tell everyone else
    socket.emit('joined', roomState());
    socket.broadcast.emit('roomState', roomState());
  });

  socket.on('move', ({ x, y } = {}) => {
    const p = players[socket.id];
    if (!p) return;
    p.x = Math.max(2, Math.min(98, Number(x) || p.x));
    p.y = Math.max(5, Math.min(95, Number(y) || p.y));
    p.action = null;
    socket.broadcast.emit('playerMoved', { id: p.id, x: p.x, y: p.y });
  });

  socket.on('action', ({ type, count, phrase } = {}) => {
    const p = players[socket.id];
    if (!p) return;
    const valid = ['huong', 'le', 'lePhat', 'chuong', 'nen', 'hoa', 'thien', 'niemPhat'];
    if (!valid.includes(type)) return;

    // --- Niệm Phật: mỗi câu kinh là 1 lần niệm, client gửi nhịp ~2,8s/câu ---
    if (type === 'niemPhat') {
      const isNewSession = p.action !== 'niemPhat';
      p.action = 'niemPhat';
      p.actionAt = Date.now();
      counters.niemPhat += 1;
      if (isNewSession) pushFeed(`📿 ${p.name} đang niệm Phật`);
      const cleanPhrase = String(phrase || 'Nam Mô A Di Đà Phật').slice(0, 80);
      io.emit('chantTick', {
        id: p.id, name: p.name, avatar: p.avatar,
        phrase: cleanPhrase, count: Number(count) || counters.niemPhat,
        total: counters.niemPhat, counters: { ...counters }, feed: activityFeed,
      });
      io.emit('actionDone', { id: p.id, name: p.name, avatar: p.avatar, type, counters: { ...counters }, feed: activityFeed });
      clearTimeout(chantTimers[socket.id]);
      chantTimers[socket.id] = setTimeout(() => {
        if (players[socket.id] && players[socket.id].action === 'niemPhat') {
          players[socket.id].action = null;
          io.emit('playerMoved', { id: socket.id, x: players[socket.id].x, y: players[socket.id].y });
        }
      }, 10000);
      return;
    }

    p.action = type;
    p.actionAt = Date.now();
    const labels = {
      huong: 'đã thắp hương',
      le: 'đã lễ Phật — Phật phát sáng',
      lePhat: 'đã lễ Phật — Phật phát sáng',
      chuong: 'đã gõ chuông',
      nen: 'đã thắp nến',
      hoa: 'đã dâng hoa',
      thien: 'đang ngồi thiền',
    };
    if (type === 'huong') counters.huong += 1;
    if (type === 'chuong') counters.chuong += 1;
    if (type === 'nen') counters.nen += 1;
    if (type === 'hoa') counters.hoa += 1;
    // Lễ Phật (cả 'le' cũ và 'lePhat' mới): Phật phát sáng cho CẢ PHÒNG cùng lúc
    const isLePhat = type === 'le' || type === 'lePhat';
    if (isLePhat) {
      counters.lePhat += 1;
      pushFeed(`✨ ${p.name} đã lễ Phật — Đức Phật phát sáng`);
      io.emit('buddhaGlow', { by: p.id, name: p.name, at: Date.now() });
    } else {
      pushFeed(`✨ ${p.name} ${labels[type]}`);
    }
    io.emit('actionDone', { id: p.id, name: p.name, avatar: p.avatar, type: isLePhat ? 'lePhat' : type, counters: { ...counters }, feed: activityFeed });
    // Clear the action label after 4s for everyone (trừ niệm Phật đã xử lý riêng)
    setTimeout(() => {
      if (players[socket.id] && players[socket.id].action !== 'niemPhat') {
        players[socket.id].action = null;
        io.emit('playerMoved', { id: socket.id, x: players[socket.id].x, y: players[socket.id].y });
      }
    }, 4000);
  });

  // Dừng niệm Phật (client bấm "Dừng niệm" hoặc di chuyển đi chỗ khác)
  socket.on('stopChant', () => {
    const p = players[socket.id];
    if (!p) return;
    if (p.action === 'niemPhat') {
      p.action = null;
      clearTimeout(chantTimers[socket.id]);
      pushFeed(`📿 ${p.name} đã dừng niệm Phật`);
      io.emit('chantStopped', { id: p.id, name: p.name, counters: { ...counters }, feed: activityFeed });
    }
  });

  socket.on('chat', ({ text } = {}) => {
    const p = players[socket.id];
    if (!p) return;
    const clean = String(text || '').trim().slice(0, 200);
    if (!clean) return;
    const msg = { name: p.name, avatar: p.avatar, text: clean, time: nowTime() };
    chatMessages.push(msg);
    if (chatMessages.length > 50) chatMessages.shift();
    io.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    clearTimeout(chantTimers[socket.id]);
    delete chantTimers[socket.id];
    const p = players[socket.id];
    if (p) {
      pushFeed(`👋 ${p.name} đã rời chùa`);
      delete players[socket.id];
      socket.broadcast.emit('roomState', roomState());
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chùa Online đang chạy tại http://localhost:${PORT}`);
});
