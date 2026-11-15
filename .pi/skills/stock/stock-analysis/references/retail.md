# Bán lẻ (ngành Bán lẻ, sectorId 1)

File này bổ sung cho mục "Phi tài chính" trong [analysis-framework.md](analysis-framework.md) và dùng trong bước 3–5. Chuỗi bán lẻ có **biên ròng mỏng** (1–4%) trên doanh thu rất lớn. Vì vậy lợi nhuận được quyết định bởi **đòn bẩy hoạt động** (chi phí cửa hàng tăng chậm hơn doanh thu) và **vốn lưu động** (tồn kho, tín dụng nhà cung cấp, vay ngắn hạn). Một thay đổi nhỏ ở biên cũng làm lợi nhuận đổi chiều mạnh.

## Tăng trưởng: đòn bẩy hoạt động

- Tách biên gộp và chi phí vận hành. Biên gộp phản ánh **cơ cấu doanh thu** (mảng biên cao như dược phẩm hay bách hóa, so với mảng biên thấp như điện thoại, điện máy). Chi phí bán hàng/doanh thu và quản lý/doanh thu (chart `costStructure`, `profitStructure.operatingProfit`) phản ánh hiệu quả chuỗi.
- Tính bằng script ad-hoc cho 5 quý gần nhất: `sellingExpense/netRevenue`, `adminExpense/netRevenue`, `operatingProfit/netRevenue`. Ví dụ FRT: Q3/25 → Q3/26 chi phí bán hàng giảm từ 13,7% xuống 13,0% doanh thu, biên LN HĐKD tăng từ 2,6% lên 4,0%, nên LNST +101% trong khi doanh thu chỉ +34%.
- Lợi nhuận tăng ba chữ số nhờ đòn bẩy hoạt động sẽ chậm lại khi chi phí/doanh thu chạm sàn. Đặt tăng trưởng LNST cạnh tăng trưởng doanh thu: nếu LNST tăng nhanh hơn doanh thu nhiều lần thì lợi nhuận rất nhạy theo cả hai chiều.
- sstock không có số cửa hàng, doanh thu/cửa hàng, tăng trưởng cùng cửa hàng (SSSG) hay doanh thu theo chuỗi/mảng. Ghi "cơ cấu theo chuỗi cần thuyết minh BCTC/tin DN" trong phần giới hạn.

## Vốn lưu động

| Series (chart) | Ý nghĩa với bán lẻ |
|---|---|
| `inventory` (asset) | Hàng trên kệ và trong kho. So **tăng trưởng tồn kho YoY với doanh thu YoY**; số ngày tồn kho ≈ `inventory / cogs quý × 91` |
| `appropriatedDebt` (capital) | Phần lớn là phải trả nhà cung cấp: tín dụng thương mại tài trợ tồn kho |
| `debt` (capital) | Vay ngắn hạn ngân hàng để nhập hàng; `financialExpense` tăng theo |
| `operating` (cashFlow) | Dao động theo quý vì đợt tích hàng cho mùa cao điểm |

- Quý có tồn kho nhảy, CFO âm và nợ vay tăng cùng lúc nghĩa là **vay để tích hàng** (FRT Q1/26: tồn kho +2.521, CFO -2.611, nợ vay +2.329 tỷ). Theo dõi các quý sau xem tồn kho có được giải phóng không. Nếu tồn kho tăng nhanh hơn doanh thu 2–3 quý liên tiếp thì rủi ro giảm giá hàng tồn là thật.
- Đọc CFO theo năm và theo 4 quý trước khi chấm chất lượng lợi nhuận: CFO/LNST TTM âm vì một quý tích hàng khác với CFO âm kéo dài nhiều năm (FRT 2018–2023).

## Bảng cân đối và capex

- Cửa hàng chủ yếu là đi thuê, nên TSCĐ và XDCB nhỏ, capex thực thấp. LCTT đầu tư âm lớn trong khi TSCĐ đứng yên thường là **gửi tiền có kỳ hạn**: đọc dòng "cashBank … tiền cuối kỳ LCTT" trong "Sự kiện bảng cân đối". Khi đó FCF TTM bị đánh giá thấp đúng bằng phần gửi tiền, còn `cashBank` (đã gồm tiền gửi) được trừ vào nợ vay ròng.
- ROE cao chủ yếu đến từ đòn bẩy tài sản: ROE ≈ ROA × (Tổng TS/VCSH). FRT Q3/26: ROA TTM 6,9%, ROE TTM 34,1%, tức tài sản ≈ 5× VCSH cty mẹ. Ghi rõ ROE cao dựa trên nợ vay và tín dụng nhà cung cấp.
- Chuỗi con có cổ đông ngoài thì `minorityInterest` tăng ("Sự kiện bảng cân đối" có dòng lợi ích CĐ thiểu số), và LNST cty mẹ chỉ là một phần LNST hợp nhất. Ghi tỷ trọng lợi ích thiểu số trên tổng VCSH.

## Định giá

- Thước đo chính là P/E, đi kèm tốc độ tăng LNST. Khi LNST tăng nhanh hơn giá, P/E giảm liên tục (de-rating nhờ lợi nhuận). Trên `07_valuation.png` đây là đường P/E dốc xuống trong khi giá đi ngang, không phải tín hiệu giá sụp.
- Ngành gộp nhiều mô hình: điện máy/ICT/dược (MWG, FRT), trang sức theo giá vàng (PNJ), phân phối (DGW, PET, PSD). P/E và P/B ngành vì thế là số pha trộn. So với các mã cùng mô hình trong bảng peers và ghi P/E premium/discount kèm lý do (ROE, tăng trưởng).
- Biên ròng mỏng và nợ vay lớn làm P/E nhạy với cấu trúc vốn. Bổ sung EV/EBITDA bằng script: `(vốn hóa + debt − cashBank + minorityInterest) / EBITDA 4Q`. FRT Q3/26: (26.286 + 2.445 + 1.283) / 3.336 ≈ 9,0x.
- Mã vừa thoát năm lỗ có P/E TB 3 năm âm hoặc vô nghĩa, và P/B rất cao do VCSH co lại; `tables.md` sẽ có cảnh báo tương ứng. Khi đó dùng trung vị P/E dương và P/B đặt cạnh ROE.

## Bối cảnh

- Động lực ngành là sức mua tiêu dùng, chu kỳ ra mắt sản phẩm điện tử, giá vàng (PNJ) và chính sách thuế/VAT. sstock không có các chuỗi vĩ mô này cho gói thường (`search_data_series` chỉ admin), nên ghi là giới hạn.
- RRG ngành chỉ theo dõi khoảng 7 mã, nên một hai mã lớn quyết định trạng thái ngành. Mã *leading* trong ngành *lagging* là sức mạnh riêng của mã: nói rõ điều này ở mục So sánh cùng ngành.

**Xong khi:** báo cáo nêu được (1) đòn bẩy hoạt động: chi phí bán hàng/doanh thu và biên LN HĐKD trong 5 quý; (2) tồn kho YoY so với doanh thu YoY, kèm lời giải thích cho quý tồn kho nhảy; (3) CFO đọc theo năm và lời giải thích LCTT đầu tư (capex hay gửi tiền); (4) ROE tách theo đòn bẩy và tỷ trọng lợi ích thiểu số; (5) P/E so với mã cùng mô hình, kèm EV/EBITDA.
