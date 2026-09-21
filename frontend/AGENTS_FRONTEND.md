# SoundWave Frontend — UI Consistency Rules for AI Agents

Tài liệu này là nguồn quy ước giao diện chính thức của frontend SoundWave. Mọi thành viên và AI agent phải đọc file này trước khi tạo hoặc sửa màn hình. Nếu yêu cầu của task xung đột với tài liệu này, ưu tiên yêu cầu trực tiếp của task nhưng phải ghi rõ lý do thay đổi trong phần bàn giao.

## 1. Mục tiêu thiết kế

SoundWave là website nghe và chia sẻ nhạc dành cho Guest, User, Staff và Admin. Giao diện cần mang cảm giác hiện đại, sáng, thoáng, thân thiện và tập trung vào nội dung âm nhạc.

Nguyên tắc chung:

- Thiết kế light-first, tối giản, không sao chép trực tiếp Spotify hoặc Zing MP3.
- Dùng cyan làm màu thương hiệu, tím chỉ là màu nhấn phụ.
- Ưu tiên khoảng trắng, phân cấp chữ rõ và card đơn giản.
- Không dùng quá nhiều gradient, hiệu ứng phát sáng, glassmorphism hoặc animation gây mất tập trung.
- Mọi màn hình phải dùng chung header, footer, player, button, card và trạng thái hệ thống.
- Giao diện phải hoạt động tốt ở 375px, 768px, 1024px và 1440px.
- Nội dung giao diện dùng tiếng Việt. Tên biến, type, component và code dùng tiếng Anh.

## 2. Nguồn tham chiếu bắt buộc

Trước khi xây màn hình mới, xem các file sau:

- `src/styles.css`: token, component style và responsive hiện tại.
- `src/components/LandingPage.tsx`: chuẩn về bố cục public page.
- `src/components/SoundWaveHeader.tsx`: header và điều hướng public.
- `src/components/MusicPlayer.tsx`: player dùng chung toàn hệ thống.
- `src/components/SoundWaveFooter.tsx`: footer public.
- `src/types.ts`: model dữ liệu frontend.
- `src/data.ts`: dữ liệu demo và cách đặt tên.

Không tạo một phiên bản header, footer hoặc player khác trong từng page.

## 3. Design tokens

### 3.1 Màu sắc

Chỉ sử dụng màu trực tiếp khi đang bổ sung token mới có lý do rõ ràng. Với phần còn lại, tái sử dụng token hiện có.

| Vai trò | Giá trị | Cách dùng |
|---|---:|---|
| Brand | `#0891B2` | CTA chính, trạng thái active, liên kết quan trọng |
| Brand dark | `#0E7490` | Hover, chữ nhấn trên nền sáng |
| Purple | `#7C3AED` | Màu nhấn phụ, đồ họa trang trí |
| Page background | `#F7F8FA` | Nền chính của trang |
| Surface | `#FFFFFF` | Card, header, modal, player |
| Primary text | `#101828` | Tiêu đề, nội dung quan trọng |
| Secondary text | `#667085` | Mô tả, metadata |
| Muted text | `#98A2B3` | Thông tin phụ, timestamp |
| Border | `#E4E7EC` | Viền card và divider |
| Light cyan | `#ECFEFF` | Nền badge, empty state, vùng active nhẹ |
| Error text | `#B42318` | Lỗi validation hoặc tải dữ liệu |
| Error background | `#FEF3F2` | Nền thông báo lỗi |

Quy tắc:

- CTA chính dùng cyan; mỗi vùng giao diện chỉ nên có một CTA chính nổi bật.
- Tím không thay thế cyan làm màu primary.
- Không dùng chữ xám nhạt trên nền trắng nếu tương phản không đủ.
- Trạng thái destructive dùng đỏ; không dùng đỏ cho hành động thông thường.
- Trạng thái thành công nên dùng xanh lá dịu và phải có icon hoặc text, không chỉ thể hiện bằng màu.

### 3.2 Typography

- Font chính: `Be Vietnam Pro`, fallback `Inter`, `system-ui`, `sans-serif`.
- Heading dùng weight 700–800, letter-spacing âm nhẹ.
- Body dùng weight 400–500.
- Button và label dùng weight 600–700.
- Eyebrow dùng chữ hoa, 11–12px, weight 800, letter-spacing rộng.
- Không dùng quá ba kích thước chữ trong cùng một card.
- Không dùng font trang trí khác nếu chưa được cả nhóm thống nhất.

Kích thước tham khảo:

| Thành phần | Desktop | Mobile |
|---|---:|---:|
| Hero title | 56–74px | 42–58px |
| Page title | 36–44px | 30–36px |
| Section title | 28–39px | 26–32px |
| Card title | 13–16px | 13–15px |
| Body | 14–17px | 13–15px |
| Metadata | 9–12px | 9–11px |

