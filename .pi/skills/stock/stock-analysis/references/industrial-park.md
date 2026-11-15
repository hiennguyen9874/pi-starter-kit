# Bất động sản khu công nghiệp (ngành Khu công nghiệp, sectorId 4)

File này bổ sung cho mục "Phi tài chính" trong [analysis-framework.md](analysis-framework.md) và dùng trong bước 3–5. Lợi nhuận của doanh nghiệp KCN phụ thuộc vào **tốc độ biến quỹ đất thành hợp đồng thuê rồi ghi nhận doanh thu**. Doanh thu ghi nhận theo đợt bàn giao, nên kết quả quý **lumpy**: mọi nhận định về tăng trưởng phải tách được quý đột biến ra khỏi xu hướng.

## Tăng trưởng: doanh thu lumpy

- Hợp đồng thuê trả tiền một lần cho cả kỳ thuê có thể được ghi nhận toàn bộ khi bàn giao (một số doanh nghiệp thì phân bổ dần). Quý có bàn giao lớn tạo đỉnh biên gộp và LNST, đồng thời thành nền cao cho cùng quý năm sau. Ví dụ IDC: Q3/25 doanh thu 2.871 tỷ, biên gộp 43,8%, LNST 842 tỷ, nên Q3/26 giảm -41,5% YoY, trong khi 9T/26 chỉ giảm -7,4%.
- Đọc tăng trưởng theo thứ tự: dòng "Lũy kế năm so với cùng kỳ" → TTM → quý. Nhóm "Tăng trưởng" của scorecard chấm theo TTM. Nếu TTM âm chỉ vì một quý nền đột biến trong khi lũy kế năm dương, ghi override ở mục Scorecard. Nếu lũy kế năm cũng âm thì giữ nguyên điểm.
- Biên gộp quý thay đổi theo cơ cấu doanh thu: cho thuê đất KCN có biên cao; các mảng phụ (điện, BOT, xây lắp, dịch vụ tiện ích) có biên thấp hơn nhưng đều hơn. sstock không trả lợi nhuận theo mảng cho cấu trúc phi tài chính, nên ghi "cơ cấu mảng cần thuyết minh BCTC".
- **Năm không có bàn giao:** doanh thu quý rơi về nền phí dịch vụ/tiện ích và biên gộp tụt theo cơ cấu, không phải vì giá thuê giảm. SZC 2026: ba quý chỉ 102–132 tỷ, biên gộp 34–39%, trong khi các quý bàn giao năm 2025 đạt 379–414 tỷ, biên 44–63%; 9T/26 LNST giảm -76%. Gọi tên năm đó là "chưa có đợt bàn giao lớn được ghi nhận" rồi kiểm tra backlog bên dưới trước khi kết luận doanh nghiệp suy yếu.
- Lấy doanh thu và LNST cùng quý năm trước làm nền cho kỳ BCTC tới (Q4 thường là quý ghi nhận lớn) và đưa vào phần catalyst.

## Quỹ đất trên bảng cân đối

| Series (chart) | Ý nghĩa với KCN |
|---|---|
| `constructionWip` (asset) | Hạ tầng KCN đang đầu tư, chi phí đền bù GPMB |
| `inventory` (asset) | Đất/hạ tầng thương phẩm chờ cho thuê theo kiểu ghi nhận một lần |
| `otherAssets` (asset) | Gồm BĐS đầu tư (hạ tầng cho thuê ghi nhận phân bổ dần); sstock gộp chung |
| `appropriatedDebt` (capital), `buyerAdvancesShort` (inventory) | Người mua trả trước và doanh thu chưa thực hiện: **backlog** tiền đã thu, chưa ghi nhận doanh thu. IDC Q3/26: 8.776 tỷ, lớn hơn nợ vay 5.497 tỷ. Hai dòng "Nợ chiếm dụng" và "Người mua trả trước NH" nằm sẵn trong bảng quý của `tables.md` |
| `investing` (cashFlow) âm lớn | Chu kỳ mở KCN mới. IDC năm 2025: cộng 4 quý ≈ -7.009 tỷ |
| `cashBank` cao, `financialProfit` tăng đều | Tiền thuê thu trước được gửi ngân hàng: thu nhập tài chính đều, không phải lợi nhuận một lần |
| `minorityInterest` (capital) | KCN thường triển khai qua công ty con, nên LNST cty mẹ thấp hơn LNST hợp nhất |

**Backlog khi hai chuỗi đi ngược chiều.** `buyerAdvancesShort` chỉ là trả trước *ngắn hạn*; `appropriatedDebt` gộp cả doanh thu chưa thực hiện *dài hạn* lẫn phải trả khác. Phép thử: Δ`appropriatedDebt` lũy kế năm ≈ CFO − LNST lũy kế năm thì tiền thuê đã thu nhưng hạch toán vào doanh thu chưa thực hiện dài hạn (phân bổ dần hoặc chờ bàn giao), tức backlog đang dày lên dù LNST thấp. SZC 9T/26: trả trước NH 285 → 93 tỷ, nhưng nợ chiếm dụng +602 tỷ, khớp CFO 620 so với LNST 58 tỷ. Ghi "cần thuyết minh BCTC" vì sstock không tách doanh thu chưa thực hiện khỏi phải trả khác.

