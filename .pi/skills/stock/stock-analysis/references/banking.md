# Ngân hàng (`structure` = bank)

File này bổ sung cho mục "Ngân hàng" trong [analysis-framework.md](analysis-framework.md) và dùng trong bước 3–5. Lợi nhuận ngân hàng = quy mô tín dụng × NIM − chi phí hoạt động − **dự phòng**. Dự phòng là biến số ban lãnh đạo chủ động điều chỉnh được, nên mọi nhận định về tăng trưởng phải đi kèm một đánh giá **chất lượng lợi nhuận**.

## Tăng trưởng: lõi trước, LNST sau

- Đọc theo thứ tự: LN trước dự phòng (năng lực lõi) → chi phí dự phòng → LNST. LN trước dự phòng tăng chậm hơn LNST là dấu hiệu lợi nhuận đang nhờ dự phòng.
- Khi `tables.md` có cảnh báo "LNST TTM YoY lệch lũy kế năm", tìm quý gây lệch trong bảng quý. Ví dụ TCB 2024Q4: FX/vàng −424, thu nhập khác −338, chi phí hoạt động 4,741 tỷ (CIR 49,6%), làm LNST chỉ còn 3,371 tỷ. Vì vậy TTM YoY lên +30,3% trong khi 9T chỉ +18,0%. Trích lũy kế năm làm con số tăng trưởng chính.
- Tách TOI theo chart `profitStructure`: lãi thuần, dịch vụ, chứng khoán đầu tư, FX/vàng, khác. Hai mảng FX/vàng và chứng khoán đầu tư có thể đổi dấu theo quý, nên coi là không bền. Với thu nhập dịch vụ, ghi tỷ trọng trong TOI và tốc độ YoY (dòng "Thu nhập dịch vụ (Q)").

## Chất lượng tài sản: mỗi dòng "Sự kiện ngân hàng" cần một lời giải thích

| Dòng trong `tables.md` | Cách đọc |
|---|---|
| "nợ xấu đi theo nhóm" | Nợ đang dịch chuyển xuống nhóm thấp hơn. Nhóm 2 tăng là tín hiệu sớm; nhóm 3 tăng mạnh sẽ đẩy NPL lên ở quý đó hoặc quý sau. Nếu nhóm 5 giảm trong khi số dư dự phòng gần như đi ngang, nhiều khả năng ngân hàng vừa xử lý/xóa nợ (ghi "cần tin DN") |
| "⚠️ NPL … trong khi chi phí dự phòng giảm YoY" | Lợi nhuận đang được hỗ trợ bởi dự phòng thấp. Định lượng phần hỗ trợ này: (dự phòng cùng kỳ − dự phòng quý này) × (1 − 20% thuế) = LNST tăng thêm nhờ dự phòng thấp. Viết lại tăng trưởng YoY sau khi trừ phần đó |
| "LLR … bộ đệm dự phòng mỏng đi" | So với đáy LLR trong bảng năm (TCB: 102% năm 2023). LLR dưới 100% và đang giảm thì chi phí dự phòng sẽ phải tăng lại |

Scorecard nhóm "Chất lượng" chỉ chấm mức NPL/LLR hiện tại, không chấm xu hướng. Khi cả ba dòng trên cùng xuất hiện trong 2 quý gần nhất, ghi chúng thành rủi ro ở mục Scorecard và mục Rủi ro. Override điểm khi NPL đã vượt 1,5% hoặc LLR đã xuống dưới 100%.

**Dữ liệu méo:** `standardRatioPct` (chart `loanStructureByQuality`) chia cho `totalLoans`, mà con số này lớn hơn tổng các nhóm nợ đã phân loại. Vì vậy chuỗi trượt dần xuống dù chất lượng nợ không đổi. Khi `tables.md` có cảnh báo này, dùng NPL/nhóm 2 và tỷ lệ nhóm 1 trên nợ đã phân loại được in kèm.

## Nguồn vốn và NIM

