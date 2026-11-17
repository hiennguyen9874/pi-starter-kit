# Đối chiếu dữ liệu trước kết luận

Dùng ở bước 3–5 khi gặp các nhánh dưới đây. **STB là ngân hàng (`structure = bank`)**, không phải doanh nghiệp đa ngành/điện. Chọn nhánh theo cấu trúc BCTC và dấu hiệu dữ liệu, không theo mã cổ phiếu.

| Nhánh | Khi nào đọc | Phạm vi |
|---|---|---|
| Nhãn và mẫu số dư nợ (§1) | `structure = bank`, trước khi diễn giải nhóm 2/NPL/LLR | Chỉ ngân hàng |
| Chất lượng tăng trưởng (§2) | Ngân hàng có thu nhập dịch vụ đổi bậc, hoặc dự phòng/số dư nợ biến động trái chiều | Chỉ ngân hàng |
| Nhận diện (§3) | Tên, mã, sàn, website hoặc `structure` giữa các nguồn không khớp | Mọi cấu trúc |
| Cửa sổ so sánh (§4) | Lợi suất trong bảng khác tiêu đề biểu đồ | Mọi cấu trúc |

Các số STB bên dưới là **ca kiểm chứng sstock ngày 17/11/2026**, không phải giả định cho dữ liệu mới. Giữ nguyên raw và key nguồn; lưu phép đối chiếu trong `<workdir>/audit.py` và `audit.json` theo runtime đã chọn. Những nhãn trong `tables.md`/PNG vẫn là output tự động cho tới khi có sửa đổi và kiểm thử riêng trong pipeline.

## 1. Ngân hàng: nhãn tỷ lệ phải khớp số dư

### 1.1. Xác định dư nợ gộp và sau dự phòng

Lấy cùng kỳ, cùng đơn vị và phạm vi hợp nhất:

```text
G1 = standardLoans
G2 = watchLoans
G3 = substandardLoans
G4 = doubtfulLoans
G5 = lossLoans
P  = loanLossProvision               # số dư cuối kỳ
classified = G1 + G2 + G3 + G4 + G5
bad = G3 + G4 + G5
```

1. Đối chiếu `classified` với `loanStructure.totalLoans` và `asset.customerLoans`.
2. Đối chiếu thêm `asset.customerLoans + P`. Khi tổng này khớp dư nợ gộp qua ít nhất ba kỳ liên tiếp đầy đủ, có thể mô tả `customerLoans` là số sau dự phòng **trong bộ dữ liệu đó**.
3. Dùng mẫu số đã đối chiếu để tính tỷ lệ; khi các mẫu số chưa khớp, ghi rõ phạm vi chưa xác định và giữ các phép tính như đối chiếu, chưa thay thế tỷ lệ nguồn.

Sai số kiểm tra thực dụng: so số dư bằng `isclose(rel_tol=1e-6, abs_tol=0.1)` với đơn vị tỷ đồng; so tỷ lệ bằng sai số tuyệt đối ≤0,02 **điểm %** khi nguồn làm tròn hai chữ số. Ghi sai số thực tế nếu ngoài ngưỡng. Đây là dung sai đối chiếu, không phải chuẩn kế toán. Chỉ cộng khi đủ cấu phần hữu hạn và chỉ tính tỷ lệ khi mẫu số dương; giữ `null` cho dữ liệu khuyết hoặc tỷ lệ chưa xác định.

**Ca STB Q3/2026:** tổng năm nhóm nợ **700.346,51** khớp `totalLoans`; `customerLoans` **682.456,51** + dự phòng **17.890** cũng bằng **700.346,51**. Lấy số sau dự phòng làm dư nợ gộp sẽ làm lệch tỷ lệ và tăng trưởng tín dụng.

### 1.2. Xác định ý nghĩa `npl2Pct` thay vì tin nhãn “nhóm 2”

Với mẫu số gộp đã đối chiếu, tính:

```text
group2Pct  = 100 * G2 / grossLoans
nplPct     = 100 * bad / grossLoans
group2to5Pct = 100 * (G2 + bad) / grossLoans
llrPct     = 100 * P / bad
standardPct = 100 * G1 / classified
```

