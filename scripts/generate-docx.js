const docx = require("docx");
const fs = require("fs");
const path = require("path");

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, convertInchesToTwip
} = docx;

const FONT = "Times New Roman";
const SZ = 24; // 12pt
const SZ_S = 20; // 10pt
const SZ_M = 28; // 14pt
const SZ_L = 32; // 16pt
const SZ_XL = 48; // 24pt
const CLR = "1E1410";
const CLR_H = "4A2C2A";
const CLR_M = "666666";
const CLR_W = "FFFFFF";
const CLR_BG = "4A2C2A";

// ─── Helpers ─────────────────────────────────────────────────────
function P(text, opts = {}) {
  const runs = typeof text === "string"
    ? [new TextRun({ text, font: FONT, size: opts.size || SZ, bold: !!opts.bold, italics: !!opts.italics, color: opts.color || CLR })]
    : text.map(t => (typeof t === "string")
        ? new TextRun({ text: t, font: FONT, size: opts.size || SZ, color: CLR })
        : new TextRun({ ...t, font: t.font || FONT, size: t.size || opts.size || SZ }));
  return new Paragraph({
    children: runs,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0, line: opts.line },
    alignment: opts.align || AlignmentType.LEFT,
    indent: opts.indent,
    pageBreakBefore: !!opts.pb,
    heading: opts.heading,
    bullet: opts.bullet,
  });
}

function H1(t)  { return P(t, { size: SZ_L, bold: true, color: CLR_H, align: AlignmentType.CENTER, before: 360, after: 200, pb: true }); }
function H2(t)  { return P(t, { size: SZ_M, bold: true, color: CLR_H, before: 240, after: 160 }); }
function H3(t)  { return P(t, { size: SZ, bold: true, color: CLR, before: 200, after: 120 }); }
function H4(t)  { return P(t, { size: SZ, bold: true, italics: true, before: 160, after: 100 }); }
function E()    { return P("", { after: 60 }); }
function PB()   { return new Paragraph({ children: [], pageBreakBefore: true }); }

function T(headers, rows) {
  return new Table({
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
          children: [P(h, { size: SZ_S, bold: true, color: CLR_W, align: AlignmentType.CENTER })],
          shading: { type: ShadingType.SOLID, color: CLR_BG },
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
        })),
      }),
      ...rows.map((r, i) => new TableRow({
        children: r.map(c => new TableCell({
          children: [P(String(c||""), { size: SZ_S })],
          shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: "F2F2F2" } : undefined,
        })),
      })),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
  });
}

// ─── COVER PAGE ──────────────────────────────────────────────────
const cover = [
  E(), E(), E(),
  P("BỘ GIÁO DỤC VÀ ĐÀO TẠO",          { size: SZ_M, bold: true, align: AlignmentType.CENTER, after: 40 }),
  P("TRƯỜNG ĐẠI HỌC ĐÔNG Á",             { size: SZ_M, bold: true, align: AlignmentType.CENTER, after: 40 }),
  P("KHOA CÔNG NGHỆ THÔNG TIN",          { size: SZ_M, bold: true, align: AlignmentType.CENTER, after: 200 }),
  E(), E(), E(),
  P("BÁO CÁO",                            { size: SZ_XL, bold: true, align: AlignmentType.CENTER, after: 40 }),
  P("THỰC TẬP NGHỀ NGHIỆP",             { size: SZ_XL, bold: true, align: AlignmentType.CENTER, after: 120 }),
  P("NĂM HỌC: 2026 – 2027",             { size: SZ_M, bold: true, align: AlignmentType.CENTER, after: 240 }),
  E(),
  P(`Đơn vị thực tập:  Trung tâm ICT Đại học Đông Á`, { size: SZ, align: AlignmentType.LEFT, after: 80, indent: { left: convertInchesToTwip(1) } }),
  P(`Địa chỉ: \t\t33 Xô Viết Nghệ Tĩnh, Hoà Cường,`,     { size: SZ, align: AlignmentType.LEFT, after: 40, indent: { left: convertInchesToTwip(1) } }),
  P(`\t\tĐà Nẵng`,                       { size: SZ, align: AlignmentType.LEFT, after: 120, indent: { left: convertInchesToTwip(1) } }),
  P(`Giảng viên hướng dẫn: ThS. Tạ Quốc Ý`, { size: SZ, align: AlignmentType.LEFT, after: 80, indent: { left: convertInchesToTwip(1) } }),
  P(`Họ và tên sinh viên\t\t: Nguyễn Thanh Tân`, { size: SZ, align: AlignmentType.LEFT, after: 40, indent: { left: convertInchesToTwip(1) } }),
  P(`Lớp\t: ST23D`,                       { size: SZ, align: AlignmentType.LEFT, after: 40, indent: { left: convertInchesToTwip(1) } }),
  E(), E(), E(), E(),
  P("BỘ GIÁO DỤC VÀ ĐÀO TẠO",          { size: SZ_M, bold: true, align: AlignmentType.CENTER, after: 40, pb: true }),
  P("TRƯỜNG ĐẠI HỌC ĐÔNG Á",           { size: SZ_M, bold: true, align: AlignmentType.CENTER, after: 40 }),
  P("KHOA CÔNG NGHỆ THÔNG TIN",        { size: SZ_M, bold: true, align: AlignmentType.CENTER, after: 240 }),
  E(), E(), E(),
  P("BÁO CÁO",                          { size: SZ_XL, bold: true, align: AlignmentType.CENTER, after: 40 }),
  P("THỰC TẬP NGHỀ NGHIỆP",           { size: SZ_XL, bold: true, align: AlignmentType.CENTER, after: 120 }),
  P("NĂM HỌC: 2026 - 2027",           { size: SZ_M, bold: true, align: AlignmentType.CENTER, after: 200 }),
  E(), E(),
  P(`Họ tên sinh viên: Nguyễn Thanh Tân`,      { size: SZ, align: AlignmentType.CENTER, after: 40 }),
  P(`Lớp: ST23D`,                                { size: SZ, align: AlignmentType.CENTER, after: 40 }),
  P(`Điện thoại: 0347857329`,                    { size: SZ, align: AlignmentType.CENTER, after: 40 }),
  P(`Email: Tan105408@donga.edu.vn`,             { size: SZ, align: AlignmentType.CENTER, after: 120 }),
];

// ─── MỤC LỤC ─────────────────────────────────────────────────────
const toc = [
  H1("MỤC LỤC"),
  P("", { after: 200 }),
  ...[
    ["LỜI CẢM ƠN", "1"],
    ["CHƯƠNG 1: TỔNG QUAN VỀ ĐƠN VỊ THỰC TẬP", "2"],
    ["  1.1. Giới thiệu đơn vị thực tập", "2"],
    ["  1.2. Lĩnh vực hoạt động", "2"],
    ["  1.3. Văn hóa và môi trường làm việc", "2"],
    ["  1.4. Các quy trình làm việc", "4"],
    ["CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ TỔNG QUAN ĐỀ TÀI", "6"],
    ["  2.1. Đặt vấn đề", "6"],
    ["  2.2. Lý do chọn đề tài", "7"],
    ["  2.3. Cơ sở lý thuyết", "9"],
    ["  2.4. Công nghệ sử dụng", "11"],
    ["CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG", "13"],
    ["  3.1. Yêu cầu chức năng", "13"],
    ["  3.2. Yêu cầu phi chức năng", "14"],
    ["  3.3. Phân tích thiết kế sơ bộ", "15"],
    ["  3.4. Thiết kế cơ sở dữ liệu", "18"],
    ["  3.5. Thiết kế giao diện", "22"],
    ["CHƯƠNG 4: TRIỂN KHAI VÀ KẾT QUẢ", "24"],
    ["  4.1. Cấu trúc dự án", "24"],
    ["  4.2. Các module chính", "26"],
    ["  4.3. Luồng xử lý nghiệp vụ", "30"],
    ["  4.4. Kiểm thử", "32"],
    ["CHƯƠNG 5: ĐÁNH GIÁ KẾT QUẢ THỰC TẬP", "35"],
    ["  5.1. Kết quả đạt được", "35"],
    ["  5.2. Hạn chế", "36"],
    ["  5.3. Hướng phát triển", "37"],
    ["NHẬT KÝ CÔNG VIỆC HÀNG TUẦN", "38"],
    ["BẢN TỰ ĐÁNH GIÁ", "45"],
    ["NHẬN XÉT CỦA ĐƠN VỊ THỰC TẬP", "46"],
    ["NHẬN XÉT CỦA GIÁO VIÊN HƯỚNG DẪN", "48"],
    ["PHIẾU ĐÁNH GIÁ THỰC TẬP CHO SINH VIÊN", "50"],
    ["PHIẾU CHẤM BÁO CÁO THỰC TẬP TỐT NGHIỆP", "53"],
  ].map(([label, page]) =>
    P(`${label} \t${page}`, { size: SZ, after: 60 })
  ),
];

