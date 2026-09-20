import type { FeaturedAlbum, FeaturedCreator, Genre, LandingTrack } from "./types";

const svgData = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const cover = (from: string, to: string, accent: string, label: string, variant = 1) =>
  svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
    <rect width="600" height="600" rx="32" fill="url(#g)"/>
    ${variant % 3 === 0
      ? `<circle cx="300" cy="278" r="178" fill="none" stroke="${accent}" stroke-width="52" opacity=".72"/><circle cx="300" cy="278" r="58" fill="${accent}" opacity=".9"/>`
      : variant % 3 === 1
        ? `<path d="M-30 380C100 210 170 530 315 315S520 120 660 268" fill="none" stroke="${accent}" stroke-width="80" stroke-linecap="round" opacity=".8"/>`
        : `<g fill="${accent}" opacity=".82"><rect x="105" y="185" width="68" height="230" rx="34"/><rect x="205" y="105" width="68" height="390" rx="34"/><rect x="305" y="150" width="68" height="300" rx="34"/><rect x="405" y="225" width="68" height="150" rx="34"/></g>`}
    <text x="42" y="535" fill="white" font-family="Arial,sans-serif" font-weight="700" font-size="38">${label}</text>
  </svg>`);

const avatar = (background: string, foreground: string, initials: string) =>
  svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="100" fill="${background}"/><circle cx="100" cy="75" r="38" fill="${foreground}" opacity=".92"/><path d="M36 190c4-46 27-72 64-72s60 26 64 72" fill="${foreground}" opacity=".92"/><text x="100" y="108" text-anchor="middle" fill="white" font-family="Arial" font-weight="800" font-size="24">${initials}</text></svg>`);

const covers = {
  dawn: cover("#0e7490", "#7c3aed", "#67e8f9", "SỚM MAI", 1),
  city: cover("#111827", "#be185d", "#f9a8d4", "THÀNH PHỐ", 2),
  blue: cover("#0369a1", "#312e81", "#bae6fd", "BIỂN XANH", 3),
  warm: cover("#c2410c", "#7c2d12", "#fed7aa", "MÙA HẠ", 1),
  night: cover("#1e1b4b", "#4c1d95", "#c4b5fd", "ĐÊM TRÔI", 2),
  green: cover("#065f46", "#134e4a", "#99f6e4", "BÌNH YÊN", 3),
  rose: cover("#9f1239", "#581c87", "#fda4af", "CHẠM", 1),
  gold: cover("#92400e", "#b45309", "#fde68a", "GỌI NẮNG", 2),
};

const creators = {
  minh: { userId: 101, displayName: "Minh An", avatarUrl: avatar("#cffafe", "#0891b2", "MA") },
  lam: { userId: 102, displayName: "Lâm Mộc", avatarUrl: avatar("#ede9fe", "#7c3aed", "LM") },
  yen: { userId: 103, displayName: "Yên Chi", avatarUrl: avatar("#ffe4e6", "#e11d48", "YC") },
  kai: { userId: 104, displayName: "Kai Vũ", avatarUrl: avatar("#d1fae5", "#059669", "KV") },
};

