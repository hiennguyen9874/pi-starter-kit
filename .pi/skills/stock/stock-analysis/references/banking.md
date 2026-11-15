# Ngân hàng (`structure` = bank)

File này bổ sung cho mục "Ngân hàng" trong [analysis-framework.md](analysis-framework.md) và dùng trong bước 3–5. Đọc kèm [banking-checks.md](banking-checks.md) trước bước 3 để kiểm chứng nguyên nhân, khoản mục tổng hợp và kịch bản độ nhạy. Lợi nhuận ngân hàng = quy mô tín dụng × NIM − chi phí hoạt động − **dự phòng**. Dự phòng là biến số ban lãnh đạo chủ động điều chỉnh được, nên mọi nhận định về tăng trưởng phải đi kèm một đánh giá **chất lượng lợi nhuận**.

## Tăng trưởng: lõi trước, LNST sau

- Đọc theo thứ tự: LN trước dự phòng (năng lực lõi) → chi phí dự phòng → LNST. LN trước dự phòng tăng chậm hơn LNST là dấu hiệu lợi nhuận đang nhờ dự phòng.
- Khi `tables.md` có cảnh báo "LNST TTM YoY lệch lũy kế năm", tìm quý gây lệch trong bảng quý. Ví dụ TCB 2024Q4: FX/vàng −424, thu nhập khác −338, chi phí hoạt động 4,741 tỷ (CIR 49,6%), làm LNST chỉ còn 3,371 tỷ. Vì vậy TTM YoY lên +30,3% trong khi 9T chỉ +18,0%. Trích lũy kế năm làm con số tăng trưởng chính.
- Tách TOI theo chart `profitStructure`: lãi thuần, dịch vụ, chứng khoán đầu tư, FX/vàng, khác. Hai mảng FX/vàng và chứng khoán đầu tư có thể đổi dấu theo quý, nên coi là không bền. Với thu nhập dịch vụ, ghi tỷ trọng trong TOI và tốc độ YoY (dòng "Thu nhập dịch vụ (Q)").
- Dòng "thu nhập khác … khoản một lần" là lợi nhuận một lần, thường là thu hồi nợ đã xử lý ngoại bảng hoặc bán tài sản (ghi "cần tin DN"). Ví dụ OCB 2025Q4: thu nhập khác 894 tỷ, bằng khoảng 6× trung vị, chiếm 24% TOI. Ghi khoản này vào rủi ro **nền so sánh cùng kỳ năm sau** và đừng ngoại suy nó vào LNST TTM.
- Dòng "LNST … QoQ, trong đó dự phòng giảm … đóng góp ~X%" nghĩa là mức tăng quý này đến từ dự phòng, LN trước dự phòng không tăng. Khi dòng này có ⚠️ "cùng quý NPL tăng", tăng trưởng QoQ không phải tín hiệu cải thiện. Báo cáo dùng lũy kế năm và LN trước dự phòng làm thước đo (OCB 2026Q3: LNST +341 tỷ, trong đó 96% đến từ dự phòng giảm từ 905 xuống 495 tỷ).

## Chất lượng tài sản: mỗi dòng "Sự kiện ngân hàng" cần một lời giải thích