### 3.3 Khoảng cách và kích thước

- Container desktop tối đa `1280px`.
- Lề ngang: desktop `24px`, tablet/mobile `16px` hoặc `12px` ở màn hình rất nhỏ.
- Section spacing desktop khoảng `72–80px`; mobile khoảng `48–56px`.
- Spacing scale ưu tiên: `4, 8, 12, 16, 24, 32, 48, 64, 80`.
- Card radius: `12–16px`.
- Modal hoặc CTA lớn: `20–24px`.
- Button radius: `10–14px`.
- Icon button tối thiểu `40x40px`; vùng bấm trên mobile không nhỏ hơn `40px`.

### 3.4 Shadow và border

- Card mặc định dùng border `1px solid #E4E7EC` hoặc border trong suốt nếu chỉ hiện khi hover.
- Shadow phải nhẹ, ưu tiên `rgba(16,24,40,0.07–0.12)`.
- Không dùng shadow đen dày hoặc nhiều lớp trên card thông thường.
- Hover card được nâng tối đa khoảng `4px`.

## 4. Component rules

### 4.1 Button

Các biến thể chuẩn:

- `button-primary`: hành động chính.
- `button-secondary`: hành động phụ có viền.
- `button-ghost`: hành động ít quan trọng.
- `button-white`: CTA trên nền cyan/tím.
- `icon-button`: hành động chỉ có icon.

Mọi icon-only button bắt buộc có `aria-label`. Không tạo style button mới nếu một biến thể hiện có đã đáp ứng được.

### 4.2 Header

- Public page dùng `SoundWaveHeader`.
- Header cố định, nền trắng mờ nhẹ và có border dưới.
- Desktop hiển thị logo, navigation, search và authentication action.
- Mobile hiển thị logo, search icon, đăng ký/avatar và menu.
- Không thêm quá nhiều mục điều hướng cấp một.

### 4.3 Music card

Track Card phải có:

- Ảnh bìa vuông.
- Tên bài hát.
- Tên creator/người đăng.
- Metadata cần thiết như lượt nghe.
- Play/Pause button.
- Active state khi bài đang phát.

Bấm tên bài mở Track Details. Bấm creator mở User/Creator Profile. Không dùng từ Artist cho actor hệ thống vì mọi User đều có thể đăng nhạc.

### 4.4 Album card

- Ảnh vuông, tên album, creator và năm phát hành.
- Toàn bộ card có thể click.
- Hover chỉ scale ảnh nhẹ và hiển thị nút Play.

### 4.5 Creator card

- Avatar tròn.
- Display name.
- Bio ngắn tối đa khoảng hai dòng.
- Số bài đã phát hành.
- Hành động `Xem hồ sơ`.

### 4.6 Form

- Label luôn hiển thị; placeholder không thay thế label.
- Input cao tối thiểu 44px.
- Hiển thị lỗi ngay dưới field bằng text và icon khi phù hợp.
- Disable submit khi request đang xử lý.
- Không xóa dữ liệu người dùng đã nhập khi API lỗi.

#### Quy tắc thông báo validation

- Tuyệt đối không sử dụng thông báo validation mặc định của trình duyệt cho các form của SoundWave.
- Không dựa riêng vào `required`, `type="email"`, `minLength`, `maxLength` hoặc `pattern` để trình duyệt tự hiển thị popup lỗi.
- Form có validation tùy chỉnh phải dùng `noValidate` và kiểm tra dữ liệu trong submit handler hoặc validation schema dùng chung.
- Không dùng `window.alert()` để thông báo lỗi nhập liệu.
- Khi người dùng submit form không hợp lệ, phải hiển thị một hộp cảnh báo chung ở đầu form và thông báo cụ thể ngay dưới từng field bị lỗi.
- Field lỗi phải có trạng thái trực quan thống nhất: label và nội dung lỗi màu `#B42318`, viền đỏ, nền đỏ rất nhạt và icon cảnh báo khi phù hợp.
- Nội dung lỗi phải cụ thể bằng tiếng Việt, ví dụ `Bạn chưa nhập địa chỉ email.`; không dùng thông báo chung chung như `Invalid value` hoặc hiển thị raw API error.
- Sau khi validation thất bại, focus phải tự chuyển đến field lỗi đầu tiên để hỗ trợ bàn phím và trình đọc màn hình.
- Field lỗi phải có `aria-invalid="true"`; thông báo lỗi phải được liên kết bằng `aria-describedby`.
- Hộp cảnh báo chung dùng `role="alert"` hoặc `aria-live="polite"` để công nghệ hỗ trợ nhận biết thay đổi.
- Khi người dùng chỉnh lại một field, chỉ xóa lỗi của field đó; không xóa dữ liệu hoặc lỗi của các field khác.
- Lỗi validation phía client và lỗi nghiệp vụ/API phải được phân biệt. Lỗi API hiển thị bằng nội dung thân thiện, không làm mất dữ liệu đã nhập.

