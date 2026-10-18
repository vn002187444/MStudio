# Kế Hoạch Di Chuyển Hạ Tầng Từ Cloudflare Về NAS (Coolify Self-Hosted)

> **Mã kế hoạch:** MST-MIGRATE-COOLIFY-001  
> **Mục tiêu:** Đưa toàn bộ hệ sinh thái MStudio Channel (Web Portal, API, Database, Ingestion, Background Jobs, Media Storage) từ serverless Cloudflare Workers về máy chủ NAS gia đình / văn phòng quản lý qua **Coolify** (Self-hosted PaaS mã nguồn mở).  
> **Tiêu chí tối thượng:** 0% chi phí định kỳ cloud, toàn quyền kiểm soát dữ liệu (data sovereignty), không giới hạn CPU execution time, không phụ thuộc giới hạn Free-Tier subrequests.

---

## 1. Bản Đồ Chuyển Đổi Kiến Trúc (Architecture Mapping Matrix)

| Thành phần hiện tại (Cloudflare) | Thành phần mới trên Coolify (NAS) | Ghi chú kỹ thuật & Tối ưu |
| :--- | :--- | :--- |
| **Cloudflare Workers (Edge SSR)** (`apps/web`) | **Docker Container (Node.js 22 Alpine / Vinext SSR)** | Chạy vinext SSR server hoặc standalone Node.js container đằng sau Traefik reverse proxy. |
| **Cloudflare D1 (SQLite Edge)** | **PostgreSQL 16 Alpine** *(hoặc SQLite + Litestream mount volume NVMe)* | D1 vốn là SQLite. Có thể dùng PostgreSQL 16 để có full text search `tsvector`, concurrency cao và transaction ACID hoàn hảo. |
| **Cloudflare R2 (Object Storage)** | **MinIO S3-Compatible Storage** | Chạy MinIO container trên Coolify, lưu trữ media/ảnh vào NAS HDD RAID. Tương thích 100% với AWS S3 SDK. |
| **Cloudflare Queues** (`mstudio-events`) | **Redis 7 Alpine + BullMQ** | Thay thế Message Queue bằng Redis In-Memory. Xử lý ingest/normalize nền cực nhanh (độ trễ < 1ms). |
| **Cloudflare Cron Triggers** (15 phút/lần) | **Coolify Scheduled Tasks** hoặc **Node-cron Worker** | Định kỳ kích hoạt scheduler fetch RSS feeds tự động 24/7 mà không lo CPU timeout. |
| **Cloudflare Edge Cache / CDN** | **Traefik Reverse Proxy + Nginx Microcache** | Traefik tự động cấp phát chứng chỉ SSL Let's Encrypt, HTTP/3, gzip/brotli compression. |
| **Cloudflare Images** | **Sharp / libvips trong Docker** | Xử lý nén ảnh WebP/AVIF và crop ảnh trực tiếp trên CPU của NAS, không tốn quota. |

---

## 2. Yêu Cầu Phần Cứng & Môi Trường NAS (Prerequisites)

- **Thiết bị:** NAS x86_64 (Synology, QNAP, TrueNAS SCALE, hoặc PC cài Ubuntu Server 24.04 LTS / Debian 12).
- **Cấu hình tối thiểu đề xuất:**
  - **CPU:** 4 Cores (Intel Celeron N5105 / J4125 hoặc Core i3/i5 / AMD Ryzen).
  - **RAM:** 8GB - 16GB RAM (Coolify tốn ~1.5GB, PostgreSQL ~512MB, MinIO ~512MB, Redis ~128MB, Web Container ~512MB).
  - **Ổ cứng:**
    - NVMe SSD (256GB - 500GB): Dành cho OS, Docker data, Coolify, PostgreSQL DB và Redis (đảm bảo I/O đọc ghi tốc độ cao).
    - HDD RAID (1TB - 4TB): Dành cho MinIO lưu trữ ảnh/bài viết lịch sử và bản backup định kỳ.
- **Mạng:**
  - IP tĩnh hoặc DDNS (Cloudflare DDNS / DuckDNS).
  - Mở port modem 80, 443 (hoặc dùng **Cloudflare Tunnel / Zero Trust** trỏ về NAS nếu mạng NAT/CGNAT không có IP WAN công khai).

---

## 3. Quy Trình 6 Giai Đoạn Di Chuyển (Step-by-Step Implementation)