// ─── LỜI CẢM ƠN ──────────────────────────────────────────────────
const loiCamOn = [
  H1("LỜI CẢM ƠN"),
  P("Đối với sinh viên, kỳ thực tập là cơ hội quan trọng để vận dụng những kiến thức đã học vào môi trường thực tế, đồng thời rèn luyện các kỹ năng chuyên môn và tác phong làm việc cần thiết cho quá trình phát triển nghề nghiệp. Trong thời gian thực tập và thực hiện dự án xây dựng hệ thống Coffee Store, em đã có cơ hội củng cố kiến thức về phát triển phần mềm, lập trình web, cơ sở dữ liệu và từng bước làm quen với quy trình xây dựng một sản phẩm phần mềm thực tế.", { before: 200 }),
  E(),
  P("Em xin gửi lời tri ân sâu sắc đến quý thầy cô Trường Đại học Đông Á đã tận tâm giảng dạy và truyền đạt cho em những kiến thức, kỹ năng nền tảng trong suốt quá trình học tập. Những kiến thức đó đã tạo tiền đề quan trọng để em có thể tiếp cận, phân tích và triển khai dự án Coffee Store trong quá trình thực tập."),
  E(),
  P("Đặc biệt, em xin chân thành cảm ơn Thầy Tạ Quốc Ý, người đã trực tiếp hướng dẫn và tận tình chỉ bảo em trong suốt quá trình thực hiện báo cáo và dự án. Những góp ý, định hướng chuyên môn và sự hỗ trợ của thầy đã giúp em tháo gỡ nhiều khó khăn, hoàn thiện sản phẩm cũng như rèn luyện tư duy phân tích, khả năng giải quyết vấn đề và phương pháp làm việc nghiêm túc."),
  E(),
  P("Em cũng xin chân thành cảm ơn Ban Lãnh đạo cùng các cán bộ tại Trung tâm ICT Đại học Đông Á đã tạo điều kiện để em được tham gia thực tập và tiếp cận với môi trường làm việc thực tế. Quá trình thực hiện dự án Coffee Store đã giúp em có cơ hội vận dụng kiến thức đã học vào việc xây dựng một hệ thống phần mềm, đồng thời nâng cao kỹ năng lập trình, xử lý lỗi, làm việc với cơ sở dữ liệu và phát triển các chức năng theo yêu cầu thực tế."),
  E(),
  P("Mặc dù đã cố gắng hoàn thiện dự án và báo cáo trong khả năng của mình, nhưng do kiến thức và kinh nghiệm thực tế còn hạn chế, sản phẩm chắc chắn vẫn không tránh khỏi những thiếu sót. Em rất mong nhận được những ý kiến đóng góp quý báu từ quý thầy cô để có thể tiếp tục hoàn thiện bản thân và nâng cao năng lực chuyên môn."),
  E(),
  P("Cuối cùng, em xin chân thành cảm ơn tất cả các cá nhân và tổ chức đã hỗ trợ, hướng dẫn và đồng hành cùng em trong suốt quá trình thực tập. Những kiến thức, kinh nghiệm và bài học tích lũy được từ dự án Coffee Store sẽ là nền tảng quan trọng, hỗ trợ em trong quá trình học tập và phát triển nghề nghiệp trong tương lai."),
  E(),
  P("Em xin chân thành cảm ơn!", { align: AlignmentType.RIGHT }),
];

