# Chùa Online — Phòng Chung Thắp Hương

Game đi chùa online cho nhiều người cùng chơi trong một phòng chung:
đăng nhập bằng tên + chọn nhân vật, đi lại trong sân chùa lúc hoàng hôn,
cùng thắp hương một lư, lễ Phật, gõ chuông, thắp nến, dâng hoa, ngồi thiền
và chat với nhau theo thời gian thực — như thật.

## Cách chơi

1. Mở link game, nhập tên và chọn 1 trong 8 nhân vật.
2. Bấm **Vào chùa**.
3. Chạm vào sân để đi lại. Bấm vào lư hương, bàn thờ, chuông, nến,
   hoa hoặc đệm thiền để nhân vật tự đi tới làm lễ.
4. Bấm **📿 Đọc kinh / Niệm Phật**: nhân vật ngồi xuống trước tượng
   Phật, tràng hạt chuyển động, từng câu kinh hiện lên theo nhịp
   ("Nam Mô A Di Đà Phật"...) kèm tiếng tụng bằng Web Audio, có đếm
   số lần niệm. Cả phòng đều thấy bạn đang niệm và nghe tiếng tụng.
   Nút **🔊 Âm thanh** ở góc trên để bật/tắt tiếng.
5. Bấm **🙏 Lễ Phật**: tượng Phật từ từ đứng dậy, phát hào quang
   vàng rực, tia sáng tỏa ra, cánh sen rơi, cả sân chùa sáng lên
   trong vài giây kèm tiếng chuông trầm — hiệu ứng này hiện cho
   **tất cả mọi người trong phòng cùng lúc**.
6. Gõ tin nhắn ở khung **Trò chuyện** — tin nhắn hiện thành bong bóng
   thoại trên đầu nhân vật của bạn, mọi người trong phòng đều thấy.

## 1) Chạy thử trên máy của bạn

Yêu cầu: Node.js 18 trở lên (tải tại https://nodejs.org).

```bash
npm install
npm start
```

Mở trình duyệt tại: http://localhost:3000

Mở thêm 1-2 tab / điện thoại khác cùng vào địa chỉ đó để thử
nhiều người chơi chung một phòng.

## 2) Đưa lên mạng miễn phí bằng Render

1. Đưa code này lên GitHub (tạo repo mới, đẩy toàn bộ thư mục này lên).
2. Vào https://render.com → **New +** → **Web Service** → chọn repo vừa tạo.
3. Điền:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - Gói **Free** là đủ để chơi thử.
4. Bấm **Create Web Service**, chờ Render build xong sẽ có link dạng:
   `https://chua-online-game.onrender.com`
5. Copy link đó dán vào bio TikTok / mô tả video. Ai bấm vào link
   cũng vào chung một phòng với bạn.

> Lưu ý: gói Free của Render sẽ "ngủ" khi không có ai vào một lúc.
> Người đầu tiên mở link có thể phải chờ khoảng 30 giây để server
> tỉnh lại, những người sau vào sẽ nhanh bình thường.

File `render.yaml` trong dự án này đã ghi sẵn cấu hình trên,
Render có thể tự nhận khi bạn kết nối repo.

## 3) Đưa lên mạng bằng Railway (cách khác, cũng miễn phí lúc đầu)

1. Vào https://railway.app → **New Project** → **Deploy from GitHub repo**
   và chọn repo này.
2. Railway tự nhận đây là dự án Node, **Start Command** là `npm start`.
3. Vào tab **Settings → Networking → Generate Domain** để lấy link công khai.
4. Copy link đó dán vào TikTok như cách trên.

## Lưu ý quan trọng

- Dữ liệu phòng (người online, tin nhắn, số hương / chuông / nến / hoa)
  được lưu **trong bộ nhớ của server**. Khi server khởi động lại
  (Render/Railway deploy lại, hoặc hết gói free), các số liệu này
  sẽ reset về 0 — đây là hành vi bình thường của bản này.
- Muốn lưu vĩnh viễn (tài khoản, lịch sử lễ, bảng công đức...),
  cần thêm cơ sở dữ liệu (ví dụ MongoDB / Postgres) — đó là bước
  nâng cấp sau, không bắt buộc để chơi chung phòng như hiện tại.
