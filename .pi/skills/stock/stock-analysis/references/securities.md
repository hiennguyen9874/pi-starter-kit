# Công ty chứng khoán (`structure` = securities)

File này bổ sung cho mục "Chứng khoán" trong [analysis-framework.md](analysis-framework.md) và dùng trong bước 3–5. Lợi nhuận của một công ty chứng khoán là **beta của thanh khoản thị trường**: mọi nhận định về FA phải gắn với chu kỳ thanh khoản và lãi suất.

## Lợi nhuận theo mảng

Với cấu trúc này, bảng quý trong `tables.md` có thêm các dòng: LN mảng cho vay / môi giới / FVTPL / HTM, YEA, COF, FVTPL cổ phiếu niêm yết, FVTPL trái phiếu, NAV khách hàng, VCSH và Vốn góp. Với mỗi quý cần trả lời hai câu: mảng nào lớn nhất, và mảng nào gây ra phần lớn thay đổi YoY.

- **Cho vay margin:** thường là trụ ổn định. Đọc NIM = YEA − COF. Nếu COF tăng nhanh hơn YEA thì NIM bị ép, dù dư nợ vẫn tăng. Ví dụ SSI từ 2025Q3 đến 2026Q3: COF tăng từ 3,8% lên 5,8%, NIM giảm từ 6,2% xuống 5,5%.
- **Môi giới:** đi theo GTGD toàn thị trường. Biên gộp dao động trong khoảng 0–40%, nên đây là nguồn biến động lớn nhất cùng với FVTPL.
- **FVTPL:** tách phần cổ phiếu niêm yết (rủi ro beta thị trường) khỏi phần trái phiếu, tiền gửi và CD (rủi ro lãi suất). Nếu LN FVTPL tăng vọt trong khi tỷ trọng cổ phiếu niêm yết lớn, coi đó là lợi nhuận theo thị trường, không bền.
- **NAV khách hàng:** proxy cho thị phần và tài sản khách hàng.
- **LN mảng là lợi nhuận gộp.** Chi phí lãi vay trên nợ vay, chi phí quản lý và thuế không được phân bổ vào mảng nào, nên tổng LN mảng luôn lớn hơn LNST. `unallocatedCostQ` (trong "Chỉ tiêu suy ra") = tổng LN mảng − LNST, tức phần các mảng phải gánh trước khi có lãi. Khi phần này gần bằng tổng LN mảng, chỉ cần một mảng đổi dấu là LNST về gần 0. Ví dụ CTS 2026Q3: tổng LN mảng 189 tỷ, chi phí không phân bổ 184 tỷ, LNST 5 tỷ. FVTPL −41 tỷ đủ để xóa sạch lợi nhuận dù mảng cho vay lập đỉnh 156 tỷ. Muốn biết mảng nào gây ra thay đổi YoY, so mức thay đổi của từng mảng với mức thay đổi LNST (CTS: FVTPL −300 tỷ, LNST −266 tỷ).

## Tăng trưởng: nền cao theo chu kỳ

Quý thanh khoản bùng nổ tạo ra nền so sánh cao cho 4 quý sau. Phải đọc song song `netProfitTTMYoYPct` và `netProfitTTMQoQPct` (trong mục "Chỉ tiêu suy ra"). Trường hợp **YoY dương nhưng TTM QoQ âm** nghĩa là lợi nhuận đã qua đỉnh. Nhóm "Tăng trưởng" của scorecard vẫn chấm theo YoY, nên trường hợp này phải được ghi thành override ở mục Scorecard. Lấy LNST cùng quý năm trước làm nền so sánh cho kỳ BCTC tới và đưa vào phần catalyst/rủi ro.

Sau một năm đỉnh, ROE thường rơi về đáy của chu kỳ trước. Ví dụ CTS: ROE tự tính 21,3% (2021) → 3,8% (2022), rồi 20,2% (2025) → 3,9% TTM (Q3/2026). Đặt `roeTTMDerivedPct` cạnh năm đáy gần nhất trong bảng năm để biết lợi nhuận đã về đáy chu kỳ hay còn rơi tiếp.

## Vốn: tăng vốn, pha loãng, ROE

Công ty chứng khoán tăng vốn thường xuyên để mở room margin. `tables.md` in mỗi lần Vốn góp thay đổi trong 8 quý thành một dòng "Vốn góp …" trong "Sự kiện bảng cân đối", kèm gợi ý LNGPP và đuôi "khớp sự kiện quyền" nếu có. Đuôi "khớp sự kiện quyền" thắng gợi ý LNGPP. Phân loại từng dòng theo bảng:

| Dấu hiệu trong quý | Diễn giải |
|---|---|
| Vốn góp tăng, VCSH tăng nhiều hơn hẳn LNST của quý | Phát hành thu tiền (chào bán hoặc riêng lẻ): thêm room margin, kéo ROE xuống trong ngắn hạn |
| Vốn góp tăng, `surplusRetainedFunds` (chart `capital`) giảm tương ứng, VCSH gần như đi ngang | Cổ phiếu thưởng hoặc cổ tức bằng cổ phiếu, không có tiền mới. Giá `close` gãy tại ngày GDKHQ (xem gotcha "sự kiện quyền" trong sstock-tools.md) |

Hình thức phát hành là suy luận từ số liệu: ghi kèm "cần tin doanh nghiệp".