- Đọc YEA, COF, NIM trong 4 quý. COF tăng nhanh hơn YEA thì NIM sẽ bị ép, dù hiện tại NIM vẫn đi ngang. Ví dụ TCB từ 2025Q4 đến 2026Q3: COF tăng 3,3% → 4,4%, YEA tăng 6,7% → 7,5%, NIM giữ 3,7%.
- Dòng "cho vay KH … nhưng tiền gửi KH …" nghĩa là tín dụng đang được tài trợ bằng giấy tờ có giá hoặc liên ngân hàng, tức vốn đắt hơn. Đọc cùng CASA và dòng "Tiền gửi khách hàng".
- Tăng trưởng tín dụng và huy động trong bảng là **lũy kế từ đầu năm**, không phải YoY. So sánh với cùng quý năm trước (cột YoY tính bằng pp). Hạn mức tín dụng NHNN giao không có trong sstock, ghi vào phần giới hạn.

## Vốn và sự kiện

- Ngân hàng hay chia cổ phiếu thưởng. Đọc "Sự kiện quyền" ở mục Giá. Khi có cảnh báo "Số CP lưu hành ≠ vốn điều lệ BCTC", vốn điều lệ trên BCTC chưa cập nhật, còn EPS và P/E đã tính theo số cổ phiếu mới. Mọi mức giá trước ngày GDKHQ trong báo cáo lấy theo `adjClose`.
- Dòng "lợi ích CĐ thiểu số" nghĩa là đã có thay đổi sở hữu ở công ty con (công ty chứng khoán, tài chính tiêu dùng, bảo hiểm). Nếu khoản này tăng cùng lúc với vốn khác (`otherCapital`), nhiều khả năng ngân hàng đã bán bớt cổ phần hoặc IPO công ty con, tức có lãi nằm trong vốn chủ chứ không qua P&L.

## Định giá: P/B đi cùng ROE

- P/B là thước đo chính. Trung vị P/B 10 năm có thể đã hình thành trong giai đoạn ROE cao hơn (TCB: ROE 18–22% trong 2018–2022, nay 15–16%). Hãy đặt ROE theo năm cạnh P/B. Nếu ROE hiện tại thấp hơn ROE của giai đoạn đó, `at_pb_median10y` là kịch bản lạc quan.
- P/B giảm trong khi ROE TTM tăng nghĩa là thị trường đang chiết khấu rủi ro (nợ xấu, COF, dòng tiền) chứ không chiết khấu lợi nhuận. Ghi nhận định này vào mục Định giá.
- P/B ngành gồm cả ngân hàng quốc doanh lẫn tư nhân, nên khi so sánh, ưu tiên các mã cùng nhóm trong bảng peers.

## Bối cảnh và biểu đồ

- Các ngân hàng lớn thuộc nhóm vốn hóa lớn, nên chỉ số lan tỏa `largeCap` là lực đẩy hoặc lực cản trực tiếp.
- Trong `05_fa_dashboard.png`, ưu tiên quan sát: cơ cấu cho vay theo chất lượng nợ, cơ cấu nguồn vốn (tiền gửi, giấy tờ có giá, liên ngân hàng), cơ cấu lợi nhuận.
- `roeTTMPct`/`roaTTMPct` theo năm của nguồn bị lỗi (khoảng 4× `roePct`). `06_fa_annual.png` đã bỏ hai chuỗi này, và `tables.md` có cảnh báo. Dùng `roePct`.

**Xong khi:** báo cáo nêu được (1) tăng trưởng theo lũy kế năm, kèm quý gây lệch TTM nếu có; (2) LN trước dự phòng so với LNST; (3) lời giải thích cho mọi dòng "Sự kiện ngân hàng", kèm phần LNST được hỗ trợ bởi dự phòng thấp nếu có dòng ⚠️; (4) xu hướng YEA/COF/NIM và nguồn tài trợ tín dụng trong 4 quý; (5) phân loại mọi dòng "Sự kiện quyền" trong 12 tháng; (6) P/B đặt cạnh ROE theo năm.