export const tracks: LandingTrack[] = [
  {
    id: 1,
    title: "Sớm Mai Dịu Dàng",
    coverUrl: covers.dawn,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 368000,
    playCount: 284521,
    publicationStatus: "APPROVED",
    genreSlug: "acoustic",
    lyrics: `Từng tia nắng ấm khẽ luồn qua ô cửa
Gió hát thì thầm bài ca mùa mới
Em nghe trong lòng những xốn xang đầu tiên
Chào ngày mới bình yên và trong trẻo.

Dù ngoài kia dòng đời vội vã
Vẫn có một góc nhỏ để trở về
Cùng giai điệu mộc mạc của sớm mai
Thả trôi hết âu lo muộn phiền.`,
    creator: creators.minh,
    album: { id: 1, title: "Những Ngày Trong Veo" },
  },
  {
    id: 2,
    title: "Thành Phố Sau Mưa",
    coverUrl: covers.city,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 421000,
    playCount: 198430,
    publicationStatus: "APPROVED",
    genreSlug: "pop",
    lyrics: `Mưa tạnh rồi trên những con phố quen
Ánh đèn vàng phản chiếu mặt hồ ướt đẫm
Bước chân ai nhẹ tênh qua từng góc nhỏ
Nghe tiếng còi xe dần xa vào màn đêm.

Thành phố vẫn thở nhịp thở của riêng mình
Sau cơn mưa gột rửa bụi mờ
Lại sáng lên những ước mơ chưa nguôi.`,
    creator: creators.lam,
    album: { id: 2, title: "Đi Qua Đêm" },
  },
  {
    id: 3,
    title: "Phía Bên Kia Biển",
    coverUrl: covers.blue,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 338000,
    playCount: 176092,
    publicationStatus: "APPROVED",
    genreSlug: "indie",
    lyrics: `Biển xanh ngút ngàn sóng vỗ về đâu
Có cánh chim bay phía chân trời xa thẳm
Lời yêu giấu kín trong từng cơn gió mặn
Gửi về phía bên kia biển rộng.`,
    creator: creators.yen,
    album: { id: 3, title: "Chạm Vào Mây" },
  },
  {
    id: 4,
    title: "Hạ Vẫn Ở Đây",
    coverUrl: covers.warm,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 312000,
    playCount: 154721,
    publicationStatus: "APPROVED",
    genreSlug: "lofi",
    lyrics: `Nắng vàng ươm rớt trên vai gầy
Ve râm ran khúc ca ngày hạ
Dù tháng năm trôi không trở lại
Mùa hạ ấy vẫn ở đây, trong tim mình.`,
    creator: creators.kai,
    album: { id: 4, title: "Gọi Nắng" },
  },
  {
    id: 5,
    title: "Đêm Trôi Rất Khẽ",
    coverUrl: covers.night,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 387000,
    playCount: 143885,
    publicationStatus: "APPROVED",
    genreSlug: "ballad",
    lyrics: `Đêm trôi rất khẽ qua từng kẽ tay
Không gian lắng lại chỉ còn tiếng thở
Một bản tình ca ru giấc ngủ say
Bình yên trở về sau giông bão.`,
    creator: creators.lam,
    album: { id: 2, title: "Đi Qua Đêm" },
  },
  {
    id: 6,
    title: "Một Khoảng Bình Yên",
    coverUrl: covers.green,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 356000,
    playCount: 121430,
    publicationStatus: "APPROVED",
    genreSlug: "acoustic",
    lyrics: `Tách trà thơm bên khung cửa sổ
Một cuốn sách đọc dở buổi chiều
Tìm lại chính mình giữa những xô bồ
Chỉ cần một khoảng bình yên thế này thôi.`,
    creator: creators.minh,
    album: { id: 1, title: "Những Ngày Trong Veo" },
  },
  {
    id: 7,
    title: "Chạm Vào Khoảng Không",
    coverUrl: covers.rose,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 329000,
    playCount: 98450,
    publicationStatus: "APPROVED",
    genreSlug: "rnb",
    lyrics: `Bàn tay với lấy những điều xa xôi
Chạm vào khoảng không nghẹn ngào
Thời gian xóa nhòa những dấu vết
Chỉ còn giai điệu ở lại.`,
    creator: creators.yen,
  },
  {
    id: 8,
    title: "Gọi Nắng Về",
    coverUrl: covers.gold,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 344000,
    playCount: 87320,
    publicationStatus: "APPROVED",
    genreSlug: "rap-hip-hop",
    lyrics: `Từng nhịp bass đánh thức buổi sáng
Mặt trời lên rọi sáng con đường
Vững bước đi về phía trước
Gọi nắng về thắp sáng ngày mai.`,
    creator: creators.kai,
    album: { id: 4, title: "Gọi Nắng" },
  },
];

export const genres: Genre[] = [
  { id: 1, name: "Pop", slug: "pop", color: "#ecfeff", accent: "#0891b2", description: "Những giai điệu bắt tai, tươi sáng và thịnh hành." },
  { id: 2, name: "Ballad", slug: "ballad", color: "#f5f3ff", accent: "#7c3aed", description: "Khúc tình ca êm dịu, sâu lắng và giàu cảm xúc." },
  { id: 3, name: "Rap / Hip-hop", slug: "rap-hip-hop", color: "#fff7ed", accent: "#ea580c", description: "Nhịp beat sôi động, ca từ chân thực và phóng khoáng." },
  { id: 4, name: "R&B", slug: "rnb", color: "#fdf2f8", accent: "#db2777", description: "Giai điệu uyển chuyển, trầm ấm và quyến rũ." },
  { id: 5, name: "Acoustic", slug: "acoustic", color: "#f0fdf4", accent: "#16a34a", description: "Thanh âm mộc mạc từ guitar và piano mộc." },
  { id: 6, name: "EDM", slug: "edm", color: "#eff6ff", accent: "#2563eb", description: "Năng lượng bùng nổ với âm nhạc điện tử hiện đại." },
  { id: 7, name: "Indie", slug: "indie", color: "#fefce8", accent: "#ca8a04", description: "Những sáng tạo tự do, độc đáo của nghệ sĩ độc lập." },
  { id: 8, name: "Lofi", slug: "lofi", color: "#f8fafc", accent: "#475569", description: "Âm hưởng thư giãn tuyệt đối cho học tập và làm việc." },
];

