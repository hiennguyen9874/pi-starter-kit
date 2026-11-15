# Ngân hàng — kiểm chứng khi số liệu bất thường

Đọc cùng [banking.md](banking.md) trước bước 3 khi `structure = bank`. File này phân biệt **số liệu quan sát**, **giả thuyết nguyên nhân** và **kịch bản độ nhạy**. Các nhãn tự động trong `tables.md` là gợi ý điều tra; xác nhận nguyên nhân bằng thuyết minh BCTC hoặc công bố doanh nghiệp. Ví dụ TPB dưới đây là ca kiểm thử dữ liệu tới 2026-11-13, không phải quy tắc riêng cho mã này.

## 1. Dự phòng: số dư khác chi phí

- `loanLossProvision` là **số dư** dự phòng cuối kỳ; `creditProvisionExpense` là **chi phí** trong quý. Cầu nối số dư có thể gồm chi phí mới, sử dụng dự phòng xử lý nợ, hoàn nhập và điều chỉnh khác. Đọc cả hai khi NPL/LLR thay đổi.
- Nhãn "NPL tăng, chi phí dự phòng giảm YoY" cần lượng hóa trước khi kết luận lợi nhuận phụ thuộc dự phòng: `(chi phí cùng kỳ − chi phí kỳ này) × 0,8`. Hệ số 0,8 giả định thuế 20%, chỉ là độ nhạy sau thuế; tác động tới LNST cty mẹ còn phụ thuộc lợi ích thiểu số. TPB 2026Q3 dự phòng giảm khoảng 4 tỷ, tác động sau thuế chỉ khoảng 3 tỷ (~0,1% LNST quý), nên không thể giải thích mức tăng LNST 51,8%.
- Dùng dòng lũy kế **LN trước dự phòng** và **chi phí dự phòng** trong `tables.md` để kiểm chứng tăng trưởng lõi. TPB 9T/2026: lần lượt +17,2% và +0,2%, trong khi LNST +20,0%.

## 2. NPL cuối năm: kiểm chứng thay vì gán mùa vụ

Khi số dư nợ nhóm 3–5 và số dư dự phòng cùng giảm, so thêm nhóm 2, trái phiếu VAMC, dư nợ và quý tiếp theo. Đây có thể là xử lý nợ bằng dự phòng, nhưng cũng có thể do thu hồi, chuyển nhóm hoặc thay đổi phạm vi hợp nhất.

- TPB 2025Q4: nợ nhóm 3–5 giảm 6.590 → 3.938 tỷ, dự phòng 4.035 → 3.630 tỷ; quý 1/2026 NPL bật lại 1,29% → 1,85%. Viết "nghi xử lý nợ, cần thuyết minh", không coi là đã xác nhận xóa nợ hoặc NPL được làm đẹp.
- Chỉ mô tả **mẫu hình lặp lại cuối năm** khi có ít nhất hai cặp Q4 → Q1 quan sát được; một lần giảm cuối năm không chứng minh tính mùa vụ. Cải thiện thật cần đối chiếu thu hồi tiền, chuyển nhóm và trích lập.
- Ngưỡng tự động (nợ nhóm 3–5 giảm ≥15%, số dư dự phòng giảm ≥3%) chỉ để phát hiện biến động, không phải chuẩn kế toán hay tiêu chí xác nhận xóa nợ.

## 3. LLR: tính độ nhạy, không suy ra nghĩa vụ trích lập

Khi LLR thấp/giảm mạnh, đối chiếu `loanLossProvision / (substandardLoans + doubtfulLoans + lossLoans)`. Nếu khác đáng kể LLR nguồn, ghi chênh lệch và kiểm tra phạm vi/mẫu số trước khi tính tiếp.

Giữ nguyên nợ nhóm 3–5, khoản dự phòng bổ sung để đạt LLR giả định là:

`max(0, LLR_giả_định / 100 × nợ_nhóm_3–5 − số_dư_dự_phòng)`

Script lấy mức LLR cao nhất trong 5 quý trước làm **mốc lịch sử** khi LLR hiện tại <100% và thấp hơn mốc ≥10 điểm %. TPB: 57% → 92% tương ứng khoảng 2.472 tỷ dự phòng, ~1.977 tỷ sau thuế 20% (~24% LNST TTM). Đây là **kịch bản độ nhạy**, không phải khoản chắc chắn phải trích, quy định LLR tối thiểu hay dự báo lợi nhuận. Thu hồi/xử lý nợ cũng thay đổi mẫu số LLR.

## 4. Nguồn vốn và khoản mục tổng hợp