// ─── CHƯƠNG 1: TỔNG QUAN ĐƠN VỊ THỰC TẬP ──────────────────────
const chuong1 = [
  H1("CHƯƠNG 1: TỔNG QUAN VỀ ĐƠN VỊ THỰC TẬP"),
  H2("1.1. Giới thiệu đơn vị thực tập"),
  P("Trung tâm Công nghệ thông tin (tên thường gọi: Trung tâm ICT) là đơn vị trực thuộc Trường Đại học Đông Á, tọa lạc tại Tầng 4 (Phòng 406 - 408), cơ sở chính số 33 Xô Viết Nghệ Tĩnh, thành phố Đà Nẵng."),
  E(),
  P("Trung tâm ICT là đơn vị hoạt động trong lĩnh vực công nghệ thông tin, chuyên tham gia phát triển phần mềm (Web) trên nền tảng Microsoft.Net, thiết kế website và cung cấp các giải pháp số, xử lý sự cố hệ thống theo yêu cầu. Với đội ngũ nhân sự trẻ, năng động, sáng tạo và môi trường làm việc chuyên nghiệp, trung tâm luôn chú trọng vào chất lượng sản phẩm và hiệu quả ứng dụng thực tế."),
  E(),
  P("Tầm nhìn : Trở thành đơn vị tiên phong trong việc cung cấp các giải pháp phần mềm tối ưu, giúp đơn giản hóa quy trình quản trị cho mọi hoạt động của nhà trường.", { before: 120 }),
  E(),
  P("Sứ mệnh : Cung cấp các sản phẩm công nghệ \"Dễ dàng - Hiệu quả - Thông minh\", giúp nhà trường tối ưu hóa nguồn lực và tăng năng suất lao động."),
  E(),
  P("Trong thời gian thực tập tại đây, tôi được tiếp cận với quy trình phát triển phần mềm, rèn luyện kỹ năng chuyên môn và học hỏi thêm nhiều kinh nghiệm thực tế trong công việc."),

  H2("1.2. Lĩnh vực hoạt động"),
  P("Trung tâm ICT Đại học Đông Á hoạt động chủ yếu trong lĩnh vực quản trị hệ thống, phát triển phần mềm và cung cấp các giải pháp công nghệ thông tin nội bộ phục vụ công tác đào tạo, quản lý của nhà trường. Trung tâm tập trung vào các mảng nghiệp vụ như:"),
  ...[
    "Phân tích, thiết kế và phát triển các phần mềm (Web) trên nền tảng Microsoft.Net.",
    "Triển khai các giải pháp số hóa giáo dục và quản trị đại học (tiêu biểu như hệ thống thư viện điện tử theo mô hình dịch vụ).",
    "Thiết kế giao diện người dùng (UI/UX).",
    "Hỗ trợ kỹ thuật, xử lý các sự cố liên quan đến hệ thống phần mềm và hạ tầng mạng toàn trường.",
    "Quản trị và cấp phát tài khoản (Account) định danh số cho sinh viên và cán bộ giảng viên.",
    "Nghiên cứu chuyên sâu và ứng dụng các công nghệ mới vào thực tiễn.",
  ].map(s => P(s, { bullet: 0, after: 40 })),

  H2("1.3. Văn hóa và môi trường làm việc"),
  H4("Văn hóa:"),
  P("Trung tâm ICT xây dựng văn hóa làm việc trên nền tảng năng động, chủ động và hợp tác. Trung tâm luôn khuyến khích tinh thần sáng tạo, cầu thị, tạo điều kiện để mỗi cá nhân đóng góp ý tưởng, phát huy năng lực và chủ động học hỏi cập nhật công nghệ mới. Các hoạt động nội bộ như báo cáo chia sẻ kỹ thuật, sinh hoạt chuyên môn hay chương trình teambuilding, vui chơi giải trí được tổ chức định kỳ, giúp tăng sự kết nối và hiểu biết lẫn nhau giữa các thành viên."),
  H4("Môi trường làm việc:"),
  P("Môi trường làm việc tại Trung tâm ICT được định hướng chuyên nghiệp, hiện đại và đầy tính sáng tạo, phù hợp với đặc thù của ngành công nghệ phần mềm. Cơ cấu tổ chức linh hoạt, kết hợp chặt chẽ giữa khả năng làm việc độc lập và làm việc theo nhóm giúp tối ưu quy trình xử lý công việc."),
  E(),
  P("Trung tâm thường xuyên tổ chức các buổi nghiên cứu, trình bày nội bộ (tương tự như \"Tech Talk\") để các thành viên chia sẻ kiến thức về công nghệ, công cụ, ngôn ngữ lập trình mới hay quy trình tối ưu hệ thống."),

  H2("1.4. Các quy trình làm việc"),
  H3("Thu thập và phân tích yêu cầu"),
  P("Trung tâm trao đổi trực tiếp với các phòng ban, khoa hoặc ban giám hiệu (người dùng nội bộ) để xác định rõ yêu cầu nghiệp vụ và tính năng mong muốn đối với hệ thống phần mềm. Mọi thông tin sau đó được đội ngũ kỹ thuật phân tích tổng hợp nhằm đưa ra các giải pháp hoặc sản phẩm phần mềm đáp ứng tối đa nhu cầu của người dùng."),
  H3("Thiết kế và lập kế hoạch"),
  P("Sau khi yêu cầu được thống nhất, đội ngũ kỹ thuật tiến hành thiết kế hệ thống, bao gồm giao diện người dùng, cấu trúc cơ sở dữ liệu và kiến trúc phần mềm. Các bản thiết kế được gửi lại để lấy ý kiến phản hồi nhằm chỉnh sửa, đồng thời xây dựng kế hoạch triển khai chi tiết cho giai đoạn phát triển."),
  H3("Phát triển và kiểm thử"),
  P("Dựa trên các bản thiết kế đã được phê duyệt, đội ngũ lập trình viên tiến hành xây dựng các chức năng của hệ thống (chủ yếu sử dụng ngôn ngữ C#, nền tảng MVC, NetCore và cơ sở dữ liệu SQL Server, MySQL). Mỗi tính năng sau khi hoàn thành đều phải trải qua các bước kiểm thử nội bộ nghiêm ngặt."),
  H3("Triển khai và bàn giao"),
  P("Khi phần mềm đã vượt qua tất cả các bước kiểm thử, hệ thống sẽ được triển khai trực tiếp trên môi trường thực tế. Trung tâm tiến hành bàn giao, phân quyền tài khoản và hướng dẫn vận hành."),
  H3("Bảo hành và hỗ trợ"),
  P("Sau khi bàn giao, trung tâm tiếp tục đóng vai trò là đơn vị cung cấp dịch vụ bảo hành và hỗ trợ kỹ thuật. Mọi yêu cầu hỗ trợ, xử lý sự cố liên quan đến hệ thống đều được đội ngũ tiếp nhận và xử lý kịp thời."),
];

// ─── CHƯƠNG 2: CƠ SỞ LÝ THUYẾT ─────────────────────────────────
const chuong2 = [
  H1("CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ TỔNG QUAN ĐỀ TÀI"),

  H2("2.1. Đặt vấn đề"),
  P("Sự phát triển của Internet và thương mại điện tử đã làm thay đổi đáng kể phương thức tiếp cận sản phẩm và thói quen mua sắm của người tiêu dùng. Khách hàng ngày càng có xu hướng tìm kiếm thông tin, lựa chọn và đặt mua sản phẩm thông qua các nền tảng trực tuyến nhằm tiết kiệm thời gian và nâng cao sự thuận tiện."),
  E(),
  P("Trong lĩnh vực kinh doanh cà phê và đồ uống, nhu cầu ứng dụng các nền tảng trực tuyến để hỗ trợ hoạt động kinh doanh ngày càng trở nên phổ biến. Tuy nhiên, việc quản lý sản phẩm, thông tin khách hàng và đơn hàng tại nhiều cửa hàng vẫn còn phụ thuộc vào các phương thức thủ công hoặc các nền tảng riêng lẻ, gây khó khăn trong việc quản lý dữ liệu và xử lý đơn hàng."),
  E(),
  P("Từ thực tế trên, việc nghiên cứu và xây dựng một hệ thống bán cà phê trực tuyến là một vấn đề có tính thực tiễn, phù hợp với xu hướng ứng dụng công nghệ thông tin vào hoạt động kinh doanh hiện nay."),

  H2("2.2. Lý do chọn đề tài"),
  P("Việc xây dựng một hệ thống bán cà phê trực tuyến có khả năng hỗ trợ khách hàng tìm kiếm sản phẩm, quản lý giỏ hàng và thực hiện đặt hàng, đồng thời hỗ trợ quản trị viên quản lý tập trung các thông tin về sản phẩm, danh mục, khách hàng và đơn hàng là cần thiết. Một hệ thống như vậy không chỉ góp phần nâng cao sự thuận tiện trong quá trình mua sắm mà còn hỗ trợ số hóa hoạt động kinh doanh."),
  E(),
  P("Bên cạnh giá trị thực tiễn, đề tài còn phù hợp với định hướng học tập và chuyên ngành của người thực hiện. Quá trình xây dựng hệ thống Coffee Store tạo điều kiện để vận dụng các kiến thức về phân tích và thiết kế hệ thống, lập trình Web, phát triển ứng dụng Full-stack, xây dựng cơ sở dữ liệu và thiết kế các dịch vụ API vào một sản phẩm phần mềm thực tế."),

  H2("2.3. Cơ sở lý thuyết"),
  H3("2.3.1. Tổng quan về Thương mại điện tử (E-commerce)"),
  P("Thương mại điện tử (Electronic Commerce - E-commerce) là hình thức thực hiện các hoạt động mua bán hàng hóa, cung cấp dịch vụ và thanh toán thông qua môi trường Internet. Đối với lĩnh vực kinh doanh cà phê và đồ uống, việc ứng dụng thương mại điện tử giúp khách hàng dễ dàng tìm kiếm sản phẩm, đặt hàng và thanh toán trực tuyến."),

  H3("2.3.2. Kiến trúc Client-Server"),
  P("Kiến trúc Client – Server là mô hình được sử dụng phổ biến trong quá trình phát triển các ứng dụng Web hiện đại. Trong mô hình này, hệ thống được chia thành hai thành phần chính: Client (phía người dùng) hiển thị giao diện và tiếp nhận thao tác; Server (phía máy chủ) tiếp nhận yêu cầu, xử lý nghiệp vụ, truy xuất cơ sở dữ liệu và trả kết quả."),

  H3("2.3.3. RESTful API"),
  P("RESTful API là kiến trúc xây dựng dịch vụ Web cho phép các ứng dụng giao tiếp với nhau thông qua giao thức HTTP. Các phương thức HTTP được sử dụng gồm: GET (lấy dữ liệu), POST (thêm mới), PUT (cập nhật), DELETE (xóa). Việc sử dụng RESTful API giúp tách biệt rõ ràng giữa giao diện và logic nghiệp vụ."),

  H3("2.3.4. JSON Web Token (JWT)"),
  P("JSON Web Token (JWT) là chuẩn mở được sử dụng để xác thực và phân quyền người dùng. Sau khi đăng nhập thành công, hệ thống sẽ tạo một Access Token chứa thông tin người dùng. Token được đính kèm vào Header của HTTP Request để Server kiểm tra và xác định quyền truy cập."),

  H3("2.3.5. Prisma ORM"),
  P("Prisma là công cụ ORM (Object Relational Mapping) hỗ trợ tương tác giữa ứng dụng và cơ sở dữ liệu thông qua các đối tượng. Prisma sử dụng tệp Schema để định nghĩa cấu trúc cơ sở dữ liệu, tự động sinh Prisma Client phục vụ các thao tác CRUD và hỗ trợ Migration giúp quản lý phiên bản cơ sở dữ liệu."),

  H3("2.3.6. Thanh toán trực tuyến PayOS"),
  P("PayOS là nền tảng thanh toán trực tuyến cho phép doanh nghiệp tích hợp các phương thức thanh toán vào hệ thống. Trong Coffee Store, PayOS được sử dụng để hỗ trợ khách hàng thanh toán khi đặt hàng. Hệ thống tạo yêu cầu thanh toán, chuyển đến PayOS và nhận kết quả thông qua cơ chế Webhook."),

  H3("2.3.7. Nodemailer"),
  P("Nodemailer là thư viện gửi thư điện tử trong môi trường Node.js. Trong Coffee Store, Nodemailer được sử dụng để gửi email tự động xác nhận đơn hàng, thông báo trạng thái đơn hàng."),

  H2("2.4. Công nghệ sử dụng"),
  T(["Công nghệ", "Mục đích"], [
    ["Node.js", "Nền tảng runtime phía server"],
    ["Express.js", "Framework web, routing"],
    ["EJS", "Template engine, render giao diện"],
    ["SQL Server", "Cơ sở dữ liệu quan hệ"],
    ["Prisma ORM", "ORM kết nối và thao tác DB"],
    ["JWT", "Xác thực, refresh token"],
    ["Firebase Auth", "Đăng nhập bằng Google"],
    ["PayOS API", "Cổng thanh toán trung gian"],
    ["Nodemailer", "Gửi email xác nhận"],
    ["Bootstrap 5", "UI framework responsive"],
    ["Chart.js", "Biểu đồ thống kê admin"],
  ]),
  E(),
  P("Về công cụ phát triển: Git & GitHub được sử dụng để quản lý mã nguồn; Visual Studio Code là trình soạn thảo chính; Postman hỗ trợ kiểm thử API."),
];

