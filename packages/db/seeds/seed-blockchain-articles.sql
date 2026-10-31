-- seed-blockchain-articles.sql
-- Seed high quality blockchain published articles for MStudio Channel

INSERT OR IGNORE INTO articles (
  id, story_id, status, current_revision_id, published_revision_id, publish_key,
  created_at, updated_at, slug, category_slug, hero_image_url, video_url,
  meta_title, meta_description, canonical_url, og_image_url, keywords,
  source_count, quality_score, is_breaking, is_trending
) VALUES
(
  'art-btc-etf-record-2026',
  '83c1e8e1-1695-4cc7-990a-077dc724f3b2',
  'published',
  'rev-btc-etf-2026',
  'rev-btc-etf-2026',
  'art-btc-etf-record-2026:rev-btc-etf-2026',
  '2026-10-18T10:00:00.000Z',
  '2026-10-18T10:00:00.000Z',
  'bitcoin-vuot-nguong-tam-ly-khi-dong-von-etf-toan-cau-tang-ky-luc',
  'blockchain',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  NULL,
  'Bitcoin vượt ngưỡng tâm lý khi dòng vốn ETF toàn cầu tăng kỷ lục | MStudio Channel',
  'Dòng vốn ròng từ các quỹ ETF Bitcoin giao ngay tại thị trường Hoa Kỳ và châu Á đã liên tục thiết lập kỷ lục mới trong quý này. Sự tham gia tích cực từ các định chế tài chính truyền thống lớn xác nhận dòng vốn đang dịch chuyển mạnh mẽ. Kết quả là, điều này không chỉ củng cố niềm tin vào tài sản mã hóa mà còn tạo động lực lớn để thị trường bước vào chu kỳ tăng trưởng bền vững.',
  'https://mstudio.minds.io.vn/bai-viet/bitcoin-vuot-nguong-tam-ly-khi-dong-von-etf-toan-cau-tang-ky-luc',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  'blockchain, bitcoin, etf, crypto, tai chinh',
  2,
  94.5,
  1,
  1
),
(
  'art-eth-l2-scaling-2026',
  '83c1e8e1-1695-4cc7-990a-077dc724f3b2',
  'published',
  'rev-eth-l2-2026',
  'rev-eth-l2-2026',
  'art-eth-l2-scaling-2026:rev-eth-l2-2026',
  '2026-10-18T14:30:00.000Z',
  '2026-10-18T14:30:00.000Z',
  'ethereum-nang-cap-layer-2-phi-giao-dich-giam-90-phan-tram',
  'blockchain',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
  NULL,
  'Ethereum nâng cấp Layer 2: Phí giao dịch giảm 90% mở đường cho ứng dụng đại chúng',
  'Việc triển khai thành công các bản nâng cấp mở rộng kiến trúc tối ưu trên hệ sinh thái Ethereum đã giúp phí giao dịch giảm xuống mức thấp kỷ lục. Các mạng lưới Layer 2 chứng kiến khối lượng giao dịch bùng nổ và tổng giá trị tài sản khóa (TVL) đạt đỉnh mới trong vòng 18 tháng qua. Diễn biến này mở ra lộ trình phát triển đột phá cho ứng dụng tài chính phi tập trung (DeFi) và thúc đẩy ứng dụng Web3 tiến dần đến thị trường đại chúng.',
  'https://mstudio.minds.io.vn/bai-viet/ethereum-nang-cap-layer-2-phi-giao-dich-giam-90-phan-tram',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
  'blockchain, ethereum, layer 2, defi, web3',
  3,
  91.0,
  0,
  1
);