```mermaid
flowchart TD
    A["Giai đoạn 1: Chuẩn bị NAS & Cài Coolify"] --> B["Giai đoạn 2: Khởi tạo Database (Postgres/SQLite)"]
    B --> C["Giai đoạn 3: Dựng MinIO S3 & Sync Data R2"]
    C --> D["Giai đoạn 4: Đóng gói Docker Compose Stack"]
    D --> E["Giai đoạn 5: Cấu hình Traefik & Domain Routing"]
    E --> F["Giai đoạn 6: Kiểm thử & Chuyển đổi DNS (Cutover)"]
```

### Giai đoạn 1: Cài đặt Coolify trên NAS
Chạy lệnh cài đặt Coolify chính thức trên terminal của NAS:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
- Truy cập Dashboard qua `http://<ip-nas>:8000`.
- Tạo Workspace và kết nối Docker socket cục bộ (`localhost`).

---

### Giai đoạn 2: Di chuyển Database (D1 $\rightarrow$ PostgreSQL / SQLite Volume)

1. **Xuất dữ liệu từ Cloudflare D1 hiện tại:**
   ```bash
   wrangler d1 export mstudio-d1-prod --remote --output=./backup_d1.sql
   ```
2. **Cấu hình Database trên Coolify:**
   - Tạo Service: **PostgreSQL 16**.
   - Thiết lập Database name: `mstudio_db`, User: `mstudio_user`, Password an toàn.
   - Volume mount vào NVMe SSD: `/var/lib/postgresql/data`.
3. **Chuyển đổi cú pháp SQLite sang PostgreSQL:**
   - Dùng công cụ `pgloader` hoặc script migrate schema tự động:
     ```bash
     pgloader sqlite://backup_d1.sql postgresql://mstudio_user:password@localhost:5432/mstudio_db
     ```

---

### Giai đoạn 3: Thiết lập MinIO Storage thay thế R2

1. **Tạo service MinIO trên Coolify:**
   - Coolify $\rightarrow$ Services $\rightarrow$ MinIO.
   - Khởi tạo Bucket: `mstudio-media`.
   - Cấp phát Access Key & Secret Key.
2. **Đồng bộ ảnh từ Cloudflare R2 về MinIO:**
   - Dùng `rclone`:
     ```bash
     rclone copy r2:mstudio-bucket minio:mstudio-media --transfers=16 --checkers=32
     ```
3. Cấu hình biến môi trường trong code:
   ```env
   S3_ENDPOINT=http://minio:9000
   S3_REGION=us-east-1
   S3_BUCKET=mstudio-media
   S3_ACCESS_KEY_ID=minioadmin
   S3_SECRET_ACCESS_KEY=your_secure_minio_password
   ```

---

### Giai đoạn 4: Đóng gói Docker Stack cho MStudio Web & Workers

Tạo file `Dockerfile` tối ưu hóa cho monorepo:

```dockerfile
# Dockerfile cho MStudio Web Portal & Workers trên Coolify
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mstudio/contracts build
RUN pnpm --filter @mstudio/db build
RUN pnpm --filter web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.cloudflare/output ./output
COPY --from=builder /app/apps/web/package.json ./package.json

EXPOSE 3000
CMD ["node", "./output/v0/workers/default/bundle/ssr/index.js"]
```

Hoặc sử dụng `docker-compose.yml` tích hợp nguyên cụm trong Coolify:
- `mstudio-web`: Cổng 3000 (Giao diện độc giả & CMS Studio).
- `mstudio-worker-ingest`: Background crawler chạy ngầm fetch RSS định kỳ.
- `mstudio-redis`: Broker cho hàng đợi tin bài.
- `mstudio-postgres`: Lưu trữ dữ liệu quan hệ, bài viết, taxonomy.
- `mstudio-minio`: Lưu trữ hình ảnh và assets.

---

### Giai đoạn 5: Định tuyến Tên miền & SSL (Traefik / Cloudflare Tunnel)

Có 2 phương án đưa traffic vào NAS:

1. **Phương án A: Cloudflare Tunnel (Khuyên dùng nhất - Không cần mở port router)**
   - Cài đặt `cloudflared` container trên NAS.
   - Trỏ domain `mstudio.vn` qua Cloudflare Tunnel về IP nội bộ `http://localhost:3000`.
   - **Ưu điểm:**
     - Giấu hoàn toàn IP thật của mạng gia đình/văn phòng.
     - Vẫn hưởng trọn vẹn DDoS protection và Edge Caching của Cloudflare.
     - Không cần NAT port trên modem, hoạt động trơn tru qua cả mạng 4G/5G/CGNAT.