// ─── CHƯƠNG 3: PHÂN TÍCH THIẾT KẾ ─────────────────────────────
const chuong3 = [
  H1("CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG"),

  H2("3.1. Yêu cầu chức năng"),
  H3("Nhóm khách hàng"),
  T(["STT", "Chức năng", "Mô tả"], [
    ["F1", "Đăng ký", "Tạo tài khoản với username, email, password"],
    ["F2", "Đăng nhập", "Xác thực bằng username/password hoặc Google"],
    ["F3", "Xem sản phẩm", "Duyệt danh sách đồ uống, bánh ngọt"],
    ["F4", "Tìm kiếm", "Tìm theo tên, lọc theo danh mục, giá, đánh giá"],
    ["F5", "Chi tiết sản phẩm", "Xem mô tả, giá, tùy chỉnh món"],
    ["F6", "Tùy chỉnh món", "Chọn size, đường, đá, topping"],
    ["F7", "Giỏ hàng", "Thêm/xoá/sửa số lượng sản phẩm"],
    ["F8", "Thanh toán", "COD hoặc PayOS online"],
    ["F9", "Áp dụng voucher", "Nhập mã giảm giá"],
    ["F10", "Đánh giá", "Gửi đánh giá sao + bình luận"],
    ["F11", "Lịch sử đơn hàng", "Xem các đơn đã đặt"],
    ["F12", "Email xác nhận", "Nhận email sau khi đặt hàng thành công"],
  ]),
  E(),
  H3("Nhóm quản trị viên"),
  T(["STT", "Chức năng", "Mô tả"], [
    ["F13", "Dashboard", "Xem thống kê doanh thu, đơn hàng (biểu đồ)"],
    ["F14", "Quản lý sản phẩm", "Thêm/sửa/xoá sản phẩm"],
    ["F15", "Quản lý đơn hàng", "Cập nhật trạng thái, ghi chú"],
    ["F16", "Quản lý người dùng", "Xoá tài khoản"],
    ["F17", "Quản lý khuyến mãi", "Tạo Promotion (mua N tặng M, giảm %, tặng SP)"],
    ["F18", "Quản lý voucher", "Tạo/sửa/xoá mã giảm giá + quy tắc tự động"],
    ["F19", "Gán voucher", "Gán thủ công voucher cho người dùng"],
    ["F20", "Best Seller", "Cấu hình ngưỡng, override thủ công"],
  ]),

  H2("3.2. Yêu cầu phi chức năng"),
  T(["STT", "Yêu cầu", "Mô tả"], [
    ["NFR1", "Bảo mật", "Mật khẩu mã hoá bcrypt, session httpOnly, JWT refresh token"],
    ["NFR2", "Toàn vẹn dữ liệu", "DB quan hệ (SQL Server), transaction, FK constraint"],
    ["NFR3", "Responsive", "Tương thích desktop, tablet, mobile"],
    ["NFR4", "Khả năng mở rộng", "Kiến trúc module, dễ thêm tính năng mới"],
    ["NFR5", "Logging", "Ghi log server + client để debug"],
  ]),

  H2("3.3. Phân tích thiết kế sơ bộ"),
  H3("3.3.1. Kiến trúc tổng thể"),
  P("Hệ thống Coffee Store được xây dựng theo mô hình Client-Server với kiến trúc MVC (Model-View-Controller) kết hợp Service Layer."),
  E(),

  // Architecture as monospace text
  ...[
    "",
    "  ┌─────────────────────────────────────────────────────────────┐",
    "  │                    CLIENT (Browser)                        │",
    "  │  HTML/EJS  |  CSS/Bootstrap  |  JavaScript (Vanilla)       │",
    "  └──────────────────────┬──────────────────────────────────────┘",
    "                         │ HTTP (session cookie)",
    "  ┌──────────────────────┼──────────────────────────────────────┐",
    "  │                 EXPRESS SERVER                              │",
    "  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │",
    "  │  │  ROUTER     │  │  MIDDLEWARE  │  │  CONTROLLERS     │  │",
    "  │  └──────┬──────┘  └──────┬───────┘  └───────┬──────────┘  │",
    "  │         │                │                   │             │",
    "  │  ┌──────┴────────────────┴───────────────────┴──────────┐ │",
    "  │  │                  SERVICES (Business Logic)            │ │",
    "  │  │  Auth  |  Cart  |  Checkout  |  Payment  |  Voucher  │ │",
    "  │  └──────────────────────┬────────────────────────────────┘ │",
    "  │                         │                                  │",
    "  │  ┌──────────────────────┴────────────────────────────────┐ │",
    "  │  │              PRISMA ORM (Object-Relational Mapping)    │ │",
    "  │  └──────────────────────┬────────────────────────────────┘ │",
    "  └─────────────────────────┼──────────────────────────────────┘",
    "                            │",
    "  ┌─────────────────────────┼──────────────────────────────────┐",
    "  │                   SQL SERVER                               │",
    "  │  User | Product | Cart | Order | Voucher | Promotion       │",
    "  └─────────────────────────────────────────────────────────────┘",
    "",
    "  Dịch vụ ngoài: PayOS (thanh toán) | Firebase (Google Auth) | Gmail SMTP (Email)",
    "",
  ].map(l => P(l, { size: SZ_S, after: 0, before: 0 })),

  P("Luồng dữ liệu: Client gửi HTTP request → Express Router → Middleware → Controller → Service → Prisma ORM → SQL Server → Kết quả render EJS View.", { before: 120 }),

  H3("3.3.2. Use Case Diagram"),
  P("Hệ thống có 2 tác nhân chính: Khách hàng (User) và Quản trị viên (Admin)."),
  ...[
    "",
    "  ┌──────────────────────────────────────────────────────────┐",
    "  │                  COFFEE STORE SYSTEM                     │",
    "  │                                                          │",
    "  │  KHÁCH HÀNG: Đăng ký | Đăng nhập | Xem SP | Giỏ hàng    │",
    "  │              Thanh toán | Voucher | Đánh giá | LS đơn   │",
    "  │                                                          │",
    "  │  QUẢN TRỊ: Dashboard | QL SP | QL Đơn | QL KM          │",
    "  │             QL Voucher | BestSeller | QL User            │",
    "  │                                                          │",
    "  │  HỆ THỐNG NGOÀI: PayOS | Firebase | Gmail               │",
    "  └──────────────────────────────────────────────────────────┘",
    "",
  ].map(l => P(l, { size: SZ_S, after: 0, before: 0 })),

  H3("3.3.3. Sequence Diagram - Đặt hàng PayOS"),
  ...[
    "",
    "  Client              Coffee Store              PayOS            Email",
    "    |                       |                     |               |",
    "    +-- POST /checkout ---->|                     |               |",
    "    |                       +-- Validate voucher  |               |",
    "    |                       +-- Create Order      |               |",
    "    |                       +-- POST payment ---->|               |",
    "    |                       |<---- checkoutUrl ---+               |",
    "    |<-- Redirect PayOS ----+                     |               |",
    "    |                       |                     |               |",
    "    |=== Thanh toán ========+=====================+===           |",
    "    |                       |<-- POST /webhook ----+               |",
    "    |                       +-- Verify signature   |               |",
    "    |                       +-- Update Order       |               |",
    "    |                       +-- Delete Cart        |               |",
    "    |                       +-- Send Email --------+-------------->|",
    "    +-- GET /return ------>|                     |               |",
    "    |<-- success page ------+                     |               |",
    "",
  ].map(l => P(l, { size: SZ_S, after: 0, before: 0 })),

  H2("3.4. Thiết kế cơ sở dữ liệu"),
  P("Hệ thống sử dụng 14 bảng trong SQL Server, được quản lý qua Prisma ORM. Dưới đây là các bảng chính:"),
  E(),
  H3("Bảng User"),
  T(["Cột", "Kiểu", "Ràng buộc", "Mô tả"], [
    ["id", "Int", "PK, auto-increment", "Mã người dùng"],
    ["username", "String", "NOT NULL", "Tên đăng nhập"],
    ["email", "String", "UNIQUE", "Email"],
    ["password", "String", "nullable", "Mật khẩu (bcrypt hash)"],
    ["role", "String", "default 'user'", "user / admin"],
    ["googleId", "String", "UNIQUE, nullable", "ID từ Google"],
  ]),
  E(),
  H3("Bảng Product"),
  T(["Cột", "Kiểu", "Mô tả"], [
    ["id", "Int PK", "Mã sản phẩm"],
    ["name", "String", "Tên sản phẩm"],
    ["price", "Float", "Giá gốc"],
    ["category", "String", "Danh mục (Cà phê, Trà,...)"],
    ["discount", "Int", "% giảm giá"],
    ["isBestSeller", "Boolean", "Best Seller"],
    ["promoTag", "String", "Tag khuyến mãi đặc biệt"],
  ]),
  E(),
  H3("Bảng Order"),
  T(["Cột", "Kiểu", "Mô tả"], [
    ["id", "Int PK", "Mã đơn"],
    ["userId", "Int FK", "Người đặt"],
    ["totalAmount", "Float", "Tổng tiền (sau giảm giá)"],
    ["status", "String", "pending → processing → completed / cancelled"],
    ["paymentMethod", "String", "cash / payos"],
    ["paymentStatus", "String", "pending / completed / failed"],
  ]),
  E(),
  H3("Bảng Voucher"),
  T(["Cột", "Kiểu", "Mô tả"], [
    ["id", "Int PK", "Mã voucher"],
    ["code", "String UNIQUE", "Mã (vd: WELCOME10)"],
    ["discountType", "String", "percent / fixed"],
    ["discountValue", "Float", "% hoặc số tiền"],
    ["minOrderValue", "Float", "Đơn tối thiểu"],
    ["usageLimit", "Int", "Số lần dùng tối đa"],
  ]),
  E(),
  P("Các quan hệ chính: User 1-1 Cart, User 1-N Order, Order 1-N OrderItem, Product 1-N CartItem/OrderItem, Voucher N-N User (qua UserVoucher), Voucher 1-N VoucherRule."),

  H2("3.5. Thiết kế giao diện"),
  P("Giao diện được thiết kế theo phong cách Artisanal Coffee với bảng màu nâu trầm (#4A2C2A), be (#C8956C), cam đất (#D4663C), nền kem (#FAF7F2), sử dụng font Playfair Display (heading) và Plus Jakarta Sans (body). Giao diện responsive trên desktop, tablet và mobile nhờ Bootstrap 5."),
  E(),
  P("Các trang chính gồm: Trang chủ (hero slider, best seller, product grid, tìm kiếm), Chi tiết sản phẩm, Giỏ hàng, Thanh toán (COD/PayOS), Đăng nhập/Đăng ký, Hồ sơ người dùng, Admin Dashboard (thống kê Chart.js, CRUD)."),
];

