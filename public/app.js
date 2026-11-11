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
  leTuong: '🙏 đang lễ tượng Phật',
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
// ---- Tượng Phật thêm (id, tên, vị trí, điểm đứng, hướng mặt, lời chúc) ----
// Quan Âm đặt ở (7.5, 12.5) thay vì (10, 13) vì (10, 13) cách cây bonsai (10, 14) chỉ 1m.
const STATUES = [
  { id: 'dung',   label: 'Tượng Phật đứng', x: 8,    z: 16,   r: 1.0, stand: { x: 10.2, z: 16 },   rot: -Math.PI / 2, tag: 'Phật Đứng',  blessing: '🙏 Đức Phật đứng ban phước cho bạn — thân tâm an lạc!' },
  { id: 'nam',    label: 'Tượng Phật nằm',  x: -19,  z: 1,    r: 2.2, stand: { x: -16.3, z: 1 },    rot: -Math.PI / 2, tag: 'Phật Nằm',   blessing: '🙏 Đức Phật nằm ban phước cho bạn — ngủ ngon, mộng lành!' },
  { id: 'quanAm', label: 'Tượng Quan Âm',   x: 7.5,  z: 12.5, r: 1.0, stand: { x: 5.3, z: 12.5 },   rot: Math.PI / 2,  tag: 'Quan Âm',    blessing: '🙏 Quan Âm Bồ Tát ban phước cho bạn — từ bi, may mắn!' },
  { id: 'diLac',  label: 'Tượng Phật Di Lặc', x: -5, z: 17,   r: 1.1, stand: { x: -5, z: 14.8 },    rot: Math.PI,      tag: 'Di Lặc',     blessing: '🙏 Phật Di Lặc ban phước cho bạn — cười vui, tài lộc đầy nhà!' },
  { id: 'hoPhap', label: 'Tượng Hộ Pháp',   x: -8.5, z: -9.5, r: 1.0, stand: { x: -8.5, z: -7.2 },  rot: Math.PI,      tag: 'Hộ Pháp',   blessing: '🙏 Hộ Pháp ban phước cho bạn — hộ trì bình an!' },
  { id: 'hoPhap', label: 'Tượng Hộ Pháp',   x: 8.5,  z: -9.5, r: 1.0, stand: { x: 8.5, z: -7.2 },   rot: Math.PI,      tag: 'Hộ Pháp',   blessing: '🙏 Hộ Pháp ban phước cho bạn — hộ trì bình an!' },
];
const STATUE_LABEL = {};
STATUES.forEach((s) => { STATUE_LABEL[s.id] = s.label; });
// ---- NPC giao nhiệm vụ: đi theo vòng waypoint cố định, vị trí tính từ đồng hồ chung ----
// (Date.now() nên mọi client thấy cùng một vị trí NPC, không dùng Math.random)
const NPCS = [
  { id: 'thayMinh', name: 'Thầy Minh', role: 'Sư thầy', robe: 0xd4a017, skin: 0xf2c89b, hair: 'none',
    story: 'A Di Đà Phật! Thầy trụ trì chùa An Nhiên. Sân chùa còn nhiều việc thiện cần người chung tay — con có muốn giúp thầy không?',
    waypoints: [[-4, -4], [4, -4], [4, 2], [-4, 2]], speed: 0.7,
    quests: [
      { id: 'thap-huong-3', title: 'Thắp 3 nén hương', desc: 'Thắp 3 nén hương ở lư hương lớn trước chính điện.', type: 'huong', count: 3, merit: 10 },
      { id: 'niem-phat-10', title: 'Niệm Phật 10 câu', desc: 'Ngồi trước tượng Phật, niệm 10 câu Nam Mô A Di Đà Phật.', type: 'niemPhat', count: 10, merit: 15 },
    ] },
  { id: 'coHue', name: 'Cô Huệ', role: 'Sư cô', robe: 0x6d4c41, skin: 0xf2c89b, hair: 'none',
    story: 'Mô Phật! Cô đang chuẩn bị hoa và chuông cho buổi lễ chiều nay. Con giúp cô một tay nhé?',
    waypoints: [[0, 6], [6, 6], [6, 12], [0, 12]], speed: 0.7,
    quests: [
      { id: 'go-chuong-5', title: 'Gõ chuông 5 lần', desc: 'Gõ chuông lớn 5 lần để tiếng chuông vang khắp sân chùa.', type: 'chuong', count: 5, merit: 10 },
      { id: 'dang-hoa-2', title: 'Dâng hoa 2 lần', desc: 'Dâng 2 lần hoa sen lên bàn thờ Phật.', type: 'hoa', count: 2, merit: 10 },
    ] },
  { id: 'baTu', name: 'Bà Tư', role: 'Bà cụ', robe: 0x4a5d7a, skin: 0xeec39a, hair: 'greybun',
    story: 'Bà già rồi, ngày nào cũng ra chùa lễ Phật, ngồi thiền cho lòng thanh thản. Cháu trẻ khỏe, làm cùng bà cho vui nhé!',
    waypoints: [[-16, 2], [-10, 2], [-10, 8], [-16, 8]], speed: 0.5,
    quests: [
      { id: 'le-phat-3', title: 'Lễ Phật 3 lần', desc: 'Lễ Phật 3 lần — lễ trước tượng Phật lớn hoặc các tượng trong sân đều được.', type: 'lePhat', count: 3, merit: 10 },
      { id: 'thien-30', title: 'Ngồi thiền 30 giây', desc: 'Ngồi thiền yên lặng 30 giây ở đệm thiền trong sân.', type: 'thien', count: 30, merit: 15 },
    ] },
  { id: 'chiLan', name: 'Chị Lan', role: 'Khách viếng chùa', robe: 0xc25b7a, skin: 0xf2c89b, hair: 'bun',
    story: 'Em đang tìm mua một căn hộ ở Vinhomes Royal Island để cả nhà về ở gần sông, gần biển. Hôm nay em vào chùa thắp hương cầu cho mua được căn ưng ý, giá tốt!',
    waypoints: [[-2, 10], [4, 10], [4, 16], [-2, 16]], speed: 0.6,
    quests: [
      { id: 'cau-can-ho', title: 'Cầu cho chị Lan mua được căn hộ', desc: 'Thắp 3 nén hương cầu cho chị Lan mua được căn hộ ưng ý ở Vinhomes Royal Island.', type: 'huong', count: 3, merit: 15 },
    ] },
  { id: 'anhTuan', name: 'Anh Tuấn', role: 'Khách viếng chùa', robe: 0x3b6ea5, skin: 0xf2c89b, hair: 'short',
    story: 'Anh đang tìm một lô đất nền đẹp để xây nhà cho bố mẹ dưỡng già. Nghe nói đất Vũ Yên giờ hot lắm, anh vào chùa gõ chuông cầu may đây!',
    waypoints: [[10, 0], [14, -1], [14, 3], [10, 3]], speed: 0.6,
    quests: [
      { id: 'cau-dat-nen', title: 'Cầu may cho anh Tuấn tìm được đất nền', desc: 'Gõ chuông 3 lần cầu may cho anh Tuấn tìm được lô đất nền ưng ý để xây nhà.', type: 'chuong', count: 3, merit: 15 },
      { id: 'quiz-3', title: 'Trả lời đúng 3 câu đố bất động sản', desc: 'Trả lời đúng 3 câu đố vui bất động sản ở bảng đố vui gần cổng hoặc khi trò chuyện với anh Tuấn.', type: 'quiz', count: 3, merit: 20 },
    ] },
];
const QUESTS_BY_ID = {};
NPCS.forEach((n) => n.quests.forEach((q) => { QUESTS_BY_ID[q.id] = { ...q, npcId: n.id, npcName: n.name }; }));
// Công đức + danh hiệu theo tổng công đức
const TITLES = [
  { min: 0, title: 'Phật tử mới' },
  { min: 20, title: 'Thiện tín' },
  { min: 50, title: 'Hộ pháp' },
  { min: 100, title: 'Công đức viên mãn' },
];
function titleForMerit(m) {
  let t = TITLES[0].title;
  for (const row of TITLES) if (m >= row.min) t = row.title;
  return t;
}

