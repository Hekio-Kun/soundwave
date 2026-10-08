# SoundWave Landing Page

Frontend prototype độc lập cho landing page SoundWave, xây bằng React, TypeScript và Vite.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://127.0.0.1:4174/`.

## Kiểm tra

```bash
npm run typecheck
npm run build
```

## Dữ liệu demo

- Dữ liệu landing page nằm trong `src/data.ts` và có thể được thay bằng API mà không đổi cấu trúc component.
- Audio demo cục bộ nằm trong `public/audio/soundwave-demo.wav` để player hoạt động khi không có Cloudinary.
- Đặt `localStorage.soundwave_demo_user = "authenticated"` để mô phỏng User đã đăng nhập; mặc định trang chạy ở chế độ Guest.
- Dùng `?state=error` hoặc `?state=empty` để xem trạng thái lỗi và không có dữ liệu.

Các liên kết chi tiết hiện dùng hash route, ví dụ `#/track/1`, để sẵn sàng thay bằng React Router khi các màn hình còn lại được triển khai.