// ─── CHƯƠNG 4: TRIỂN KHAI ──────────────────────────────────────
const chuong4 = [
  H1("CHƯƠNG 4: TRIỂN KHAI VÀ KẾT QUẢ"),

  H2("4.1. Cấu trúc dự án"),
  P("Dự án được tổ chức theo mô hình MVC kết hợp Service Layer:"),
  ...[
    "",
    "  coffee-store/",
    "  ├── prisma/           # Schema DB, migrations",
    "  ├── src/",
    "  │   ├── app.js        # Khởi tạo Express, mount routes",
    "  │   ├── server.js     # Entry point, auto-job",
    "  │   ├── config/       # DB, env, Firebase",
    "  │   ├── middlewares/   # Auth, logging, error",
    "  │   ├── modules/      # 11 module nghiệp vụ",
    "  │   │   ├── auth/     # Đăng ký, đăng nhập, Google OAuth",
    "  │   │   ├── products/ # CRUD sản phẩm",
    "  │   │   ├── carts/    # Giỏ hàng",
    "  │   │   ├── checkout/ # Thanh toán + tạo đơn",
    "  │   │   ├── orders/   # Lịch sử đơn + email",
    "  │   │   ├── payments/ # PayOS",
    "  │   │   ├── reviews/  # Đánh giá sản phẩm",
    "  │   │   ├── promotions/ # Khuyến mãi",
    "  │   │   ├── vouchers/ # Voucher + rules",
    "  │   │   ├── bestseller/ # Best Seller",
    "  │   │   └── admin/    # Dashboard",
    "  │   ├── public/       # CSS, JS, images",
    "  │   ├── views/        # 14 EJS templates",
    "  │   └── utils/        # JWT, logger, ApiError",
    "  ├── seed.js           # Dữ liệu mẫu",
    "  └── docs/             # Tài liệu",
    "",
  ].map(l => P(l, { size: SZ_S, after: 0, before: 0 })),

  H2("4.2. Các module chính"),
  H3("Module Auth"),
  P("Sử dụng express-session kết hợp JWT refresh token. Đăng ký dùng bcryptjs hash password (salt rounds=10). Hỗ trợ đăng nhập Google qua Firebase Admin SDK. Session httpOnly, sameSite=lax, maxAge=7 ngày."),

  H3("Module Checkout & PayOS"),
  P("Quy trình thanh toán: Kiểm tra giỏ → Validate voucher → Tính tổng (SP - KM - Voucher) → Nếu COD: tạo đơn, xoá giỏ, gửi email, auto-assign voucher. Nếu PayOS: tạo đơn pending, gọi PayOS API tạo payment link, redirect sang PayOS, nhận webhook cập nhật đơn."),
  E(),
  P("PayOS signature dùng HMAC-SHA256 với 5 fields. Webhook được verify chữ ký. Mỗi orderCode = Date.now() (unique)."),

  H3("Module Voucher & Promotion"),
  P("Ba loại Promotion: buyXGetY (mua N tặng M), percentOff (giảm %), freeItem (tặng SP). Voucher có 2 loại: percent (giảm %) và fixed (giảm tiền), kèm ràng buộc minOrderValue, maxDiscount, usageLimit, expiresAt. Auto-assign: hệ thống tự gán voucher khi user đạt milestones (totalSpend, orderCount)."),

  H3("Module Best Seller"),
  P("Tự động xác định sản phẩm bán chạy dựa trên rating trung bình (>=4.0) và số lượng đánh giá (>=5). Hỗ trợ override thủ công (force on/off). Ngưỡng cấu hình qua SiteSetting. Kích hoạt lại mỗi khi có review mới."),

  H3("Module Admin Dashboard"),
  P("Dashboard thống kê: số đơn hôm nay/hôm qua/đang chờ, doanh thu kèm trend %, biểu đồ 12 tháng (Chart.js). Quản lý: CRUD sản phẩm, đơn hàng, người dùng, voucher, promotion, best seller."),

  H2("4.3. Luồng xử lý nghiệp vụ"),
  H3("Luồng thanh toán PayOS"),
  ...[
    "",
    "  1. User chọn PayOS tại Checkout",
    "  2. Server validate voucher, tạo Order (status: pending)",
    "  3. Server gọi PayOS API tạo payment link",
    "  4. Redirect user sang trang PayOS",
    "  5. User thanh toán trên PayOS",
    "  6. PayOS gửi webhook POST /payment/payos/webhook",
    "  7. Server verify signature, cập nhật Order → completed",
    "  8. Server xoá giỏ hàng",
    "  9. Server gửi email xác nhận qua Nodemailer",
    "  10. Server kiểm tra auto-assign voucher (totalSpend, orderCount)",
    "  11. User được redirect về /payment/payos/return → checkout_success",
    "",
  ].map(l => P(l, { size: SZ_S, after: 40, before: 0 })),

  H3("Luồng tự động gán Voucher"),
  ...[
    "",
    "  1. Order hoàn thành (COD hoặc PayOS webhook)",
    "  2. Gọi checkAutoAssignment(userId, totalAmount)",
    "  3. Lấy tất cả VoucherRule đang active",
    "  4. Với mỗi rule:",
    "     - Nếu trigger = totalSpend: tính tổng chi tiêu của user",
    "     - Nếu trigger = orderCount: đếm số đơn completed",
    "     - Nếu đủ threshold và chưa có → upsert UserVoucher",
    "  5. User nhận được voucher, có thể dùng ở lần mua sau",
    "",
  ].map(l => P(l, { size: SZ_S, after: 40, before: 0 })),

  H2("4.4. Kiểm thử"),
  P("Tiến hành kiểm thử thủ công 40 test case trên 6 module, tất cả đều đạt kết quả mong đợi."),
  E(),
  T(["Module", "Số test case", "Đạt", "Không đạt", "Tỉ lệ"], [
    ["Xác thực", "7", "7", "0", "100%"],
    ["Sản phẩm", "6", "6", "0", "100%"],
    ["Giỏ hàng", "6", "6", "0", "100%"],
    ["Thanh toán", "10", "10", "0", "100%"],
    ["Đánh giá", "2", "2", "0", "100%"],
    ["Admin", "9", "9", "0", "100%"],
    ["Tổng", "40", "40", "0", "100%"],
  ]),
  E(),
  P("Các test case tiêu biểu: đăng ký thành công, đăng nhập sai mật khẩu, thêm giỏ hàng khi chưa login, checkout COD/PayOS, voucher hết hạn, voucher dùng rồi, email xác nhận, dashboard thống kê, best seller override."),
];