export const albums: FeaturedAlbum[] = [
  { id: 1, title: "Những Ngày Trong Veo", coverUrl: covers.dawn, creatorName: "Minh An", releaseYear: 2026, tracksCount: 2, description: "Tuyển tập acoustic nhẹ nhàng dành cho những sớm mai yên tĩnh." },
  { id: 2, title: "Đi Qua Đêm", coverUrl: covers.night, creatorName: "Lâm Mộc", releaseYear: 2026, tracksCount: 2, description: "Hành trình âm thanh qua thành phố sau những cơn mưa đêm." },
  { id: 3, title: "Chạm Vào Mây", coverUrl: covers.blue, creatorName: "Yên Chi", releaseYear: 2025, tracksCount: 1, description: "Giai điệu dream pop bay bổng giữa biển trời." },
  { id: 4, title: "Gọi Nắng", coverUrl: covers.gold, creatorName: "Kai Vũ", releaseYear: 2026, tracksCount: 2, description: "Năng lượng mùa hè bùng cháy trong từng giai điệu." },
];

export const featuredCreators: FeaturedCreator[] = [
  { ...creators.minh, avatarUrl: creators.minh.avatarUrl!, bio: "Những giai điệu acoustic dành cho ngày chậm rãi.", publishedTracks: 12, followersCount: 4320 },
  { ...creators.lam, avatarUrl: creators.lam.avatarUrl!, bio: "Kể chuyện thành phố bằng alternative pop.", publishedTracks: 9, followersCount: 3180 },
  { ...creators.yen, avatarUrl: creators.yen.avatarUrl!, bio: "Dream pop, biển xanh và những khoảng trời xa.", publishedTracks: 7, followersCount: 2950 },
  { ...creators.kai, avatarUrl: creators.kai.avatarUrl!, bio: "Năng lượng mùa hè trong từng nhịp beat.", publishedTracks: 11, followersCount: 5120 },
];

export const heroCovers = [covers.dawn, covers.city, covers.blue];

export const demoPlaylists: import("./types").Playlist[] = [
  {
    id: 1,
    title: "Giai điệu sớm mai",
    description: "Khởi đầu ngày mới với nguồn năng lượng tích cực.",
    coverUrl: covers.dawn,
    trackCount: 3,
    isPrivate: false,
    ownerId: 1,
    ownerName: "Lê An",
    trackIds: [1, 4, 6],
  },
  {
    id: 2,
    title: "Đêm muộn suy tư",
    description: "Nhạc nhẹ ru giấc ngủ và những khoảng lặng tâm hồn.",
    coverUrl: covers.night,
    trackCount: 3,
    isPrivate: true,
    ownerId: 1,
    ownerName: "Lê An",
    trackIds: [2, 3, 5],
  },
];

export const initialStudioTracks: import("./types").StudioTrack[] = [
  {
    id: 101,
    title: "Gió Qua Thung Lũng (Demo)",
    coverUrl: covers.green,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 240000,
    genreSlug: "acoustic",
    genreName: "Acoustic",
    albumTitle: "Single",
    status: "DRAFT",
    createdAt: "2026-09-18",
  },
  {
    id: 102,
    title: "Ánh Sáng Nơi Chân Trời",
    coverUrl: covers.gold,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 310000,
    genreSlug: "pop",
    genreName: "Pop",
    albumTitle: "Single",
    status: "PENDING",
    createdAt: "2026-09-19",
  },
  {
    id: 103,
    title: "Vũ Điệu Đêm Hè",
    coverUrl: covers.warm,
    audioUrl: "/audio/soundwave-demo.wav",
    durationMs: 295000,
    genreSlug: "edm",
    genreName: "EDM",
    status: "REJECTED",
    latestRejectionReason: "Âm thanh ở đoạn drop bị rè âm lượng vượt ngưỡng chuẩn. Vui lòng kiểm tra lại mastering trước khi gửi lại.",
    createdAt: "2026-09-15",
  },
];

export const demoUser: import("./types").CurrentUser = {
  id: 1,
  email: "lean@soundwave.vn",
  displayName: "Lê An",
  avatarUrl: avatar("#cffafe", "#0891b2", "LA"),
  role: "USER",
  bio: "Yêu thích sáng tác những giai điệu lofi và pop mộc.",
};