So `rateBadDebt.npl2Pct` với **cả hai ứng viên** `group2Pct` và `group2to5Pct` qua ít nhất ba kỳ liên tiếp có dữ liệu đầy đủ:
- Chỉ ứng viên nhóm 2 khớp: dùng nhãn “nợ nhóm 2”.
- Chỉ ứng viên nhóm 2–5 khớp: dùng nhãn “nợ nhóm 2–5”, đồng thời trình bày nhóm 2 riêng từ số dư.
- Cả hai hoặc không ứng viên nào khớp: ghi “ý nghĩa tỷ lệ chưa xác định”; trình bày số dư nhóm 2 và các tỷ lệ tính lại có nêu mẫu số.

`standardRatioPct` cũng cần đối chiếu trước khi gọi là lỗi nguồn: nếu khớp `G1 / classified`, dùng được; nếu khác do tổng dư nợ có phần chưa phân loại, nêu khác biệt phạm vi và tỷ lệ trên nợ đã phân loại. Một ca lệch mẫu số ở mã khác không chứng minh mọi chuỗi đều lỗi.

**Ca STB Q1–Q3/2026:** `npl2Pct` **7,56 / 10,19 / 9,86%** khớp nhóm 2–5; nhóm 2 riêng khoảng **0,95 / 2,65 / 2,53%**. Q3, `G2 = 17.710,50`, `bad = 51.366,51`, nên nhóm 2 riêng **2,53%**, NPL **7,33%**, nhóm 2–5 **9,86%**, LLR **34,83%**. `standardRatioPct` **90,14%** khớp số dư, không phải lỗi trong ca này.

### 1.3. Đọc tỷ lệ cùng số dư tuyệt đối

Với từng chỉ tiêu đang được mô tả là “cải thiện”, đặt cạnh nhau: **tử số, mẫu số, tỷ lệ, thay đổi QoQ/YoY**. Tỷ lệ giảm nhờ mẫu số tăng nhanh hơn chưa đủ chứng minh chất lượng tín dụng tốt lên.

**Ca STB Q2 → Q3/2026:** NPL **7,54 → 7,33%** nhưng nợ nhóm 3–5 **47.957,09 → 51.366,51 (+7,1%)**; dư nợ gộp tăng khoảng **10,1%**. Nhóm 2 riêng giảm tỷ lệ **2,65 → 2,53%** trong khi số dư tăng **16.826,70 → 17.710,50 (+5,3%)**.

**Xong khi:** bảng đối chiếu có ít nhất ba kỳ đầy đủ hoặc nêu rõ không đủ kỳ; xác định được cách đọc `npl2Pct`, mẫu số dư nợ và LLR hoặc đánh dấu chưa xác định; mọi nhận định cải thiện đi kèm số dư. Khi đổi nhãn, báo cáo phải cảnh báo khác biệt với bảng/PNG tự động. Các công thức này chỉ áp dụng `bank`.

## 2. Ngân hàng: tăng trước dự phòng chưa chắc là tăng trưởng lõi

### 2.1. Thu nhập dịch vụ đổi bậc

Khi dịch vụ tăng vọt hoặc thay thế phần lãi thuần giảm:
1. Đặt tăng trưởng **lãi thuần, dịch vụ, TOI, LN trước dự phòng, chi phí dự phòng, LNST mẹ** cạnh nhau theo quý và YTD cùng kỳ.
2. Tính dịch vụ/TOI và đối chiếu CIR. CIR giảm có thể do thu nhập tăng đột biến, không chỉ do tiết giảm chi phí.
3. Chốt tính lặp lại bằng thuyết minh hoặc công bố doanh nghiệp. Khi chưa có, ghi “chưa rõ cơ cấu/tính lặp lại, cần thuyết minh”; chỉ trình bày tăng LN trước dự phòng quan sát được, chưa nâng thành tăng trưởng lõi bền vững.

**Ca STB 9T/2026:** LN trước dự phòng **+42,6%**, nhưng lãi thuần **−17,8%**, dịch vụ **+253,7%**. Dịch vụ Q3 **4.254,78**, chiếm **41,3% TOI**, so **7,7%** cùng kỳ. Dữ liệu này chưa phân biệt thu phí thường xuyên, khoản phí một lần hay phân loại lại. Nguồn gốc khoản thu cần xác nhận riêng trước khi chuẩn hóa EPS hoặc cộng premium P/B.