// ─── CHƯƠNG 5: ĐÁNH GIÁ ─────────────────────────────────────────
const chuong5 = [
  H1("CHƯƠNG 5: ĐÁNH GIÁ KẾT QUẢ THỰC TẬP"),

  H2("5.1. Kết quả đạt được"),
  H3("Về chức năng"),
  P("Hoàn thành 11 module chính với 20+ chức năng: xác thực (local + Google), quản lý sản phẩm (tìm kiếm, lọc, phân trang), giỏ hàng (tùy chỉnh size/đường/đá/topping), thanh toán (COD + PayOS), đơn hàng + email xác nhận, đánh giá sản phẩm, khuyến mãi (buyXGetY/percentOff/freeItem), voucher (auto-assign theo rule), best seller tự động, admin dashboard (Chart.js)."),
  E(),
  H3("Về kỹ thuật"),
  P("Kiến trúc module rõ ràng (MVC + Service Layer), cơ sở dữ liệu quan hệ 14 bảng, tích hợp thành công PayOS (tạo payment, webhook, return), Firebase Auth (Google OAuth), gửi email SMTP template HTML, responsive (Bootstrap 5), design system riêng (CSS custom properties), logger toàn diện (server + client)."),

  H2("5.2. Hạn chế"),
  T(["STT", "Hạn chế", "Hướng khắc phục"], [
    ["1", "Chưa có cache (Redis)", "Thêm Redis cache cho danh sách SP"],
    ["2", "Chưa có realtime notification", "Dùng Socket.IO cho trạng thái đơn"],
    ["3", "Chưa có unit test", "Bổ sung Jest + Supertest"],
    ["4", "CSS 1 file lớn (1257 dòng)", "Tách thành nhiều file theo module"],
    ["5", "Chưa có quản lý kho", "Thêm stock field + cảnh báo hết hàng"],
    ["6", "Chưa có CI/CD", "GitHub Actions + VPS"],
  ]),

  H2("5.3. Hướng phát triển"),
  T(["STT", "Hướng phát triển", "Mô tả", "Ưu tiên"], [
    ["1", "Quản lý kho", "Số lượng tồn, tự động ẩn SP hết hàng", "Cao"],
    ["2", "Mobile App", "Xây dựng app với React Native", "Cao"],
    ["3", "Real-time", "WebSocket cập nhật trạng thái đơn hàng", "Trung"],
    ["4", "AI gợi ý", "Gợi ý SP dựa trên lịch sử mua hàng", "Trung"],
    ["5", "Loyalty (tích điểm)", "Hệ thống tích điểm, tặng quà sinh nhật", "Trung"],
    ["6", "Chatbot", "Hỗ trợ khách hàng tự động", "Thấp"],
    ["7", "CI/CD", "Tự động test + deploy", "Thấp"],
  ]),
];

// ─── NHẬT KÝ ─────────────────────────────────────────────────────
function makeDiaryTable(weekNum, startDate, endDate, days) {
  const rows = days.map(([day, date, work]) => [
    `${day} (${date})`,
    work || "                                          ",
    "",
  ]);
  rows.push(["Tổng kết", "", ""]);
  rows.push(["  Những việc làm được:", "                                          ", ""]);
  rows.push(["  Những việc chưa làm được:", "", ""]);
  rows.push(["  Biện pháp khắc phục:", "", ""]);
  return [
    P(`Nhật ký công việc tuần ${weekNum}, từ ngày ${startDate} đến ngày ${endDate}`, { size: SZ, bold: true, before: 200 }),
    T(["Thứ/Ngày", "CÔNG VIỆC", "XÁC NHẬN CỦA ĐƠN VỊ"], rows),
    E(), E(),
  ];
}