2. **Phương án B: Trỏ A record trực tiếp về NAS IP**
   - Mở port 80/443 trên Router về IP nội bộ NAS.
   - Traefik trên Coolify tự động kích hoạt Let's Encrypt SSL certificate.

---

### Giai đoạn 6: Kế Hoạch Sao Lưu & Khôi Phục (Backup & DR)

- **Database:** Tự động tạo snapshot pg_dump mỗi đêm lúc 03:00 và lưu trữ tại thư mục `/backup/db` trên mảng RAID.
- **Restic / Duplicati:** Đồng bộ toàn bộ container volumes lên Google Drive hoặc OneDrive cá nhân hàng tuần để chống sự cố hỏng hóc phần cứng NAS.
- **Rollback:** Giữ nguyên phiên bản Cloudflare Workers hiện tại làm fallback dự phòng. Nếu NAS mất điện hoặc rớt mạng Internet, chỉ cần đổi DNS trở lại `mstudio.vn002187444.workers.dev` trong vòng 60 giây.

---

## 4. Bảng So Sánh Chi Phí & Hiệu Năng Sau Khi Dời Host

| Tiêu chí | Cloudflare Free Tier | Self-hosted Coolify trên NAS |
| :--- | :--- | :--- |
| **Chi phí hàng tháng** | 0 VNĐ (nhưng bị chạm trần quota khi scale) | **0 VNĐ** (tận dụng phần cứng sẵn có) |
| **Giới hạn CPU runtime** | 10ms - 50ms (dễ timeout khi chạy AI parser) | **Không giới hạn** (chạy full core CPU NAS) |
| **Dung lượng lưu trữ DB** | Tối đa 10GB (D1 limit) | **Hàng trăm GB đến vài TB** (theo dung lượng ổ cứng NAS) |
| **Giới hạn Workers Request** | 100,000 req/ngày | **Không giới hạn** |
| **Quyền kiểm soát (Control)** | Phụ thuộc chính sách nhà cung cấp cloud | **100% sở hữu tư nhân**, dữ liệu đặt tại nhà |

---

## 5. Chiến Lược Hybrid Host Đỉnh Cao: Giữ R2, Giữ CF AI Workers & Kế Hoạch Test Tải NAS

> **Mục tiêu cốt lõi:** Kết hợp sức mạnh xử lý vô tận của phần cứng NAS cục bộ với năng lực phân phối toàn cầu và GPU serverless của Cloudflare, loại bỏ 100% rủi ro nghẽn CPU hoặc sập mạng gia đình.

```mermaid
flowchart TD
    Client["Độc giả toàn cầu & Mobile App"] --> CF["Cloudflare Edge CDN & WAF (Proxy)"]
    CF -->|"Phục vụ ảnh & Media (0đ Egress)"| R2["Cloudflare R2 (Giữ nguyên)"]
    CF -->|"Chạy Cron Ingest & Tóm tắt AI"| CFAi["Cloudflare AI Worker / Gateway (Giữ nguyên)"]
    CF -->|"Cloudflare Tunnel (Zero Trust)"| NAS["NAS Local - Coolify Platform"]
    
    subgraph NAS_Hardware["Máy chủ NAS Gia Đình / Văn Phòng"]
        NAS --> Web["Web Portal SSR (Container)"]
        NAS --> API["API Gateway Hono / Node.js (Container)"]
        NAS --> DB[("Database SQLite WAL / Postgres trên NVMe")]
    end
    
    CFAi -->|"Đẩy bài đã verify & tóm tắt"| API
```

### 5.1. Tạm thời giữ lại Cloudflare R2 cho Media Assets
- **Lý do kỹ thuật:** Cloudflare R2 có chính sách **$0 Egress Bandwidth** (hoàn toàn miễn phí cước tải dữ liệu ra).
  - Nếu chuyển ảnh về NAS lưu trữ, khi bài viết viral với 100.000 lượt đọc, đường truyền Internet gia đình (đặc biệt là tốc độ Upload) sẽ bị bão hòa, dẫn đến mạng nhà bị nghẽn và độc giả load ảnh bị chậm.
  - Việc tạm thời giữ R2 trên Cloudflare giúp ứng dụng trên NAS chỉ phục vụ mã HTML/JSON siêu nhẹ (~15KB/req).
