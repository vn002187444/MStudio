# Hướng Dẫn Chi Tiết Triển Khai MStudio Trên Máy Chủ NAS (Coolify Self-Hosted)

> Tài liệu hướng dẫn từng bước (Step-by-Step Runbook) để nạp dữ liệu và vận hành hệ thống MStudio trên máy chủ NAS cá nhân / văn phòng qua **Coolify**.

---

## 1. Các File Cần Thiết Đã Sẵn Sàng Trong Thư Mục Dự Án

| Tên File | Vị trí | Mục đích |
| :--- | :--- | :--- |
| **`mstudio_dev_dump.sql`** | Gốc thư mục (`d:\MStudio\mstudio_dev_dump.sql`) | Bản sao lưu toàn bộ 515 bài viết, 75+ nguồn tin RSS, taxonomy và cấu hình hệ thống từ Cloudflare D1 (77.8 MB). |
| **`Dockerfile`** | Gốc thư mục (`d:\MStudio\Dockerfile`) | Bản đóng gói Multi-stage build Node.js 22 Alpine tối ưu dung lượng RAM và CPU cho NAS. |
| **`docker-compose.coolify.yml`** | Gốc thư mục (`d:\MStudio\docker-compose.coolify.yml`) | File cấu hình stack Coolify (Web Container + Cloudflare Tunnel + Resource Limits). |

---

## 2. Quy Trình 4 Bước Triển Khai Trên NAS

### Bước 1: Sao chép file bản dump `mstudio_dev_dump.sql` lên NAS

Từ terminal máy tính Windows, bạn có thể chuyển file bản dump vào thư mục dữ liệu trên NAS bằng lệnh `scp` hoặc qua giao diện File Station / SMB của NAS:

```bash
# Ví dụ sao chép qua SSH (thay user và ip_nas bằng thông tin thật của bạn):
scp d:\MStudio\mstudio_dev_dump.sql user@<IP_NAS>:/home/user/mstudio/
```

Hoặc nếu NAS có giao diện Web (Synology DSM / TrueNAS / QNAP), bạn chỉ cần kéo thả file `mstudio_dev_dump.sql` vào thư mục chia sẻ `/docker/mstudio/data`.

---

### Bước 2: Nạp dữ liệu vào cơ sở dữ liệu SQLite trên NAS

Trên NAS (hoặc qua terminal SSH của NAS):

```bash
# 1. Tạo thư mục chứa dữ liệu SQLite nếu chưa có
mkdir -p /data/mstudio
cd /home/user/mstudio

# 2. Khởi tạo database mstudio.db từ file dump
sqlite3 /data/mstudio/mstudio.db < mstudio_dev_dump.sql

# 3. Kích hoạt chế độ WAL (Write-Ahead Logging) siêu tốc trên SSD của NAS:
sqlite3 /data/mstudio/mstudio.db "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA cache_size=-64000;"
```

> **Ghi chú hiệu năng:** Sau khi bật WAL mode, SQLite trên ổ cứng NVMe/SSD của NAS có thể phục vụ hơn **20.000 lượt đọc/giây**, đáp ứng hàng trăm ngàn lượt đọc mỗi ngày mà CPU không bị nóng.

---

### Bước 3: Triển khai dự án trên Coolify Dashboard

1. Mở giao diện Coolify: `http://<IP_NAS>:8000`.
2. Vào mục **Projects** $\rightarrow$ chọn **+ New Project** $\rightarrow$ đặt tên `MStudio`.
3. Chọn **+ New Resource** $\rightarrow$ Chọn **Docker Compose**.
4. Dán toàn bộ nội dung từ file [`docker-compose.coolify.yml`](file:///d:/MStudio/docker-compose.coolify.yml) vào khung soạn thảo.
5. Cấu hình biến môi trường (**Environment Variables**) trong Coolify:
   - `PORT=3000`
   - `DATABASE_URL=file:/data/mstudio.db`
   - `CLOUDFLARE_R2_BUCKET=mstudio-raw`
   - `CLOUDFLARE_TUNNEL_TOKEN=<Mã_Token_Cloudflare_Tunnel_của_bạn>` (Nếu dùng Tunnel)
6. Tại mục **Storage / Persistent Volumes**, map thư mục SQLite:
   - Host path: `/data/mstudio` $\rightarrow$ Container path: `/data`
7. Bấm **Deploy**. Coolify sẽ tự động kéo mã nguồn từ GitHub hoặc build Dockerfile nội bộ.

---

### Bước 4: Định Tuyến Tên Miền (Domain & SSL)

Có 2 phương án đưa traffic từ internet về NAS:

#### Phương Án 1: Cloudflare Tunnel (Khuyên dùng nhất - Không cần mở port Router)
1. Trên Cloudflare Zero Trust Dashboard $\rightarrow$ **Networks** $\rightarrow$ **Tunnels** $\rightarrow$ Tạo Tunnel mới.
2. Sao chép `TUNNEL_TOKEN` và điền vào biến môi trường `CLOUDFLARE_TUNNEL_TOKEN` trong Coolify.
3. Cấu hình Public Hostname trong Cloudflare Tunnel:
   - Domain: `mstudio.vn` (hoặc subdomain bạn chọn)
   - Service: `HTTP` trỏ tới `web:3000`
4. **Ưu điểm:** Giấu 100% IP nhà mạng, miễn nhiễm scan port hay DDoS, không cần mở port modem.

#### Phương Án 2: Mở Port Modem Trực Tiếp
- Mở port 80 và 443 trên Router trỏ về IP nội bộ của NAS.
- Traefik của Coolify sẽ tự động tạo chứng chỉ SSL Let's Encrypt miễn phí.

---

## 3. Lợi Ích Của Kiến Trúc Hybrid Được Kích Hoạt

- **Media & Ảnh:** Vẫn phục vụ từ Cloudflare R2 (0 VNĐ cước băng thông tải ra, không làm nghẽn đường truyền Internet nhà bạn).
- **Trí tuệ nhân tạo (AI):** Các tác vụ suy luận LLM nặng vẫn chạy qua Cloudflare Workers AI / Gemini Gateway ở biên Edge (không làm nóng CPU/GPU của NAS).
- **Lưu trữ & Truy vấn:** Chạy trực tiếp trên ổ cứng SSD của NAS, phá vỡ giới hạn 50.000 lượt ghi/ngày của D1 Free Tier.