- `interbankFundingSharePct` = vốn liên ngân hàng / tổng nguồn vốn; `interbankFundingShareChg4Qpp` là thay đổi 4 quý. `netInterbankBil` = vốn liên ngân hàng − tiền gửi/cho vay TCTD khác; dương nghĩa là vay ròng theo các khoản mục này. So cả mức ròng và thay đổi QoQ, cùng CASA/COF. TPB 2026Q3 vốn liên ngân hàng +27.267 tỷ, tài sản tại TCTD khác +25.627 tỷ: tăng vay ròng chỉ khoảng 1.640 tỷ. Bù trừ kế toán này chưa xử lý chênh lệch kỳ hạn, tiền tệ hoặc tài sản cầm cố, nên không chứng minh an toàn thanh khoản.
- `otherAssets` tăng nhanh: nêu số tiền, YoY và tỷ trọng tổng tài sản; đánh dấu "chưa rõ cơ cấu, cần thuyết minh". Lãi dự thu/phải thu chỉ là các khả năng. TPB 2026Q3: 47.529 tỷ, +244% YoY, 8,0% tổng TS.
- **`otherCapital` không mặc nhiên là vốn chủ.** Kiểm tra nhãn nguồn và cấu phần cộng về `totalCapital`: chart nguồn vốn gồm cả nợ lẫn vốn chủ, khoản "khác" có thể gộp nợ phải trả khác. Chỉ `marketCap / snapshot.pb` cho một đối chiếu gần đúng vốn sổ sách hàm ý (đổi vốn hóa về tỷ); chênh lệch ngày, phạm vi hợp nhất và lợi ích thiểu số phải được ghi rõ. Khi chưa có thuyết minh, không dùng `otherCapital` để chứng minh nguồn chia thưởng hay lãi IPO ghi thẳng vào vốn chủ.
- Lợi ích thiểu số tăng có thể do giao dịch sở hữu hoặc thay đổi hợp nhất. Chỉ gọi tên IPO/bán vốn/mua công ty con khi có công bố xác nhận.

## 5. Sự kiện quyền: đối chiếu hai phép đo

`corporate_actions.factor` được tính từ thay đổi tỷ lệ **close/adjClose** giữa hai phiên, không phải tỷ số giá đóng cửa hai phiên. Biến động giao dịch thông thường đã được triệt tiêu trong phép tính này.

So hệ số điều chỉnh với `sharesOutstanding / (charterCapital × 100.000) − 1` (vốn điều lệ theo tỷ, mệnh giá 10.000 đ). Tỷ lệ thứ hai chỉ là chênh lệch hai nguồn khác thời điểm, chưa phải tỷ lệ chính thức của một đợt phát hành. TPB: hệ số khoảng 1,190 nhưng số CP snapshot cao hơn BCTC Q3 khoảng 15%. **Ghi chưa khớp, cần ngày GDKHQ và phương án quyền**; có thể có cổ tức tiền kèm CP, nhiều sự kiện hoặc dữ liệu chưa đồng bộ. Giữ giá lịch sử theo `adjClose`; chốt tỷ lệ và loại phát hành theo công bố, không ép hai con số khớp nhau.

## 6. Nền so sánh và scorecard

- Tách **tăng trưởng TTM YoY** khỏi **lũy kế YTD YoY**. Nếu cần giải thích khoảng cách, tính hai tốc độ sau khi loại quý Q4: so tăng trưởng Q4 với tăng trưởng YTD. Một quý Q4 có lợi nhuận lớn chưa đủ chứng minh nó làm tăng tốc độ TTM; cần cả Q4 của năm trước đó. Không mặc định P/E TB 3 năm bị méo chỉ vì có một năm lợi nhuận thấp: đối chiếu chuỗi định giá và cờ `avg3Y_distorted`.
- Giữ điểm gốc và ngưỡng do `tables.md` in ra. NPL 1,5–3% có điểm gốc 0; LLR 60–100% có điểm gốc 0. Việc vừa vượt 1,5% hoặc vừa xuống dưới 100% không tự động tạo điểm âm mới. Nếu xu hướng nợ/LLR đủ mạnh để override, ghi tiêu chí, điểm trước/sau, tính lại tổng phụ và đặt lại vị trí trong ma trận. Phân biệt **điểm gốc**, **đánh giá điều chỉnh**, và **hạ bậc theo bối cảnh**.

**Xong khi:** mỗi nhánh phát sinh có số liệu kèm kỳ; nguyên nhân chưa xác nhận được ghi rõ; mọi độ nhạy nêu giả định; mọi override có điểm trước/sau và tổng phụ; không kết luận xóa nợ, cơ cấu tài sản khác hoặc tỷ lệ phát hành từ chênh lệch tổng hợp đơn thuần.
