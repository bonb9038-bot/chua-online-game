# Chùa Online 3D — Phòng Chung (bản 3D)

Game đi chùa online nhiều người chơi chung một phòng, dựng cảnh 3D bằng Three.js.

## Chạy thử
```
npm install
npm start
```
Mở http://localhost:3000 — nhập tên, chọn nhân vật rồi vào chùa.

## Điều khiển
- **W A S D / phím mũi tên**: đi bộ trong sân chùa
- **Kéo chuột**: xoay camera (lăn chuột để zoom gần/xa)
- **Chạm vào sân/vật** (chuột hoặc cảm ứng): đi tới đó
- **Phím E** khi đứng gần lư hương, chuông, bàn thờ...: làm lễ
- **Điện thoại**: cần gạt ảo ở góc trái để đi, kéo phần phải màn hình để xoay camera
- Nút dưới sân: Thắp hương, Lễ Phật, Gõ chuông, Thắp nến, Dâng hoa, Ngồi thiền, Đọc kinh / Niệm Phật

## Tính năng
- Sân chùa 3D: chính điện mái ngói cong, tượng Phật vàng, bàn thờ ngũ quả, lư hương lớn có khói, chuông đồng, trống, đèn lồng đỏ, ao sen, cây bonsai, đèn đá, cổng tam quan, núi và hoàng hôn.
- Lễ Phật: tượng Phật đứng dậy phát sáng vàng, cánh sen rơi, chuông trầm — hiện cho cả phòng.
- Niệm Phật: ngồi quỳ trước Phật, tràng hạt, câu kinh chạy theo nhịp, tiếng mõ + chuông.
- Phòng chung thời gian thực (Socket.io): thấy nhau đi lại, bảng tên, bong bóng chat, chat chung, bộ đếm lễ chung, hoạt động chung.

## Deploy (Render)
Repo GitHub + `render.yaml` có sẵn: Node, `npm install` / `npm start`, gói Free.
Gói Free ngủ khi lâu không ai vào nên lần mở đầu sau lúc vắng có thể chờ ~50 giây.

Dữ liệu phòng (bộ đếm chung, chat, feed) lưu trong bộ nhớ (RAM): reset khi server khởi động lại. Tiến độ từng người chơi thì được lưu riêng — xem mục dưới.

## Lưu tiến độ người chơi (2 lớp)

### Lớp 1 — localStorage trên máy người chơi (CHÍNH, đáng tin nhất)

Khi vào chùa, game lưu profile vào localStorage theo tên, key
`chua3d-profile-<tên>` (tên được mã hoá URL), gồm: tên, nhân vật đã chọn,
Công đức, KN, danh hiệu (suy ra từ Công đức), các bộ đếm cá nhân
(thắp hương, gõ chuông, niệm Phật, lễ Phật…), nhiệm vụ đang làm + tiến độ
từng nhiệm vụ, nhiệm vụ đã xong, điểm đố vui (số câu đúng, phần đã hoàn
thành + điểm cao nhất từng phần). Lưu ngay khi Công đức / nhiệm vụ / đố vui
thay đổi (debounce ~1 giây) và lưu lại trước khi rời trang (`beforeunload`).

Mở lại trang: nếu có profile đã lưu, màn hình đăng nhập hiện sẵn tên +
nhân vật cũ và nút **"▶️ Chơi tiếp"** to rõ — bấm là vào thẳng phòng với
đúng tiến độ cũ. Nút **"Vào chùa"** lúc này thành **"Tạo nhân vật mới"**:
bấm vào sẽ hỏi xác nhận trước khi ghi đè tiến độ cũ của tên đó.

Lớp này giữ tiến độ khi quay lại trên **cùng thiết bị / trình duyệt**,
kể cả khi server đã restart hay redeploy. Đổi máy hoặc xoá dữ liệu trình
duyệt thì mất (đó là giới hạn của localStorage).

### Lớp 2 — server lưu `players.json` (hỗ trợ thêm)

`server.js` lưu trạng thái người chơi theo tên vào file `players.json`
trong thư mục dự án (ghi debounce 2 giây sau mỗi thay đổi, đọc lại khi
khởi động; ghi qua file tạm rồi đổi tên để tránh file dở). Client gửi
profile qua sự kiện socket `profileSave` `{name, merit, title, questsDone,
quizScore}` khi vào chùa và khi tiến độ đổi. Khi client join, server gửi
lại profile đã lưu (nếu có) trong sự kiện `joined` để client đối chiếu —
nhưng **localStorage vẫn là nguồn chính, nếu 2 bên khác nhau thì ưu tiên
localStorage**; server chỉ dùng profile đã lưu khi máy đó chưa có
localStorage cho tên đó. Server không dùng dữ liệu này làm trạng thái tin
cậy cho game logic (chỉ lưu theo tên).

**Giới hạn quan trọng:** file này chỉ giúp giữ tiến độ khi server restart
trong **cùng một lần deploy**. Render Free dùng ổ đĩa tạm (ephemeral) nên
khi redeploy có thể mất — lớp localStorage trên máy người chơi mới là chỗ
giữ tiến độ chắc chắn. Không hứa hẹn lưu đa thiết bị (muốn thế cần
database thật, chưa có trong bản này).

`players.json` do server tự tạo khi có người chơi lưu (không commit sẵn;
có thể xoá để reset toàn bộ tiến độ lớp server).

## Kiểm thử
- `node --check server.js`, mở `http://localhost:3000/?autotest=1` để tự vào chùa với tên test.
