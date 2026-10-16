# Hướng dẫn kết nối Cloudflare Pages tự động Build & Deploy từ GitHub

Tài liệu này hướng dẫn cách cấu hình Cloudflare Pages để tự động hóa 100% quy trình build và deploy trang tin tức **MStudio Channel** (`apps/web`) và **MStudio CMS** (`apps/studio`) mỗi khi có commit mới trên nhánh `main`, loại bỏ hoàn toàn việc phải chạy lệnh build thủ công từ máy tính cá nhân.

---

## 1. Thiết lập cho ứng dụng Web (`apps/web` - https://mstudio.minds.io.vn)

### Bước 1: Tạo dự án mới trên Cloudflare Dashboard
1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/) -> Chọn tài khoản của bạn.
2. Tại menu bên trái, vào **Workers & Pages** -> Chọn tab **Pages** -> Bấm **Connect to Git** (hoặc **Create an application** -> **Pages** -> **Connect to Git**).
3. Đăng nhập / Chọn tài khoản GitHub của bạn (`vn002187444`) và chọn kho lưu trữ **`MStudio`**.

### Bước 2: Cấu hình Build Settings (Thiết lập bản dựng)
Điền chính xác các thông số sau:

| Mục cấu hình | Giá trị thiết lập | Ghi chú |
| :--- | :--- | :--- |
| **Project name** | `mstudio-web` | Tên dự án Pages |
| **Production branch** | `main` | Nhánh triển khai tự động |
| **Framework preset** | `None` | Để trống hoặc None để sử dụng cấu hình tùy chỉnh |
| **Root directory** | `apps/web` | Thư mục mã nguồn của ứng dụng Web |
| **Build command** | `npm ci && npm run build` | Cài đặt package và build Vite/Vinext |
| **Build output directory** | `.cloudflare/output/v0/workers/default/assets` | Thư mục chứa tài nguyên tĩnh đã tối ưu hóa |

### Bước 3: Thêm biến môi trường (Environment variables)
Tại mục **Environment variables (advanced)**, thêm các biến sau:
- `NODE_VERSION` = `24` (Bắt buộc để tương thích với Vinext và runtime mới nhất)
- `MSTUDIO_API_URL` = `https://mstudio-api.vn002187444.workers.dev`

### Bước 4: Hoàn tất & Gắn Custom Domain
1. Bấm **Save and Deploy**. Cloudflare Pages sẽ tự động kích hoạt lượt build đầu tiên từ GitHub.
2. Sau khi build thành công, vào tab **Custom domains** của dự án `mstudio-web`.
3. Bấm **Set up a custom domain** -> Nhập `mstudio.minds.io.vn` -> Xác nhận để Cloudflare tự động cấu hình DNS và chứng chỉ SSL miễn phí.

---

## 2. Thiết lập cho Studio CMS (`apps/studio` - Tùy chọn)

Nếu bạn muốn tách CMS Studio thành một dự án Cloudflare Pages độc lập:
- **Project name**: `mstudio-cms`
- **Root directory**: `apps/studio`
- **Build command**: `npm ci && npm run build`
- **Build output directory**: `.cloudflare/output/v0/workers/default/assets`
- **Biến môi trường**:
  - `NODE_VERSION` = `24`
  - `MSTUDIO_API_URL` = `https://mstudio-api.vn002187444.workers.dev`

---

## 3. Lợi ích sau khi kích hoạt
1. **Hoàn toàn tự động**: Mỗi lần commit & push code lên GitHub, Cloudflare Pages sẽ tự động pull code, build và deploy trong khoảng 1-2 phút mà không cần mở terminal ở máy tính.
2. **Preview Deployments**: Mọi pull request hoặc nhánh con đều được tạo một URL xem trước riêng biệt (`https://<commit-hash>.mstudio-web.pages.dev`).
3. **Không tốn tài nguyên máy cá nhân**: Việc biên dịch và tối ưu hóa tài nguyên hoàn toàn diễn ra trên hạ tầng đám mây của Cloudflare.
