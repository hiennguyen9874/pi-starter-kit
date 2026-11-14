# Khung phân tích một cổ phiếu

Đi theo trình tự **top-down**: thị trường → ngành → doanh nghiệp → định giá → giá và dòng tiền → tổng hợp. Ở mỗi tầng, mục tiêu là trả lời một câu hỏi bằng **evidence** lấy từ `tables.md`/`metrics.json`.

## 1. Thị trường: "có nên xuống tiền lúc này không?"

- `market.state`: **uptrend** (thuận lợi), **pressure** (giằng co, giảm tỷ trọng mua mới), **downtrend** (ưu tiên phòng thủ). Xem thêm `daysInCurrent`, `ddCount` (≥5 phiên phân phối trong 25 phiên là áp lực bán đáng kể), `latestFtd` (follow-through day, tín hiệu sớm của một nhịp hồi), và lý do của các lần chuyển trạng thái (`transitions`).
- Tâm lý (0-100): dưới 20 là rất bi quan, thường gần đáy ngắn hạn; trên 80 là hưng phấn. Đọc `chg_week/chg_month` để biết xu hướng cải thiện hay xấu đi.
- Dòng tiền lan tỏa: nhóm vốn hóa nào đang dẫn dắt. Nếu mã thuộc nhóm đang yếu thì đó là lực cản.
- P/E thị trường so với TB 3 năm: thị trường rẻ hay đắt so với chính lịch sử của nó.

## 2. Ngành: "ngành có đang được dòng tiền chọn không?"

