# Đa ngành, điện & thiết bị điện (Đa ngành 5555, Điện 13, Nước 26, Thiết bị điện & điện tử 32)

File này bổ sung cho mục "Phi tài chính" trong [analysis-framework.md](analysis-framework.md) và dùng trong bước 3–5. Có hai vấn đề cần xử lý. Thứ nhất, **ngành của mã không phản ánh hoạt động kinh doanh**: Đa ngành là một rổ ghép (MSN tiêu dùng, REE điện/BĐS/M&E, GEX thiết bị điện/điện/KCN, VGC VLXD/KCN, HUT BOT, F88 tài chính…), nên RRG, P/E và FA của ngành đều là benchmark sai. Thứ hai, lợi nhuận của doanh nghiệp điện và holding đi qua **công ty liên kết, chu kỳ thủy văn và chu kỳ capex nguồn điện**. Mục "Ngành proxy" áp dụng cho mọi mã Đa ngành. Các mục còn lại chỉ áp dụng cho mã có mảng điện, nước, thiết bị điện hoặc M&E.

## Ngành proxy (chạy ngay sau bước 2)

1. Liệt kê các mảng kinh doanh chính của doanh nghiệp, rồi gán mỗi mảng một `sectorId` lấy trong `raw/sector_rrg.json`: điện 13, nước 26, thiết bị điện/dây cáp 32, BĐS 3, KCN 4, xây dựng/M&E 41, VLXD 40. sstock không có cơ cấu doanh thu theo mảng, nên ghi rõ nguồn của bước gán: "theo hiểu biết, cần BCTC bộ phận".
2. Fetch rồi tính bảng (4 lần gọi MCP cho mỗi ngành):
   Dùng mục **Ngành proxy** của file runtime đã chọn ở SKILL.md: [ipython](runtime-ipython.md#ngành-proxy) khi có tool `ipython`, hoặc [codemode](runtime-codemode.md#ngành-proxy) khi dùng codemode. Chỉ đọc nhánh khớp runtime.
   ```bash
   uv run -q --with pandas --with numpy python .pi/skills/stock/stock-analysis/scripts/proxy_sectors.py stock-reports/REE-2026-11-15
   ```
   Kết quả ghi ra `proxy.md`. Mỗi ngành proxy có RRG kèm hạng, P/E và P/B (hiện tại / TB 3 năm), biên TTM, LNST TTM YoY, chênh lệch P/E và P/B của mã so với ngành, và các mã dẫn dắt.
3. Đọc `proxy.md` thay cho phần số liệu ngành trong `tables.md`:
   - **Bối cảnh:** khi ngành proxy chính (mảng đóng góp lợi nhuận lớn nhất) *leading* còn rổ Đa ngành *lagging*, ghi override nhóm "Bối cảnh" ở mục Scorecard. REE 2026-11-13: Đa ngành *lagging* (RS3 hạng 33/42), trong khi Điện *leading* (#14) và Nước *leading* (#7).
   - **Định giá:** "P/E vs ngành" của scorecard tính theo rổ Đa ngành, thường cho kết luận ngược. REE có P/E 11,3: thấp hơn Đa ngành (14,4) 22%, nhưng **cao hơn Điện (7,7) 46%** và cao hơn Nước (10,6) 7%. Báo cáo ghi cả hai cách so, còn kết luận dựa trên ngành proxy và nêu lý do của mức premium/discount (cơ cấu mảng, đòn bẩy, độ ổn định lợi nhuận).
   - **Tăng trưởng:** đặt LNST TTM YoY của mã cạnh ngành proxy. Ngành tăng mạnh hơn nhiều nghĩa là mã đang đi sau chu kỳ ngành (REE +6,4% so với Điện +74,9%). Nguyên nhân có thể là cơ cấu nguồn (thủy điện, nhiệt điện, tái tạo) hoặc là các mảng khác kéo xuống.
4. Ngành proxy mà RRG chỉ theo dõi 1–2 mã (`proxy.md` in "x mã được RRG theo dõi / y mã niêm yết"; Thiết bị điện 1/13, Nước 2/39) thì RRG của ngành đó thực chất là RRG của 1–2 mã. Khi đó dùng bảng mã dẫn dắt thay cho góc RRG của ngành.

## Lợi nhuận: công ty liên kết và lợi ích thiểu số

- Trong sstock, EBT = `operatingProfit` + `financialProfit` + `otherProfit`, với `operatingProfit` = lãi gộp − bán hàng − quản lý. `financialProfit` là số **ròng sau `financialExpense`** và **gồm cả lãi công ty liên kết và cổ tức**. Ví dụ REE Q3/26: 855 + 232 − 2 = 1.085 = `ebt`. Chi phí tài chính là 201 tỷ, nên thu nhập tài chính cộng lãi liên kết gộp khoảng 433 tỷ/quý.
- Holding có danh mục liên kết lớn (REE nắm các công ty thủy điện và nước) có `financialProfit` là lợi nhuận **định kỳ**, dao động theo thủy văn của các công ty liên kết. Chỉ gọi là lợi nhuận một lần khi quý đó vượt 2× trung vị 8 quý và có bằng chứng đi kèm (thoái vốn: `finInvest` giảm, LCTT đầu tư dương). sstock không tách lãi liên kết khỏi thu nhập tài chính, nên ghi "cơ cấu cần thuyết minh BCTC".
- Dự án điện thường triển khai qua công ty con có đối tác, nên đọc tỷ lệ LNST cty mẹ/EBT (REE Q3/26: 788/1.085 ≈ 73%) và tỷ trọng `minorityInterest` trên tổng vốn chủ.

## Mảng điện: thủy văn, cơ cấu nguồn, capex

- **Thủy điện:** lợi nhuận đi theo lượng nước (La Niña thuận lợi, El Niño bất lợi). Mùa mưa ở miền Bắc kéo dài khoảng T6–T10, miền Trung khoảng T9–T12. Vì vậy so tăng trưởng theo cùng quý năm trước và theo lũy kế năm, không so QoQ. Đỉnh chu kỳ đọc trong bảng năm (REE 2022: biên gộp 46,2%, ROE 19,8%). P/E thấp vào năm thủy văn đỉnh là bẫy giá trị.
- **Nhiệt điện khí/than** có biên mỏng, giá nhiên liệu được chuyển vào giá bán (biên gộp TTM của ngành Điện chỉ 18% vì POW, PGV). **Điện tái tạo** phụ thuộc giá FIT/giá chuyển tiếp và mức cắt giảm công suất. Biên của ngành proxy vì vậy là số pha trộn: so với các mã cùng loại nguồn trong danh sách mã dẫn dắt của `proxy.md`.
- **Chu kỳ capex:** XDCB tăng cùng nợ vay và LCTT tài chính dương nghĩa là đang xây nguồn điện mới. XDCB chuyển sang TSCĐ là thời điểm vận hành thương mại (COD): khấu hao đổi bậc trong 1–2 quý sau, kéo doanh thu đi lên. REE Q1/26: XDCB −1.136, TSCĐ +1.662 tỷ, khấu hao 338 → 380 tỷ/quý. REE Q3/26: XDCB +2.817, nợ vay +1.270, LCTT tài chính +1.061 tỷ, tức một đợt đầu tư mới (dự án cụ thể cần tin doanh nghiệp).
- Dự án điện được tài trợ bằng vay dài hạn, nên nợ vay ròng/VCSH tăng theo chu kỳ capex. Theo dõi EBIT/chi phí tài chính (≥3x) qua từng quý của chu kỳ.
- sstock gói thường không có dữ liệu thủy văn, giá thị trường điện (CGM) hay sản lượng (`search_data_series` chỉ dành cho admin): ghi vào phần giới hạn.

## Thiết bị điện, M&E, EPC

- **Backlog:** `buyerAdvancesShort` và `appropriatedDebt`. Doanh thu ghi nhận theo tiến độ, Q4 thường là quý lớn. Tồn kho, người mua trả trước và doanh thu cùng tăng là đơn hàng đang thi công (REE Q3/26: tồn kho +61,9%, trả trước +96%, doanh thu +28% YoY). Tồn kho tăng khi trả trước đi ngang là rủi ro hàng tồn hoặc chậm nghiệm thu.
- **Phải thu:** EPC/M&E thu tiền theo nghiệm thu. Theo dõi `receivables` so với doanh thu TTM, và CFO đọc theo năm. CFO âm kéo dài nhiều năm là rủi ro thu hồi tiền.
- **Biên gộp** của dây cáp và máy biến áp đi theo giá đồng/nhôm/thép kỹ thuật điện. Gói thường không có các chuỗi giá này: ghi vào phần giới hạn.
- Động lực ngành: đầu tư lưới điện của EVN, Quy hoạch điện VIII, FDI (nhà máy mới cần M&E).

## Định giá

- **Tái định giá cấu trúc:** khi mô hình kinh doanh đổi (REE: P/E 5–7 giai đoạn 2017–2020, 9–18 từ 2021 khi mảng điện lớn lên), trung vị P/E 10 năm bị kéo về phía giai đoạn cũ. Hãy đọc `07_valuation.png`, lấy khoảng P/E từ năm tái định giá làm vùng tham chiếu, và ghi override cho tiêu chí "P/E / trung vị 10N" trong scorecard. P/B ít bị ảnh hưởng hơn.
- Doanh nghiệp tiện ích có lợi nhuận ổn định thì định giá bằng P/B đi cùng ROE và tỷ suất cổ tức. Mã holding nhiều mảng không có SOTP trong sstock: so với từng ngành proxy và nêu mức premium/discount kèm lý do.
- **Cổ tức cổ phiếu hằng năm** (REE ~15%/năm 2023–2026, xem "Sự kiện quyền"): EPS 4 quý đã tính trên số cổ phiếu mới, nên LNST tăng không có nghĩa là EPS tăng. Nêu tăng trưởng EPS cạnh tăng trưởng LNST.

## Dòng tiền

- Một số mã tiện ích/holding đã đầy room ngoại (REE). Khi khối ngoại ròng 250 phiên dưới 0,5% vốn hóa và giao dịch mua lẻ tẻ, ghi "khối ngoại không phải biến số dòng tiền; room cần kiểm chứng" thay vì đọc mua/bán ròng như tín hiệu.
- Beta thấp (REE 0,43) làm RS tăng lên khi thị trường *pressure*. RS cao trong bối cảnh này phản ánh tính phòng thủ, chưa chắc là dòng tiền chủ động. Đối chiếu với tỷ lệ mua/bán chủ động.

**Xong khi:** báo cáo có (1) bảng `proxy.md`, mỗi mảng chính được gán một ngành proxy, kèm kết luận Bối cảnh và P/E so với ngành proxy (ghi override nếu khác scorecard); (2) `financialProfit` được phân loại định kỳ hay một lần, kèm tỷ lệ LNST cty mẹ/EBT; (3) giai đoạn capex: XDCB, nợ vay, các lần COD và bậc khấu hao; (4) với mảng M&E/thiết bị: tồn kho, người mua trả trước và doanh thu YoY cạnh nhau; (5) định giá theo cửa sổ sau tái định giá và theo ngành proxy; (6) giới hạn: thủy văn, giá CGM, giá kim loại, cơ cấu theo mảng.