### 4.7 Modal

- Chỉ dùng modal cho quyết định cần tập trung hoặc hành động ngắn.
- Modal cần heading, mô tả rõ và tối đa hai hành động chính.
- Nút đóng hoặc Cancel phải rõ ràng.
- Focus phải đi vào modal khi mở và trở về vị trí cũ khi đóng.
- Mobile xếp button theo chiều dọc nếu không đủ chỗ.

### 4.8 Player

- Chỉ có một `MusicPlayer` dùng chung ở cấp ứng dụng.
- Player cố định dưới màn hình và không được che nội dung; page/footer phải có bottom padding tương ứng.
- Desktop gồm thông tin track, controls, timeline, volume và queue.
- Mobile giữ ảnh bìa, tên bài, creator, Play/Pause và Next.
- Thời gian chạy lấy từ `audio.currentTime`.
- Tổng thời lượng ưu tiên `audio.duration`; `durationMs` là fallback.
- Khi Guest nghe hết bài, mở `GuestLoginPrompt`; chọn tiếp tục thì phát bài kế tiếp.
- Lời nhắc Guest không được lưu vào bảng `notifications`.

## 5. Bố cục theo nhóm màn hình

### Public/User pages

- Giữ nền sáng `#F7F8FA`.
- Dùng container tối đa 1280px.
- Track Details, Album Details và User/Creator Profile là ba màn hình riêng.
- Các màn hình khám phá sử dụng cùng Track Card, Album Card và Creator Card với landing page.
- Player phải tồn tại khi điều hướng giữa các trang public.

### Staff/Admin pages

- Dùng chung token màu, typography, button, form và modal với public pages.
- Có thể dùng dashboard shell riêng gồm sidebar và top bar.
- Bảng dữ liệu ưu tiên dễ đọc; không trang trí quá nhiều.
- Status badge phải thống nhất: pending, approved, rejected, hidden, open, resolved.
- Hành động nguy hiểm như Reject, Ban, Delete cần confirm và mô tả hậu quả.

## 6. Responsive rules

Các breakpoint chuẩn:

- Mobile: dưới `680px`.
- Tablet: `680px–860px`.
- Small desktop: `861px–1100px`.
- Desktop: trên `1100px`.

Quy tắc:

- Card nhạc/album trên mobile có thể cuộn ngang với scroll snap.
- Không thu nhỏ card đến mức tên và nút khó đọc.
- Data table trên mobile chuyển sang card hoặc cho phép cuộn ngang có chủ đích.
- Không để xuất hiện horizontal scrollbar toàn trang.
- Không ẩn chức năng quan trọng chỉ vì màn hình nhỏ.
- Kiểm tra player, modal và dropdown tại 375px.

## 7. Loading, empty, error và image fallback

Mỗi màn hình lấy dữ liệu phải có đủ:

1. Loading skeleton có hình dạng gần với nội dung thật.
2. Empty state giải thích tại sao chưa có dữ liệu và cung cấp hành động tiếp theo nếu phù hợp.
3. Error state có thông báo dễ hiểu và nút `Thử lại`.
4. Image fallback cho cover/avatar lỗi hoặc null.

Không dùng spinner toàn màn hình cho danh sách dài nếu skeleton phù hợp hơn. Không hiển thị raw API error trực tiếp cho người dùng.

## 8. Accessibility

- Tất cả ảnh nội dung phải có `alt`; ảnh trang trí dùng `alt=""`.
- Icon-only button bắt buộc có `aria-label`.
- Dùng đúng heading hierarchy: mỗi page có một `h1`; section dùng `h2`; card dùng `h3` khi cần.
- Mọi thao tác phải sử dụng được bằng bàn phím.
- Focus state phải nhìn thấy rõ.
- Không chỉ dùng màu để truyền đạt trạng thái.
- Tôn trọng `prefers-reduced-motion`.
- Modal dùng `role="dialog"`, `aria-modal="true"` và quản lý focus.
- Text và background phải có độ tương phản đủ đọc.

## 9. Dữ liệu, routing và authorization

- Component nhận dữ liệu qua props; không hard-code dữ liệu nghiệp vụ bên trong card.
- Type dùng chung đặt trong `src/types.ts`.
- Mock data đặt trong `src/data.ts` hoặc module mock riêng.
- Khi có API, giữ nguyên interface component và thay data source ở service/hook.
- Chỉ hiển thị track có `publicationStatus === "APPROVED"` trên public pages.
- Frontend có thể ẩn action theo role nhưng backend vẫn phải kiểm tra quyền.
- Không đưa logic role phức tạp trực tiếp vào component trình bày.
- Hash route hiện tại là tạm thời; khi thêm React Router, route phải giữ cấu trúc ý nghĩa như `/tracks/:id`, `/albums/:id`, `/creators/:id`.