const diaryWeeks = [
  makeDiaryTable(1, "15/06/2026", "21/06/2026", [
    ["Thứ 3", "16/06", ""], ["Thứ 5", "18/06", ""], ["Thứ 7", "20/06", ""],
  ]),
  makeDiaryTable(2, "22/06/2026", "28/06/2026", [
    ["Thứ 3", "23/06", ""], ["Thứ 5", "25/06", ""], ["Thứ 7", "27/06", ""],
  ]),
  makeDiaryTable(3, "29/06/2026", "05/07/2026", [
    ["Thứ 3", "30/06", ""], ["Thứ 5", "02/07", ""], ["Thứ 7", "04/07", ""],
  ]),
  makeDiaryTable(4, "06/07/2026", "12/07/2026", [
    ["Thứ 3", "07/07", ""], ["Thứ 5", "09/07", ""], ["Thứ 7", "11/07", ""],
  ]),
  makeDiaryTable(5, "13/07/2026", "19/07/2026", [
    ["Thứ 3", "14/07", ""], ["Thứ 5", "16/07", ""], ["Thứ 7", "18/07", ""],
  ]),
  makeDiaryTable(6, "20/07/2026", "26/07/2026", [
    ["Thứ 3", "21/07", ""], ["Thứ 5", "23/07", ""], ["Thứ 7", "25/07", ""],
  ]),
  makeDiaryTable(7, "27/07/2026", "02/08/2026", [
    ["Thứ 3", "28/07", ""], ["Thứ 5", "30/07", ""], ["Thứ 7", "01/08", ""],
  ]),
];

const diarySection = [H1("NHẬT KÝ CÔNG VIỆC HÀNG TUẦN"), ...diaryWeeks.flat()];

// ─── FORM: BẢN TỰ ĐÁNH GIÁ ─────────────────────────────────────
const selfEval = [
  H1("BẢN TỰ ĐÁNH GIÁ KẾT QUẢ CỦA SINH VIÊN THỰC TẬP"),
  E(),
  P("Kính gửi: (Đơn vị thực tập)", { before: 120 }),
  P("Trong thời gian thực tập thực tế tại đơn vị, được sự giúp đỡ, giao nhiệm vụ của Anh (Chị) thuộc bộ phận: ....................................................................."),
  P("Em xin tự đánh giá kết quả đạt được như sau:"),
  ...[
    "1. Về chấp hành đúng nội quy, quy định của đơn vị thực tập",
    "2. Về việc thực hiện đúng công việc được phân công trong thời gian thực tập",
    "3. Về thời gian, giờ giấc của SV thực tập học việc",
    "4. Về thực hiện đúng Văn hóa nơi công sở và 12 điều Văn hóa Sinh viên Đông Á",
    "5. Về việc bảo vệ mọi bí mật về thông tin đơn vị mà SV thực tập, an toàn lao động",
    "6. Về đạo đức tác phong trung thực trong công tác, tích cực học hỏi, thái độ cầu tiến",
    "7. Về những đóng góp cho DN",
  ].map(s => P("", { after: 200, indent: { left: convertInchesToTwip(0.3) }, before: 80 })),
  E(),
  P("Sinh viên tự đánh giá", { align: AlignmentType.RIGHT }),
  P("(Ký và ghi rõ họ tên)", { align: AlignmentType.RIGHT }),
];

// ─── FORM: NHẬN XÉT ĐƠN VỊ ─────────────────────────────────────
const companyReview = [
  H1("NHẬN XÉT CỦA ĐƠN VỊ THỰC TẬP"),
  E(),
  P("Tên người chấm: ..............................................................................", { before: 120 }),
  P("Học hàm, học vị: ............................................................................"),
  P("Tên sinh viên: ...................................................... Lớp: ......................."),
  P("Tên chuyên đề: ............................................................................"),
  E(),
  P("A. Ý thức tổ chức kỷ luật:", { bold: true }),
  P("Sinh viên đã làm việc tại đơn vị, xí nghiệp bao nhiêu buổi: 05 buổi/tuần"),
  P("Trong thời gian làm việc: ... – ..."),
  P("Thái độ: tốt, nghiêm túc chấp hành các kỷ luật"),
  E(),
  P("B. Sinh viên đã nắm được vấn đề gì? có sâu không?", { bold: true }),
  P("1. ................................................................................................................................................", { after: 120 }),
  P("2. ................................................................................................................................................", { after: 120 }),
  P("C. Nhận xét góp ý cho sinh viên.", { bold: true }),
  P("1. ................................................................................................................................................", { after: 120 }),
  P("2. ................................................................................................................................................", { after: 120 }),
  P("3. ................................................................................................................................................", { after: 120 }),
  E(),
  P("Xếp loại và cho điểm:", { bold: true }),
  T(["Nội dung", "Xếp loại"], [
    ["1. Tinh thần thái độ", "A    B+    B    C"],
    ["2. Năng lực lý thuyết", "A    B+    B    C"],
    ["3. Năng lực tiếp cận thực tế", "A    B+    B    C"],
  ]),
  E(),
  P("Điểm của sinh viên đạt: ...... điểm (bằng chữ ...............)"),
  E(),
  P("Đà Nẵng, ngày ..... tháng ..... năm ....."),
  P("Cán bộ hướng dẫn", { align: AlignmentType.RIGHT }),
  P("(Ký tên và ghi rõ họ tên)", { align: AlignmentType.RIGHT }),
];

// ─── FORM: NHẬN XÉT GIẢNG VIÊN ─────────────────────────────────
const teacherReview = [
  H1("NHẬN XÉT CỦA GIÁO VIÊN HƯỚNG DẪN THỰC TẬP"),
  E(),
  P("A. Về mặt hình thức báo cáo:", { bold: true, before: 120 }),
  P("", { after: 200 }),
  P("B. Về mặt nội dung:", { bold: true }),
  P("  1. Lý luận:", { before: 80 }), P("", { after: 120 }),
  P("  2. Thực tế:", { before: 80 }), P("", { after: 120 }),
  P("C. Tinh thần, thái độ thực tập:", { bold: true }), P("", { after: 200 }),
  P("D. Những thiếu sót, hạn chế:", { bold: true }), P("", { after: 200 }),
  E(),
  P("Xếp loại và cho điểm: Điểm số: .............. Điểm chữ: .........................."),
  E(),
  P("Đà Nẵng, ngày ..... tháng ..... năm ....."),
  P("Giáo viên hướng dẫn", { align: AlignmentType.RIGHT }),
  P("(Ký và ghi rõ họ tên)", { align: AlignmentType.RIGHT }),
];