- `contributedCapitalYoYPct` > 0 là có pha loãng. So EPS 4 quý với LNST.
- `marginHeadroomBil` = 2 × VCSH − dư nợ margin, tức dư địa còn lại tới trần 200%. Sau đợt cổ phiếu thưởng, đọc thêm `surplusRetainedFunds` còn lại: số này thấp (CTS 136 tỷ sau đợt thưởng 2026Q3) và headroom hẹp nghĩa là muốn tăng margin thì phải phát hành thu tiền, tức pha loãng tiếp. Ghi vào rủi ro.
- **ROE:** `roeTTMPct` của nguồn có thể trả về 0 phẳng. Dùng ROE snapshot và đối chiếu với `roeTTMDerivedPct` (LNST TTM / VCSH bình quân 5 quý). Dòng "ROE (tự tính)" trong bảng năm cho phép so với các chu kỳ trước.

## Nguồn vốn, tự doanh và đòn bẩy

Đọc chart `asset`, `capital` và `proprietaryTradingBreakdown` trong `raw/fa_q.json` qua script ad-hoc:

| Dấu hiệu | Diễn giải |
|---|---|
| `htm` (tiền gửi/CD) và `debt` cùng giảm mạnh trong 1–2 quý | Công ty rút tiền gửi để trả nợ vay, tức đang thu hẹp bảng cân đối/giảm đòn bẩy. Đây không phải mất thanh khoản. Mảng HTM giảm đi kèm chi phí lãi vay giảm (CTS 2026Q1→Q3: HTM 3.663 → 2.030 tỷ, nợ vay 9.395 → 7.679 tỷ) |
| FVTPL cổ phiếu niêm yết tăng trong khi LN mảng FVTPL âm | Công ty đang tăng beta (mua thêm hoặc bắt đáy) dù đang lỗ. Ghi tỷ lệ cổ phiếu niêm yết/VCSH vào rủi ro (CTS Q3/2026: 1.042/2.859 ≈ 36%, gấp 2,3 lần Q4/2025) |
| `receivables` tăng đột biến (≥2× QoQ) | Thường là phải thu bán chứng khoán/trái phiếu chưa tất toán hoặc phải thu dịch vụ. Ghi "chưa rõ, cần tin DN" nếu không giải thích được bằng các mảng khác (CTS Q3/2026: 164 → 555 tỷ) |

## Định giá: P/B đi cùng ROE

- P/B ở percentile thấp chỉ thật sự là rẻ khi ROE hiện tại tương đương ROE của những năm P/B ở quanh trung vị. Hãy đặt ROE tự tính theo năm cạnh biểu đồ P/B 10 năm. Nếu ROE hiện tại thấp hơn hẳn (SSI: 12–13% hiện nay so với 19% năm 2021), thì `at_pb_median10y` là kịch bản lạc quan; ghi rõ điều đó.
- P/E chỉ là thước đo phụ. Khi EPS 4 quý sụp (ROE TTM khoảng 5% trở xuống), P/E nhảy vọt lên percentile cao và `at_pe_median10y` không còn ý nghĩa (CTS: P/E 56x, tham chiếu 4,5 nghìn đồng). Hãy bỏ cả hai và định giá bằng P/B. Giá tại P/B ngành (giá × P/B ngành / P/B hiện tại) là một mức tham chiếu tiêu cực hữu ích, ghi kèm giả định VCSH không đổi.
- Mã đầu ngành thường giao dịch với premium so với ngành. Đọc `pb_vs_sector_pct` và độ hở giữa hai đường P/B trong `07_valuation.png`: premium thu hẹp là dấu hiệu thị trường đang định giá lại vị thế của mã.

## Bối cảnh & biểu đồ

- Beta với VNINDEX cao, nên trạng thái thị trường, FTD và nhóm vốn hóa đang dẫn dắt (`diffusion`) có trọng số lớn trong kịch bản. Công ty chứng khoán vốn hóa lớn chịu ảnh hưởng trực tiếp từ chỉ số lan tỏa `largeCap`.
- Ngành có nhiều mã, nên so sánh với các mã cùng nhóm vốn hóa trong bảng peers thay vì chỉ so với ngành.
- Khi ROE của nguồn bằng 0, `charts.py` thay panel "Hiệu suất sinh lời" bằng panel "ROE/ROA tự tính": TTM theo quý trên VCSH bình quân 5 quý, theo năm trên VCSH cuối kỳ. Khi trích dẫn, ghi rõ đó là số tự tính.
- Trong `05_fa_dashboard.png`, ưu tiên quan sát: COF so với NIM, cơ cấu FVTPL, NAV khách hàng và cơ cấu nguồn vốn.

**Xong khi:** báo cáo nêu được (1) mảng đóng góp chính, mảng gây ra thay đổi YoY lớn nhất và chi phí không phân bổ so với tổng LN mảng, (2) xu hướng YEA/COF/NIM trong 4 quý, (3) phân loại cho mọi dòng "Vốn góp" trong "Sự kiện bảng cân đối", kèm LNGPP còn lại và headroom margin, (4) ROE dùng để định giá, kèm nguồn và đặt cạnh ROE các năm trước, (5) lời giải thích cho mọi dấu hiệu trong bảng "Nguồn vốn, tự doanh và đòn bẩy" xuất hiện trong 4 quý gần nhất.