// ---- Đố vui bất động sản: 12 câu, mỗi câu 4 đáp án ----
// ref: true = câu dùng số liệu dự án, chỉ mang tính tham khảo (ghi chú trong panel).
const QUIZ_SECTIONS = [
  {
    "id": "mo-dau",
    "title": "Phần mở đầu — Kiến thức cơ bản",
    "range": "1–12",
    "questions": [
      {
        "n": 1,
        "q": "Dự án Vinhomes Royal Island tọa lạc ở đâu?",
        "options": [
          "Đảo Cát Bà, Hải Phòng",
          "Đảo Vũ Yên, Hải Phòng",
          "Bán đảo Đồ Sơn, Hải Phòng",
          "Hạ Long, Quảng Ninh"
        ],
        "answer": 1,
        "explain": "Vinhomes Royal Island nằm trên đảo Vũ Yên, thành phố Hải Phòng."
      },
      {
        "n": 2,
        "q": "Cây cầu nào nối đảo Vũ Yên với trung tâm Hải Phòng?",
        "options": [
          "Cầu Bính",
          "Cầu Hoàng Gia",
          "Cầu Rào",
          "Cầu Tân Vũ"
        ],
        "answer": 1,
        "explain": "Cầu Hoàng Gia là cây cầu biểu tượng nối đảo Vũ Yên với trung tâm Hải Phòng."
      },
      {
        "n": 3,
        "q": "Diện tích đảo Vũ Yên khoảng bao nhiêu?",
        "options": [
          "Khoảng 50 ha",
          "Khoảng 200 ha",
          "Khoảng 877 ha",
          "Khoảng 1.500 ha"
        ],
        "answer": 2,
        "explain": "Đảo Vũ Yên rộng khoảng 877 ha — số liệu tham khảo, có thể thay đổi theo quy hoạch.",
        "ref": true
      },
      {
        "n": 4,
        "q": "\"Sổ hồng\" là giấy tờ gì?",
        "options": [
          "Giấy phép xây dựng",
          "Hợp đồng đặt cọc mua nhà",
          "Giấy chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất ở",
          "Giấy chứng nhận đăng ký kinh doanh"
        ],
        "answer": 2,
        "explain": "Sổ hồng chứng nhận quyền sở hữu nhà ở gắn liền với quyền sử dụng đất ở."
      },
      {
        "n": 5,
        "q": "Sổ đỏ và sổ hồng khác nhau thế nào?",
        "options": [
          "Sổ đỏ chứng nhận quyền sử dụng đất; sổ hồng chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất ở",
          "Sổ đỏ luôn có giá trị cao hơn sổ hồng",
          "Sổ hồng chỉ cấp cho chung cư, sổ đỏ chỉ cấp cho đất nông nghiệp",
          "Hai loại sổ này giống hệt nhau, chỉ khác màu bìa"
        ],
        "answer": 0,
        "explain": "Sổ đỏ ghi nhận quyền sử dụng đất; sổ hồng ghi nhận quyền sở hữu nhà ở gắn liền với đất ở."
      },
      {
        "n": 6,
        "q": "Khi mua nhà, tiền đặt cọc thường là bao nhiêu?",
        "options": [
          "Luôn đúng 50% giá nhà",
          "Thường 5–10% giá trị, tùy thỏa thuận hai bên",
          "Cố định 1 triệu đồng",
          "Không cần đặt cọc khi mua nhà"
        ],
        "answer": 1,
        "explain": "Đặt cọc thường 5–10% giá trị căn nhà, do hai bên thỏa thuận — số liệu tham khảo.",
        "ref": true
      },
      {
        "n": 7,
        "q": "Sau khi ký hợp đồng mua bán nhà, bước quan trọng tiếp theo là gì?",
        "options": [
          "Sơn lại nhà rồi dọn vào ở ngay",
          "Công chứng hợp đồng tại văn phòng công chứng",
          "Đăng tin rao bán lại căn nhà",
          "Đổi ổ khóa cửa chính"
        ],
        "answer": 1,
        "explain": "Hợp đồng mua bán nhà cần được công chứng để có giá trị pháp lý đầy đủ."
      },
      {
        "n": 8,
        "q": "Vay ngân hàng mua nhà thường được vay tối đa bao nhiêu?",
        "options": [
          "Khoảng 70–80% giá trị tài sản",
          "Luôn vay được 100% giá nhà",
          "Chỉ vay được tối đa 30%",
          "Chỉ vay được tối đa 10%"
        ],
        "answer": 0,
        "explain": "Ngân hàng thường cho vay khoảng 70–80% giá trị tài sản, tùy chính sách từng ngân hàng — số liệu tham khảo.",
        "ref": true
      },
      {
        "n": 9,
        "q": "Theo phong thủy, cửa chính của nhà nên tránh điều gì?",
        "options": [
          "Có mái che phía trên",
          "Đối thẳng với cửa sau (khí vào rồi thoát ngay)",
          "Hướng ra đường lớn",
          "Trồng cây xanh trước cửa"
        ],
        "answer": 1,
        "explain": "Cửa chính đối thẳng cửa sau bị coi là \"xuyên đường sát\", khí tốt vào nhà rồi thoát ra ngay."
      },
      {
        "n": 10,
        "q": "Phòng thờ trong nhà nên đặt ở đâu?",
        "options": [
          "Cạnh nhà vệ sinh cho tiện",
          "Nơi cao ráo, yên tĩnh và trang nghiêm",
          "Dưới gầm cầu thang",
          "Trong phòng ngủ"
        ],
        "answer": 1,
        "explain": "Phòng thờ nên đặt ở nơi cao ráo, yên tĩnh, trang nghiêm nhất trong nhà."
      },
      {
        "n": 11,
        "q": "Shophouse là loại hình bất động sản gì?",
        "options": [
          "Chung cư cao cấp",
          "Nhà phố thương mại, vừa ở vừa kinh doanh",
          "Biệt thự nghỉ dưỡng ven biển",
          "Đất nông nghiệp"
        ],
        "answer": 1,
        "explain": "Shophouse là nhà phố thương mại ở tầng trệt, vừa để ở vừa kinh doanh buôn bán."
      },
      {
        "n": 12,
        "q": "Biệt thự khác nhà liền kề ở điểm nào?",
        "options": [
          "Liền kề luôn đắt hơn biệt thự",
          "Biệt thự độc lập, có sân vườn riêng; liền kề xây sát nhau thành dãy",
          "Biệt thự không được cấp sổ hồng",
          "Nhà liền kề không được ở, chỉ để kinh doanh"
        ],
        "answer": 1,
        "explain": "Biệt thự là nhà độc lập có sân vườn riêng; nhà liền kề xây sát nhau thành dãy phố."
      }
    ]
  },
  {
    "id": "p9",
    "title": "Phần 9 — Kiến thức chuyên sâu về dự án",
    "range": "101–115",
    "questions": [
      {
        "n": 101,
        "q": "Vinhomes Royal Island thuộc địa bàn hành chính nào sau khi Hải Phòng thực hiện sắp xếp đơn vị hành chính năm 2025?",
        "options": [
          "Phường Hồng Bàng",
          "Phường Thủy Nguyên",
          "Phường Lê Chân",
          "Phường Ngô Quyền"
        ],
        "answer": 1,
        "explain": "Đảo Vũ Yên nằm trong địa bàn Thủy Nguyên, Hải Phòng."
      },
      {
        "n": 102,
        "q": "Đặc điểm nào tạo nên tính chất đô thị đảo của Vũ Yên?",
        "options": [
          "Được bao quanh bởi hệ thống sông",
          "Nằm trên đỉnh núi",
          "Nằm giữa khu công nghiệp",
          "Nằm sát đường quốc lộ"
        ],
        "answer": 0,
        "explain": "Vũ Yên là đảo, được bao quanh bởi hệ thống sông."
      },
      {
        "n": 103,
        "q": "Đâu là lợi thế của việc phát triển một khu đô thị đảo?",
        "options": [
          "Không gian cảnh quan mặt nước",
          "Tạo môi trường sống có tính riêng tư",
          "Phát triển các hoạt động giải trí đường thủy",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Cả ba lợi thế đều đúng: cảnh quan mặt nước, riêng tư và giải trí đường thủy."
      },
      {
        "n": 104,
        "q": "Tổng diện tích khoảng 877 ha của dự án thể hiện điều gì?",
        "options": [
          "Quy mô phát triển đô thị lớn",
          "Chỉ dành cho biệt thự",
          "Chỉ dành cho thương mại",
          "Chỉ dành cho sân golf"
        ],
        "answer": 0,
        "explain": "877 ha cho thấy đây là một đại đô thị quy mô rất lớn."
      },
      {
        "n": 105,
        "q": "Yếu tố nào giúp Vinhomes Royal Island khác biệt với khu đô thị thông thường?",
        "options": [
          "Không gian đảo kết hợp hệ sinh thái tiện ích",
          "Chỉ có nhà ở thấp tầng",
          "Chỉ có khu thương mại",
          "Chỉ có công viên"
        ],
        "answer": 0,
        "explain": "Sự khác biệt là không gian đảo kết hợp hệ sinh thái tiện ích đồng bộ."
      },
      {
        "n": 106,
        "q": "Khi nghiên cứu quy hoạch tổng thể, đâu là yếu tố cần quan tâm?",
        "options": [
          "Cơ cấu sử dụng đất",
          "Hệ thống giao thông",
          "Mạng lưới tiện ích",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Nghiên cứu quy hoạch cần xem cả cơ cấu đất, giao thông và tiện ích."
      },
      {
        "n": 107,
        "q": "Mật độ xây dựng thấp có thể đem lại lợi thế nào?",
        "options": [
          "Tăng diện tích không gian mở",
          "Tăng diện tích cảnh quan",
          "Cải thiện trải nghiệm sống",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Mật độ thấp giúp tăng không gian mở, cảnh quan và trải nghiệm sống."
      },
      {
        "n": 108,
        "q": "Vai trò của cảnh quan sông nước trong dự án là gì?",
        "options": [
          "Tạo giá trị thẩm mỹ",
          "Tăng trải nghiệm nghỉ dưỡng",
          "Hình thành bản sắc đô thị",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Sông nước vừa tạo thẩm mỹ, vừa tăng trải nghiệm nghỉ dưỡng và bản sắc đô thị."
      },
      {
        "n": 109,
        "q": "Đâu là yếu tố quan trọng khi đánh giá một dự án đô thị đảo?",
        "options": [
          "Khả năng kết nối giao thông",
          "Hệ thống tiện ích",
          "Năng lực vận hành",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Đánh giá đô thị đảo cần cả kết nối giao thông, tiện ích và năng lực vận hành."
      },
      {
        "n": 110,
        "q": "Mô hình đô thị tích hợp được hiểu là gì?",
        "options": [
          "Chỉ phát triển nhà ở",
          "Kết hợp nhà ở, thương mại, dịch vụ và tiện ích",
          "Chỉ phát triển công viên",
          "Chỉ phát triển khu nghỉ dưỡng"
        ],
        "answer": 1,
        "explain": "Đô thị tích hợp kết hợp nhà ở, thương mại, dịch vụ và tiện ích trong một khu."
      },
      {
        "n": 111,
        "q": "Tại sao quy hoạch đồng bộ có thể tạo ra giá trị dài hạn?",
        "options": [
          "Hạn chế phát triển tự phát",
          "Tạo môi trường sống thống nhất",
          "Hỗ trợ hình thành cộng đồng cư dân",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Quy hoạch đồng bộ hạn chế tự phát, tạo môi trường thống nhất và cộng đồng cư dân."
      },
      {
        "n": 112,
        "q": "Yếu tố nào quyết định khả năng hình thành cộng đồng cư dân chất lượng?",
        "options": [
          "Hệ thống tiện ích",
          "Môi trường sống",
          "Dịch vụ quản lý",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Cộng đồng chất lượng cần cả tiện ích, môi trường sống và dịch vụ quản lý."
      },
      {
        "n": 113,
        "q": "Đâu là điểm quan trọng khi nghiên cứu vị trí một căn biệt thự ven sông?",
        "options": [
          "Tầm nhìn",
          "Hướng tiếp cận",
          "Khoảng cách tới tiện ích",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Biệt thự ven sông cần xem tầm nhìn, hướng tiếp cận và khoảng cách tới tiện ích."
      },
      {
        "n": 114,
        "q": "Khi khách hàng đánh giá một khu đô thị cao cấp, điều gì thường được quan tâm?",
        "options": [
          "Chất lượng sản phẩm",
          "Không gian sống",
          "Hệ sinh thái tiện ích",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Khách cao cấp quan tâm cả chất lượng sản phẩm, không gian sống và hệ sinh thái tiện ích."
      },
      {
        "n": 115,
        "q": "Giá trị thương hiệu Vinhomes có thể hỗ trợ dự án ở khía cạnh nào?",
        "options": [
          "Nhận diện thương hiệu",
          "Khả năng thu hút khách hàng",
          "Niềm tin vào hệ sinh thái và dịch vụ",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Thương hiệu Vinhomes hỗ trợ cả nhận diện, thu hút khách và niềm tin vào dịch vụ."
      }
    ]
  },
  {
    "id": "p10",
    "title": "Phần 10 — Hạ tầng và kết nối",
    "range": "116–130",
    "questions": [
      {
        "n": 116,
        "q": "Cầu Hoàng Gia có vai trò quan trọng nhất đối với Vũ Yên là gì?",
        "options": [
          "Tăng cường kết nối đảo với khu vực đô thị Hải Phòng",
          "Kết nối Hải Phòng với Hà Nội",
          "Kết nối Hải Phòng với Thái Bình",
          "Kết nối Hải Phòng với sân bay Nội Bài"
        ],
        "answer": 0,
        "explain": "Cầu Hoàng Gia là tuyến kết nối chính giữa đảo Vũ Yên với đô thị Hải Phòng."
      },
      {
        "n": 117,
        "q": "Cầu Hoàng Gia chính thức khánh thành vào thời điểm nào?",
        "options": [
          "Tháng 1/2024",
          "Tháng 7/2024",
          "Tháng 8/2025",
          "Tháng 1/2026"
        ],
        "answer": 2,
        "explain": "Cầu Hoàng Gia khánh thành tháng 8/2025. Lưu ý: đáp án này chỉ mang tính tham khảo, cần kiểm tra lại.",
        "ref": true
      },
      {
        "n": 118,
        "q": "Cầu Máy Chai có ý nghĩa gì đối với kết nối khu vực?",
        "options": [
          "Hỗ trợ kết nối khu vực đảo Vũ Yên với mạng lưới giao thông đô thị",
          "Kết nối trực tiếp với Cát Bà",
          "Kết nối với Hà Nội",
          "Kết nối với sân bay Nội Bài"
        ],
        "answer": 0,
        "explain": "Cầu Máy Chai hỗ trợ kết nối đảo Vũ Yên với mạng lưới giao thông đô thị."
      },
      {
        "n": 119,
        "q": "Khi một cây cầu mới được đưa vào khai thác, lợi ích trực tiếp là gì?",
        "options": [
          "Cải thiện khả năng tiếp cận",
          "Mở rộng lựa chọn tuyến đường",
          "Hỗ trợ phát triển đô thị hai bên kết nối",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Cầu mới cải thiện tiếp cận, mở thêm tuyến đường và thúc đẩy đô thị hai bên."
      },
      {
        "n": 120,
        "q": "Sân bay Cát Bi có vai trò gì đối với dự án?",
        "options": [
          "Kết nối hàng không nội địa và quốc tế",
          "Trung tâm thương mại",
          "Cảng biển quốc tế",
          "Khu công nghiệp"
        ],
        "answer": 0,
        "explain": "Sân bay Cát Bi kết nối hàng không nội địa và quốc tế cho cư dân và khách."
      },
      {
        "n": 121,
        "q": "Hệ thống cảng biển Hải Phòng có thể tạo động lực phát triển nào?",
        "options": [
          "Thương mại",
          "Logistics",
          "Thu hút đầu tư và chuyên gia",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Cảng biển Hải Phòng thúc đẩy thương mại, logistics và thu hút đầu tư, chuyên gia."
      },
      {
        "n": 122,
        "q": "Khi tư vấn khoảng cách từ Royal Island tới một địa điểm, cách làm nào chính xác nhất?",
        "options": [
          "Tự ước lượng",
          "Lấy khoảng cách đường chim bay làm thời gian di chuyển",
          "Kiểm tra tuyến đường thực tế và thời gian theo phương tiện",
          "Cam kết thời gian cố định"
        ],
        "answer": 2,
        "explain": "Tư vấn khoảng cách phải dựa trên tuyến đường thực tế và thời gian theo phương tiện."
      },
      {
        "n": 123,
        "q": "Kết nối với cao tốc Hà Nội – Hải Phòng có ý nghĩa gì?",
        "options": [
          "Hỗ trợ giao thương liên vùng",
          "Thuận tiện cho khách từ Hà Nội",
          "Mở rộng khả năng tiếp cận thị trường",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Cao tốc Hà Nội – Hải Phòng hỗ trợ giao thương liên vùng và khách từ Hà Nội."
      },
      {
        "n": 124,
        "q": "Vị trí gần trung tâm hành chính mới Thủy Nguyên có thể mang lại lợi ích nào?",
        "options": [
          "Thu hút nhu cầu nhà ở",
          "Thu hút chuyên gia và lao động chất lượng cao",
          "Thúc đẩy dịch vụ đô thị",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Gần trung tâm hành chính mới Thủy Nguyên thu hút nhu cầu ở, chuyên gia và dịch vụ."
      },
      {
        "n": 125,
        "q": "Yếu tố nào có thể ảnh hưởng đến giá trị bất động sản khi hạ tầng giao thông phát triển?",
        "options": [
          "Thời gian di chuyển",
          "Khả năng kết nối",
          "Nhu cầu sử dụng và khai thác",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Hạ tầng tốt rút ngắn thời gian di chuyển, tăng kết nối và nhu cầu sử dụng."
      },
      {
        "n": 126,
        "q": "Đâu là phương tiện phù hợp với lợi thế khai thác bến du thuyền?",
        "options": [
          "Du thuyền",
          "Tàu trải nghiệm đường thủy",
          "Phương tiện du lịch đường sông phù hợp",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Bến du thuyền khai thác du thuyền, tàu trải nghiệm và du lịch đường sông."
      },
      {
        "n": 127,
        "q": "Khi hạ tầng kết nối chưa hoàn thành, sale nên làm gì?",
        "options": [
          "Cam kết đã hoàn thành",
          "Phân biệt rõ hạng mục đã hoàn thành, đang thi công và quy hoạch",
          "Không cần đề cập",
          "Tự dự đoán thời gian"
        ],
        "answer": 1,
        "explain": "Sale phải phân biệt rõ hạng mục đã xong, đang thi công và quy hoạch — không cam kết bừa."
      },
      {
        "n": 128,
        "q": "Tại sao khách hàng mua nhà cần quan tâm đến khả năng kết nối?",
        "options": [
          "Phục vụ công việc",
          "Phục vụ học tập",
          "Phục vụ sinh hoạt và giao thương",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Kết nối tốt phục vụ cả công việc, học tập, sinh hoạt và giao thương."
      },
      {
        "n": 129,
        "q": "Yếu tố nào phản ánh chất lượng kết nối giao thông của một khu đô thị?",
        "options": [
          "Số lượng tuyến đường",
          "Khả năng kết nối với các trung tâm kinh tế",
          "Thời gian di chuyển thực tế",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Chất lượng kết nối thể hiện ở số tuyến, kết nối trung tâm kinh tế và thời gian thực tế."
      },
      {
        "n": 130,
        "q": "Cách tư vấn tốt nhất về lợi thế hạ tầng là gì?",
        "options": [
          "Chỉ liệt kê tên các cây cầu",
          "Phân tích tác động thực tế của từng tuyến kết nối tới nhu cầu sống và đầu tư",
          "Chỉ nói giá sẽ tăng",
          "Không cần quan tâm tiến độ"
        ],
        "answer": 1,
        "explain": "Tư vấn hạ tầng tốt là phân tích tác động thực tế tới nhu cầu sống và đầu tư."
      }
    ]
  },
  {
    "id": "p11",
    "title": "Phần 11 — Phân khu và sản phẩm chuyên sâu",
    "range": "131–140",
    "questions": [
      {
        "n": 131,
        "q": "Phân khu Golf Land có lợi thế nổi bật nào?",
        "options": [
          "Nằm cạnh khu công nghiệp",
          "Có nhiều sản phẩm hướng tầm nhìn sân golf và hồ cảnh quan",
          "Chỉ có nhà liền kề",
          "Không có tiện ích nội khu"
        ],
        "answer": 1,
        "explain": "Golf Land nổi bật với nhiều sản phẩm hướng tầm nhìn sân golf và hồ cảnh quan."
      },
      {
        "n": 132,
        "q": "Diện tích biệt thự song lập tại Golf Land theo thông tin giới thiệu là khoảng bao nhiêu?",
        "options": [
          "90–150 m²",
          "180–269 m²",
          "270–419 m²",
          "450–600 m²"
        ],
        "answer": 1,
        "explain": "Biệt thự song lập tại Golf Land được giới thiệu khoảng 180–269 m² — số liệu tham khảo, cần kiểm tra lại."
      },
      {
        "n": 133,
        "q": "Diện tích biệt thự đơn lập tại Golf Land theo thông tin giới thiệu là khoảng bao nhiêu?",
        "options": [
          "90–150 m²",
          "180–269 m²",
          "270–419,4 m²",
          "500–700 m²"
        ],
        "answer": 2,
        "explain": "Biệt thự đơn lập tại Golf Land được giới thiệu khoảng 270–419,4 m² — số liệu tham khảo, cần kiểm tra lại."
      },
      {
        "n": 134,
        "q": "Diện tích shophouse tại Golf Land theo thông tin giới thiệu là khoảng bao nhiêu?",
        "options": [
          "50–80 m²",
          "90–211,2 m²",
          "250–300 m²",
          "300–500 m²"
        ],
        "answer": 1,
        "explain": "Shophouse tại Golf Land được giới thiệu khoảng 90–211,2 m² — số liệu tham khảo, cần kiểm tra lại."
      },
      {
        "n": 135,
        "q": "Phân khu Hoàng Gia có vị trí nổi bật tiếp giáp dòng sông nào?",
        "options": [
          "Sông Hồng",
          "Sông Ruột Lợn",
          "Sông Đà",
          "Sông Lô"
        ],
        "answer": 1,
        "explain": "Phân khu Hoàng Gia tiếp giáp sông Ruột Lợn."
      },
      {
        "n": 136,
        "q": "Phân khu Đảo Vua có tiện ích độc quyền nào được giới thiệu trên website dự án?",
        "options": [
          "Ngự Hoa Viên",
          "Hồ cá Koi",
          "Đồi yến tiệc",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Đảo Vua có cả Ngự Hoa Viên, hồ cá Koi và đồi yến tiệc."
      },
      {
        "n": 137,
        "q": "Phân khu Hoàng Gia có những loại hình sản phẩm nào?",
        "options": [
          "Biệt thự song lập",
          "Biệt thự đơn lập",
          "Liền kề và shophouse",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Hoàng Gia có cả biệt thự song lập, đơn lập, liền kề và shophouse."
      },
      {
        "n": 138,
        "q": "Khu Tài Lộc được định vị nổi bật với đặc điểm nào?",
        "options": [
          "Tâm điểm các hoạt động văn hóa, mua sắm, ẩm thực và giải trí",
          "Chỉ phục vụ nghỉ dưỡng biệt lập",
          "Chỉ phát triển biệt thự đơn lập",
          "Khu sản xuất công nghiệp"
        ],
        "answer": 0,
        "explain": "Khu Tài Lộc là tâm điểm văn hóa, mua sắm, ẩm thực và giải trí."
      },
      {
        "n": 139,
        "q": "Phân khu Miyabi và Komorebi được giới thiệu thuộc nhóm sản phẩm nào?",
        "options": [
          "Biệt thự thuộc dự án Royal Island",
          "Căn hộ chung cư",
          "Nhà ở xã hội",
          "Nhà xưởng thương mại"
        ],
        "answer": 0,
        "explain": "Miyabi và Komorebi là dòng biệt thự thuộc Royal Island."
      },
      {
        "n": 140,
        "q": "Khi lựa chọn căn biệt thự tại Golf Land, khách hàng nên quan tâm điều gì?",
        "options": [
          "Tầm nhìn sân golf",
          "Khoảng cách tới tiện ích",
          "Diện tích và thiết kế căn nhà",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Chọn biệt thự Golf Land cần xem tầm nhìn golf, khoảng cách tiện ích và diện tích, thiết kế."
      }
    ]
  },
  {
    "id": "p12",
    "title": "Phần 12 — Tiện ích độc bản",
    "range": "141–150",
    "questions": [
      {
        "n": 141,
        "q": "Sân golf tại Vinhomes Royal Island có quy mô diện tích được giới thiệu khoảng bao nhiêu?",
        "options": [
          "60 ha",
          "100 ha",
          "160 ha",
          "250 ha"
        ],
        "answer": 2,
        "explain": "Sân golf được giới thiệu rộng khoảng 160 ha — số liệu tham khảo, cần kiểm tra lại."
      },
      {
        "n": 142,
        "q": "Sân golf tại dự án được giới thiệu gồm hai phong cách địa hình chính nào?",
        "options": [
          "Núi và biển",
          "Đầm lầy tự nhiên và hồ",
          "Rừng và sa mạc",
          "Đồi và đồng bằng"
        ],
        "answer": 1,
        "explain": "Sân golf có hai phong cách địa hình chính là đầm lầy tự nhiên và hồ."
      },
      {
        "n": 143,
        "q": "Số hố golf được giới thiệu có hệ thống chiếu sáng phục vụ chơi ban đêm là bao nhiêu?",
        "options": [
          "9 hố",
          "18 hố",
          "27 hố",
          "36 hố"
        ],
        "answer": 2,
        "explain": "Sân golf có 27 hố được chiếu sáng để chơi ban đêm — số liệu tham khảo, cần kiểm tra lại."
      },
      {
        "n": 144,
        "q": "Clubhouse sân golf được giới thiệu có quy mô khoảng bao nhiêu locker?",
        "options": [
          "100 locker",
          "200 locker",
          "300 locker",
          "500 locker"
        ],
        "answer": 2,
        "explain": "Clubhouse sân golf được giới thiệu khoảng 300 locker — số liệu tham khảo, cần kiểm tra lại."
      },
      {
        "n": 145,
        "q": "Bến du thuyền cao cấp của dự án được giới thiệu có quy mô lên tới bao nhiêu?",
        "options": [
          "2 ha",
          "5 ha",
          "10 ha",
          "20 ha"
        ],
        "answer": 1,
        "explain": "Bến du thuyền cao cấp được giới thiệu quy mô lên tới 5 ha — số liệu tham khảo, cần kiểm tra lại."
      },
      {
        "n": 146,
        "q": "Tháp Mặt Trời tại quảng trường Royal Square có chiều cao được giới thiệu khoảng bao nhiêu?",
        "options": [
          "25 m",
          "35 m",
          "45 m",
          "60 m"
        ],
        "answer": 2,
        "explain": "Tháp Mặt Trời tại quảng trường Royal Square cao khoảng 45 m — số liệu tham khảo, cần kiểm tra lại."
      },
      {
        "n": 147,
        "q": "Công viên văn hóa Hàn Quốc tại dự án có tên gọi là gì?",
        "options": [
          "K-Park",
          "K-Land",
          "Seoul Park",
          "Korea Royal"
        ],
        "answer": 0,
        "explain": "Công viên văn hóa Hàn Quốc có tên K-Park."
      },
      {
        "n": 148,
        "q": "River Walk được định hướng là loại hình không gian nào?",
        "options": [
          "Phố đi bộ ven sông",
          "Khu công nghiệp",
          "Trung tâm hành chính",
          "Khu nhà xưởng"
        ],
        "answer": 0,
        "explain": "River Walk là phố đi bộ ven sông."
      },
      {
        "n": 149,
        "q": "VinWonders Royal Park có điểm nhấn nào được giới thiệu?",
        "options": [
          "Khu vui chơi giải trí gia đình",
          "Safari thú độc đáo",
          "Vườn cổ tích và trò chơi trẻ em",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "VinWonders Royal Park có cả khu vui chơi gia đình, safari thú và vườn cổ tích, trò chơi trẻ em."
      },
      {
        "n": 150,
        "q": "Học viện cưỡi ngựa Vinpearl Horse Academy hướng tới trải nghiệm nào?",
        "options": [
          "Đua xe thể thao",
          "Đào tạo và trải nghiệm bộ môn cưỡi ngựa",
          "Lặn biển",
          "Leo núi"
        ],
        "answer": 1,
        "explain": "Vinpearl Horse Academy đào tạo và mang lại trải nghiệm cưỡi ngựa."
      }
    ]
  },
  {
    "id": "p13",
    "title": "Phần 13 — Kiến trúc và không gian sống",
    "range": "151–160",
    "questions": [
      {
        "n": 151,
        "q": "Một căn biệt thự có 4 mặt thoáng thường thuộc loại hình nào?",
        "options": [
          "Biệt thự đơn lập",
          "Nhà liền kề",
          "Shophouse",
          "Căn hộ chung cư"
        ],
        "answer": 0,
        "explain": "Biệt thự đơn lập có 4 mặt thoáng vì đứng độc lập, không chung tường với căn nào."
      },
      {
        "n": 152,
        "q": "Điểm khác biệt cơ bản giữa biệt thự song lập và đơn lập là gì?",
        "options": [
          "Đơn lập thường có 4 mặt thoáng, song lập thường ghép cặp",
          "Song lập luôn có 4 mặt thoáng",
          "Đơn lập luôn có diện tích nhỏ hơn",
          "Hai loại hình hoàn toàn giống nhau"
        ],
        "answer": 0,
        "explain": "Đơn lập có 4 mặt thoáng, song lập ghép cặp nên chung một phía tường."
      },
      {
        "n": 153,
        "q": "Yếu tố nào tạo nên giá trị của biệt thự ven sông?",
        "options": [
          "Tầm nhìn mặt nước",
          "Không gian cảnh quan",
          "Trải nghiệm sống gần thiên nhiên",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Biệt thự ven sông có giá trị nhờ tầm nhìn mặt nước, cảnh quan và trải nghiệm gần thiên nhiên."
      },
      {
        "n": 154,
        "q": "Tại sao căn biệt thự có tầm nhìn sân golf có thể được khách hàng đánh giá cao?",
        "options": [
          "Cảnh quan rộng và thoáng",
          "Tầm nhìn đặc trưng",
          "Giá trị trải nghiệm sống",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Tầm nhìn sân golf được đánh giá cao nhờ cảnh quan rộng thoáng, tầm nhìn đặc trưng và trải nghiệm sống."
      },
      {
        "n": 155,
        "q": "Khi đánh giá hướng nhà, yếu tố nào cần được xem xét?",
        "options": [
          "Hướng nắng",
          "Hướng gió",
          "Thói quen sinh hoạt của gia đình",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Đánh giá hướng nhà cần xem hướng nắng, hướng gió và thói quen sinh hoạt của gia đình."
      },
      {
        "n": 156,
        "q": "Nhà liền kề thường có đặc điểm nào?",
        "options": [
          "Các căn xây dựng liền nhau theo dãy",
          "Có 4 mặt thoáng hoàn toàn",
          "Chỉ được xây dựng trên đảo",
          "Luôn có sân golf phía sau"
        ],
        "answer": 0,
        "explain": "Nhà liền kề xây liền nhau thành dãy, chung tường hai bên."
      },
      {
        "n": 157,
        "q": "Không gian sân vườn riêng mang lại lợi ích nào?",
        "options": [
          "Tạo không gian thư giãn",
          "Có thể tổ chức sinh hoạt ngoài trời",
          "Tăng trải nghiệm riêng tư",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Sân vườn riêng vừa thư giãn, vừa sinh hoạt ngoài trời, vừa tăng riêng tư."
      },
      {
        "n": 158,
        "q": "Bể bơi bốn mùa mái kính pha lê tại Hoàng Gia có lợi thế nào?",
        "options": [
          "Tạo không gian bơi lội có mái che",
          "Tăng trải nghiệm tiện ích cao cấp",
          "Tạo điểm nhấn kiến trúc",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Bể bơi bốn mùa mái kính pha lê vừa có mái che, vừa là tiện ích cao cấp và điểm nhấn kiến trúc."
      },
      {
        "n": 159,
        "q": "Công viên nội khu đóng vai trò gì đối với cư dân?",
        "options": [
          "Không gian vận động",
          "Không gian thư giãn",
          "Không gian giao lưu cộng đồng",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Công viên nội khu là không gian vận động, thư giãn và giao lưu cộng đồng."
      },
      {
        "n": 160,
        "q": "Đâu là cách lựa chọn căn nhà phù hợp nhất với nhu cầu gia đình?",
        "options": [
          "Chỉ lựa chọn căn đắt nhất",
          "Cân đối diện tích, ngân sách, vị trí và mục đích sử dụng",
          "Chỉ lựa chọn căn có mặt tiền lớn",
          "Chọn theo lời giới thiệu của người khác mà không kiểm tra"
        ],
        "answer": 1,
        "explain": "Chọn nhà phù hợp phải cân đối diện tích, ngân sách, vị trí và mục đích sử dụng."
      }
    ]
  },
  {
    "id": "p14",
    "title": "Phần 14 — Pháp lý và quyền sở hữu",
    "range": "161–170",
    "questions": [
      {
        "n": 161,
        "q": "Quy hoạch chi tiết tỷ lệ 1/500 thể hiện nội dung nào?",
        "options": [
          "Ranh giới, tổ chức không gian và các chỉ tiêu quy hoạch chi tiết",
          "Chỉ thể hiện giá bán",
          "Chỉ thể hiện chính sách ngân hàng",
          "Chỉ thể hiện nội thất"
        ],
        "answer": 0,
        "explain": "Quy hoạch 1/500 thể hiện ranh giới, tổ chức không gian và các chỉ tiêu quy hoạch chi tiết."
      },
      {
        "n": 162,
        "q": "Sổ hồng của bất động sản có ý nghĩa gì?",
        "options": [
          "Chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất theo quy định",
          "Chỉ là phiếu đặt cọc",
          "Chỉ là hợp đồng quảng cáo",
          "Chỉ là giấy xác nhận thanh toán"
        ],
        "answer": 0,
        "explain": "Sổ hồng chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất theo quy định."
      },
      {
        "n": 163,
        "q": "Khách hàng muốn kiểm tra pháp lý một căn biệt thự cần xem gì?",
        "options": [
          "Hợp đồng mua bán",
          "Hồ sơ pháp lý liên quan đến quyền sử dụng đất và nhà ở",
          "Thông tin quy hoạch và nghĩa vụ tài chính liên quan",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Kiểm tra pháp lý cần xem hợp đồng mua bán, hồ sơ quyền sử dụng đất, nhà ở, quy hoạch và nghĩa vụ tài chính."
      },
      {
        "n": 164,
        "q": "Thời hạn sở hữu của một bất động sản cần căn cứ vào đâu?",
        "options": [
          "Lời giới thiệu của sale",
          "Hồ sơ pháp lý và quy định áp dụng cho sản phẩm",
          "Giá bán",
          "Diện tích căn nhà"
        ],
        "answer": 1,
        "explain": "Thời hạn sở hữu căn cứ vào hồ sơ pháp lý và quy định áp dụng cho sản phẩm."
      },
      {
        "n": 165,
        "q": "Khi khách hàng yêu cầu xem giấy phép xây dựng, sale cần làm gì?",
        "options": [
          "Cung cấp tài liệu chính xác theo phạm vi được phép",
          "Tự tạo tài liệu",
          "Gửi tài liệu của dự án khác",
          "Từ chối mọi yêu cầu"
        ],
        "answer": 0,
        "explain": "Sale cung cấp giấy phép xây dựng chính xác trong phạm vi được phép, không tự tạo tài liệu."
      },
      {
        "n": 166,
        "q": "Hợp đồng mua bán bất động sản có vai trò gì?",
        "options": [
          "Xác lập quyền và nghĩa vụ của các bên",
          "Thể hiện giá và phương thức thanh toán",
          "Quy định các điều khoản giao dịch",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Hợp đồng mua bán xác lập quyền, nghĩa vụ, giá, phương thức thanh toán và điều khoản giao dịch."
      },
      {
        "n": 167,
        "q": "Khi chuyển nhượng bất động sản, khách hàng cần kiểm tra điều gì?",
        "options": [
          "Điều kiện chuyển nhượng",
          "Tình trạng thanh toán",
          "Nghĩa vụ thuế, phí",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Chuyển nhượng cần kiểm tra điều kiện chuyển nhượng, tình trạng thanh toán và nghĩa vụ thuế, phí."
      },
      {
        "n": 168,
        "q": "Tại sao phải kiểm tra tình trạng thế chấp của bất động sản?",
        "options": [
          "Để xác định các ràng buộc liên quan đến tài sản",
          "Để biết màu sơn căn nhà",
          "Để xác định số lượng tiện ích",
          "Để xác định hướng gió"
        ],
        "answer": 0,
        "explain": "Kiểm tra thế chấp để xác định các ràng buộc pháp lý liên quan đến tài sản."
      },
      {
        "n": 169,
        "q": "Khi có thay đổi về chính sách pháp lý, nhân viên sale nên làm gì?",
        "options": [
          "Tiếp tục sử dụng thông tin cũ",
          "Cập nhật văn bản mới nhất và kiểm tra hiệu lực",
          "Tự suy luận",
          "Chỉ nghe thông tin từ khách hàng"
        ],
        "answer": 1,
        "explain": "Có thay đổi chính sách pháp lý thì cập nhật văn bản mới nhất và kiểm tra hiệu lực."
      },
      {
        "n": 170,
        "q": "Tài liệu nào có giá trị quan trọng nhất khi xác định quyền và nghĩa vụ của người mua?",
        "options": [
          "Bài đăng quảng cáo",
          "Tin nhắn môi giới",
          "Hợp đồng và hồ sơ pháp lý có liên quan",
          "Video giới thiệu dự án"
        ],
        "answer": 2,
        "explain": "Quyền và nghĩa vụ của người mua được xác định bằng hợp đồng và hồ sơ pháp lý liên quan."
      }
    ]
  },
  {
    "id": "p15",
    "title": "Phần 15 — Tài chính và chính sách bán hàng",
    "range": "171–185",
    "questions": [
      {
        "n": 171,
        "q": "Khi mua bất động sản, tổng giá trị đầu tư cần tính những khoản nào?",
        "options": [
          "Giá bán",
          "Thuế và phí",
          "Chi phí tài chính và các khoản phát sinh",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Tổng giá trị đầu tư gồm giá bán, thuế, phí, chi phí tài chính và các khoản phát sinh."
      },
      {
        "n": 172,
        "q": "Chính sách hỗ trợ lãi suất 0% có ý nghĩa gì?",
        "options": [
          "Khách hàng không cần thanh toán tiền nhà",
          "Khách hàng được hỗ trợ lãi vay theo điều kiện và thời hạn quy định",
          "Khách hàng được miễn toàn bộ thuế",
          "Khách hàng được tặng căn nhà"
        ],
        "answer": 1,
        "explain": "Hỗ trợ lãi suất 0% nghĩa là khách được hỗ trợ lãi vay theo điều kiện và thời hạn quy định, không phải không trả tiền nhà."
      },
      {
        "n": 173,
        "q": "Thanh toán sớm thường có thể mang lại lợi ích nào?",
        "options": [
          "Được hưởng chiết khấu theo chính sách",
          "Giảm chi phí lãi vay trong một số trường hợp",
          "Tối ưu dòng tiền nếu có đủ vốn",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Thanh toán sớm có thể được chiết khấu, giảm lãi vay và tối ưu dòng tiền nếu đủ vốn."
      },
      {
        "n": 174,
        "q": "Khi tư vấn khách hàng sử dụng đòn bẩy tài chính, cần phân tích điều gì?",
        "options": [
          "Thu nhập hàng tháng",
          "Khả năng trả nợ",
          "Lãi suất sau thời gian ưu đãi",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Tư vấn đòn bẩy tài chính phải phân tích thu nhập, khả năng trả nợ và lãi suất sau thời gian ưu đãi."
      },
      {
        "n": 175,
        "q": "Khách hàng sử dụng vốn vay 50% giá trị bất động sản cần quan tâm điều gì nhất?",
        "options": [
          "Khả năng trả nợ gốc và lãi",
          "Màu sắc căn nhà",
          "Số lượng nhân viên kinh doanh",
          "Chiều cao cổng chào"
        ],
        "answer": 0,
        "explain": "Vay 50% giá trị nhà thì quan trọng nhất là khả năng trả nợ gốc và lãi."
      },
      {
        "n": 176,
        "q": "Chiết khấu thanh toán sớm được tính dựa trên yếu tố nào?",
        "options": [
          "Chính sách bán hàng áp dụng",
          "Tiến độ thanh toán",
          "Giá trị và tỷ lệ thanh toán đủ điều kiện",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Chiết khấu thanh toán sớm dựa trên chính sách, tiến độ thanh toán và giá trị, tỷ lệ đủ điều kiện."
      },
      {
        "n": 177,
        "q": "Cam kết tiền thuê trong chính sách bán hàng cần được hiểu như thế nào?",
        "options": [
          "Là khoản thu nhập vô điều kiện vĩnh viễn",
          "Là chính sách có điều kiện, thời hạn và phạm vi áp dụng cụ thể",
          "Là cam kết tăng giá bất động sản",
          "Là khoản miễn phí quản lý"
        ],
        "answer": 1,
        "explain": "Cam kết tiền thuê là chính sách có điều kiện, thời hạn và phạm vi áp dụng cụ thể, không phải thu nhập vĩnh viễn."
      },
      {
        "n": 178,
        "q": "Khi so sánh hai phương án thanh toán, sale cần tính toán gì?",
        "options": [
          "Số tiền phải trả từng đợt",
          "Mức chiết khấu",
          "Chi phí vốn và dòng tiền",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "So sánh phương án thanh toán cần tính số tiền từng đợt, chiết khấu và chi phí vốn, dòng tiền."
      },
      {
        "n": 179,
        "q": "Giá trị chiết khấu thực tế được xác định như thế nào?",
        "options": [
          "Lấy giá bán nhân với tỷ lệ chiết khấu đủ điều kiện",
          "Lấy giá bán cộng tỷ lệ chiết khấu",
          "Lấy giá bán trừ tiền đặt cọc",
          "Lấy giá bán chia cho số tháng"
        ],
        "answer": 0,
        "explain": "Chiết khấu thực tế = giá bán × tỷ lệ chiết khấu đủ điều kiện."
      },
      {
        "n": 180,
        "q": "Khách hàng có dòng tiền không ổn định nên ưu tiên phương án nào?",
        "options": [
          "Vay tối đa",
          "Thanh toán toàn bộ ngay lập tức",
          "Phương án có tiến độ thanh toán phù hợp năng lực tài chính",
          "Chọn căn có giá cao nhất"
        ],
        "answer": 2,
        "explain": "Dòng tiền không ổn định nên chọn phương án có tiến độ thanh toán phù hợp năng lực tài chính."
      },
      {
        "n": 181,
        "q": "Khi tư vấn chính sách bán hàng, sale cần lưu ý điều gì?",
        "options": [
          "Thời hạn áp dụng",
          "Điều kiện hưởng ưu đãi",
          "Các khoản không được tính vào ưu đãi",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Tư vấn chính sách bán hàng phải lưu ý thời hạn, điều kiện hưởng ưu đãi và các khoản không được tính."
      },
      {
        "n": 182,
        "q": "Tỷ suất lợi nhuận cho thuê bất động sản thường được tính bằng công thức nào?",
        "options": [
          "Thu nhập cho thuê năm / Tổng vốn đầu tư × 100%",
          "Giá bán / Tiền đặt cọc",
          "Thu nhập tháng / Số phòng",
          "Giá bán × 12"
        ],
        "answer": 0,
        "explain": "Tỷ suất lợi nhuận cho thuê = thu nhập cho thuê năm / tổng vốn đầu tư × 100%."
      },
      {
        "n": 183,
        "q": "Khi tính lợi nhuận cho thuê thực tế, cần trừ những khoản nào?",
        "options": [
          "Chi phí quản lý",
          "Chi phí bảo trì và sửa chữa",
          "Thời gian trống phòng và các chi phí liên quan",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Lợi nhuận cho thuê thực tế phải trừ chi phí quản lý, bảo trì, sửa chữa và thời gian trống phòng."
      },
      {
        "n": 184,
        "q": "Tại sao khách hàng cần xem xét lãi suất sau thời gian ưu đãi?",
        "options": [
          "Vì lãi suất có thể thay đổi theo điều khoản vay",
          "Vì ảnh hưởng đến nghĩa vụ trả nợ",
          "Vì ảnh hưởng đến hiệu quả đầu tư",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Lãi suất sau ưu đãi có thể thay đổi, ảnh hưởng nghĩa vụ trả nợ và hiệu quả đầu tư."
      },
      {
        "n": 185,
        "q": "Khi khách hàng hỏi về lợi nhuận đầu tư, sale nên đưa ra thông tin nào?",
        "options": [
          "Kịch bản tích cực",
          "Kịch bản cơ sở",
          "Kịch bản thận trọng và rủi ro",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Tư vấn lợi nhuận đầu tư nên đưa cả ba kịch bản: tích cực, cơ sở và thận trọng kèm rủi ro."
      }
    ]
  },
  {
    "id": "p16",
    "title": "Phần 16 — Kỹ năng bán hàng thực chiến",
    "range": "186–200",
    "questions": [
      {
        "n": 186,
        "q": "Khách hàng nói: \"Tôi chưa hiểu tại sao phải mua Vũ Yên\". Sale nên làm gì?",
        "options": [
          "Gửi ngay bảng giá",
          "Tìm hiểu nhu cầu và phân tích lợi thế phù hợp với khách hàng",
          "Thúc ép đặt cọc",
          "Nói rằng dự án sắp hết hàng"
        ],
        "answer": 1,
        "explain": "Khách chưa hiểu vì sao mua Vũ Yên thì tìm hiểu nhu cầu rồi phân tích lợi thế phù hợp với họ."
      },
      {
        "n": 187,
        "q": "Khách hàng có ngân sách 15 tỷ đồng muốn mua biệt thự. Bước đầu tiên cần làm là gì?",
        "options": [
          "Chọn ngay căn đắt nhất",
          "Xác định nhu cầu, ngân sách thực tế và phương án thanh toán",
          "Yêu cầu khách vay thêm",
          "Chỉ giới thiệu căn có hoa hồng cao"
        ],
        "answer": 1,
        "explain": "Ngân sách 15 tỷ thì bước đầu là xác định nhu cầu, ngân sách thực tế và phương án thanh toán."
      },
      {
        "n": 188,
        "q": "Khách hàng muốn mua nhà để bố mẹ nghỉ dưỡng. Yếu tố nào cần ưu tiên?",
        "options": [
          "Không gian yên tĩnh",
          "Cảnh quan và tiện ích thư giãn",
          "Khả năng tiếp cận y tế",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Mua nhà cho bố mẹ nghỉ dưỡng thì ưu tiên cả không gian yên tĩnh, cảnh quan, tiện ích thư giãn và tiếp cận y tế."
      },
      {
        "n": 189,
        "q": "Khách hàng mua bất động sản để cho thuê. Sale nên phân tích điều gì?",
        "options": [
          "Nhu cầu thuê",
          "Giá thuê thực tế",
          "Chi phí vận hành và khả năng khai thác",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Mua để cho thuê thì phân tích nhu cầu thuê, giá thuê thực tế, chi phí vận hành và khả năng khai thác."
      },
      {
        "n": 190,
        "q": "Khi khách hàng nói: \"Tôi cần suy nghĩ thêm\", cách xử lý phù hợp là gì?",
        "options": [
          "Gọi điện liên tục gây áp lực",
          "Tìm hiểu vấn đề khách hàng còn băn khoăn và cung cấp thông tin hỗ trợ",
          "Ngừng chăm sóc ngay",
          "Tự giảm giá mà không có căn cứ"
        ],
        "answer": 1,
        "explain": "Khách cần suy nghĩ thêm thì tìm hiểu điều họ còn băn khoăn và cung cấp thông tin hỗ trợ, không gây áp lực."
      },
      {
        "n": 191,
        "q": "Khách hàng so sánh Royal Island với một dự án khác. Sale nên làm gì?",
        "options": [
          "Chê bai dự án đối thủ",
          "So sánh khách quan về vị trí, sản phẩm, tiện ích, giá và pháp lý",
          "Khẳng định dự án đối thủ không có giá trị",
          "Tránh mọi câu hỏi"
        ],
        "answer": 1,
        "explain": "So sánh với dự án khác thì so sánh khách quan về vị trí, sản phẩm, tiện ích, giá và pháp lý."
      },
      {
        "n": 192,
        "q": "Khi khách hàng yêu cầu xem nhà thực tế, sale cần chuẩn bị gì?",
        "options": [
          "Lịch tham quan",
          "Thông tin căn cụ thể",
          "Hồ sơ và tài liệu giới thiệu",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Dẫn khách xem nhà thực tế cần chuẩn bị lịch tham quan, thông tin căn cụ thể và hồ sơ, tài liệu giới thiệu."
      },
      {
        "n": 193,
        "q": "Khách hàng muốn xem một căn cụ thể nhưng căn đó đã được giao dịch. Sale nên làm gì?",
        "options": [
          "Vẫn quảng cáo căn đó còn hàng",
          "Thông báo tình trạng chính xác và đề xuất căn thay thế phù hợp",
          "Không trả lời",
          "Yêu cầu khách chuyển tiền ngay"
        ],
        "answer": 1,
        "explain": "Căn khách muốn xem đã bán thì thông báo đúng tình trạng và đề xuất căn thay thế phù hợp."
      },
      {
        "n": 194,
        "q": "Điều gì giúp khách hàng tin tưởng một nhân viên tư vấn?",
        "options": [
          "Thông tin minh bạch",
          "Kiến thức chuyên môn",
          "Thái độ chuyên nghiệp và trách nhiệm",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Khách tin tưởng sale nhờ thông tin minh bạch, kiến thức chuyên môn và thái độ chuyên nghiệp, trách nhiệm."
      },
      {
        "n": 195,
        "q": "Khi khách hàng hỏi về một tiện ích chưa hoàn thành, sale nên trả lời thế nào?",
        "options": [
          "Nói đã hoàn thành",
          "Phân biệt rõ tình trạng hiện tại và kế hoạch triển khai",
          "Cam kết hoàn thành trong tháng",
          "Không cần cung cấp thông tin"
        ],
        "answer": 1,
        "explain": "Tiện ích chưa hoàn thành thì phân biệt rõ tình trạng hiện tại và kế hoạch triển khai, không nói đã xong."
      },
      {
        "n": 196,
        "q": "Trong quá trình chăm sóc khách hàng, CRM có vai trò gì?",
        "options": [
          "Quản lý thông tin khách hàng",
          "Theo dõi lịch sử tương tác",
          "Quản lý cơ hội bán hàng",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "CRM quản lý thông tin khách hàng, theo dõi lịch sử tương tác và quản lý cơ hội bán hàng."
      },
      {
        "n": 197,
        "q": "Khi khách hàng có nhu cầu đầu tư dài hạn, sale cần tập trung vào điều gì?",
        "options": [
          "Quy hoạch và tầm nhìn phát triển",
          "Giá trị sử dụng",
          "Khả năng khai thác và thanh khoản",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Đầu tư dài hạn thì tập trung quy hoạch, tầm nhìn phát triển, giá trị sử dụng, khai thác và thanh khoản."
      },
      {
        "n": 198,
        "q": "Khách hàng hỏi về khả năng thanh khoản của một căn biệt thự. Yếu tố nào cần phân tích?",
        "options": [
          "Vị trí",
          "Mức giá so với thị trường",
          "Nhu cầu mua bán và đặc điểm sản phẩm",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Thanh khoản biệt thự phụ thuộc vị trí, mức giá so với thị trường, nhu cầu mua bán và đặc điểm sản phẩm."
      },
      {
        "n": 199,
        "q": "Đâu là sai lầm nghiêm trọng nhất khi tư vấn bất động sản?",
        "options": [
          "Chưa thuộc hết tên các phân khu",
          "Cung cấp thông tin sai lệch hoặc cam kết không có căn cứ",
          "Chưa biết hết các tuyến đường",
          "Chưa biết hết các tiện ích"
        ],
        "answer": 1,
        "explain": "Sai lầm nghiêm trọng nhất là cung cấp thông tin sai lệch hoặc cam kết không có căn cứ."
      },
      {
        "n": 200,
        "q": "Một nhân viên sale chuyên nghiệp cần đạt được điều gì?",
        "options": [
          "Hiểu sâu dự án",
          "Phân tích được tài chính và sản phẩm",
          "Tư vấn đúng nhu cầu và minh bạch thông tin",
          "Cả A, B và C"
        ],
        "answer": 3,
        "explain": "Sale chuyên nghiệp phải hiểu sâu dự án, phân tích được tài chính, sản phẩm và tư vấn đúng nhu cầu, minh bạch thông tin."
      }
    ]
  }
];
// ---- Đố vui bất động sản: 9 phần, 112 câu (12 câu mở đầu + 100 câu 101–200) ----
// QUIZ_SECTIONS: [{id, title, range, questions: [{n, q, options, answer, explain, ref?}]}]
// ref: true = đáp án "tham khảo", chỉ câu 117 (ngày khánh thành Cầu Hoàng Gia).
// Các câu số liệu dự án (132–134, 141, 143–146) dùng bảng đáp án của Emma —
// các số liệu này vẫn cần Emma kiểm tra lại trước khi dùng để tư vấn khách thật.
// Bảng đáp án 131–200 của Emma bị lệch ở 26 câu, đã sửa theo nội dung câu hỏi:
// 153, 154, 155, 157, 159, 160, 161, 162, 163, 164, 166, 167, 168, 169, 172,
// 174, 175, 179, 180, 181, 182, 186, 190, 191, 194, 195 (xem quiz100-data.js).
let quizSection = null, quizIdx = 0, quizAnswered = false, quizScore = 0;
const quizSectionState = {}; // id -> {correct, total, completed, best}
function openQuiz() {
  $('quizPanel').classList.remove('hidden');
  renderQuizSections();
}
function renderQuizSections() {
  quizSection = null;
  $('quizSections').classList.remove('hidden');
  $('quizGame').classList.add('hidden');
  $('quizBack').classList.add('hidden');
  $('quizNext').classList.add('hidden');
  $('quizProgress').textContent = 'Chọn một phần để làm';
  const box = $('quizSections');
  box.innerHTML = '';
  QUIZ_SECTIONS.forEach((s) => {
    const st = quizSectionState[s.id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dlg-quest';
    b.innerHTML = '<b>' + escapeHtml(s.title) + '</b> — Câu ' + s.range + ' • ' + s.questions.length + ' câu'
      + (st && st.completed ? ' • ✅ Đã xong (đúng nhất: ' + st.best + '/' + st.total + ')' : '');
    b.onclick = () => startQuizSection(s.id);
    box.appendChild(b);
  });
}
function startQuizSection(id) {
  quizSection = QUIZ_SECTIONS.find((s) => s.id === id);
  if (!quizSection) return;
  quizIdx = 0;
  quizScore = 0;
  $('quizSections').classList.add('hidden');
  $('quizGame').classList.remove('hidden');
  $('quizBack').classList.remove('hidden');
  $('quizNext').onclick = quizNextHandler;
  showQuizQuestion();
}
function showQuizQuestion() {
  const qq = quizSection.questions[quizIdx];
  quizAnswered = false;
  $('quizProgress').textContent = quizSection.title + ' • Câu ' + (quizIdx + 1) + '/' + quizSection.questions.length;
  $('quizScore').textContent = quizScore;
  $('quizQuestion').textContent = 'Câu ' + qq.n + '. ' + qq.q;
  $('quizRefNote').classList.toggle('hidden', !qq.ref);
  const fb = $('quizFeedback');
  fb.textContent = '';
  fb.className = 'quiz-feedback';
  $('quizNext').textContent = 'Câu tiếp theo →';
  $('quizNext').classList.add('hidden');
  const box = $('quizOptions');
  box.innerHTML = '';
  qq.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dlg-quest';
    b.innerHTML = '<b>' + 'ABCD'[i] + '.</b> ' + escapeHtml(opt);
    b.onclick = () => answerQuiz(i, b);
    box.appendChild(b);
  });
}
function answerQuiz(i, btn) {
  if (quizAnswered) return;
  quizAnswered = true;
  const qq = quizSection.questions[quizIdx];
  const fb = $('quizFeedback');
  const btns = document.querySelectorAll('#quizOptions .dlg-quest');
  btns.forEach((b, j) => { b.disabled = true; if (j === qq.answer) b.classList.add('correct'); });
  const refTag = qq.ref ? ' (đáp án tham khảo — chờ kiểm tra lại)' : '';
  if (i === qq.answer) {
    quizScore += 1;
    myActions.quiz = (myActions.quiz || 0) + 1;
    merit += 5;
    xp += 10;
    updateMeritUI();
    scheduleProfileSave();
    btn.classList.add('correct');
    fb.textContent = '✅ Đúng rồi! +5 công đức, +10 điểm kinh nghiệm. ' + qq.explain + refTag;
    fb.className = 'quiz-feedback good';
    checkQuestProgress();
  } else {
    btn.classList.add('wrong');
    fb.textContent = '❌ Chưa đúng. Đáp án đúng: ' + 'ABCD'[qq.answer] + '. ' + qq.explain + refTag;
    fb.className = 'quiz-feedback bad';
  }
  $('quizScore').textContent = quizScore;
  $('quizNext').classList.remove('hidden');
  renderQuestPanel();
}
function completeQuizSection() {
  const total = quizSection.questions.length;
  const perfect = quizScore === total;
  let bonus = 10;
  if (perfect) bonus += 10;
  merit += bonus;
  updateMeritUI();
  scheduleProfileSave();
  const st = quizSectionState[quizSection.id] || { correct: 0, total, completed: false, best: 0 };
  st.correct = quizScore;
  st.completed = true;
  st.best = Math.max(st.best || 0, quizScore);
  quizSectionState[quizSection.id] = st;
  $('quizQuestion').textContent = '🎉 Hoàn thành ' + quizSection.title + '! Bạn trả lời đúng ' + quizScore + '/' + total + ' câu.'
    + (perfect ? ' Làm đúng hết — quá xuất sắc!' : '');
  $('quizOptions').innerHTML = '';
  const fb = $('quizFeedback');
  fb.textContent = '🏆 +' + bonus + ' công đức vì đã hoàn thành phần này' + (perfect ? ' (thưởng thêm 10 vì làm đúng hết)' : '')
    + '. Danh hiệu hiện tại của bạn: ' + titleForMerit(merit) + '.';
  fb.className = 'quiz-feedback good';
  $('quizNext').textContent = '← Chọn phần khác';
  $('quizNext').classList.remove('hidden');
  $('quizNext').onclick = renderQuizSections;
  showToast('🎉 Hoàn thành ' + quizSection.title + ' • +' + bonus + ' công đức!');
}
function quizNextHandler() {
  quizIdx += 1;
  if (quizIdx >= quizSection.questions.length) {
    completeQuizSection();
    return;
  }
  showQuizQuestion();
}
$('quizNext').onclick = quizNextHandler;
$('quizBack').onclick = renderQuizSections;
$('quizClose').onclick = () => $('quizPanel').classList.add('hidden');

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
let toastTimer = null;

// ---- Tượng + NPC + nhiệm vụ (tiến độ theo từng người chơi, lưu ở client) ----
let statueGroups = {}; // statueId -> [{ group, mats, light, glowT, glowActive }] (Hộ Pháp có 2 tượng)
let npcs = []; // { def, av, questMark, walkPhase, wayLen, totalLen }
let myActions = { huong: 0, chuong: 0, nen: 0, hoa: 0, niemPhat: 0, lePhat: 0, thienSec: 0, quiz: 0 };
let activeQuests = []; // { questId, baseline: {...myActions} }
let completedQuests = []; // questId đã hoàn thành (để lưu tiến độ, có thể nhận lại)
let merit = 0;
let xp = 0; // điểm kinh nghiệm (đố vui BĐS)
let profileResumed = false; // true khi vào bằng "Chơi tiếp" (đã áp dụng localStorage)
let profileForceNew = false; // true khi người chơi xác nhận ghi đè tiến độ cũ
let thienActive = false;
let nearestStatue = null;
let nearestNpc = null;
let nearestQuiz = false;
let npcTalkTarget = null; // npcId đang đứng gần để mở đối thoại khi bấm E

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

// ---- Nhạc nền đọc kinh tịnh tâm (Web Audio tổng hợp, không cần file nhạc) ----
// Drone trầm kiểu tụng "Om" + tiếng mõ nhịp chậm + chuông ngân nhẹ theo nhịp.
// Chỉ chạy sau khi người chơi bấm "Vào chùa" (đã có tương tác nên trình duyệt cho phát).
let musicOn = true;
let musicVolLevel = 0.4;
let musicGain = null, musicTimer = null;
let nextMoAt = 0, nextBellAt = 0, bellNoteIdx = 0;
let musicChantBoost = false; // khi niệm Phật: mõ đánh nhanh hơn, nổi lên trên nền nhạc
const MUSIC_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
function startMusic() {
  if (musicTimer) return;
  ensureAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = musicOn ? musicVolLevel * 0.3 : 0;
  musicGain.connect(audioCtx.destination);
  // Drone trầm: 55Hz + 82.4Hz + 110Hz, âm lượng dao động chậm như hơi thở
  const droneGain = audioCtx.createGain();
  droneGain.gain.value = 0.05;
  droneGain.connect(musicGain);
  const lfo = audioCtx.createOscillator(), lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.07; lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain); lfoGain.connect(droneGain.gain);
  lfo.start();
  [55, 82.41, 110].forEach((f, i) => {
    const o = audioCtx.createOscillator();
    o.type = 'sine'; o.frequency.value = f;
    const g = audioCtx.createGain(); g.gain.value = i === 0 ? 0.6 : 0.3;
    o.connect(g); g.connect(droneGain);
    o.start();
  });
  nextMoAt = audioCtx.currentTime + 1;
  nextBellAt = audioCtx.currentTime + 3;
  musicTimer = setInterval(() => {
    if (!musicOn || !audioCtx) return;
    const now = audioCtx.currentTime;
    const moStep = musicChantBoost ? 1.4 : 2.8;
    if (now >= nextMoAt) { playMoTick(now); nextMoAt = now + moStep; }
    if (now >= nextBellAt) {
      playMusicBell(MUSIC_NOTES[bellNoteIdx % MUSIC_NOTES.length], now);
      bellNoteIdx += 1;
      nextBellAt = now + 8 + Math.random() * 4;
    }
  }, 500);
}
function playMoTick(when) {
  if (!audioCtx || !musicGain) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'triangle'; o.frequency.value = 950;
  g.gain.setValueAtTime(musicChantBoost ? 0.1 : 0.06, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
  o.connect(g); g.connect(musicGain);
  o.start(when); o.stop(when + 0.15);
}
function playMusicBell(freq, when) {
  if (!audioCtx || !musicGain) return;
  [[1, 0.1], [2.76, 0.04], [5.4, 0.015]].forEach(([mult, vol]) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq * mult;
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0005, when + 4);
    o.connect(g); g.connect(musicGain);
    o.start(when); o.stop(when + 4.2);
  });
}
function setMusicOn(on) {
  musicOn = on;
  $('musicBtn').textContent = on ? '🎵 Nhạc: Bật' : '🔇 Nhạc: Tắt';
  if (musicGain && audioCtx) musicGain.gain.setTargetAtTime(on ? musicVolLevel * 0.3 : 0, audioCtx.currentTime, 0.3);
  if (on) {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (!musicTimer) startMusic();
  }
}
$('musicBtn').onclick = () => setMusicOn(!musicOn);
$('musicVol').addEventListener('input', (e) => {
  musicVolLevel = Number(e.target.value) / 100;
  if (musicGain && audioCtx) musicGain.gain.setTargetAtTime(musicOn ? musicVolLevel * 0.3 : 0, audioCtx.currentTime, 0.1);
});
// Trình duyệt có thể tạm dừng AudioContext: chạm lần đầu sẽ mở lại nhạc
window.addEventListener('pointerdown', () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
});

// ---- Màn hình đăng nhập ----
const grid = $('avatarGrid');
AVATARS.forEach((a) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'avatar-btn' + (a.emoji === selectedAvatar.emoji ? ' selected' : '');
  b.dataset.emoji = a.emoji;
  b.innerHTML = a.emoji + '<small>' + a.label + '</small>';
  b.onclick = () => {
    selectedAvatar = a;
    document.querySelectorAll('.avatar-btn').forEach((el) => el.classList.remove('selected'));
    b.classList.add('selected');
  };
  grid.appendChild(b);
});

// ---- Lưu tiến độ người chơi (2 lớp) ----
// Lớp 1 — localStorage trên máy người chơi (CHÍNH, đáng tin nhất): giữ tiến độ
// khi quay lại trên cùng thiết bị/trình duyệt, kể cả khi server đã redeploy.
// Lớp 2 — server lưu players.json (xem server.js + README.md): chỉ giữ tiến độ
// khi server restart trong cùng một lần deploy; Render Free dùng ổ đĩa tạm
// (ephemeral) nên khi redeploy có thể mất. Không hứa hẹn lưu đa thiết bị
// (muốn thế cần database thật, chưa có trong bản này).
const PROFILE_KEY_PREFIX = 'chua3d-profile-';
const PROFILE_LAST_KEY = 'chua3d-profile-last';
const PROFILE_VERSION = 1;
function profileKey(name) { return PROFILE_KEY_PREFIX + encodeURIComponent(String(name || '').trim()); }
function loadProfile(name) {
  try {
    const raw = localStorage.getItem(profileKey(name));
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || p.version !== PROFILE_VERSION || typeof p.name !== 'string') return null;
    return p;
  } catch (e) { return null; }
}
function collectProfile() {
  return {
    version: PROFILE_VERSION,
    name: myName,
    avatar: myAvatar ? myAvatar.emoji : '🙏',
    merit, xp,
    myActions: { ...myActions },
    activeQuests: activeQuests.map((aq) => ({ questId: aq.questId, baseline: { ...aq.baseline } })),
    completedQuests: [...completedQuests],
    quiz: {
      totalCorrect: myActions.quiz || 0,
      sections: Object.fromEntries(Object.entries(quizSectionState).map(([id, st]) => [id, { ...st }])),
    },
    savedAt: new Date().toISOString(),
  };
}
let profileSaveTimer = null;
function saveProfileNow() {
  if (!myName) return;
  try {
    localStorage.setItem(profileKey(myName), JSON.stringify(collectProfile()));
    localStorage.setItem(PROFILE_LAST_KEY, myName);
  } catch (e) { /* bộ nhớ đầy / chế độ ẩn danh: bỏ qua, game vẫn chơi được */ }
  sendProfileToServer();
}
function scheduleProfileSave() {
  clearTimeout(profileSaveTimer);
  profileSaveTimer = setTimeout(saveProfileNow, 1000);
}
function sendProfileToServer() {
  if (!socket || !myName) return;
  try {
    socket.emit('profileSave', {
      name: myName,
      merit,
      title: titleForMerit(merit),
      questsDone: [...completedQuests],
      quizScore: myActions.quiz || 0,
    });
  } catch (e) { /* bỏ qua */ }
}
function applyProfile(p) {
  if (!p) return;
  merit = Number(p.merit) || 0;
  xp = Number(p.xp) || 0;
  if (p.myActions && typeof p.myActions === 'object') {
    myActions = { huong: 0, chuong: 0, nen: 0, hoa: 0, niemPhat: 0, lePhat: 0, thienSec: 0, quiz: 0, ...p.myActions };
  }
  activeQuests = Array.isArray(p.activeQuests)
    ? p.activeQuests.filter((aq) => aq && QUESTS_BY_ID[aq.questId]).map((aq) => ({ questId: aq.questId, baseline: { ...myActions, ...(aq.baseline || {}) } }))
    : [];
  completedQuests = Array.isArray(p.completedQuests) ? p.completedQuests.filter((id) => QUESTS_BY_ID[id]) : [];
  if (p.quiz && p.quiz.sections && typeof p.quiz.sections === 'object') {
    for (const [id, st] of Object.entries(p.quiz.sections)) {
      if (st && typeof st === 'object') quizSectionState[id] = { correct: 0, total: 0, completed: false, best: 0, ...st };
    }
  }
  updateMeritUI();
  renderQuestPanel();
}
function resetProgress() {
  merit = 0; xp = 0;
  myActions = { huong: 0, chuong: 0, nen: 0, hoa: 0, niemPhat: 0, lePhat: 0, thienSec: 0, quiz: 0 };
  activeQuests = [];
  completedQuests = [];
  for (const k of Object.keys(quizSectionState)) delete quizSectionState[k];
  updateMeritUI();
  renderQuestPanel();
}
// Áp dụng profile từ server (chỉ khi máy này chưa có localStorage cho tên đó;
// localStorage luôn là nguồn chính — nếu 2 bên khác nhau thì ưu tiên localStorage).
// Profile server chỉ có merit/title/questsDone/quizScore nên khôi phục được
// từng đó: xp = số câu đúng × 10 (khớp cách tính +10 KN/câu đúng trong game).
function applyServerProfile(sp) {
  if (!sp || typeof sp !== 'object') return;
  merit = Math.max(0, Number(sp.merit) || 0);
  const qs = Math.max(0, Number(sp.quizScore) || 0);
  myActions.quiz = qs;
  xp = qs * 10;
  completedQuests = Array.isArray(sp.questsDone) ? sp.questsDone.filter((id) => QUESTS_BY_ID[id]) : [];
  updateMeritUI();
  renderQuestPanel();
  saveProfileNow();
}
// Lưu trước khi rời trang (kể cả khi đóng tab giữa chừng)
window.addEventListener('beforeunload', () => { if (myName) saveProfileNow(); });

// ---- Màn hình đăng nhập: hiện "Chơi tiếp" nếu tên đã có profile đã lưu ----
function refreshContinueBox() {
  const name = $('nameInput').value.trim();
  const p = name ? loadProfile(name) : null;
  const box = $('continueBox');
  if (!p) {
    box.classList.add('hidden');
    $('joinBtn').textContent = '🙏 Vào chùa';
    return;
  }
  $('continueText').innerHTML = '👋 Chào mừng quay lại, <b>' + escapeHtml(p.name) + '</b> ' + escapeHtml(p.avatar || '') +
    ' — 🪷 ' + (p.merit || 0) + ' công đức • ' + escapeHtml(titleForMerit(p.merit || 0)) +
    ' • ⭐ ' + (p.xp || 0) + ' KN • ' + (p.completedQuests ? p.completedQuests.length : 0) + ' nhiệm vụ đã xong';
  box.classList.remove('hidden');
  $('joinBtn').textContent = '🆕 Tạo nhân vật mới';
}
function selectAvatarByEmoji(emoji) {
  const av = AVATARS.find((a) => a.emoji === emoji);
  if (!av) return;
  selectedAvatar = av;
  document.querySelectorAll('.avatar-btn').forEach((el) => el.classList.toggle('selected', el.dataset.emoji === emoji));
}
(function initLogin() {
  let last = null;
  try { last = localStorage.getItem(PROFILE_LAST_KEY); } catch (e) { /* bỏ qua */ }
  if (last) {
    const p = loadProfile(last);
    if (p) {
      $('nameInput').value = p.name;
      selectAvatarByEmoji(p.avatar);
    }
  }
  refreshContinueBox();
})();
$('nameInput').addEventListener('input', refreshContinueBox);
$('continueBtn').onclick = () => join({ resume: true });

function join(options = {}) {
  const name = $('nameInput').value.trim() || 'Phật tử';
  myName = name.slice(0, 20);
  myAvatar = selectedAvatar;
  profileForceNew = false;
  if (options.resume) {
    const p = loadProfile(myName);
    if (p) {
      applyProfile(p);
      profileResumed = true;
      showToast('👋 Chào mừng quay lại, ' + myName + '! Tiến độ cũ đã được khôi phục.');
    }
  } else {
    const existing = loadProfile(myName);
    if (existing) {
      const ok = confirm('Tên "' + myName + '" đã có tiến độ cũ (' + (existing.merit || 0) + ' công đức, ' +
        (existing.completedQuests ? existing.completedQuests.length : 0) + ' nhiệm vụ đã xong).\n' +
        'Bấm OK để tạo nhân vật mới và GHI ĐÈ tiến độ cũ.\nBấm Cancel để quay lại và bấm "Chơi tiếp".');
      if (!ok) return;
      profileForceNew = true;
      try { localStorage.removeItem(profileKey(myName)); } catch (e) { /* bỏ qua */ }
    }
    resetProgress();
  }
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  $('meLabel').textContent = myAvatar.emoji + ' ' + myName;
  ensureAudio(); // tạo AudioContext ngay trong lần bấm (tương tác người dùng) để nhạc nền được phép phát
  initThree().then(() => {
    startMusic();
    socket = io();
    socket.on('connect', () => {
      myId = socket.id;
      socket.emit('join', { name: myName, avatar: myAvatar.emoji });
    });
    socket.on('joined', (state) => {
      applyRoomState(state);
      // Server gửi lại profile đã lưu (nếu có). Chỉ dùng khi máy này chưa có
      // localStorage cho tên đó và người chơi không vừa chọn ghi đè —
      // localStorage luôn là nguồn chính.
      if (state && state.savedProfile && !profileResumed && !profileForceNew && !loadProfile(myName)) {
        applyServerProfile(state.savedProfile);
        showToast('👋 Đã khôi phục tiến độ từ máy chủ: ' + (state.savedProfile.merit || 0) + ' công đức.');
      } else {
        saveProfileNow(); // tạo/cập nhật profile local + gửi lên server (lớp 2)
      }
    });
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
      if (data.type === 'leTuong') {
        setPose(data.id, 'bow');
        glowStatue(data.statue, data.name);
        const st = STATUES.find((s) => s.id === data.statue);
        if (st) showBubble(data.name, st.blessing);
      }
      showActionLabel(data.id, data.type);
      if (data.id === myId) countMyAction(data.type);
    });
    socket.on('statueGlow', (data) => glowStatue(data.statue, data.name));
    socket.on('questDone', (data) => {
      renderFeed(data.feed || []);
      if (data.name !== myName) showToast('🎉 ' + data.name + ' đã hoàn thành: ' + data.quest + ' (+' + data.merit + ' công đức)');
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
  const st = c.statues || {};
  const setStat = (id, val) => { const el = $('countStatue' + id); if (el) el.textContent = val; };
  setStat('Dung', st.dung || 0);
  setStat('Nam', st.nam || 0);
  setStat('QuanAm', st.quanAm || 0);
  setStat('DiLac', st.diLac || 0);
  setStat('HoPhap', st.hoPhap || 0);
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
  musicChantBoost = true; // mõ/đọc kinh nổi lên trên nền nhạc
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
  musicChantBoost = false;
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

// ---- Lễ tượng ----
function walkToPoint(x, z, rot, cb) {
  const dx = x - myPos.x, dz = z - myPos.z;
  if (Math.hypot(dx, dz) < 1.4) {
    myPos.rot = rot;
    sendMove(true);
    if (cb) cb();
    return;
  }
  moveTarget = { x, z };
  pendingAction = { type: 'point', cb, rot };
}
function walkToNpc(npc, cb) {
  const px = npc.av.root.position.x, pz = npc.av.root.position.z;
  const dx = myPos.x - px, dz = myPos.z - pz;
  const d = Math.hypot(dx, dz) || 1;
  const tx = px + (dx / d) * 1.4, tz = pz + (dz / d) * 1.4;
  const rot = Math.atan2(px - myPos.x, pz - myPos.z);
  walkToPoint(tx, tz, rot, cb);
}
function doStatueBow(statueId) {
  if (!socket) return;
  const st = STATUES.find((s) => s.id === statueId);
  if (!st) return;
  if (chanting) stopChant();
  walkToPoint(st.stand.x, st.stand.z, st.rot, () => {
    socket.emit('action', { type: 'leTuong', statue: statueId });
    setPose(myId, 'bow');
  });
}
function glowStatue(statueId, byName) {
  const entries = statueGroups[statueId];
  if (!entries) return;
  playDeepBell();
  for (const entry of entries) {
    entry.glowActive = true;
    entry.glowT = 0;
    entry.light.intensity = 3;
  }
  // Cánh sen rơi quanh tượng
  let i = 0;
  for (const p of petalPool) {
    if (p.life > 0) continue;
    p.life = 4 + Math.random();
    const st = STATUES.find((s) => s.id === statueId);
    p.x = (st ? st.x : 0) + (Math.random() - 0.5) * 5;
    p.y = 6 + Math.random() * 2;
    p.z = (st ? st.z : 0) + (Math.random() - 0.5) * 5;
    p.m.visible = true;
    if (++i >= 12) break;
  }
}

// ---- Công đức / danh hiệu / nhiệm vụ ----
function updateMeritUI() {
  const t = titleForMerit(merit);
  const el = $('meritLabel');
  if (el) el.textContent = '🪷 ' + merit + ' công đức • ' + t + ' • ⭐ ' + xp + ' KN';
  const mini = $('meritMini');
  if (mini) mini.textContent = '• 🪷 ' + merit + ' • ' + t + ' • ⭐ ' + xp + ' KN';
}
function showToast(text, ms = 5000) {
  const el = $('toast');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}
function questProgress(aq) {
  const q = QUESTS_BY_ID[aq.questId];
  if (!q) return 0;
  return Math.max(0, Math.min(q.count, (myActions[q.type] || 0) - (aq.baseline[q.type] || 0)));
}
function renderQuestPanel() {
  const list = $('questList');
  if (!list) return;
  if (!activeQuests.length) {
    list.innerHTML = '<li class="quest-empty">Chưa có nhiệm vụ nào. Hãy tìm NPC có dấu <b class="quest-mark">!</b> vàng để nhận nhiệm vụ nhé!</li>';
    return;
  }
  list.innerHTML = activeQuests.map((aq) => {
    const q = QUESTS_BY_ID[aq.questId];
    const p = questProgress(aq);
    const unit = q.type === 'thien' ? ' giây' : q.type === 'quiz' ? ' câu' : ' lần';
    return '<li>📜 <b>' + escapeHtml(q.title) + '</b> (' + escapeHtml(q.npcName) + ')<br>' +
      'Tiến độ: <b>' + p + '/' + q.count + unit + '</b> • Thưởng: +' + q.merit + ' công đức' +
      (p >= q.count ? ' <span class="quest-done">— sắp hoàn thành!</span>' : '') + '</li>';
  }).join('');
}
function updateNpcMarks() {
  for (const npc of npcs) {
    const hasAvailable = npc.def.quests.some((q) => !activeQuests.some((aq) => aq.questId === q.id));
    if (npc.questMark) npc.questMark.visible = hasAvailable;
  }
}
function acceptQuest(questId) {
  const q = QUESTS_BY_ID[questId];
  if (!q) return;
  if (activeQuests.some((aq) => aq.questId === questId)) { showToast('Bạn đang làm nhiệm vụ này rồi!'); return; }
  if (activeQuests.length >= 3) { showToast('Bạn đã nhận tối đa 3 nhiệm vụ. Hoàn thành một nhiệm vụ rồi nhận thêm nhé!'); return; }
  activeQuests.push({ questId, baseline: { ...myActions } });
  renderQuestPanel();
  updateNpcMarks();
  scheduleProfileSave();
  showToast('📜 Đã nhận nhiệm vụ: ' + q.title + ' (+' + q.merit + ' công đức khi hoàn thành)');
  if (npcTalkTarget) openDialogue(npcTalkTarget);
}
function checkQuestProgress() {
  for (const aq of [...activeQuests]) {
    const q = QUESTS_BY_ID[aq.questId];
    if (!q) continue;
    if (questProgress(aq) >= q.count) completeQuest(aq);
  }
  renderQuestPanel();
}
function completeQuest(aq) {
  const q = QUESTS_BY_ID[aq.questId];
  activeQuests = activeQuests.filter((a) => a !== aq);
  completedQuests.push(q.id);
  merit += q.merit;
  updateMeritUI();
  renderQuestPanel();
  updateNpcMarks();
  scheduleProfileSave();
  // Mưa cánh sen chúc mừng quanh người chơi
  let i = 0;
  for (const p of petalPool) {
    p.life = 5 + Math.random();
    p.x = myPos.x + (Math.random() - 0.5) * 8;
    p.y = 7 + Math.random() * 3;
    p.z = myPos.z + (Math.random() - 0.5) * 8;
    p.m.visible = true;
    if (++i >= 24) break;
  }
  playDeepBell();
  const title = titleForMerit(merit);
  showToast('🎉 Hoàn thành nhiệm vụ: ' + q.title + ' (+' + q.merit + ' công đức)! Danh hiệu của bạn: ' + title, 7000);
  if (socket) socket.emit('questComplete', { quest: q.title, merit: q.merit, title });
}
function countMyAction(type) {
  if (type === 'leTuong') { myActions.lePhat += 1; scheduleProfileSave(); checkQuestProgress(); return; }
  if (type === 'thien') { thienActive = true; checkQuestProgress(); return; }
  if (type in myActions) { myActions[type] += 1; scheduleProfileSave(); checkQuestProgress(); }
  if (type !== 'thien') thienActive = false;
}
setInterval(() => {
  if (!thienActive) return;
  myActions.thienSec += 1;
  scheduleProfileSave();
  checkQuestProgress();
}, 1000);

// ---- Đối thoại NPC ----
function openDialogue(npcId) {
  const npc = npcs.find((n) => n.def.id === npcId);
  if (!npc) return;
  npcTalkTarget = npcId;
  $('dlgName').textContent = npc.def.name;
  $('dlgRole').textContent = npc.def.role;
  $('dlgStory').textContent = npc.def.story;
  const box = $('dlgQuests');
  box.innerHTML = '';
  // Anh Tuấn và chị Lan (khách mua nhà đất) còn rủ chơi đố vui BĐS
  if (npc.def.id === 'chiLan' || npc.def.id === 'anhTuan') {
    const qb = document.createElement('button');
    qb.type = 'button';
    qb.className = 'dlg-quest';
    qb.innerHTML = '<b>❓ Chơi đố vui bất động sản</b>12 câu về mua bán nhà đất, Vinhomes Royal Island, sổ hồng, phong thủy — trả lời đúng +5 công đức, +10 điểm kinh nghiệm.';
    qb.onclick = () => { closeDialogue(); openQuiz(); };
    box.appendChild(qb);
  }
  npc.def.quests.forEach((q) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dlg-quest';
    const isActive = activeQuests.some((aq) => aq.questId === q.id);
    const unit = q.type === 'thien' ? 'giây' : q.type === 'quiz' ? 'câu' : 'lần';
    b.innerHTML = '<b>📜 ' + escapeHtml(q.title) + ' (+' + q.merit + ' công đức)</b>' +
      escapeHtml(q.desc) + ' (' + q.count + unit + ')' +
      (isActive ? '<br><i>✅ Đang làm — xem tiến độ ở bảng Nhiệm vụ</i>' : '');
    b.disabled = isActive || activeQuests.length >= 3;
    if (!isActive && activeQuests.length >= 3) b.title = 'Đã nhận tối đa 3 nhiệm vụ';
    b.onclick = () => acceptQuest(q.id);
    box.appendChild(b);
  });
  $('dialoguePanel').classList.remove('hidden');
}
function closeDialogue() {
  $('dialoguePanel').classList.add('hidden');
  npcTalkTarget = null;
}
$('dlgClose').onclick = closeDialogue;
$('bowStatueBtn').onclick = () => {
  if (nearestStatue) doStatueBow(nearestStatue.id);
  else showToast('Hãy lại gần một tượng Phật rồi bấm lại nhé! (Phật đứng, Phật nằm, Quan Âm, Di Lặc, Hộ Pháp)');
};
$('questBtn').onclick = () => {
  const panel = $('questPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast('📜 Bảng Nhiệm vụ ở cột bên phải — lại gần NPC có dấu ! vàng để nhận nhiệm vụ.');
};
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
  { x: 17, z: 9, r: 6.1 },      // ao sen (đã làm to + cầu gỗ)
  { x: -18, z: 6, r: 0.9 }, { x: -20, z: -4, r: 0.9 }, { x: 19, z: -4, r: 0.9 },
  { x: -8, z: 14, r: 0.9 }, { x: 10, z: 14, r: 0.9 }, // cây bonsai
  { x: -6, z: -2, r: 0.7 }, { x: 6, z: -2, r: 0.7 }, { x: -12, z: 12, r: 0.7 }, { x: 12, z: 12, r: 0.7 }, // đèn đá
  { x: -2.6, z: 19.5, r: 0.7 }, { x: 2.6, z: 19.5, r: 0.7 }, { x: -6.5, z: 19.5, r: 0.7 }, { x: 6.5, z: 19.5, r: 0.7 }, // trụ cổng
  { x: -9.6, z: -11.3, r: 0.5 }, { x: -7, z: -11.3, r: 0.5 }, { x: -3.5, z: -11.3, r: 0.5 },
  { x: 3.5, z: -11.3, r: 0.5 }, { x: 7, z: -11.3, r: 0.5 }, { x: 9.6, z: -11.3, r: 0.5 }, // cột chính điện
  { x: 8, z: 16, r: 1.0 }, { x: -19, z: 1, r: 2.2 }, { x: 7.5, z: 12.5, r: 1.0 },
  { x: -5, z: 17, r: 1.1 }, { x: -8.5, z: -9.5, r: 1.0 }, { x: 8.5, z: -9.5, r: 1.0 }, // tượng Phật thêm
  { x: -11, z: 17, r: 1.0 }, // bảng đố vui BĐS gần cổng
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
  buildStatues();
  buildNPCs();
  buildQuizBoard();

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
  updateMeritUI();
  renderQuestPanel();
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

// ---- Logo NOVASKY: bảng lớn treo ngay mặt tiền chính điện, nhìn từ sân là thấy ----
// (Bản cũ đặt ở tường sau trong điện nên từ sân không nhìn thấy.)
function buildLogoPlaque() {
  const loader = new THREE.TextureLoader();
  loader.load('logo-novasky.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    // Khung vàng + bảng logo treo giữa lối vào chính điện, dưới biển CHÙA AN NHIÊN
    const frame = box(5.4, 2.4, 0.12, 0xd4af37, { metalness: 0.7, roughness: 0.3 });
    frame.position.set(0, 3.4, -10.85);
    scene.add(frame);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 2.1),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    plaque.position.set(0, 3.4, -10.78);
    scene.add(plaque);
    // Thanh treo vàng phía trên bảng
    const bar = box(5.4, 0.12, 0.12, 0xd4af37, { metalness: 0.7, roughness: 0.3 });
    bar.position.set(0, 4.68, -10.85);
    scene.add(bar);
    // Giữ thêm một bảng nhỏ trên tường sau trong điện (nhìn thấy khi vào trong lễ Phật)
    const frame2 = box(4.0, 2.1, 0.1, 0xd4af37, { metalness: 0.7, roughness: 0.3 });
    frame2.position.set(0, 5.9, -19.56);
    scene.add(frame2);
    const plaque2 = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 1.8),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    plaque2.position.set(0, 5.9, -19.5);
    scene.add(plaque2);
  }, undefined, () => {
    // Nếu ảnh logo lỗi, vẫn hiện chữ NOVASKY để không mất logo
    const fallbackTex = canvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#0b2a5b'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 72px serif'; ctx.textAlign = 'center';
      ctx.fillText('NOVASKY', w / 2, h / 2 - 10);
      ctx.font = '36px serif'; ctx.fillText('Niềm vui sum vầy', w / 2, h / 2 + 50);
    }, 512, 256);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 2.1),
      new THREE.MeshStandardMaterial({ map: fallbackTex, roughness: 0.6 }));
    plaque.position.set(0, 3.4, -10.78);
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

// ---- Các tượng Phật thêm: Phật đứng, Phật nằm, Quan Âm, Di Lặc, Hộ Pháp ----
// Mỗi tượng: đài sen + tượng (khối cơ bản Three.js) + bảng tên bay + đèn phát sáng khi lễ.
function lotusPedestal(g, r = 1.1, gold = 0xd4af37) {
  const base = cyl(r, r + 0.15, 0.3, 0x8a6d1f, { metalness: 0.6, roughness: 0.4 });
  base.position.y = 0.15;
  g.add(base);
  const n = Math.max(8, Math.round(r * 10));
  for (let i = 0; i < n; i++) {
    const p = sph(0.26, gold, { metalness: 0.7, roughness: 0.35 });
    p.scale.set(1, 0.55, 1.4);
    const a = (i / n) * Math.PI * 2;
    p.position.set(Math.sin(a) * r * 0.85, 0.32, Math.cos(a) * r * 0.85);
    p.rotation.y = a;
    p.rotation.x = -0.35;
    g.add(p);
  }
}
function statueLabel(g, text, y) {
  const tag = makeTextSprite(text, { color: '#ffe9b0' });
  tag.sp.position.y = y;
  g.add(tag.sp);
  return tag.sp;
}
function registerStatue(id, g, x, z, tagText, tagY, lightY = 3.2) {
  g.position.set(x, 0, z);
  scene.add(g);
  statueLabel(g, tagText, tagY);
  const light = new THREE.PointLight(0xffc23d, 0, 12, 1.6);
  light.position.set(x, lightY, z);
  scene.add(light);
  const mats = [];
  g.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) mats.push({ m: o.material, base: o.material.emissiveIntensity ?? 1 }); });
  // Hộ Pháp có 2 tượng chung 1 bộ đếm: lưu cả hai để lễ một tượng thì cả hai cùng sáng
  if (!statueGroups[id]) statueGroups[id] = [];
  statueGroups[id].push({ group: g, mats, light, glowT: 0, glowActive: false });
  g.traverse((o) => { o.userData.statue = id; });
  interactiveRoots.push(g);
  return g;
}
function buildStatues() {
  const gold = { color: 0xe8b923, metalness: 0.85, roughness: 0.28, emissive: 0x2a1500, emissiveIntensity: 0.4 };
  const bronze = { color: 0xa8763e, metalness: 0.8, roughness: 0.35, emissive: 0x1a0d00, emissiveIntensity: 0.4 };

  // 1) Tượng Phật đứng — một tay giơ lên ban phước (8, 16), mặt hướng về cổng
  {
    const g = new THREE.Group();
    lotusPedestal(g, 1.0);
    const robe = cyl(0.42, 0.62, 1.7, 0xe8b923, gold); robe.position.y = 1.35; g.add(robe);
    const chest = sph(0.5, 0xe8b923, gold); chest.scale.set(1, 1.1, 0.7); chest.position.y = 2.3; g.add(chest);
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 10, 24), mat(0xb8860b, { metalness: 0.7, roughness: 0.35 }));
    sash.position.y = 2.15; sash.rotation.x = Math.PI / 2 - 0.2; g.add(sash);
    // Tay phải giơ lên ban phước, lòng bàn tay hướng ra ngoài
    const armR = cyl(0.11, 0.09, 0.85, 0xe8b923, gold);
    armR.position.set(0.5, 2.5, 0.15); armR.rotation.z = -0.5; g.add(armR);
    const palm = box(0.2, 0.3, 0.06, 0xe8b923, gold); palm.position.set(0.72, 3.0, 0.2); g.add(palm);
    // Tay trái buông xuôi
    const armL = cyl(0.11, 0.09, 0.85, 0xe8b923, gold);
    armL.position.set(-0.5, 1.9, 0.1); armL.rotation.z = 0.25; g.add(armL);
    const head = sph(0.34, 0xe8b923, gold); head.position.y = 3.0; g.add(head);
    const ushnisha = sph(0.12, 0xe8b923, gold); ushnisha.position.y = 3.32; g.add(ushnisha);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 10, 32),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.3 }));
    halo.position.set(0, 3.0, -0.2); g.add(halo);
    registerStatue('dung', g, 8, 16, 'Phật Đứng', 4.1);
  }

  // 2) Tượng Phật nằm — nằm dài dưới gốc cây phía Tây (-19, 1), đầu gối tay
  {
    const g = new THREE.Group();
    lotusPedestal(g, 2.0);
    const pillow = box(0.9, 0.25, 0.7, 0xd4af37, { metalness: 0.5, roughness: 0.4 });
    pillow.position.set(-1.5, 0.45, 0); g.add(pillow);
    const head = sph(0.42, 0xe8b923, gold); head.position.set(-1.35, 0.75, 0); g.add(head);
    const ushnisha = sph(0.14, 0xe8b923, gold); ushnisha.position.set(-1.35, 1.12, 0); g.add(ushnisha);
    // Thân nằm dài: các khối cầu dẹt nối nhau
    const body = sph(0.62, 0xe8b923, gold); body.scale.set(2.4, 0.85, 0.9); body.position.set(0.1, 0.75, 0); g.add(body);
    const hip = sph(0.55, 0xe8b923, gold); hip.scale.set(1.4, 0.8, 0.95); hip.position.set(1.1, 0.72, 0); g.add(hip);
    const legs = sph(0.42, 0xe8b923, gold); legs.scale.set(1.6, 0.6, 0.7); legs.position.set(1.9, 0.6, 0); g.add(legs);
    const robeFold = box(3.2, 0.12, 0.5, 0xb8860b, { metalness: 0.6, roughness: 0.4 });
    robeFold.position.set(0.3, 1.05, 0.25); robeFold.rotation.y = 0.06; g.add(robeFold);
    const arm = cyl(0.1, 0.09, 1.1, 0xe8b923, gold);
    arm.position.set(-0.6, 0.65, 0.45); arm.rotation.z = Math.PI / 2 - 0.25; g.add(arm);
    registerStatue('nam', g, -19, 1, 'Phật Nằm', 2.6);
    g.rotation.y = Math.PI / 2; // nằm dọc theo trục Z, đầu hướng Bắc
  }

  // 3) Tượng Quan Âm — áo trắng viền vàng, tay cầm bình cam lộ (7.5, 12.5)
  {
    const g = new THREE.Group();
    lotusPedestal(g, 1.0, 0xffffff);
    const robe = cyl(0.45, 0.68, 1.8, 0xf5f0e6, { roughness: 0.7 });
    robe.position.y = 1.4; g.add(robe);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.35 }));
    trim.position.y = 0.75; trim.rotation.x = Math.PI / 2; g.add(trim);
    const chest = sph(0.48, 0xf5f0e6, { roughness: 0.7 }); chest.scale.set(1, 1.05, 0.7); chest.position.y = 2.35; g.add(chest);
    // Khăn choàng đầu trắng
    const veil = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 16), mat(0xf5f0e6, { roughness: 0.7 }));
    veil.position.y = 3.0; g.add(veil);
    const head = sph(0.3, 0xf2c89b, { roughness: 0.7 }); head.position.set(0, 2.95, 0.12); g.add(head);
    const crown = cyl(0.12, 0.2, 0.18, 0xd4af37, { metalness: 0.8, roughness: 0.3 });
    crown.position.set(0, 3.3, 0.12); g.add(crown);
    // Tay cầm bình cam lộ
    const arm = cyl(0.09, 0.08, 0.7, 0xf5f0e6, { roughness: 0.7 });
    arm.position.set(0.45, 2.0, 0.25); arm.rotation.z = -0.7; g.add(arm);
    const vase = cyl(0.14, 0.2, 0.42, 0x2e6b8a, { roughness: 0.4 });
    vase.position.set(0.62, 1.65, 0.35); g.add(vase);
    const sprig = cyl(0.02, 0.02, 0.4, 0x2e7d32); sprig.position.set(0.62, 1.95, 0.35); sprig.rotation.z = 0.3; g.add(sprig);
    const armL = cyl(0.09, 0.08, 0.7, 0xf5f0e6, { roughness: 0.7 });
    armL.position.set(-0.45, 2.0, 0.15); armL.rotation.z = 0.5; g.add(armL);
    registerStatue('quanAm', g, 7.5, 12.5, 'Quan Âm', 4.0);
  }

  // 4) Tượng Phật Di Lặc — bụng to, cười hoan hỷ, bao vải bên cạnh (-5, 17)
  {
    const g = new THREE.Group();
    lotusPedestal(g, 1.1);
    const belly = sph(0.75, 0xe8b923, gold); belly.scale.set(1, 0.95, 0.85); belly.position.y = 1.15; g.add(belly);
    const chest = sph(0.6, 0xe8b923, gold); chest.scale.set(1.05, 0.85, 0.8); chest.position.y = 1.95; g.add(chest);
    // Áo mở phanh bụng: hai vạt áo hai bên
    [-1, 1].forEach((s) => {
      const flap = box(0.28, 0.9, 0.1, 0xb8860b, { metalness: 0.6, roughness: 0.4 });
      flap.position.set(s * 0.55, 1.7, 0.55); flap.rotation.y = s * 0.5; g.add(flap);
    });
    const head = sph(0.42, 0xe8b923, gold); head.position.y = 2.6; g.add(head);
    [-1, 1].forEach((s) => {
      const ear = sph(0.12, 0xe8b923, gold); ear.scale.set(0.6, 1.8, 0.6); ear.position.set(s * 0.42, 2.55, 0); g.add(ear);
    });
    // Nụ cười: miệng cong (nửa vành khuyên)
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.6 }));
    smile.position.set(0, 2.55, 0.4); smile.rotation.z = Math.PI; g.add(smile);
    // Bao vải bên cạnh
    const sack = sph(0.5, 0x8d5a2b, { roughness: 0.95 }); sack.scale.set(1, 1.1, 0.9); sack.position.set(1.15, 0.85, 0.3); g.add(sack);
    const sackTop = cyl(0.12, 0.3, 0.35, 0x6d4520, { roughness: 0.95 }); sackTop.position.set(1.15, 1.35, 0.3); g.add(sackTop);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), mat(0xd4af37, { metalness: 0.7, roughness: 0.35 }));
    tie.position.set(1.15, 1.2, 0.3); tie.rotation.x = Math.PI / 2; g.add(tie);
    registerStatue('diLac', g, -5, 17, 'Di Lặc', 3.6);
  }

  // 5) Hai Hộ Pháp — mặt nghiêm, giáp đồng, cầm vũ khí, hai bên lối vào chính điện (±8.5, -9.5)
  [[-8.5, -1], [8.5, 1]].forEach(([x, side]) => {
    const g = new THREE.Group();
    lotusPedestal(g, 1.0, 0xa8763e);
    // Chân trụ vững
    [-0.35, 0.35].forEach((dx) => {
      const leg = cyl(0.14, 0.16, 0.9, 0x5d4037, { roughness: 0.9 });
      leg.position.set(dx, 0.75, 0); g.add(leg);
    });
    const armor = cyl(0.5, 0.62, 1.3, 0xa8763e, bronze); armor.position.y = 1.6; g.add(armor);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.06, 10, 24), mat(0xd4af37, { metalness: 0.7, roughness: 0.3 }));
    belt.position.y = 1.25; belt.rotation.x = Math.PI / 2; g.add(belt);
    const head = sph(0.34, 0xc98f5a, { roughness: 0.7 }); head.position.y = 2.6; g.add(head);
    // Mũ giáp có sừng + lông mày rậm (mặt nghiêm)
    const helm = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 12), mat(0x8a6d1f, { metalness: 0.75, roughness: 0.35 }));
    helm.position.y = 2.95; g.add(helm);
    [-1, 1].forEach((s) => {
      const brow = box(0.16, 0.05, 0.05, 0x222222); brow.position.set(s * 0.14, 2.68, 0.32); brow.rotation.z = s * -0.5; g.add(brow);
      const eye = sph(0.045, 0xffffff, { roughness: 0.4 }); eye.position.set(s * 0.13, 2.6, 0.32); g.add(eye);
    });
    // Vũ khí: giáo (bên trái) / chày kim cang (bên phải)
    if (side < 0) {
      const spear = cyl(0.05, 0.05, 2.6, 0x6b4a2f, { roughness: 0.7 });
      spear.position.set(0.75, 1.9, 0.2); g.add(spear);
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 8), mat(0xd7dde3, { metalness: 0.9, roughness: 0.2 }));
      blade.position.set(0.75, 3.4, 0.2); g.add(blade);
    } else {
      const staff = cyl(0.06, 0.06, 2.2, 0x6b4a2f, { roughness: 0.7 });
      staff.position.set(-0.75, 1.7, 0.2); g.add(staff);
      const mace = sph(0.2, 0xd4af37, { metalness: 0.8, roughness: 0.3 }); mace.position.set(-0.75, 2.9, 0.2); g.add(mace);
    }
    // Tay cầm vũ khí
    const arm = cyl(0.11, 0.09, 0.7, 0xa8763e, bronze);
    arm.position.set(side * 0.6, 2.1, 0.15); arm.rotation.z = side * -0.5; g.add(arm);
    registerStatue('hoPhap', g, x, -9.5, 'Hộ Pháp', 3.9);
  });
}

// ---- Bảng đố vui bất động sản gần cổng (-11, 17) ----
const QUIZ_SPOT = { x: -11, z: 17, r: 3.5, stand: { x: -11, z: 18.6 }, rot: Math.PI };
function buildQuizBoard() {
  const g = new THREE.Group();
  [-1.1, 1.1].forEach((x) => {
    const post = box(0.22, 2.6, 0.22, 0x6b4a2f);
    post.position.set(x, 1.3, 0);
    g.add(post);
  });
  const boardTex = canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#fff8ec'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8c2f26'; ctx.lineWidth = 12; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#a33d00'; ctx.font = 'bold 64px serif'; ctx.textAlign = 'center';
    ctx.fillText('❓ ĐỐ VUI', w / 2, 110);
    ctx.fillText('BẤT ĐỘNG SẢN', w / 2, 190);
    ctx.fillStyle = '#3a2317'; ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText('Trả lời đúng +5 công đức', w / 2, 280);
    ctx.fillText('Bấm vào bảng để chơi!', w / 2, 340);
  }, 512, 384);
  const back = box(3.5, 2.65, 0.1, 0x6b4a2f);
  back.position.set(0, 2.0, 0.05);
  g.add(back);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.55),
    new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.8 }));
  board.position.set(0, 2.0, 0.14);
  g.add(board);
  const roof = box(4.0, 0.18, 1.0, 0x7f1d1d);
  roof.position.set(0, 3.5, 0);
  g.add(roof);
  g.position.set(-11, 0, 17);
  scene.add(g);
  g.traverse((o) => { o.userData.quiz = 'board'; });
  interactiveRoots.push(g);
}

// ---- NPC giao nhiệm vụ ----
function buildNPCs() {
  NPCS.forEach((def) => {
    const avDef = { emoji: '🧑', label: def.name, robe: def.robe, skin: def.skin, hair: def.hair };
    const av = createAvatar(avDef, def.name, false);
    av.id = 'npc-' + def.id;
    // Dấu "!" vàng trên đầu khi còn nhiệm vụ để nhận
    const mark = makeTextSprite('!', { color: '#ffd700' });
    mark.sp.scale.set(0.9, 0.45, 1);
    mark.sp.position.y = 3.0;
    av.root.add(mark.sp);
    av.root.traverse((o) => { o.userData.npc = def.id; });
    interactiveRoots.push(av.root);
    // Độ dài từng đoạn waypoint để nội suy vị trí theo thời gian
    const segs = [];
    let total = 0;
    for (let i = 0; i < def.waypoints.length; i++) {
      const a = def.waypoints[i], b = def.waypoints[(i + 1) % def.waypoints.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push({ a, b, len });
      total += len;
    }
    npcs.push({ def, av, questMark: mark.sp, walkPhase: Math.random() * 6, segs, totalLen: total });
  });
  updateNpcMarks();
}
// Vị trí NPC tại thời điểm t (giây): nội suy dọc vòng waypoint, mọi client giống nhau
function npcPosAt(npc, tSec) {
  const speed = npc.def.speed || 0.7;
  let d = ((tSec * speed) % npc.totalLen + npc.totalLen) % npc.totalLen;
  for (const seg of npc.segs) {
    if (d <= seg.len) {
      const k = seg.len ? d / seg.len : 0;
      const x = seg.a[0] + (seg.b[0] - seg.a[0]) * k;
      const z = seg.a[1] + (seg.b[1] - seg.a[1]) * k;
      const rot = Math.atan2(seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]);
      return { x, z, rot };
    }
    d -= seg.len;
  }
  const last = npc.segs[npc.segs.length - 1];
  return { x: last.b[0], z: last.b[1], rot: 0 };
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
  // Mặt nước lớn, xanh sáng, nhìn từ sân là thấy ngay
  const water = new THREE.Mesh(new THREE.CircleGeometry(5.5, 40),
    new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.08, metalness: 0.35, emissive: 0x0a2f55, emissiveIntensity: 0.35 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.07; water.receiveShadow = true; g.add(water);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.55, 0.25, 10, 48), mat(0x9a8d7a, { roughness: 0.95 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.1; g.add(rim);
  // Cầu gỗ cong bắc qua ao để ai cũng nhận ra đây là ao
  const bridge = box(7.2, 0.16, 1.4, 0x8d5a2b, { roughness: 0.9 });
  bridge.position.set(0, 0.55, 0); g.add(bridge);
  [-0.65, 0.65].forEach((z) => {
    const rail = box(7.2, 0.12, 0.1, 0x6d4520, { roughness: 0.9 });
    rail.position.set(0, 1.05, z); g.add(rail);
  });
  [-3.2, -1.1, 1.1, 3.2].forEach((x) => {
    const post = box(0.12, 0.55, 0.12, 0x6d4520, { roughness: 0.9 });
    post.position.set(x, 0.85, 0.65); g.add(post);
    const post2 = post.clone(); post2.position.z = -0.65; g.add(post2);
  });
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
    rock.position.set(Math.sin(a) * 6.1, 0.15, Math.cos(a) * 6.1);
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
    if ((e.key === 'e' || e.key === 'E')) {
      if (nearestNpc) {
        walkToNpc(nearestNpc, () => openDialogue(nearestNpc.def.id));
      } else if (nearestStatue) {
        doStatueBow(nearestStatue.id);
      } else if (nearestQuiz) {
        walkToPoint(QUIZ_SPOT.stand.x, QUIZ_SPOT.stand.z, QUIZ_SPOT.rot, () => openQuiz());
      } else if (nearestSpot) {
        const t = promptType;
        walkToSpot(t, () => doAction(t));
      }
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
      while (o && !o.userData.spot && !o.userData.statue && !o.userData.npc && !o.userData.quiz) o = o.parent;
      if (o) {
        if (o.userData.statue) return { statue: o.userData.statue };
        if (o.userData.npc) return { npc: o.userData.npc };
        if (o.userData.quiz) return { quiz: o.userData.quiz };
        return { spot: o.userData.spot };
      }
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
    } else if (hit.statue) {
      doStatueBow(hit.statue);
    } else if (hit.npc) {
      const npc = npcs.find((n) => n.def.id === hit.npc);
      if (npc) walkToNpc(npc, () => openDialogue(npc.def.id));
    } else if (hit.quiz) {
      walkToPoint(QUIZ_SPOT.stand.x, QUIZ_SPOT.stand.z, QUIZ_SPOT.rot, () => openQuiz());
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

  // Bấm vào gợi ý làm lễ / lễ tượng / nói chuyện NPC / đố vui
  $('promptChip').addEventListener('click', () => {
    if (nearestNpc) walkToNpc(nearestNpc, () => openDialogue(nearestNpc.def.id));
    else if (nearestStatue) doStatueBow(nearestStatue.id);
    else if (nearestQuiz) walkToPoint(QUIZ_SPOT.stand.x, QUIZ_SPOT.stand.z, QUIZ_SPOT.rot, () => openQuiz());
    else if (promptType) walkToSpot(promptType, () => doAction(promptType));
  });

  // Kiểm tra điểm làm lễ / tượng / NPC gần nhất mỗi 0.25s
  setInterval(() => {
    if (!me) return;
    let best = null, bestD = 1e9;
    for (const [type, s] of Object.entries(SPOTS)) {
      const d = Math.hypot(myPos.x - s.x, myPos.z - s.z);
      if (d < s.r && d < bestD) { best = type; bestD = d; }
    }
    nearestSpot = best;
    promptType = best;
    // Tượng gần nhất (trong 3.5m tính từ chân tượng)
    let bestSt = null, bestStD = 1e9;
    for (const s of STATUES) {
      const d = Math.hypot(myPos.x - s.x, myPos.z - s.z) - s.r;
      if (d < 3.5 && d < bestStD) { bestSt = s; bestStD = d; }
    }
    nearestStatue = bestSt;
    // NPC gần nhất (trong 3.5m)
    let bestNpc = null, bestNpcD = 1e9;
    for (const npc of npcs) {
      const d = Math.hypot(myPos.x - npc.av.root.position.x, myPos.z - npc.av.root.position.z);
      if (d < 3.5 && d < bestNpcD) { bestNpc = npc; bestNpcD = d; }
    }
    nearestNpc = bestNpc;
    // Bảng đố vui gần cổng
    nearestQuiz = Math.hypot(myPos.x - QUIZ_SPOT.x, myPos.z - QUIZ_SPOT.z) < QUIZ_SPOT.r + 1;
    const chip = $('promptChip');
    if (bestNpc) {
      chip.textContent = '💬 Nói chuyện với ' + bestNpc.def.name + ' — bấm E hoặc chạm vào đây';
      chip.classList.remove('hidden');
    } else if (bestSt) {
      chip.textContent = '🙏 Lễ ' + bestSt.label + ' — bấm E hoặc chạm vào đây';
      chip.classList.remove('hidden');
    } else if (nearestQuiz) {
      chip.textContent = '❓ Đố vui bất động sản — bấm E hoặc chạm vào đây';
      chip.classList.remove('hidden');
    } else if (best) {
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
      thienActive = false; // rời khỏi chỗ thiền thì dừng tính giờ thiền
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

  // --- NPC đi lại theo vòng waypoint (vị trí tính từ đồng hồ chung) ---
  for (const npc of npcs) {
    const pos = npcPosAt(npc, Date.now() / 1000);
    const prevX = npc.av.root.position.x, prevZ = npc.av.root.position.z;
    npc.av.root.position.set(pos.x, 0, pos.z);
    npc.av.root.rotation.y = pos.rot;
    const moved = Math.hypot(pos.x - prevX, pos.z - prevZ) > 0.0005;
    if (moved) {
      npc.walkPhase += dt * 6;
      npc.av.body.position.y = Math.abs(Math.sin(npc.walkPhase)) * 0.06;
      npc.av.armL.rotation.x = Math.sin(npc.walkPhase) * 0.6;
      npc.av.armR.rotation.x = -Math.sin(npc.walkPhase) * 0.6;
    } else {
      npc.av.body.position.y *= 0.9;
      npc.av.armL.rotation.x *= 0.9;
      npc.av.armR.rotation.x *= 0.9;
    }
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

  // --- Tượng lễ phát sáng (vàng, 4 giây rồi tắt dần) ---
  for (const entries of Object.values(statueGroups)) {
    for (const entry of entries) {
      if (!entry.glowActive) continue;
      entry.glowT += dt;
      const k = entry.glowT < 1 ? entry.glowT : entry.glowT > 3 ? Math.max(0, 4 - entry.glowT) : 1;
      entry.light.intensity = 3 * k;
      entry.group.scale.setScalar(1 + 0.05 * k);
      for (const e of entry.mats) e.m.emissiveIntensity = e.base + 1.6 * k;
      if (entry.glowT >= 4) {
        entry.glowActive = false;
        entry.light.intensity = 0;
        entry.group.scale.setScalar(1);
        for (const e of entry.mats) e.m.emissiveIntensity = e.base;
      }
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
