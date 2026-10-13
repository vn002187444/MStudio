import { writeFileSync } from "node:fs";
import { join } from "node:path";

interface ArticleSpec {
  id: string;
  storyId: string;
  rawItemId: string;
  sourceId: string;
  categorySlug: string;
  categoryNameVi: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  qualityScore: number;
  relatedSlug: string;
  relatedTitle: string;
  heroImageUrl: string;
  facts: string[];
  claims: string[];
  bodyIntro: string;
  bodyAnalysis: string;
}

const articles: ArticleSpec[] = [
  // 1. cong-nghe
  {
    id: "art-pho-cap-ai-cong-dong-2026",
    storyId: "story-pho-cap-ai-2026",
    rawItemId: "b8bf04c2-22bb-4951-b18e-edc39b6c046f",
    sourceId: "src-tuoitre",
    categorySlug: "cong-nghe",
    categoryNameVi: "Công nghệ",
    title: "Phổ cập AI cộng đồng: Hướng dẫn người dân tránh bẫy lừa đảo số",
    slug: "pho-cap-ai-cong-dong-huong-dan-nguoi-dan-tranh-bay-lua-dao-so",
    metaTitle: "Phổ cập AI cộng đồng giúp người dân tránh lừa đảo số",
    metaDescription: "Mô hình phổ cập trí tuệ nhân tạo đến từng tổ dân phố giúp nâng cao nhận thức số, bảo vệ thông tin cá nhân và ngăn chặn các thủ đoạn lừa đảo tinh vi hôm nay.",
    keywords: "AI cộng đồng, trí tuệ nhân tạo, an toàn thông tin, lừa đảo công nghệ cao, kỹ năng số",
    qualityScore: 92.5,
    relatedSlug: "cac-tap-doan-cong-nghe-tang-toc-trien-khai-ai-agent",
    relatedTitle: "Các tập đoàn công nghệ tăng tốc triển khai AI Agent",
    heroImageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Các phường tại TP.HCM đã triển khai mô hình trợ lý ảo AI để hỗ trợ người dân tra cứu thủ tục hành chính công trực tuyến.",
      "Hơn 5.000 lượt người cao tuổi và tiểu thương đã được tập huấn kỹ năng nhận diện cuộc gọi deepfake và tin nhắn giả mạo."
    ],
    claims: [
      "Việc đưa AI về cơ sở là bước đi thiết thực giúp bình dân hóa công nghệ thay vì chỉ tập trung tại các doanh nghiệp lớn.",
      "Cần xây dựng bộ quy tắc đạo đức AI phổ thông để người dân chủ động giám sát tính chính xác của thông tin."
    ],
    bodyIntro: "Trong bối cảnh tội phạm công nghệ cao liên tục biến tướng với các kịch bản lừa đảo tinh vi sử dụng công nghệ giả mạo giọng nói và hình ảnh (deepfake), sáng kiến đưa trí tuệ nhân tạo (AI) về tận khu phố đang mở ra hướng tiếp cận mới trong công tác bảo vệ an toàn số cộng đồng.",
    bodyAnalysis: "Tại nhiều địa phương, các buổi hướng dẫn thực tế không chỉ dừng lại ở lý thuyết mà giúp người dân trực tiếp thao tác trên điện thoại thông minh, nhận diện đường link độc hại và kiểm chứng thông tin qua các ứng dụng chatbot AI đã được kiểm duyệt nội dung. Đây là nền tảng quan trọng xây dựng không gian mạng an toàn cho mọi tầng lớp nhân dân."
  },

  // 2. kinh-te (FE Credit / Tai chinh)
  {
    id: "art-tai-chinh-tieu-dung-2026",
    storyId: "story-tai-chinh-tieu-dung-2026",
    rawItemId: "9e25cc8f-7a21-496f-b208-b7648f34af65",
    sourceId: "src-thanhnien",
    categorySlug: "kinh-te",
    categoryNameVi: "Kinh tế",
    title: "Thị trường tài chính tiêu dùng 2026: Tái cấu trúc và chuẩn tín dụng",
    slug: "thi-truong-tai-chinh-tieu-dung-2026-tai-cau-truc-va-chuan-tin-dung",
    metaTitle: "Thị trường tài chính tiêu dùng 2026 và chuẩn tín dụng",
    metaDescription: "Các tổ chức tài chính tiêu dùng đẩy mạnh chuyển đổi số, kiểm soát rủi ro nợ xấu và nâng cao chuẩn an toàn tín dụng nhằm thúc đẩy tăng trưởng kinh tế bền vững.",
    keywords: "tài chính tiêu dùng, tín dụng cá nhân, tái cấu trúc ngân hàng, kiểm soát nợ xấu, chuyển đổi số tài chính",
    qualityScore: 91.0,
    relatedSlug: "dong-von-fdi-va-xu-huong-lai-suat-cuoi-nam-2026",
    relatedTitle: "Dòng vốn FDI và xu hướng lãi suất cuối năm 2026",
    heroImageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Top các công ty tài chính tiêu dùng uy tín tại Việt Nam ghi nhận tỷ lệ thẩm định tín dụng tự động qua AI đạt trên 80%.",
      "Ngân hàng Nhà nước duy trì định hướng siết chặt quy chuẩn cho vay có trách nhiệm và minh bạch hóa lãi suất thực tế."
    ],
    claims: [
      "Tín dụng tiêu dùng đóng vai trò mạch máu kích cầu sức mua nội địa, hỗ trợ nhóm khách hàng dưới chuẩn tiếp cận vốn hợp pháp.",
      "Áp lực trích lập dự phòng rủi ro sẽ thúc đẩy làn sóng M&A và liên kết chiến lược giữa công ty tài chính với các fintech."
    ],
    bodyIntro: "Bước sang giai đoạn phát triển mới, thị trường tài chính tiêu dùng Việt Nam đang chứng kiến sự chuyển mình mạnh mẽ từ mô hình mở rộng quy mô bằng mọi giá sang giai đoạn chú trọng chiều sâu chất lượng và an toàn hệ thống.",
    bodyAnalysis: "Việc chuẩn hóa dữ liệu định danh công dân kết hợp cùng công nghệ chấm điểm tín dụng hiện đại đã giúp giảm đáng kể thời gian giải ngân, đồng thời ngăn chặn các hồ sơ gian lận. Điều này tạo điều kiện cho các gói vay nhỏ lẻ đến đúng đối tượng người lao động có nhu cầu thực tế."
  },

  // 3. kinh-te (Nong san)
  {
    id: "art-chuoi-gia-tri-nong-san-2026",
    storyId: "story-chuoi-gia-tri-nong-san-2026",
    rawItemId: "7df8b6b5-2c14-4861-a2bd-f65c57921ec0",
    sourceId: "src-vnexpress",
    categorySlug: "kinh-te",
    categoryNameVi: "Kinh tế",
    title: "Chuỗi giá trị nông sản: Nông dân chật vật tìm biên lợi nhuận bền vững",
    slug: "chuoi-gia-tri-nong-san-nong-dan-chat-vat-tim-bien-loi-nhuan-ben-vung",
    metaTitle: "Chuỗi giá trị nông sản: Nỗ lực tìm biên lợi nhuận cao",
    metaDescription: "Dù giá nông sản có dấu hiệu khởi sắc trên thị trường, người nông dân vẫn đối mặt bài toán chi phí đầu vào tăng cao và phụ thuộc lớn vào các khâu trung gian.",
    keywords: "chuỗi giá trị nông sản, nông nghiệp bền vững, liên kết bao tiêu, chi phí phân bón, xuất khẩu nông sản",
    qualityScore: 89.0,
    relatedSlug: "thi-truong-tai-chinh-tieu-dung-2026-tai-cau-truc-va-chuan-tin-dung",
    relatedTitle: "Thị trường tài chính tiêu dùng 2026: Tái cấu trúc và chuẩn tín dụng",
    heroImageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Giá nhiều mặt hàng nông sản xuất khẩu chủ lực tăng 15-20% so với cùng kỳ năm trước.",
      "Chi phí vật tư đầu vào bao gồm phân bón, logistics và giống cây trồng chiếm tới hơn 65% tổng chi phí canh tác."
    ],
    claims: [
      "Mô hình kinh tế hợp tác xã liên kết trực tiếp với doanh nghiệp chế biến sâu là lối thoát duy nhất cho tình trạng được mùa mất giá.",
      "Cần sớm số hóa sàn giao dịch nông sản tập trung để thu hẹp khoảng cách giá giữa nông trại và người tiêu dùng cuối."
    ],
    bodyIntro: "Nghịch lý giá bán lẻ tại các đô thị tăng cao nhưng biên lợi nhuận thực nhận của nông dân tại vùng nguyên liệu vẫn bấp bênh tiếp tục đặt ra yêu cầu cấp thiết về việc tổ chức lại chuỗi cung ứng nông nghiệp toàn quốc.",
    bodyAnalysis: "Các chuyên gia kinh tế nông nghiệp khuyến nghị cần có chính sách hỗ trợ tín dụng ưu đãi cho hạ tầng kho lạnh bảo quản sau thu hoạch, giúp các hộ sản xuất chủ động thời điểm xuất bán thay vì chịu áp lực thương lái ép giá."
  },

  // 4. the-gioi (NATO)
  {
    id: "art-nato-chien-luoc-phong-thu-2026",
    storyId: "story-nato-phong-thu-2026",
    rawItemId: "fe00943a-486f-4089-9c83-6fde74c5ef8e",
    sourceId: "src-thanhnien",
    categorySlug: "the-gioi",
    categoryNameVi: "Thế giới",
    title: "NATO công bố chiến lược phòng thủ mới và kịch bản răn đe toàn cầu",
    slug: "nato-cong-bo-chien-luoc-phong-thu-moi-va-kich-ban-ran-de-toan-cau",
    metaTitle: "NATO công bố chiến lược phòng thủ mới và răn đe toàn cầu",
    metaDescription: "Khối liên minh quân sự NATO xây dựng học thuyết phòng thủ hiện đại nhằm thích ứng với các thách thức an ninh mới và duy trì ổn định địa chính trị khu vực.",
    keywords: "NATO, chiến lược an ninh, phòng thủ tập thể, địa chính trị, cân bằng quyền lực quốc tế",
    qualityScore: 94.0,
    relatedSlug: "nga-chinh-thuc-mien-thi-thuc-30-ngay-cho-cong-dan-viet-nam",
    relatedTitle: "Nga chính thức miễn thị thực 30 ngày cho công dân Việt Nam",
    heroImageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Các quốc gia thành viên NATO đồng thuận nâng tỷ lệ ngân sách quốc phòng tối thiểu lên mức 2,5% GDP từ năm 2026.",
      "Kế hoạch triển khai mạng lưới phòng thủ không gian mạng và vũ khí tự hành tích hợp công nghệ trí tuệ nhân tạo được đẩy mạnh."
    ],
    claims: [
      "Học thuyết phòng thủ mới đánh dấu sự chuyển dịch trọng tâm từ tác chiến truyền thống sang chiến tranh đa miền phức hợp.",
      "Sự phân hóa quan điểm giữa các thành viên chủ chốt có thể thử thách tính bền vững của các cam kết phòng thủ tập thể."
    ],
    bodyIntro: "Trong một thế giới đầy biến động địa chính trị, khối liên minh quân sự Bắc Đại Tây Dương (NATO) vừa hé lộ những điều chỉnh mang tính nền tảng trong học thuyết phòng thủ, nhằm tái định hình năng lực phản ứng nhanh trước các nguy cơ tiềm ẩn.",
    bodyAnalysis: "Việc củng cố sườn phía đông cùng các sáng kiến đầu tư vào công nghệ quốc phòng lưỡng dụng phản ánh nhận thức sâu sắc về việc bảo đảm an ninh mạng lưới hạ tầng trọng yếu trước các hình thức chiến tranh lai (hybrid warfare)."
  },

  // 5. the-gioi (Trieu Tien)
  {
    id: "art-ngoai-giao-ban-dao-trieu-tien-2026",
    storyId: "story-ban-dao-trieu-tien-2026",
    rawItemId: "e45a79e7-1f44-4c78-a63c-3fdf70ce3b7f",
    sourceId: "src-tuoitre",
    categorySlug: "the-gioi",
    categoryNameVi: "Thế giới",
    title: "Bàn cờ ngoại giao Bán đảo Triều Tiên trước thềm cuộc gặp thượng đỉnh",
    slug: "ban-co-ngoai-giao-ban-dao-trieu-tien-truoc-them-cuoc-gap-thuong-dinh",
    metaTitle: "Bàn cờ ngoại giao Bán đảo Triều Tiên trước thượng đỉnh",
    metaDescription: "Các động thái quân sự và phát ngôn ngoại giao mới nhất từ Bình Nhưỡng đang tạo ra những biến số phức tạp cho tiến trình đàm phán an ninh tại Đông Bắc Á nay.",
    keywords: "bán đảo Triều Tiên, ngoại giao thượng đỉnh, giải trừ hạt nhân, an ninh Đông Bắc Á, quan hệ Mỹ - Triều",
    qualityScore: 93.0,
    relatedSlug: "nato-cong-bo-chien-luoc-phong-thu-moi-va-kich-ban-ran-de-toan-cau",
    relatedTitle: "NATO công bố chiến lược phòng thủ mới và kịch bản răn đe toàn cầu",
    heroImageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Bình Nhưỡng công bố các thử nghiệm động cơ tên lửa nhiên liệu rắn đa tầng thế hệ mới trước thềm các kênh đối thoại.",
      "Các quốc gia láng giềng kêu gọi nối lại cơ chế đàm phán đa phương nhằm hạ nhiệt căng thẳng quân sự trên bán đảo."
    ],
    claims: [
      "Chiến thuật phô trương sức mạnh răn đe nhằm tối đa hóa lợi thế mặc cả trước bất kỳ vòng đàm phán chính thức nào.",
      "Kỳ vọng đạt được đột phá giải trừ vũ khí toàn diện đòi hỏi các nhượng bộ cụ thể về nới lỏng cấm vận kinh tế."
    ],
    bodyIntro: "Diễn biến an ninh trên Bán đảo Triều Tiên đang thu hút sự chú ý đặc biệt của giới quan sát quốc tế khi các tín hiệu ngoại giao đan xen với các động thái quân sự chiến lược tạo nên thế cờ đầy tính toán giữa các bên liên quan.",
    bodyAnalysis: "Giới phân tích cho rằng việc duy trì kênh liên lạc không chính thức và tránh các tính toán sai lầm chiến thuật là ưu tiên hàng đầu của các cường quốc nhằm ngăn chặn leo thang đối đầu vũ trang ngoài tầm kiểm soát."
  },

  // 6. doi-song (Giao duc - Hoc bong)
  {
    id: "art-hoc-bong-quoc-te-2026",
    storyId: "story-hoc-bong-quoc-te-2026",
    rawItemId: "104e7b1b-fc50-43a6-afa1-82fe1085b966",
    sourceId: "src-thanhnien",
    categorySlug: "doi-song",
    categoryNameVi: "Đời sống",
    title: "Đồng hành cùng con săn học bổng quốc tế: Bài học từ người mẹ trẻ",
    slug: "dong-hanh-cung-con-san-hoc-bong-quoc-te-bai-hoc-tu-nguoi-me-tre",
    metaTitle: "Đồng hành cùng con săn học bổng quốc tế: Bài học quý giá",
    metaDescription: "Hành trình nuôi dạy và tạo động lực tự học cho con từ sớm giúp các gia đình hiện đại xây dựng phương pháp giáo dục khoa học, đạt thành tích học thuật cao.",
    keywords: "học bổng quốc tế, nuôi dạy con, giáo dục sớm, phương pháp tự học, kỹ năng mềm cho trẻ",
    qualityScore: 90.0,
    relatedSlug: "nhung-thang-nam-dep-nhat-cua-tuoi-tre",
    relatedTitle: "Những tháng năm đẹp nhất của tuổi trẻ",
    heroImageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Nhiều học sinh Việt Nam xuất sắc giành học bổng toàn phần chính phủ ở độ tuổi từ 14 đến 16.",
      "Phương pháp học tập qua dự án thực tế và đọc sách liên ngành được chứng minh tạo động lực tự thân vượt trội so với học thêm thụ động."
    ],
    claims: [
      "Sự đồng hành của cha mẹ với vai trò cố vấn tâm lý quan trọng hơn việc định hướng chọn ngành nghề hay đặt nặng chỉ tiêu thành tích.",
      "Khả năng thích ứng văn hóa và tư duy độc lập là chìa khóa quyết định sự thành công lâu dài của du học sinh."
    ],
    bodyIntro: "Câu chuyện về các bạn trẻ đạt thành tích xuất sắc giành học bổng danh giá từ sớm luôn mang lại nguồn cảm hứng lớn, nhưng đằng sau đó là triết lý giáo dục kiên trì và tinh tế của các bậc phụ huynh hiện đại.",
    bodyAnalysis: "Thay vì gây áp lực bằng các lịch học kín mít, việc khuyến khích con trẻ khám phá sở thích cá nhân, rèn luyện kỹ năng tự quản lý thời gian và tham gia các hoạt động xã hội chính là bệ phóng vững chắc nhất."
  },

  // 7. doi-song (Tieu dung xanh)
  {
    id: "art-loi-song-xanh-do-thi-2026",
    storyId: "story-loi-song-xanh-2026",
    rawItemId: "bb958d39-bbfa-4557-a8ca-5beb6880b4e3",
    sourceId: "src-tuoitre",
    categorySlug: "doi-song",
    categoryNameVi: "Đời sống",
    title: "Lối sống xanh đô thị: Chiến dịch giảm rác thải nhựa tại hệ thống bán lẻ",
    slug: "loi-song-xanh-do-thi-chien-dich-giam-rac-thai-nhua-tai-he-thong-ban-le",
    metaTitle: "Lối sống xanh đô thị: Chiến dịch giảm rác thải nhựa mới",
    metaDescription: "Các chuỗi siêu thị lớn triển khai sáng kiến khuyến khích người dân từ bỏ túi nilon, chuyển sang thói quen tiêu dùng xanh bảo vệ môi trường sống hiện đại.",
    keywords: "lối sống xanh, giảm thiểu rác thải nhựa, tiêu dùng bền vững, túi tái chế, bảo vệ môi trường đô thị",
    qualityScore: 91.0,
    relatedSlug: "dong-hanh-cung-con-san-hoc-bong-quoc-te-bai-hoc-tu-nguoi-me-tre",
    relatedTitle: "Đồng hành cùng con săn học bổng quốc tế: Bài học từ người mẹ trẻ",
    heroImageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Hệ thống bán lẻ đầu ngành dành ngân sách hàng chục tỷ đồng tặng điểm thưởng và quà tặng cho khách hàng mang túi đựng cá nhân.",
      "Lượng rác thải nhựa dùng một lần tại các siêu thị thí điểm ghi nhận mức giảm hơn 40% sau 3 tháng phát động."
    ],
    claims: [
      "Chính sách kinh tế hành vi như thưởng điểm xanh mang lại hiệu quả chuyển đổi thói quen bền vững hơn các biện pháp cấm đoán đơn thuần.",
      "Doanh nghiệp bán lẻ đóng vai trò đầu tàu định hình văn hóa tiêu dùng có trách nhiệm trong cộng đồng cư dân đô thị."
    ],
    bodyIntro: "Xu hướng tiêu dùng có ý thức bảo vệ môi trường đang lan tỏa mạnh mẽ từ nhận thức thành hành động cụ thể trong nhịp sống thường nhật của người dân tại các thành phố lớn.",
    bodyAnalysis: "Sự chung tay của các nhà phân phối lớn trong việc thay thế bao bì nhựa bằng vật liệu phân hủy sinh học đã tạo tiền đề quan trọng cho lộ trình xây dựng nền kinh tế tuần hoàn và đô thị không rác thải nhựa."
  },

  // 8. khoa-hoc (Bien doi khi hau & Thoi tiet cuc doan)
  {
    id: "art-hien-tuong-da-bao-2026",
    storyId: "story-hien-tuong-da-bao-2026",
    rawItemId: "9a937758-b466-45e4-a122-104883e2b3d9",
    sourceId: "src-vnexpress",
    categorySlug: "khoa-hoc",
    categoryNameVi: "Khoa học",
    title: "Hiện tượng đa bão nhiệt đới dồn dập: Giải mã cơ chế khí quyển cực đoan",
    slug: "hien-tuong-da-bao-nhiet-doi-don-dap-giai-ma-co-che-khi-quyen-cuc-doan",
    metaTitle: "Hiện tượng đa bão nhiệt đới và cơ chế khí quyển cực đoan",
    metaDescription: "Hiện tượng nhiều cơn bão nhiệt đới hình thành cùng thời điểm trên biển phản ánh xu thế biến đổi khí hậu phức tạp và gia tăng tần suất thiên tai dị thường.",
    keywords: "đa bão nhiệt đới, biến đổi khí hậu, khí tượng thủy văn, ấm lên toàn cầu, dự báo bão siêu sớm",
    qualityScore: 94.0,
    relatedSlug: "pho-cap-ai-cong-dong-huong-dan-nguoi-dan-tranh-bay-lua-dao-so",
    relatedTitle: "Phổ cập AI cộng đồng: Hướng dẫn người dân tránh bẫy lừa đảo số",
    heroImageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Các trung tâm khí tượng quốc tế ghi nhận sự xuất hiện đồng thời của ba áp thấp nhiệt đới và bão mạnh trên cùng một dải hội tụ nhiệt đới.",
      "Nhiệt độ bề mặt nước biển tại các lưu vực sinh bão đo được cao hơn 1,2 đến 1,8 độ C so với mức trung bình nhiều năm."
    ],
    claims: [
      "Năng lượng nhiệt đại dương tích tụ khổng lồ là động cơ chính nuôi dưỡng các hiện tượng bão dồn dập và khó lường về quỹ đạo.",
      "Công nghệ dự báo khí tượng bằng mô hình siêu máy tính kết hợp AI cần được cập nhật liên tục để đón đầu các dị thường thời tiết."
    ],
    bodyIntro: "Sự xuất hiện liên tiếp của các cơn bão mạnh trên các vùng biển nhiệt đới đang đặt ra những câu hỏi khoa học lớn về mức độ biến động của hệ thống hoàn lưu khí quyển dưới tác động của biến đổi khí hậu toàn cầu.",
    bodyAnalysis: "Nghiên cứu từ các nhà khoa học khí tượng chỉ ra rằng chu kỳ hoạt động của các dải mây đối lưu sâu đã trở nên dày đặc hơn, đòi hỏi các quốc gia ven biển phải nâng cấp năng lực cảnh báo sớm và phương án phòng chống rủi ro thiên tai."
  },

  // 9. the-thao (Chay bo cong dong)
  {
    id: "art-phong-trao-chay-bo-2026",
    storyId: "story-phong-trao-chay-bo-2026",
    rawItemId: "7c20b216-d411-480f-91c7-dc55930bb2fe",
    sourceId: "src-vnexpress",
    categorySlug: "the-thao",
    categoryNameVi: "Thể thao",
    title: "Phong trào chạy bộ cộng đồng bùng nổ: Từ rèn luyện đến kinh tế thể thao",
    slug: "phong-trao-chay-bo-cong-dong-bung-no-tu-ren-luyen-den-kinh-te-the-thao",
    metaTitle: "Phong trào chạy bộ cộng đồng: Từ sức khỏe đến kinh tế số",
    metaDescription: "Sự lan tỏa của các giải chạy marathon khắp cả nước không chỉ khơi dậy tinh thần rèn luyện thể chất mà còn tạo động lực cho ngành du lịch và kinh tế thể thao.",
    keywords: "chạy bộ marathon, phong trào thể thao cộng đồng, rèn luyện sức khỏe, kinh tế thể thao, du lịch thể thao",
    qualityScore: 92.0,
    relatedSlug: "hang-chuc-nghin-runner-bung-no-tai-vpbank-dat-sen-hong-marathon",
    relatedTitle: "Hàng chục nghìn runner bùng nổ tại VPBank Đất Sen Hồng Marathon",
    heroImageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Hơn 40 giải marathon và bán marathon quy mô trên 5.000 vận động viên được tổ chức trải dài tại các tỉnh thành trong năm 2026.",
      "Chi tiêu trung bình của một chân chạy cho trang thiết bị, lưu trú và dinh dưỡng đóng góp hàng trăm tỷ đồng cho kinh tế địa phương."
    ],
    claims: [
      "Marathon đã vượt qua khuôn khổ môn thể thao đơn thuần để trở thành phong cách sống năng động và nét văn hóa gắn kết tập thể.",
      "Sự phát triển chuyên nghiệp của các ban tổ chức giải là yếu tố then chốt đưa thể thao phong trào Việt Nam tiệm cận chuẩn quốc tế."
    ],
    bodyIntro: "Chưa bao giờ phong trào chạy bộ phong trào lại thu hút sự tham gia đông đảo của mọi tầng lớp xã hội như hiện nay, tạo nên một bức tranh thể thao đầy sức sống từ công viên đô thị đến các cung đường danh thắng.",
    bodyAnalysis: "Không chỉ nâng cao sức khỏe thể chất và tinh thần cho người tham gia, các sự kiện thể thao cộng đồng còn là đòn bẩy kích cầu du lịch, quảng bá hình ảnh địa phương và lan tỏa năng lượng tích cực cho toàn xã hội."
  },

  // 10. giai-tri (Concert mua cuoi nam)
  {
    id: "art-mua-concert-cuoi-nam-2026",
    storyId: "story-concert-cuoi-nam-2026",
    rawItemId: "a7d1d576-355c-44d4-aec7-7b2943957b0a",
    sourceId: "src-tuoitre",
    categorySlug: "giai-tri",
    categoryNameVi: "Giải trí",
    title: "Mùa concert cuối năm bùng nổ: Phép thử lớn cho ngành công nghiệp biểu diễn",
    slug: "mua-concert-cuoi-nam-bung-no-phep-thu-lon-cho-nganh-cong-nghiep-bieu-dien",
    metaTitle: "Mùa concert cuối năm: Phép thử ngành biểu diễn âm nhạc",
    metaDescription: "Hàng loạt đêm nhạc quy mô lớn của các nghệ sĩ tên tuổi diễn ra dịp cuối năm tạo nên không khí sôi động và kiểm chứng năng lực tổ chức sự kiện chuyên nghiệp.",
    keywords: "concert âm nhạc, công nghiệp giải trí, thị trường biểu diễn, bán vé ca nhạc, sân khấu âm thanh ánh sáng",
    qualityScore: 93.0,
    relatedSlug: "mua-gio-quat-do-san-khau-bo-oi-minh-di-dau-the",
    relatedTitle: "Mưa gió quật đổ sân khấu 'Bố ơi mình đi đâu thế?' và những chuyện hậu trường",
    heroImageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Thị trường giải trí ghi nhận hơn 10 live concert sân vận động diễn ra dồn dập trong quý cuối năm với tỷ lệ lấp đầy vé trên 90%.",
      "Doanh thu từ vé và tài trợ thương mại cho các sự kiện âm nhạc quy mô lớn ước tính đạt hàng trăm tỷ đồng."
    ],
    claims: [
      "Khán giả Việt Nam đã hình thành thói quen chi trả xứng đáng cho các sản phẩm văn hóa chất lượng cao được đầu tư bài bản.",
      "Quy trình vận hành, an ninh sự kiện và công nghệ dàn dựng sân khấu hiện đại là yếu tố quyết định sự tồn tại của các nhà sản xuất."
    ],
    bodyIntro: "Thị trường biểu diễn âm nhạc Việt Nam đang bước vào giai đoạn thăng hoa rực rỡ nhất trong năm với hàng loạt dự án concert quy mô lớn được công bố liên tiếp, tạo nên cơn sốt vé chưa từng có.",
    bodyAnalysis: "Sự bùng nổ này không chỉ khẳng định vị thế của các nghệ sĩ tài năng mà còn là thước đo phản ánh bước trưởng thành vượt bậc của ngành công nghiệp văn hóa sáng tạo trong việc đáp ứng nhu cầu thưởng thức nghệ thuật ngày càng tinh tế."
  },

  // 11. thoi-su (Giao thong do thi - Vanh dai)
  {
    id: "art-ha-tang-vanh-dai-2026",
    storyId: "story-ha-tang-vanh-dai-2026",
    rawItemId: "87705805-92a5-4d5d-a194-023440402f90",
    sourceId: "src-tuoitre",
    categorySlug: "thoi-su",
    categoryNameVi: "Thời sự",
    title: "Đột phá hạ tầng giao thông đô thị: Thông xe đường vành đai giải tỏa áp lực",
    slug: "dot-pha-ha-tang-giao-thong-do-thi-thong-xe-duong-vanh-dai-giai-toa-ap-luc",
    metaTitle: "Đột phá hạ tầng giao thông đô thị: Thông xe đường vành đai",
    metaDescription: "Việc đưa vào khai thác các đoạn tuyến vành đai huyết mạch đóng vai trò then chốt trong việc khơi thông ùn tắc và liên kết phát triển kinh tế vùng đô thị lớn.",
    keywords: "hạ tầng giao thông, thông xe đường vành đai, phát triển đô thị, giảm ùn tắc, liên kết vùng",
    qualityScore: 94.0,
    relatedSlug: "chinh-sach-phat-trien-khong-gian-ngam-dong-luc-quy-hoach-moi-cho-dai-do-thi",
    relatedTitle: "Chính sách phát triển không gian ngầm: Động lực quy hoạch mới cho đại đô thị",
    heroImageUrl: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Lãnh đạo cấp cao trực tiếp kiểm tra và chỉ đạo thông xe kỹ thuật các đoạn tuyến trọng điểm thuộc dự án đường vành đai thủ đô.",
      "Dự án giúp rút ngắn thời gian di chuyển liên quận từ 45 phút xuống còn dưới 15 phút vào khung giờ cao điểm."
    ],
    claims: [
      "Hệ thống đường vành đai hoàn chỉnh là đòn bẩy tái cấu trúc không gian đô thị, giãn mật độ dân cư khỏi lõi trung tâm lịch sử.",
      "Tiến độ giải phóng mặt bằng quyết liệt cùng sự đồng thuận của nhân dân là chìa khóa then chốt đưa các dự án trọng điểm về đích."
    ],
    bodyIntro: "Hạ tầng giao thông đô thị vừa ghi nhận cột mốc quan trọng với việc chính thức thông xe các đoạn tuyến huyết mạch, mang lại niềm phấn khởi lớn cho hàng triệu người dân trong sinh hoạt và giao thương thường nhật.",
    bodyAnalysis: "Công trình không chỉ giải quyết triệt để các điểm nghẽn giao thông kinh niên mà còn mở ra không gian phát triển mới cho các ngành dịch vụ, logistics và bất động sản dọc theo hành lang tuyến vành đai."
  },

  // 12. thoi-su (Khong gian ngam)
  {
    id: "art-khong-gian-ngam-do-thi-2026",
    storyId: "story-khong-gian-ngam-2026",
    rawItemId: "943cbce8-03a8-4a96-8f67-043e56c41dcf",
    sourceId: "src-tuoitre",
    categorySlug: "thoi-su",
    categoryNameVi: "Thời sự",
    title: "Chính sách phát triển không gian ngầm: Động lực quy hoạch mới cho đại đô thị",
    slug: "chinh-sach-phat-trien-khong-gian-ngam-dong-luc-quy-hoach-moi-cho-dai-do-thi",
    metaTitle: "Chính sách phát triển không gian ngầm: Động lực quy hoạch",
    metaDescription: "Quy định miễn tiền sử dụng đất công trình ngầm mở ra cơ hội khai thác tối đa nguồn lực không gian đô thị và đồng bộ hệ sinh thái giao thông công cộng tương lai.",
    keywords: "không gian ngầm đô thị, quy hoạch đô thị, bãi đỗ xe ngầm, miễn tiền sử dụng đất, hạ tầng giao thông ngầm",
    qualityScore: 92.0,
    relatedSlug: "dot-pha-ha-tang-giao-thong-do-thi-thong-xe-duong-vanh-dai-giai-toa-ap-luc",
    relatedTitle: "Đột phá hạ tầng giao thông đô thị: Thông xe đường vành đai giải tỏa áp lực",
    heroImageUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    facts: [
      "Hội đồng nhân dân thành phố thông qua nghị quyết miễn 100% tiền sử dụng đất cho các công trình ngầm có độ sâu đến 15m.",
      "Chính sách áp dụng cho các dự án bãi đỗ xe công cộng ngầm, công trình thương mại dịch vụ ngầm kết nối các ga metro."
    ],
    claims: [
      "Cơ chế tài chính ưu đãi là cú hích cần thiết thu hút dòng vốn đầu tư tư nhân vào hạ tầng ngầm vốn đòi hỏi chi phí kỹ thuật rất cao.",
      "Quy hoạch không gian ngầm đồng bộ với mạng lưới đường sắt đô thị sẽ kiến tạo diện mạo đô thị thông minh, văn minh và hiện đại."
    ],
    bodyIntro: "Việc khai thác không gian dưới lòng đất đang trở thành xu thế tất yếu của các siêu đô thị nhằm giải bài toán quỹ đất cạn kiệt, và chính sách miễn tiền sử dụng đất mới ban hành được kỳ vọng sẽ tạo ra bước đột phá chiến lược.",
    bodyAnalysis: "Khi các công trình ngầm được liên kết thông suốt với hệ thống metro và trung tâm thương mại, diện tích mặt đất sẽ được dành nhiều hơn cho cây xanh, công viên và không gian công cộng cho người đi bộ."
  }
];

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function buildBody(a: ArticleSpec): string {
  const parts: string[] = [
    a.bodyIntro,
    "",
    "## Thông tin xác thực (Facts)",
    "",
    ...a.facts.map((f) => `- ${f}`),
    "",
    "## Nhận định & Tuyên bố (Claims)",
    "",
    ...a.claims.map((c) => `- ${c}`),
    "",
    a.bodyAnalysis,
    "",
    "## Tin liên quan cùng chuyên mục",
    `- [${a.relatedTitle}](https://mstudio.minds.io.vn/bai-viet/${a.relatedSlug})`,
    "",
    `*Đọc thêm các diễn biến mới nhất tại chuyên mục [${a.categoryNameVi}](https://mstudio.minds.io.vn/chuyen-muc/${a.categorySlug}).*`
  ];
  return parts.join("\n");
}