**Phân loại lại** (danh sách "Sự kiện bảng cân đối" trong `tables.md`; dòng có đuôi "(năm)" lấy từ BCTC năm cho những năm nằm ngoài cửa sổ 17 quý):
- XDCB → tồn kho (IDC Q2/26: XDCB -6.268, tồn kho +6.401 tỷ): dự án hoàn thành hạ tầng và chuyển sang để cho thuê. Phần này sẽ đi vào giá vốn khi bàn giao. Tồn kho/Tổng TS vọt lên (IDC từ 5,7% lên 32,9%) là do kế toán, không phải hàng ế. Rủi ro thật nằm ở tốc độ hấp thụ, cần theo dõi tồn kho giảm dần qua các quý sau.
- XDCB → TSCĐ hoặc `otherAssets`: hạ tầng cho thuê theo kiểu phân bổ dần, doanh thu đều hơn.
- XDCB → "tách sang nhiều khoản" (SZC 2022 (năm): XDCB -2.156 ↔ tồn kho +1.337 + TS khác +1.143 tỷ): một KCN hoàn thành, phần cho thuê một lần vào tồn kho, phần phân bổ dần vào BĐS đầu tư. Tồn kho/TTS cao từ đó về sau là gốc kế toán của lần chuyển này; theo dõi tồn kho 4 quý gần nhất để đo tốc độ hấp thụ.
- Khấu hao thường đổi bậc cùng lúc với lần phân loại lại (IDC từ 270–370 xuống 87–101 tỷ/quý), làm biên gộp các quý sau thay đổi do cách hạch toán. Đánh dấu "cần tin doanh nghiệp".

## Dòng tiền và vốn

- CFO dao động theo tiến độ thu tiền thuê. CFO/LNST < 0,8 trong năm có capex lớn hoặc ngay sau một lần phân loại tồn kho là chuyện thường gặp. Hãy đọc CFO theo năm trước khi kết luận về chất lượng lợi nhuận (IDC 2024–2025: CFO 4.085 / 3.914 tỷ, khoảng 2× LNST).
- Doanh nghiệp KCN hay tăng vốn: cổ tức bằng cổ phiếu (pha loãng, không có tiền mới) hoặc **phát hành quyền mua** (có tiền mới). Dòng vốn điều lệ trong "Sự kiện bảng cân đối" và nhãn "phát hành quyền mua … giá ước …" ở "Sự kiện quyền" phân biệt hai loại. Sau quyền mua, ROE giảm cơ học vì VCSH tăng trước khi tiền mới sinh lời (SZC: VĐL 1.200 → 1.800 tỷ ở Q1/24, ROE năm 13,4% → 10,9% trong hai năm dù LNST tăng). Khi so sánh, dùng EPS 4 quý (đã tính trên số cổ phiếu mới).
- Cổ tức tiền: nhãn "cổ tức tiền ~X đ/cp" × (vốn điều lệ / 10.000 đ) ra tổng tiền chi. Đặt cạnh LNST lũy kế năm; chi vượt lợi nhuận (SZC 2026: ~180 tỷ so với LNST 9T 58 tỷ) là rủi ro duy trì cổ tức hoặc phải vay thêm.

## Định giá

- Giá trị cốt lõi là quỹ đất còn lại (RNAV: diện tích thương phẩm × giá thuê). Dữ liệu này không có trong sstock, nên P/E và P/B chỉ là proxy. Ghi điều này trong phần giới hạn.
- Một quý bàn giao lớn có thể làm P/E thấp giả tạo. So P/E hiện tại với trung vị 10N và đặt cạnh LNST lũy kế năm.
- P/B đi cùng ROE. Kiểm tra cảnh báo tháng P/B ngoại lai trong `tables.md`: IDC có khối P/B 2023 bị lỗi nguồn.
- P/B percentile thấp trong khi ROE TTM thấp nhất chuỗi là P/B co theo ROE, không phải vùng rẻ. Giá tham chiếu theo P/B trung vị/TB 3 năm khi đó không dùng được (SZC: P/B 1,23x, percentile 11%, ROE 5,2% so với 11–24% các năm trước; `at_pb_median10y` 36,5 so với giá 20,85). Ghi rõ trong mục Scorecard rằng điểm +1 của P/B phản ánh ROE thấp.
- Giá tham chiếu theo P/E thấp hơn giá hiện tại nghĩa là thị trường đang định giá trước một đợt ghi nhận lợi nhuận. Nối kết luận này với backlog: backlog dày lên thì có cơ sở, backlog mỏng đi thì là kỳ vọng suông.
- Ngành gộp cả doanh nghiệp KCN thuần lẫn doanh nghiệp có thêm BĐS đô thị (BCM, KBC), nên P/E ngành bị lệch. Ưu tiên so với các mã cùng mô hình trong bảng peers.

## Bối cảnh

- Động lực ngành là FDI đăng ký/giải ngân, thuế quan và giá thuê đất. `search_data_series` chỉ dành cho admin, nên ghi đây là giới hạn và chỉ kết luận từ dữ liệu giá/dòng tiền của ngành.
- Ngành phân hóa mạnh (cùng một thời điểm có thể có cả mã *leading* lẫn *lagging*). Mục So sánh cùng ngành phải nêu được mã đang được chọn và mã bị bỏ lại.
- Nhiều mã KCN niêm yết trên HNX/UPCoM, nên bị guard-2 Elite cố định (xem analysis-framework).

**Xong khi:** báo cáo nêu được (1) tăng trưởng theo lũy kế năm đặt cạnh TTM và quý, kèm quý nào là nền đột biến; (2) quỹ đất: XDCB, tồn kho và backlog (cả `appropriatedDebt` lẫn `buyerAdvancesShort`, kèm phép thử Δ`appropriatedDebt` so với CFO − LNST) cùng xu hướng 4 quý; (3) lời giải thích cho mỗi dòng phân loại lại (kể cả dòng "(năm)") và thay đổi vốn điều lệ, kèm tổng cổ tức tiền đặt cạnh LNST lũy kế năm; (4) CFO đọc theo năm; (5) giới hạn RNAV và dữ liệu FDI.
