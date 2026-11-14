# Công ty chứng khoán (`structure` = securities)

File này bổ sung cho mục "Chứng khoán" trong [analysis-framework.md](analysis-framework.md) và dùng trong bước 3–5. Lợi nhuận của một công ty chứng khoán là **beta của thanh khoản thị trường**: mọi nhận định về FA phải gắn với chu kỳ thanh khoản và lãi suất.

## Lợi nhuận theo mảng

Với cấu trúc này, bảng quý trong `tables.md` có thêm các dòng: LN mảng cho vay / môi giới / FVTPL / HTM, YEA, COF, FVTPL cổ phiếu niêm yết, FVTPL trái phiếu, NAV khách hàng, VCSH và Vốn góp. Với mỗi quý cần trả lời hai câu: mảng nào lớn nhất, và mảng nào gây ra phần lớn thay đổi YoY.

- **Cho vay margin:** thường là trụ ổn định. Đọc NIM = YEA − COF. Nếu COF tăng nhanh hơn YEA thì NIM bị ép, dù dư nợ vẫn tăng. Ví dụ SSI từ 2025Q3 đến 2026Q3: COF tăng từ 3,8% lên 5,8%, NIM giảm từ 6,2% xuống 5,5%.
- **Môi giới:** đi theo GTGD toàn thị trường. Biên gộp dao động trong khoảng 0–40%, nên đây là nguồn biến động lớn nhất cùng với FVTPL.
- **FVTPL:** tách phần cổ phiếu niêm yết (rủi ro beta thị trường) khỏi phần trái phiếu, tiền gửi và CD (rủi ro lãi suất). Nếu LN FVTPL tăng vọt trong khi tỷ trọng cổ phiếu niêm yết lớn, coi đó là lợi nhuận theo thị trường, không bền.
- **NAV khách hàng:** proxy cho thị phần và tài sản khách hàng.

## Tăng trưởng: nền cao theo chu kỳ

Quý thanh khoản bùng nổ tạo ra nền so sánh cao cho 4 quý sau. Phải đọc song song `netProfitTTMYoYPct` và `netProfitTTMQoQPct` (trong mục "Chỉ tiêu suy ra"). Trường hợp **YoY dương nhưng TTM QoQ âm** nghĩa là lợi nhuận đã qua đỉnh. Nhóm "Tăng trưởng" của scorecard vẫn chấm theo YoY, nên trường hợp này phải được ghi thành override ở mục Scorecard. Lấy LNST cùng quý năm trước làm nền so sánh cho kỳ BCTC tới và đưa vào phần catalyst/rủi ro.

## Vốn: tăng vốn, pha loãng, ROE

Công ty chứng khoán tăng vốn thường xuyên để mở room margin. Mỗi lần Vốn góp thay đổi trong 8 quý đều phải được phân loại:

| Dấu hiệu trong quý | Diễn giải |
|---|---|
| Vốn góp tăng, VCSH tăng nhiều hơn hẳn LNST của quý | Phát hành thu tiền (chào bán hoặc riêng lẻ): thêm room margin, kéo ROE xuống trong ngắn hạn |
| Vốn góp tăng, `surplusRetainedFunds` (chart `capital`) giảm tương ứng, VCSH gần như đi ngang | Cổ phiếu thưởng hoặc cổ tức bằng cổ phiếu, không có tiền mới. Giá `close` gãy tại ngày GDKHQ (xem gotcha "sự kiện quyền" trong sstock-tools.md) |

Hình thức phát hành là suy luận từ số liệu: ghi kèm "cần tin doanh nghiệp".

- `contributedCapitalYoYPct` > 0 là có pha loãng. So EPS 4 quý với LNST.
- `marginHeadroomBil` = 2 × VCSH − dư nợ margin, tức dư địa còn lại tới trần 200%.
- **ROE:** `roeTTMPct` của nguồn có thể trả về 0 phẳng. Dùng ROE snapshot và đối chiếu với `roeTTMDerivedPct` (LNST TTM / VCSH bình quân 5 quý). Dòng "ROE (tự tính)" trong bảng năm cho phép so với các chu kỳ trước.

## Định giá: P/B đi cùng ROE

- P/B ở percentile thấp chỉ thật sự là rẻ khi ROE hiện tại tương đương ROE của những năm P/B ở quanh trung vị. Hãy đặt ROE tự tính theo năm cạnh biểu đồ P/B 10 năm. Nếu ROE hiện tại thấp hơn hẳn (SSI: 12–13% hiện nay so với 19% năm 2021), thì `at_pb_median10y` là kịch bản lạc quan; ghi rõ điều đó.
- Mã đầu ngành thường giao dịch với premium so với ngành. Đọc `pb_vs_sector_pct` và độ hở giữa hai đường P/B trong `07_valuation.png`: premium thu hẹp là dấu hiệu thị trường đang định giá lại vị thế của mã.

## Bối cảnh & biểu đồ

- Beta với VNINDEX cao, nên trạng thái thị trường, FTD và nhóm vốn hóa đang dẫn dắt (`diffusion`) có trọng số lớn trong kịch bản. Công ty chứng khoán vốn hóa lớn chịu ảnh hưởng trực tiếp từ chỉ số lan tỏa `largeCap`.
- Ngành có nhiều mã, nên so sánh với các mã cùng nhóm vốn hóa trong bảng peers thay vì chỉ so với ngành.
- Khi ROE của nguồn bằng 0, `charts.py` thay panel "Hiệu suất sinh lời" bằng panel "ROE/ROA tự tính": TTM theo quý trên VCSH bình quân 5 quý, theo năm trên VCSH cuối kỳ. Khi trích dẫn, ghi rõ đó là số tự tính.
- Trong `05_fa_dashboard.png`, ưu tiên quan sát: COF so với NIM, cơ cấu FVTPL, NAV khách hàng và cơ cấu nguồn vốn.

**Xong khi:** báo cáo nêu được (1) mảng đóng góp chính và mảng gây ra thay đổi YoY lớn nhất, (2) xu hướng YEA/COF/NIM trong 4 quý, (3) phân loại cho mọi lần Vốn góp thay đổi trong 8 quý, (4) ROE dùng để định giá, kèm nguồn và đặt cạnh ROE các năm trước.