// ─── FORM: PHIẾU ĐÁNH GIÁ ───────────────────────────────────────
const evaluationSheet = [
  H1("PHIẾU ĐÁNH GIÁ THỰC TẬP (LÀM VIỆC) CHO SINH VIÊN"),
  E(),
  P("Đơn vị thực tập: ........................................................................................", { before: 120 }),
  P("Địa chỉ: ......................................................................................................."),
  P("Họ tên sinh viên: ........................................................................................."),
  P("Thời gian SV thực tập: Từ ngày ........... đến ngày ..........."),
  P("Sinh viên làm việc tại bộ phận: ......................................................................"),
  E(),
  P("I. Đánh giá của Đơn vị thực tập", { bold: true }),
  P("Xin vui lòng đánh dấu \"x\" vào ô được lựa chọn (Mức 1: Rất thấp → Mức 5: Rất cao)"),
  E(),
  T(["Nội dung", "1", "2", "3", "4", "5"], [
    ["1. SV đi làm đúng giờ, đầy đủ các ngày trong tuần", "", "", "", "", ""],
    ["2. SV có vắng mặt nhiều không, bao nhiêu buổi", "", "", "", "", ""],
    ["3. Thái độ làm việc tích cực, nghiêm túc", "", "", "", "", ""],
    ["4. SV sẵn sàng làm những việc đơn vị yêu cầu", "", "", "", "", ""],
    ["5. SV mạnh dạn giao tiếp, thân thiện với mọi người", "", "", "", "", ""],
  ]),
  E(),
  P("2. SV làm mảng việc nào tích cực nhất:", { bold: true }),
  P("", { after: 120 }),
  P("3. SV thể hiện năng lực chuyên môn rõ nét ở nội dung gì?", { bold: true }),
  P("", { after: 120 }),
  E(),
  P("4. Doanh nghiệp có hài lòng với SV ở những kỹ năng và phẩm chất gì?", { bold: true }),
  E(),
  T(["Nội dung", "1", "2", "3", "4", "5"], [
    ["A. Kỹ năng:", "", "", "", "", ""],
    ["  1. Làm việc nhóm", "", "", "", "", ""],
    ["  2. Giao tiếp, thuyết trình", "", "", "", "", ""],
    ["  3. Tổ chức công việc hiệu quả", "", "", "", "", ""],
    ["  4. Lắng nghe", "", "", "", "", ""],
    ["  5. Giải quyết vấn đề", "", "", "", "", ""],
    ["  6. Sử dụng công nghệ thông tin", "", "", "", "", ""],
    ["B. Phẩm chất:", "", "", "", "", ""],
    ["  1. Trung thực", "", "", "", "", ""],
    ["  2. Thẳng thắn", "", "", "", "", ""],
    ["  3. Trách nhiệm", "", "", "", "", ""],
    ["  4. Làm việc chăm chỉ, thông minh", "", "", "", "", ""],
    ["  5. Luôn có mục tiêu, kiên trì thực hiện", "", "", "", "", ""],
    ["  6. Có thiện chí học hỏi", "", "", "", "", ""],
  ]),
  E(),
  P("5. Doanh nghiệp mong muốn SV nâng cao kỹ năng gì?", { bold: true }),
  P("", { after: 200 }),
  E(),
  P("II. Xếp loại", { bold: true }),
  E(),
  T(["Nội dung", "1", "2", "3", "4", "5"], [
    ["1. Thái độ tích cực - Doanh nghiệp hài lòng", "", "", "", "", ""],
    ["2. Tham gia các công việc gắn với chuyên môn", "", "", "", "", ""],
    ["3. Kỹ năng làm việc chuyên nghiệp", "", "", "", "", ""],
    ["4. Mức độ hài lòng chung của Doanh nghiệp", "", "", "", "", ""],
  ]),
  E(),
  P("7. Xếp loại chung của Nhà trường dựa trên đánh giá của Doanh nghiệp:"),
  P("", { after: 200 }),
  E(),
  P("Ngày thành lập Đơn vị: ............................."),
  P("Địa chỉ mail đơn vị: ....................................."),
  P("Điện thoại đơn vị: ....................................."),
  P("Cán bộ phụ trách SV thực tập: .........................."),
  P("Số điện thoại CB phụ trách: .........................."),
  E(),
  P("LÃNH ĐẠO ĐƠN VỊ", { align: AlignmentType.RIGHT, bold: true }),
  P("(Ký tên & đóng dấu)", { align: AlignmentType.RIGHT }),
];

// ─── FORM: PHIẾU CHẤM ──────────────────────────────────────────
const gradingSheet = [
  H1("PHIẾU CHẤM BÁO CÁO THỰC TẬP TỐT NGHIỆP"),
  E(),
  P("Họ tên sinh viên: .............................................................................", { before: 120 }),
  P("Ngày sinh: ..../..../.......    - Số ID: ...................    - Lớp SH: ..................."),
  P("Đơn vị thực tập: ............................................................................."),
  E(),

  T(["PLO/PI", "Nội dung CLO", "Tiêu chí đánh giá", "TS (%)", "Điểm", "Điểm QĐ"],
  [
    ["PLO1", "CLO1. Trình bày mô hình tổ chức, chức năng doanh nghiệp; tuân thủ nội quy",
     "Tìm hiểu mô hình tổ chức\nTrình bày mô tả vị trí việc làm\nTrình bày quy trình làm việc\nĐảm bảo tiến độ thời gian", "10%", "", ""],
    ["PLO2", "CLO2. Thể hiện tinh thần làm việc chuyên nghiệp, giao tiếp, hợp tác",
     "Kỹ năng làm việc nhóm và thuyết trình\nKỹ năng tự học, tự nghiên cứu", "20%", "", ""],
    ["PLO7", "CLO3. Vận dụng kỹ năng chuyên môn giải quyết công việc tại DN",
     "Điểm đánh giá của DN về việc hoàn thành công việc được giao", "50%", "", ""],
    ["PLO2/3", "CLO4. Sử dụng tiếng Anh trong giao tiếp và công việc", "", "", "", ""],
    ["PLO2/3", "CLO5. Thực hiện báo cáo khoa học cấu trúc chặt chẽ, logic",
     "Trình bày báo cáo rõ ràng, đúng quy định, ít lỗi chính tả (≤10 lỗi)\nBố cục chặt chẽ, mạch lạc\nTrích dẫn và liệt kê tài liệu tham khảo đúng quy định", "20%", "", ""],
  ]),
  E(),
  P("Tổng cộng: 100%", { bold: true }),
  E(),
  P("Nhận xét:", { bold: true }),
  P("", { after: 200 }),
  E(),
  E(),
  P("GIẢNG VIÊN", { align: AlignmentType.RIGHT, bold: true }),
  P("(Ký, ghi rõ họ tên)", { align: AlignmentType.RIGHT }),
];

// ─── BUILD DOCUMENT ──────────────────────────────────────────────
const allChildren = [
  ...cover,
  ...toc,
  PB(),
  ...loiCamOn,
  PB(),
  ...chuong1,
  PB(),
  ...chuong2,
  PB(),
  ...chuong3,
  PB(),
  ...chuong4,
  PB(),
  ...chuong5,
  PB(),
  ...diarySection,
  PB(),
  ...selfEval,
  PB(),
  ...companyReview,
  PB(),
  ...teacherReview,
  PB(),
  ...evaluationSheet,
  PB(),
  ...gradingSheet,
];

const doc = new Document({
  title: "Báo cáo thực tập tốt nghiệp - Coffee Store",
  styles: {
    default: {
      document: {
        run: { font: FONT, size: SZ },
        paragraph: { spacing: { after: 120 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.2),
        },
      },
    },
    children: allChildren,
  }],
});

const outputDir = path.join(__dirname, "..", "docs");
const outputPath = path.join(outputDir, "FILE BAO CAO THUC TAP (chinh thuc).docx");
const tempPath = path.join(outputDir, "_temp_output.docx");
Packer.toBuffer(doc).then(buffer => {
  // Write to temp first to avoid EBUSY
  fs.writeFileSync(tempPath, buffer);
  // Replace original if possible
  try { fs.unlinkSync(outputPath); } catch (e) { /* ignore */ }
  try { fs.renameSync(tempPath, outputPath); } catch (e) {
    // If rename fails (locked), leave as temp
    console.log("⚠ Could not replace original (file may be open in Word), saved as _temp_output.docx");
    console.log("✅ Temp file created:", tempPath);
  }
  if (fs.existsSync(outputPath)) {
    console.log("✅ File Word created:", outputPath);
  }
  console.log("📦 Size:", (buffer.length / 1024).toFixed(1), "KB");
}).catch(err => {
  console.error("❌ Error:", err.message, err.stack);
});
