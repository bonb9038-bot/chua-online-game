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

Dữ liệu phòng lưu trong bộ nhớ (RAM): reset khi server khởi động lại.

## Kiểm thử
- `node --check server.js`, mở `http://localhost:3000/?autotest=1` để tự vào chùa với tên test.