INSERT OR IGNORE INTO article_revisions (
  id, article_id, revision_number, title, body, summary, created_at
) VALUES
(
  'rev-btc-etf-2026',
  'art-btc-etf-record-2026',
  1,
  'Bitcoin vượt ngưỡng tâm lý khi dòng vốn ETF toàn cầu tăng kỷ lục',
  'Dòng vốn ròng đổ vào các quỹ ETF Bitcoin giao ngay tại Hoa Kỳ và châu Á đã thiết lập cột mốc mới, phản ánh sự tham gia mạnh mẽ của các tổ chức tài chính truyền thống.

## Động lực tăng trưởng từ các tổ chức tài chính

- **Sự thật kiểm chứng:** Các định chế quản lý tài sản hàng đầu thế giới liên tục nâng tỷ trọng phân bổ danh mục vào Bitcoin ETF. *(Nguồn / source: CoinDesk)*

- **Sự thật kiểm chứng:** Khối lượng giao dịch hàng ngày trên các sàn giao dịch phi tập trung (DEX) và tập trung (CEX) tăng hơn 35% so với cùng kỳ. *(Nguồn / source: On-Chain Analytics)*

## Phân tích tác động và xu hướng on-chain

- Dữ liệu on-chain cho thấy lượng Bitcoin lưu thông trên các sàn giao dịch giảm xuống mức thấp nhất trong 5 năm qua, dấu hiệu cho thấy áp lực bán suy giảm mạnh mẽ.

---

Nguồn: CoinDesk / On-Chain Analytics
Original: https://www.coindesk.com/markets',
  'Dòng vốn ròng từ các quỹ ETF Bitcoin giao ngay tại thị trường Hoa Kỳ và châu Á đã liên tục thiết lập kỷ lục mới trong quý này. Sự tham gia tích cực từ các định chế tài chính truyền thống lớn xác nhận dòng vốn đang dịch chuyển mạnh mẽ. Kết quả là, điều này không chỉ củng cố niềm tin vào tài sản mã hóa mà còn tạo động lực lớn để thị trường bước vào chu kỳ tăng trưởng bền vững.',
  '2026-10-18T10:00:00.000Z'
),
(
  'rev-eth-l2-2026',
  'art-eth-l2-scaling-2026',
  1,
  'Ethereum nâng cấp Layer 2: Phí giao dịch giảm 90% mở đường cho ứng dụng đại chúng',
  'Hệ sinh thái Ethereum bước vào giai đoạn mở rộng đột phá khi các mạng lưới Layer 2 ghi nhận mức phí giao dịch giảm sâu kỷ lục, tạo điều kiện thuận lợi cho các ứng dụng tài chính phi tập trung (DeFi) và thanh toán vi mô.

## Bước tiến công nghệ mở rộng mạng lưới

- **Sự thật kiểm chứng:** Phí gas trung bình trên các mạng L2 lớn như Arbitrum, Optimism và Base đã giảm hơn 90%, duy trì ổn định dưới mức 0.01 USD mỗi giao dịch. *(Nguồn / source: Cointelegraph)*

- **Sự thật kiểm chứng:** Tổng giá trị tài sản bị khóa (TVL) trên toàn bộ hệ sinh thái DeFi chạm mốc cao nhất trong 18 tháng qua. *(Nguồn / source: L2Beat)*

## Xu hướng phát triển Web3 trong tương lai

- Trải nghiệm người dùng trong các ứng dụng Web3 ngày càng tiếp cận gần hơn với các ứng dụng Web2 truyền thống nhờ việc trừu tượng hóa tài khoản (Account Abstraction) và tốc độ xác thực khối tức thì.

---

Nguồn: Cointelegraph / L2Beat
Original: https://cointelegraph.com/ethereum',
  'Việc triển khai thành công các bản nâng cấp mở rộng kiến trúc tối ưu trên hệ sinh thái Ethereum đã giúp phí giao dịch giảm xuống mức thấp kỷ lục. Các mạng lưới Layer 2 chứng kiến khối lượng giao dịch bùng nổ và tổng giá trị tài sản khóa (TVL) đạt đỉnh mới trong vòng 18 tháng qua. Diễn biến này mở ra lộ trình phát triển đột phá cho ứng dụng tài chính phi tập trung (DeFi) và thúc đẩy ứng dụng Web3 tiến dần đến thị trường đại chúng.',
  '2026-10-18T14:30:00.000Z'
);
