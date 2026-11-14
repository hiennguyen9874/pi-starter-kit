# {MÃ} — {Tên công ty} | Phân tích cổ phiếu

> Dữ liệu sstock tới **{asOf}** · Ngành {sectorName} (sectorId {sectorId}) · Cấu trúc BCTC: {structure} · {giới hạn gói, ví dụ "Gói S1: BCTC 17 quý, giá từ …"}.
> Báo cáo được tạo từ dữ liệu định lượng, **không phải khuyến nghị đầu tư**.

<!-- Mỗi con số lấy từ tables.md / metrics.json / raw. Tiền: tỷ đồng; giá: nghìn đồng. Xóa hết các comment trước khi hoàn tất. -->

## 1. Tóm tắt

**Kết luận:** {1–2 câu: vị trí trong ma trận Cơ bản × Kỹ thuật, cộng bối cảnh}. Scorecard **{total}/±16 → {verdict}** (Kỹ thuật & dòng tiền {x}/8 · Cơ bản & định giá {y}/6 · Bối cảnh {z}/2).

| Luận điểm | Số liệu |
|---|---|
| {tăng trưởng / chất lượng} | {số} |
| {định giá} | {số} |
| {xu hướng giá} | {số} |
| {dòng tiền / sức mạnh} | {số} |

**Điều kiện hành động:** {trigger tích cực có thể kiểm chứng} · {mức vô hiệu hóa}.

## 2. Bối cảnh thị trường & ngành
<!-- trạng thái thị trường + số phiên + ddCount + FTD; tâm lý; lan tỏa (nhóm của mã); P/E thị trường; RRG ngành + hạng + quỹ đạo; độ rộng; tỷ trọng của mã trong ngành -->
![market](charts/09_market.png)

## 3. Kết quả kinh doanh & sức khỏe tài chính
<!-- bảng 5 quý gần nhất với các KPI chính của cấu trúc BCTC; giải thích từng biến động lớn; so sánh với chu kỳ (bảng theo năm); bảng cân đối; dòng tiền; pha loãng -->
![fa key](charts/04_fa_key.png)
![fa annual](charts/06_fa_annual.png)

## 4. Định giá
<!-- P/E, P/B: hiện tại / trung vị 10N / percentile / ngành / VNINDEX; caveat avg3Y bị méo, peSstock bị giữ nguyên; vùng giá tham chiếu kèm giả định -->
![valuation](charts/07_valuation.png)

## 5. Kỹ thuật & xu hướng giá
<!-- cấu trúc MA, vùng nền, RSI/MACD, ATR, thanh khoản so với TB, hiệu suất tương đối -->
![price](charts/01_price_technical.png)
![relative](charts/02_relative_strength.png)

## 6. Dòng tiền & smart-money
<!-- bảng khối ngoại / tự doanh / chủ động; RRG, VCR, AMFI, phân kỳ; Elite: số trụ, trụ thiếu, guard, lịch sử -->
![flow](charts/03_money_flow.png)

## 7. So sánh cùng ngành
<!-- bảng các mã cùng ngành (tables.md) + nhận xét: mã dẫn dắt hay đi sau, vì sao -->
![rrg](charts/08_rrg.png)

## 8. Scorecard
<!-- bảng 8 nhóm kèm ghi chú ngắn; nêu rõ nếu override và lý do -->

## 9. Rủi ro & catalyst
<!-- rủi ro đặc thù ngành / bảng cân đối / dòng tiền; catalyst; giới hạn dữ liệu (gói, tool admin-only, chuỗi nghi lỗi) -->

## 10. Kịch bản & mức giá theo dõi

| Kịch bản | Điều kiện | Ý nghĩa |
|---|---|---|
| Tích cực | {mức giá / RS / GTGD} | {…} |
| Cơ sở | {…} | {…} |
| Tiêu cực | {mức vô hiệu hóa} | {…} |

---
*Phụ lục:* dữ liệu thô ở `raw/`, chỉ số ở `metrics.json`, bảng đầy đủ ở `tables.md`, biểu đồ ở `charts/` (gồm cả [05_fa_dashboard](charts/05_fa_dashboard.png)).