## 10. Cấu trúc code

Khi dự án mở rộng, ưu tiên cấu trúc:

```text
src/
  api/             API client và endpoint
  components/
    common/        Button, Modal, EmptyState, Skeleton
    music/         TrackCard, AlbumCard, MusicPlayer
    layout/        Header, Footer, DashboardShell
  features/        auth, catalog, playlist, studio, moderation
  hooks/           Hook dùng chung
  pages/           Màn hình theo route
  styles/          Token và style dùng chung nếu styles.css quá lớn
  types/           Type theo domain khi types.ts quá lớn
  utils/           Formatter và helper thuần
```

Quy tắc code:

- Component dùng PascalCase; hook dùng tiền tố `use`; function/variable dùng camelCase.
- Không tạo component lớn hơn khoảng 250–300 dòng nếu có thể tách theo trách nhiệm.
- Không copy/paste card hoặc modal giữa nhiều page.
- Không dùng inline style trừ giá trị dữ liệu động như màu genre hoặc progress percentage.
- Không thêm UI library mới nếu chưa có lý do và thống nhất với nhóm.
- Không sửa global token chỉ để giải quyết một màn hình riêng.
- Không lưu server state trùng lặp ở nhiều component.

## 11. Quy trình làm việc dành cho AI agent

Trước khi code:

1. Đọc `AGENTS.md`.
2. Tìm component tương tự trong dự án bằng `rg`.
3. Tái sử dụng component và CSS hiện có.
4. Xác định đủ loading, empty, error, unauthorized và success state.
5. Xác định desktop/mobile behavior trước khi chỉnh code.

Trong khi code:

1. Giữ thay đổi trong phạm vi task.
2. Không đổi token hoặc component dùng chung một cách âm thầm.
3. Không tạo mock API bên trong JSX.
4. Dùng semantic HTML và accessibility attribute.
5. Giữ toàn bộ text giao diện bằng tiếng Việt và nhất quán thuật ngữ.

Sau khi code:

1. Chạy `npm run typecheck`.
2. Chạy `npm run build`.
3. Kiểm tra trực quan ở 375px, 768px, 1024px và 1440px.
4. Kiểm tra keyboard focus, empty/error/loading state.
5. Kiểm tra player không che nội dung.
6. Báo cáo component đã tái sử dụng, token mới nếu có và giới hạn còn lại.

## 12. Definition of Done cho một màn hình

Một màn hình chỉ được xem là hoàn thành khi:

- Khớp design token và component chuẩn.
- Có desktop và mobile layout.
- Có loading, empty và error state nếu tải dữ liệu.
- Có accessibility label và keyboard interaction.
- Không có horizontal overflow ngoài vùng cuộn có chủ đích.
- Không có TypeScript error.
- Build thành công.
- Không làm hỏng landing page hoặc player.
- Mọi link/action chính có hành vi rõ ràng.
- Không hiển thị dữ liệu trái với role hoặc publication status.

## 13. Những điều không được tự ý làm

- Không đổi cyan primary sang màu khác.
- Không tạo dark theme khi chưa có yêu cầu.
- Không tạo actor hoặc giao diện “Đăng ký làm nghệ sĩ”.
- Không gọi User đăng nhạc là Artist trong nghiệp vụ.
- Không thêm lyric đồng bộ thời gian khi scope hiện tại chỉ dùng lyric dạng text.
- Không thêm AI recommendation và gọi nội dung là cá nhân hóa khi chưa có backend hỗ trợ.
- Không thêm animation nặng hoặc autoplay video/audio.
- Không thay đổi player thành component riêng cho từng page.
- Không bỏ qua trạng thái Guest, Staff hoặc Admin khi chức năng có phân quyền.
- Không dùng dữ liệu chưa được duyệt trên public pages.

## 14. Checklist bàn giao ngắn

```text
[ ] Đã tái sử dụng component hiện có
[ ] Đúng màu, font, spacing và radius
[ ] Có loading / empty / error state
[ ] Responsive 375 / 768 / 1024 / 1440
[ ] Keyboard và aria-label hoạt động
[ ] Form không dùng thông báo validation mặc định của trình duyệt
[ ] Không có horizontal overflow ngoài vùng cho phép
[ ] Player không che nội dung
[ ] npm run typecheck thành công
[ ] npm run build thành công
[ ] Đã ghi rõ thay đổi token hoặc component dùng chung
```