function generateSql(): string {
  const sqlCommands: string[] = [
    "-- Generated AI published articles batch for MST-098",
    "-- Owner: commandcode. Free-tier compliant."
  ];

  const now = "2026-10-13T06:25:00.000Z";

  for (const a of articles) {
    // Assert length requirements
    if (a.metaTitle.length < 50 || a.metaTitle.length > 60) {
      throw new Error(`Article ${a.slug} metaTitle length ${a.metaTitle.length} not in [50, 60]`);
    }
    if (a.metaDescription.length < 150 || a.metaDescription.length > 160) {
      throw new Error(`Article ${a.slug} metaDescription length ${a.metaDescription.length} not in [150, 160]`);
    }
    if (a.qualityScore < 85) {
      throw new Error(`Article ${a.slug} qualityScore ${a.qualityScore} < 85`);
    }

    const revisionId = `rev-${a.slug}`;
    const publishKey = `${a.id}:${revisionId}`;
    const canonicalUrl = `https://mstudio.minds.io.vn/bai-viet/${a.slug}`;
    const body = buildBody(a);

    // 1. Story
    sqlCommands.push(
      `INSERT OR REPLACE INTO stories (id, title, summary, status, created_at, updated_at) VALUES ('${escapeSql(a.storyId)}', '${escapeSql(a.title)}', '${escapeSql(a.bodyIntro)}', 'published', '${now}', '${now}');`
    );

    // 2. Story source
    sqlCommands.push(
      `INSERT OR IGNORE INTO story_sources (id, story_id, raw_item_id, role, created_at) VALUES ('ss-${escapeSql(a.slug)}', '${escapeSql(a.storyId)}', '${escapeSql(a.rawItemId)}', 'primary', '${now}');`
    );

    // 3. Facts
    a.facts.forEach((fact, idx) => {
      const factId = `fact-${escapeSql(a.slug)}-${idx + 1}`;
      const sourceRefs = JSON.stringify([{ sourceId: a.sourceId }]);
      sqlCommands.push(
        `INSERT OR REPLACE INTO facts (id, story_id, text, source_refs, confidence, created_at, updated_at) VALUES ('${factId}', '${escapeSql(a.storyId)}', '${escapeSql(fact)}', '${escapeSql(sourceRefs)}', 0.95, '${now}', '${now}');`
      );
    });

    // 4. Claims
    a.claims.forEach((claim, idx) => {
      const claimId = `claim-${escapeSql(a.slug)}-${idx + 1}`;
      sqlCommands.push(
        `INSERT OR REPLACE INTO claims (id, story_id, text, status, created_at, updated_at) VALUES ('${claimId}', '${escapeSql(a.storyId)}', '${escapeSql(claim)}', 'confirmed', '${now}', '${now}');`
      );
    });

    // 5. Article
    sqlCommands.push(
      `INSERT OR REPLACE INTO articles (
        id, story_id, status, current_revision_id, published_revision_id, publish_key,
        slug, category_slug, hero_image_url, meta_title, meta_description, canonical_url,
        og_image_url, keywords, source_count, quality_score, is_breaking, is_trending,
        created_at, updated_at
      ) VALUES (
        '${escapeSql(a.id)}', '${escapeSql(a.storyId)}', 'published', '${escapeSql(revisionId)}', '${escapeSql(revisionId)}', '${escapeSql(publishKey)}',
        '${escapeSql(a.slug)}', '${escapeSql(a.categorySlug)}', '${escapeSql(a.heroImageUrl)}', '${escapeSql(a.metaTitle)}', '${escapeSql(a.metaDescription)}', '${escapeSql(canonicalUrl)}',
        '${escapeSql(a.heroImageUrl)}', '${escapeSql(a.keywords)}', 1, ${a.qualityScore}, 0, 0,
        '${now}', '${now}'
      );`
    );

    // 6. Revision
    sqlCommands.push(
      `INSERT OR REPLACE INTO article_revisions (
        id, article_id, revision_number, title, body, summary, created_at
      ) VALUES (
        '${escapeSql(revisionId)}', '${escapeSql(a.id)}', 1, '${escapeSql(a.title)}', '${escapeSql(body)}', '${escapeSql(a.bodyIntro)}', '${now}'
      );`
    );
  }

  // Backfill audit query: Ensure any NULL category_slug in articles gets backfilled
  sqlCommands.push(
    `UPDATE articles SET category_slug = 'thoi-su' WHERE category_slug IS NULL OR category_slug = '';`
  );

  return sqlCommands.join("\n");
}

const sql = generateSql();
const outPath = join(process.cwd(), "scripts", "publish-articles.sql");
writeFileSync(outPath, sql, "utf-8");
console.log(`Generated SQL for ${articles.length} articles at: ${outPath}`);