- **Cách tích hợp từ NAS:**
  Container trên NAS kết nối tới R2 như một S3 bucket tiêu chuẩn thông qua `@aws-sdk/client-s3`:
  ```env
  S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  S3_BUCKET=mstudio-media-prod
  S3_ACCESS_KEY_ID=<R2_ACCESS_KEY>
  S3_SECRET_ACCESS_KEY=<R2_SECRET_KEY>
  S3_REGION=auto
  ```
  Sau khi hạ tầng NAS chạy ổn định từ 1–3 tháng, nếu muốn chuyển sang MinIO nội bộ, chỉ cần chạy 1 lệnh `rclone` đồng bộ.

---

### 5.2. Giữ nguyên Cloudflare AI Workers & Cron Jobs chạy trên Edge
- **Có để lại được không?** $\rightarrow$ **CỰC KỲ KHUYẾN NGHỊ ĐỂ LẠI!**
- **Lợi ích kiến trúc:**
  1. **Bảo vệ CPU NAS:** Các tác vụ định kỳ 5 phút cào hàng chục nguồn tin RSS, parse XML dung lượng lớn, băm SHA-256 và so khớp trùng lặp sẽ ngốn rất nhiều chu kỳ CPU. Khi để Cloudflare Cron Worker chạy, edge server của Cloudflare sẽ gánh toàn bộ tải này.
  2. **Tận dụng Serverless GPU:** Tính năng kiểm chứng sự thật và tạo bản nháp AI (`draftWithAi` qua Cloudflare Workers AI `@cloudflare/ai` hoặc Gemini qua AI Gateway) chạy trực tiếp trên cloud, NAS không cần trang bị card đồ họa rời đắt tiền (Nvidia RTX) mà vẫn có tốc độ sinh nội dung dưới 2 giây.
  3. **Quy trình đẩy dữ liệu về NAS:**
     Sau khi Cloudflare Worker hoàn tất verify và draft bài viết, nó chỉ việc gọi một HTTP POST request qua Cloudflare Tunnel vào endpoint bảo mật của API trên NAS:
     `POST https://mstudio.vn/api/v1/internal/ingest` (kèm theo Secret Token bí mật `X-Internal-Secret`).

---

### 5.3. Kế Hoạch Benchmark & Stress Test Tránh Quá Tải NAS

Để kiểm soát tuyệt đối hiệu năng và ngăn ngừa tình trạng sập hệ thống (OOM Killer hoặc CPU 100%), quy trình kiểm thử tải 3 bước được thiết lập:

#### Bước 1: Thiết lập Giới hạn Tài nguyên (Container Resource Limits) trong Coolify
Tránh để một container bị memory leak kéo sập cả hệ điều hành NAS:
```yaml
# docker-compose.prod.yml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1024M
        reservations:
          cpus: '0.5'
          memory: 256M

  api:
    deploy:
      resources:
        limits:
          cpus: '1.5'
          memory: 512M

  db:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1024M
```

#### Bước 2: Tối ưu SQLite WAL Mode trên NVMe SSD
Nếu tiếp tục dùng SQLite thay vì Postgres:
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
PRAGMA cache_size = -64000; -- Dùng 64MB RAM làm page cache
PRAGMA temp_store = MEMORY;
```
*(Đạt thông lượng hơn 20,000 reads/sec và 4,000 writes/sec trên ổ cứng NVMe thông thường).*

#### Bước 3: Kịch bản Chạy Stress Test Thực tế (Load Testing Script)
Sử dụng công cụ `k6` chạy từ máy bên ngoài:
```javascript
// k6-stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Khởi động: 50 users
    { duration: '3m', target: 200 }, // Đỉnh tải: 200 users đồng thời (tương đương 50.000 view/giờ)
    { duration: '1m', target: 0 },   // Hạ nhiệt
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% request phải dưới 300ms
    http_req_failed: ['rate<0.01'],    // Tỷ lệ lỗi dưới 1%
  },
};

export default function () {
  const res = http.get('https://mstudio.vn/');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

#### Bước 4: Chốt chặn Cache Cloudflare (Shielding Edge)
Đặt header cache trên các trang đọc tin tức:
`Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`
$\rightarrow$ **Kết quả:** Cloudflare CDN hấp thụ **88% - 94%** tổng lượng request. NAS chỉ cần xử lý khoảng 6% - 12% dynamic requests, đảm bảo CPU NAS luôn dao động an toàn ở mức **15% - 30%**.