| Dòng trong `tables.md` | Cách đọc |
|---|---|
| "nợ xấu đi theo nhóm" | Nợ đang dịch chuyển xuống nhóm thấp hơn. Nhóm 2 tăng là tín hiệu sớm; nhóm 3 tăng mạnh sẽ đẩy NPL lên ở quý đó hoặc quý sau. Nếu nhóm 5 giảm trong khi số dư dự phòng gần như đi ngang, nhiều khả năng ngân hàng vừa xử lý/xóa nợ (ghi "cần tin DN") |
| "⚠️ NPL … trong khi chi phí dự phòng giảm YoY" | Lợi nhuận đang được hỗ trợ bởi dự phòng thấp. Định lượng phần hỗ trợ này: (dự phòng cùng kỳ − dự phòng quý này) × (1 − 20% thuế) = LNST tăng thêm nhờ dự phòng thấp. Viết lại tăng trưởng YoY sau khi trừ phần đó |
| "LLR … bộ đệm dự phòng mỏng đi" | So với đáy LLR trong bảng năm (TCB: 102% năm 2023). LLR dưới 100% và đang giảm là rủi ro bộ đệm mỏng; đối chiếu thu hồi/xử lý nợ và độ nhạy LLR trước khi dự báo chi phí |
| "nợ nhóm 5 tăng N quý liên tiếp" | Nợ mất vốn đang tích tụ chậm, nên quy tắc +30%/quý không bắt được. Chi phí dự phòng sẽ phải duy trì cao. Lúc này LLR tăng chỉ là đang đuổi theo nợ xấu chứ không phải bộ đệm dày lên (OCB: nhóm 5 tăng từ 3,389 lên 5,852 tỷ trong 5 quý, LLR từ 30% lên 56%) |
| "trái phiếu VAMC … cùng quý NPL giảm" | NPL giảm nhờ bán nợ cho VAMC, nợ chưa được thu hồi. Rủi ro vẫn nằm trên bảng cân đối dưới dạng trái phiếu đặc biệt phải trích dự phòng dần. Báo cáo coi mức NPL trước khi bán là NPL "thật" (OCB 2025Q4: 4.34% xuống 3.39% khi xuất hiện 1,313 tỷ trái phiếu VAMC) |

Nhóm 2 giảm cùng quý nhóm 3–5 tăng **có thể là nợ trượt nhóm**; cần bảng chuyển nhóm để xác nhận, chưa đủ kết luận chất lượng nợ cải thiện. Đọc nhóm 2 cùng các nhóm 3–5 trong `loanStructureByQuality`, đừng đọc riêng nhóm 2.

Scorecard nhóm "Chất lượng" chỉ chấm mức NPL/LLR hiện tại, không chấm xu hướng. Khi nợ trượt nhóm, NPL tăng với dự phòng giảm và LLR mỏng đi cùng xuất hiện trong 2 quý gần nhất, ghi thành rủi ro ở mục Scorecard và mục Rủi ro. Cách giữ điểm gốc và override có giải trình nằm ở mục 6 của [banking-checks.md](banking-checks.md).

**Dữ liệu méo:** `standardRatioPct` (chart `loanStructureByQuality`) chia cho `totalLoans`, mà con số này lớn hơn tổng các nhóm nợ đã phân loại. Vì vậy chuỗi trượt dần xuống dù chất lượng nợ không đổi. Khi `tables.md` có cảnh báo này, dùng NPL/nhóm 2 và tỷ lệ nhóm 1 trên nợ đã phân loại được in kèm.

## Nguồn vốn và NIM

- Đọc YEA, COF, NIM trong 4 quý. COF tăng nhanh hơn YEA thì NIM sẽ bị ép, dù hiện tại NIM vẫn đi ngang. Ví dụ TCB từ 2025Q4 đến 2026Q3: COF tăng 3,3% → 4,4%, YEA tăng 6,7% → 7,5%, NIM giữ 3,7%.
- Dòng "cho vay KH … nhưng tiền gửi KH …" nghĩa là tín dụng đang được tài trợ bằng giấy tờ có giá hoặc liên ngân hàng, tức vốn đắt hơn. Đọc cùng CASA và dòng "Tiền gửi khách hàng".
- Dòng "tiền gửi KH … % QoQ … huy động dân cư co lại" xuất hiện cả khi cho vay đi ngang. Trước khi kết luận ngân hàng thiếu vốn, so mức tăng `interbankFunding` (nguồn vốn) với `depositsLoansToOtherCIs` (tài sản) trong `raw/fa_q.json`. Nếu hai bên cùng tăng thì ngân hàng chủ yếu đang phình bảng cân đối liên ngân hàng, áp lực vốn ròng nhỏ hơn con số gộp (OCB 2026Q3: vốn liên ngân hàng +22,491 tỷ, tiền gửi tại TCTD khác +17,881 tỷ).
- Dòng "CASA … −Xpp" nghĩa là ngân hàng mất vốn rẻ. COF thường tăng trong 1–3 quý sau đó, nên đọc tiếp xu hướng COF.
- Tăng trưởng tín dụng và huy động trong bảng là **lũy kế từ đầu năm**, không phải YoY. So sánh với cùng quý năm trước (cột YoY tính bằng pp). Hạn mức tín dụng NHNN giao không có trong sstock, ghi vào phần giới hạn.