- RRG ngành: **leading** (RS3 và RS6 đều trên 50), **improving** (động lượng ngắn hạn đang lên), **weakening** (đang mất đà), **lagging**. Hạng RS3/RS6 trên 42 ngành, VCR (≥1 là dòng tiền đang tăng tốc), `breadthPct` (% số mã trên MA50, dưới 50% nghĩa là sức mạnh tập trung ở vài mã), `warning`.
- Quỹ đạo (`tail`, đường đen trong `08_rrg.png`): đi từ improving sang leading là giai đoạn đẹp nhất; từ leading sang weakening là dấu hiệu chốt lời.
- Vị thế của doanh nghiệp: tỷ trọng doanh thu, LNST và vốn hóa trong ngành (`sector.fa`, `stock_cap_share_pct`). Mã chiếm phần lớn ngành (HPG `83%) thì "số liệu ngành" thực chất là số liệu của chính mã đó, nên khi so sánh cần dùng các mã cùng ngành thay vì ngành.
- Biên lợi nhuận của mã so với biên của ngành cho thấy lợi thế cạnh tranh.

## 3. Doanh nghiệp: KPI theo cấu trúc BCTC

Chung cho mọi cấu trúc: tăng trưởng TTM YoY (doanh thu và LNST; `analyze.py` cho +1 điểm khi LNST ≥ 15% và doanh thu ≥ 10%), ROE TTM (≥15% tốt, ≤8% yếu), xu hướng 8 quý chứ không chỉ quý mới nhất, và tách lợi nhuận một lần ra khỏi lợi nhuận cốt lõi (`financialProfit` / `otherProfit` đột biến).

**Phi tài chính** (`nonfinancial`)
- Biên gộp/ròng TTM tăng nghĩa là sức mạnh định giá cải thiện hoặc chu kỳ đang thuận. Với ngành chu kỳ (thép, phân bón, hóa chất, BĐS, vận tải biển), luôn so với đỉnh và đáy chu kỳ trong bảng theo năm.
- Bảng cân đối: `debt` là nợ vay chịu lãi, `appropriatedDebt` là nợ chiếm dụng (phải trả, người mua trả trước). Nợ vay ròng/VCSH ≤30% là tốt, ≥100% là rủi ro. EBIT/chi phí tài chính TTM nên ≥3x.
- Dòng tiền: CFO TTM/LNST TTM ≥0,8 cho thấy lợi nhuận là tiền thật. Đầu tư (investing) âm lớn là đang trong chu kỳ capex; khi XDCB dở dang chuyển sang TSCĐ thì công suất mới bắt đầu ghi nhận doanh thu.
- Tồn kho/Tổng tài sản tăng nhanh hơn doanh thu là rủi ro giảm giá hàng tồn. Người mua trả trước tăng là đơn hàng tốt (BĐS, xây dựng).
- Vốn điều lệ tăng nghĩa là pha loãng, cần so EPS với LNST.

**Ngân hàng** (`bank`)
- Thu nhập: NIM (xu hướng quan trọng hơn mức tuyệt đối), COF tăng sẽ ép NIM, CIR (≤35% là hiệu quả).
- Chất lượng tài sản: NPL ≤1,5% tốt và ≥3% xấu; nợ nhóm 2 tăng là dấu hiệu sớm của nợ xấu; LLR ≥100% là bộ đệm dày, ≤60% là mỏng. Chi phí dự phòng giảm trong khi NPL tăng nghĩa là lợi nhuận đang được "làm đẹp".
- Huy động và tín dụng: CASA cao thì vốn rẻ; LDR gần trần quy định hạn chế dư địa tăng trưởng; tăng trưởng tín dụng so với hạn mức ngành.
- Tăng trưởng LN trước dự phòng (`profitBeforeProvision`) phản ánh năng lực lõi; LNST còn chịu ảnh hưởng của dự phòng.

**Chứng khoán** (`securities`)
- Lợi nhuận phụ thuộc thanh khoản thị trường (môi giới, margin) và tự doanh (beta cao với VNINDEX). Đọc cơ cấu lợi nhuận theo mảng để biết lợi nhuận đến từ đâu.
- Margin/VCSH: trần pháp lý 200%, trên 180% là gần trần. NIM margin cho biết chênh lệch lãi suất cho vay ký quỹ.
- Tự doanh/Tổng tài sản cao thì lợi nhuận biến động mạnh. Xem cơ cấu FVTPL (cổ phiếu niêm yết so với trái phiếu/tiền gửi).
- Checklist chi tiết (lợi nhuận theo mảng, NIM/COF, sự kiện tăng vốn, P/B đi cùng ROE): [securities.md](securities.md).

**Bảo hiểm** (`insurance`)
- Combined ratio <100% là có lãi từ nghiệp vụ bảo hiểm (≤95% tốt, ≥105% xấu). Tỷ lệ bồi thường và tỷ lệ chi phí.
- Lợi nhuận tài chính (danh mục đầu tư, chủ yếu tiền gửi và trái phiếu) thường chiếm phần lớn LNST, nên nhạy với lãi suất.

## 4. Định giá: "giá đang rẻ hay đắt, so với cái gì?"

- So với chính lịch sử của mã: P/E và P/B hiện tại so với trung vị 10 năm và percentile. Percentile ≤20 là vùng rẻ của lịch sử, ≥80 là vùng đắt.
- So với ngành và thị trường: `pe_vs_sector_pct`, P/E VNINDEX.
- **Cổ phiếu chu kỳ:** P/E thấp *ở đỉnh lợi nhuận* là cái bẫy giá trị. Hãy kiểm tra biên lợi nhuận và ROE hiện tại so với đỉnh chu kỳ trước. Ưu tiên P/B kết hợp ROE: P/B thấp với ROE đang tăng là kết hợp tốt nhất. `avg3YPe` thường bị méo bởi năm lợi nhuận đáy.
- **Ngân hàng / chứng khoán / bảo hiểm:** P/B là thước đo chính, đi kèm ROE.
- `implied_price` (giá nếu bội số quay về trung vị hoặc TB 3 năm) là **vùng tham chiếu**, không phải giá mục tiêu. Luôn ghi rõ giả định là lợi nhuận hoặc giá trị sổ sách giữ nguyên.

## 5. Kỹ thuật: "xu hướng giá có xác nhận không?"

- Cấu trúc xu hướng: vị trí giá so với MA50/MA200 và độ dốc của chúng. Xếp chồng giá > MA50 > MA200, tất cả dốc lên, là uptrend chuẩn. Giá dưới MA200 đang dốc xuống là downtrend trung hạn.
- Động lượng: RSI 55–70 là khỏe; trên 80 là quá mua; dưới 40 là yếu. MACD cắt lên signal phía trên 0 là động lượng xác nhận.
- Mức giá theo dõi: đỉnh/đáy 52 tuần, MA200, biên của vùng nền gần nhất (nhìn trên `01_price_technical.png`). ATR% dùng để đặt khoảng dừng lỗ hợp lý (khoảng 2–3×ATR).
- Thanh khoản: GTGD TB20 so với TB60; giá phá vỡ cần đi kèm GTGD vượt TB20.
- Hiệu suất tương đối so với VNINDEX qua 1T/3T/6T/1N.

## 6. Dòng tiền & smart-money: "ai đang mua?"

- **RS3/RS6** (0-100, xếp hạng toàn thị trường): ≥80 là nhóm dẫn đầu, ≤30 là nhóm yếu. Đọc thêm Δ5 phiên và Δ60 phiên trên biểu đồ Sức mạnh.
- **VCR** (tốc độ dòng tiền): <0,8 là rút, 0,8–1 là ổn định, 1–1,2 là tăng, ≥1,2 là mạnh. **AMFI** (mua chủ động có trọng số): >0 nghĩa là phe mua chiếm ưu thế. **bear20Active** là phân kỳ giảm đã được xác nhận, một tín hiệu cảnh báo.
- **Elite v23**: vào vị thế khi đủ 5/5 trụ (rs3 ≥ 80 và rs6 ≥ 60, VCR ≥ 1, AMFI > 0, GTGD20 ≥ 5 tỷ, không có bear20) trong 3 phiên liên tiếp và không bị guard nào chặn. Trụ còn thiếu chính là trigger cần theo dõi. Lịch sử các episode (tỷ lệ thắng, lãi/lỗ trung bình) cho biết tín hiệu này có đáng tin với mã đó hay không.
- Khối ngoại (5/20/60/250 phiên kèm đường lũy kế), mua/bán chủ động (âm kéo dài nghĩa là phe bán chủ động áp đảo), tự doanh. **Xác nhận** là khi giá tăng đồng thời dòng tiền dương; **phân kỳ** là khi giá tăng nhưng dòng tiền âm, hoặc ngược lại.

## 7. So sánh cùng ngành

Đặt mã cạnh các mã khác trong ngành theo RS3/RS6, RRG, VCR, AMFI, vốn hóa (`peers`). Mã đi sau ngành trong khi ngành đang leading thì có thể là cơ hội đuổi theo (nếu cơ bản tốt) hoặc là dấu hiệu của vấn đề riêng của mã. Trong báo cáo phải nói rõ là trường hợp nào.

## 8. Scorecard & ma trận kết luận

`analyze.py → scorecard()` chấm 8 nhóm, mỗi tiêu chí -1/0/+1, điểm nhóm bị chặn trong [-2, +2]. Ngưỡng chính xác được in ở cột "Chi tiết" của `tables.md`; muốn đổi ngưỡng thì sửa trực tiếp trong code. Verdict theo tổng điểm: ≥8 Tích cực, ≥3 Khá tích cực, -2…+2 Trung tính, ≤-3 Khá tiêu cực, ≤-8 Tiêu cực.

Kết luận dựa trên hai tổng phụ:

| | Kỹ thuật & dòng tiền ≥ +3 | Kỹ thuật & dòng tiền ≤ +2 |
|---|---|---|
| **Cơ bản & định giá ≥ +3** | Ứng viên mạnh: cân nhắc giải ngân theo kịch bản | Watchlist: doanh nghiệp tốt nhưng giá chưa xác nhận, chờ trigger kỹ thuật |
| **Cơ bản & định giá ≤ +2** | Chỉ phù hợp giao dịch theo đà, đặt dừng lỗ chặt | Đứng ngoài |

Sau đó điều chỉnh theo Bối cảnh: thị trường downtrend hoặc ngành lagging thì hạ một bậc. Scorecard là công cụ định lượng thô; override khi có evidence mạnh hơn (ví dụ lợi nhuận một lần làm méo tăng trưởng, chuỗi dữ liệu nghi lỗi) và ghi rõ lý do.

## 9. Kịch bản

Viết 3 kịch bản (tích cực / cơ sở / tiêu cực). Mỗi kịch bản có **điều kiện kiểm chứng được** (mức giá cụ thể, ngưỡng RS, GTGD, trạng thái thị trường) và ý nghĩa đi kèm. Kèm danh sách catalyst (kỳ BCTC tới, sự kiện ngành) và rủi ro (đặc thù ngành, bảng cân đối, dòng tiền, giới hạn dữ liệu).