### 2.2. Số dư dự phòng giảm dù chi phí tăng

Dùng cầu nối sau khi xác nhận cùng phạm vi, đơn vị và chi phí thực sự là số trong quý:

```text
residual = P_cuối_kỳ - P_đầu_kỳ - creditProvisionExpense_trong_quý
```

`residual` là **phần cầu nối chưa được giải thích**; sử dụng dự phòng xử lý nợ, hoàn nhập, thay đổi phạm vi hay điều chỉnh khác chỉ là các khả năng. Đọc cùng thay đổi từng nhóm nợ và VAMC; chốt nguyên nhân bằng thuyết minh. Giữ cách đọc độ nhạy LLR và tác động sau thuế theo [banking-checks.md](banking-checks.md#3-llr-tính-độ-nhạy-không-suy-ra-nghĩa-vụ-trích-lập).

**Ca STB Q3/2026:** `17.890 − 27.176,90 − 5.728,75 = −15.015,65` tỷ. Nhóm 5 giảm nhưng nhóm 3 và tổng nợ xấu tăng; phép tính cầu nối chưa chứng minh đã thu hồi tiền hoặc xóa nợ.

**Xong khi:** từng bước nhảy thu nhập và dự phòng có kỳ, số tiền, cầu nối hoặc nhãn chưa rõ; kết luận tách **quan sát / giả thuyết / bằng chứng xác nhận**. Scorecard giữ điểm gốc; nếu override thì ghi tiêu chí, điểm trước/sau và tổng phụ theo khung chung.

## 3. Mọi cấu trúc: nhận diện doanh nghiệp lệch nguồn

Khi tên không khớp mã hoặc website, đối chiếu `code`/`mack`, sàn, `nameEn`, `nameShort`, website và rổ ngành trước khi chọn BCTC:
- Các trường nhận diện còn lại đồng thuận, chỉ tên lỗi: ghi cảnh báo metadata, nêu cơ sở chọn tên hiển thị và giữ raw nguyên trạng. Việc đồng thuận giữa các trường chỉ là đối chiếu nội bộ nguồn, chưa phải xác minh độc lập.
- Mã, sàn hoặc cấu trúc BCTC còn mâu thuẫn: dừng phần FA/định giá cho tới khi làm rõ; không ép sang tool BCTC khác bằng phỏng đoán.

**Ca STB:** `company.name` ghi “Sài Gòn Tài Lộc” trong khi English, tên ngắn và website chỉ tới Sacombank/Sài Gòn Thương Tín. Ghi đây là bất nhất metadata; chưa có cơ sở coi là ngân hàng đổi tên. Tương tự, một cờ metadata như `isActive` không tự đủ để kết luận cổ phiếu đã ngừng giao dịch.

**Xong khi:** báo cáo nêu trường lệch, cơ sở nhận diện và mức xác minh; mọi phần phụ thuộc nhận diện chưa rõ được hoãn kết luận.

## 4. Mọi cấu trúc: bảng và biểu đồ khác lợi suất

Khi `metrics`/`tables` khác tiêu đề biểu đồ 02, kiểm tra ngày đầu/cuối, số điểm và số khoảng sinh lời, cách ghép lịch STB–VNINDEX và `close`/`adjClose`. Chọn một cửa sổ làm chuẩn trong lời viết, chú thích cửa sổ còn lại; dùng giá điều chỉnh cho lịch sử có quyền theo khung chung.

Trong phiên bản pipeline quan sát ở ca STB, chart chuẩn hóa **252 điểm** sau khi ghép hai chuỗi, còn lợi suất 1Y của metrics dùng **độ trễ 252 phiên** (cần 253 điểm). Vì vậy **+42,3%/+5,8%** trên chart và **+45,0%/+8,4%** trong bảng có thể khác dù cùng ngày cuối. Kiểm tra code hiện tại trước khi dùng lời giải thích này cho lượt mới; đây không phải quy tắc rằng mọi sai lệch đều do một phiên gốc.

**Xong khi:** sai lệch đã đối chiếu được với cửa sổ thực tế, hoặc được ghi là chưa giải thích; lời viết không trộn lợi suất từ hai điểm gốc.