## Vốn và sự kiện

- Ngân hàng hay chia cổ phiếu thưởng. Đọc "Sự kiện quyền" ở mục Giá; dòng vốn điều lệ trong "Sự kiện bảng cân đối" có đuôi "khớp sự kiện quyền" là CP thưởng/cổ tức CP, kể cả khi gợi ý LNGPP ghi "không khớp" (có thể thưởng từ quỹ dự trữ/thặng dư; nguồn cụ thể cần thuyết minh DN). Khi có cảnh báo "Số CP lưu hành ≠ vốn điều lệ BCTC", vốn điều lệ trên BCTC chưa cập nhật, còn EPS và P/E đã tính theo số cổ phiếu mới. Mọi mức giá trước ngày GDKHQ trong báo cáo lấy theo `adjClose`.
- Dòng "lợi ích CĐ thiểu số" gợi ý biến động ở công ty con. Kiểm chứng thay đổi sở hữu/phạm vi hợp nhất theo mục 4 của [banking-checks.md](banking-checks.md).

## Định giá: P/B đi cùng ROE

- P/B là thước đo chính. Trung vị P/B 10 năm có thể đã hình thành trong giai đoạn ROE cao hơn (TCB: ROE 18–22% trong 2018–2022, nay 15–16%). Hãy đặt ROE theo năm cạnh P/B. Nếu ROE hiện tại thấp hơn ROE của giai đoạn đó, `at_pb_median10y` là kịch bản lạc quan.
- P/B giảm trong khi ROE TTM tăng nghĩa là thị trường đang chiết khấu rủi ro (nợ xấu, COF, dòng tiền) chứ không chiết khấu lợi nhuận. Ghi nhận định này vào mục Định giá.
- P/B ngành gồm cả ngân hàng quốc doanh lẫn tư nhân, nên khi so sánh, ưu tiên các mã cùng nhóm trong bảng peers. Bảng peers không có P/B; muốn đặt P/B cạnh 2–4 mã cùng nhóm thì gọi `get_stock_valuation` (`charts: ["pb"]`, `resolution: "1M"`) cho từng mã, mỗi mã một lần gọi; nếu không gọi thì ghi rằng mức chiết khấu so với ngành bị phóng đại bởi nhóm quốc doanh.

## Bối cảnh và biểu đồ

- Các ngân hàng lớn thuộc nhóm vốn hóa lớn, nên chỉ số lan tỏa `largeCap` là lực đẩy hoặc lực cản trực tiếp. Ngân hàng tầm trung (vốn hóa ≈ 30–150 nghìn tỷ) đi theo `midCap`.
- RRG ngành Ngân hàng là bình quân của nhóm quốc doanh/vốn hóa lớn và nhóm tư nhân, và hai nhóm thường phân hóa. Đọc bảng peers và `08_rrg.png` để nói mã đang đi cùng nhóm nào. Vẫn hạ một bậc khi ngành lagging, nhưng nếu nhóm cùng loại đang leading thì ghi rõ để giải thích sức mạnh của mã.
- Trong `05_fa_dashboard.png`, ưu tiên quan sát: cơ cấu cho vay theo chất lượng nợ, cơ cấu nguồn vốn (tiền gửi, giấy tờ có giá, liên ngân hàng), cơ cấu lợi nhuận.
- `roeTTMPct`/`roaTTMPct` theo năm của nguồn bị lỗi (khoảng 4× `roePct`). `06_fa_annual.png` đã bỏ hai chuỗi này, và `tables.md` có cảnh báo. Dùng `roePct`.

**Xong khi:** báo cáo nêu được (1) tăng trưởng theo lũy kế năm, kèm quý gây lệch TTM nếu có; (2) LN trước dự phòng so với LNST; (3) lời giải thích cho mọi dòng "Sự kiện ngân hàng", kèm phần LNST được hỗ trợ bởi dự phòng thấp nếu có dòng ⚠️; (4) xu hướng YEA/COF/NIM và nguồn tài trợ tín dụng trong 4 quý; (5) phân loại mọi dòng "Sự kiện quyền" trong 12 tháng; (6) P/B đặt cạnh ROE theo năm.
