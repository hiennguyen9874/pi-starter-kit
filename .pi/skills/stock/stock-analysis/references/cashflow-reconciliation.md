# Đối chiếu LCTT quý ↔ năm — phi tài chính

Dùng khi bảng báo **LCTT quý lệch số năm** hoặc thiếu kỳ đối chiếu trong khi CFO có ảnh hưởng tới kết luận. Phép so tự động chỉ so **4 quý liền của năm đã kết thúc** với số năm cùng tên; dung sai = lớn hơn giữa **1 tỷ** và **2%** số tuyệt đối lớn hơn. Đây là ngưỡng điều tra, không phải chuẩn trọng yếu. Lệch không chứng minh quý nào sai: có thể khác phạm vi, bản sửa đổi hoặc cách phân loại. Bảng/PNG quý giữ số SSTOCK; số TTM bị ảnh hưởng không dùng để kết luận/chấm điểm nếu chưa có cầu nối.

## 1. Chọn chứng từ

- Lấy BCTC gốc tại trang Quan hệ cổ đông, HNX/HOSE hoặc công bố có ký. Ưu tiên bản đính chính/kiểm toán đã công bố tới phiên chốt. Lưu URL hoặc tài liệu với số trang. Đọc đầu báo cáo (**riêng/hợp nhất**, lũy kế hay riêng quý, đơn vị và ngày công bố) trước khi chép số.
- Với `Qn` (n<4), lấy **lũy kế Qn năm nay**, **lũy kế Qn năm trước**, **năm trước** cùng phạm vi/cơ sở để tính TTM. Muốn kiểm tra riêng quý, lấy thêm lũy kế `Q(n−1)` tương ứng; Q1 chính là lũy kế. Q4 lũy kế là cả năm. Khi cách phân loại đổi, đọc thuyết minh và chỉ ghép số cùng cơ sở — nếu chưa xác nhận được, giữ trạng thái chưa kiểm chứng.
- Chép mã dòng/tên: CFO, đầu tư, tài chính, LNST và **chi mua/xây TSCĐ** nếu có. Dùng CFO và LNST cùng BCTC/phạm vi để tính tỷ lệ, không ghép CFO riêng với LNST hợp nhất. `CFO + đầu tư ròng` không phải FCF; chỉ tính CFO trừ capex nếu biết dòng chi phù hợp và nêu phạm vi khoản chi.

## 2. Nhập và chạy lại

Tạo `<workdir>/cashflow_evidence.json` từ [mẫu](../templates/cashflow_evidence.json). Mỗi key `YYYYQn` là số **lũy kế từ đầu năm tới quý n**, tiền theo **tỷ đồng**, `capex` là **chi dương**, trường chưa có bỏ trống/`null`. `scope` là `separate` hoặc `consolidated`; `basis` mô tả cơ sở chung. Mỗi dòng cần `source` (URL hoặc đường dẫn và trang) và `publishedDate` ISO `YYYY-MM-DD` không sau phiên chốt. Nếu lấy số so sánh từ một báo cáo phát hành sau kỳ so sánh, ghi ngày của **báo cáo thực tế đã dùng**. Dùng `netProfit` cùng phạm vi với CFO; ghi rõ cơ sở mẫu số trong `basis` nếu chọn LNST công ty mẹ.

Chạy lại **Compute**, đọc `fa.cashReconciliation` trong `metrics.json` và phần đối chiếu trong `tables.md`. `companyEvidence` ghi phạm vi và nguồn; `vendorExcluded` chỉ để truy vết. Cầu nối thiếu đầu vào sẽ không được tính; tệp lỗi không thay số. Giữ raw nguyên trạng. Nếu chỉ có bằng chứng một kỳ hoặc khác cơ sở, nêu số đã xác nhận và kỳ chưa xác nhận trong báo cáo, không dựng TTM.

**Xong khi:** có số nguồn trước/sau, cửa sổ, phạm vi, tài liệu/trang hoặc giới hạn cụ thể; ghi ảnh hưởng đến điểm và cảnh báo rằng chart quý vẫn lấy nguồn SSTOCK. Ca TNG: CFO 2025 tổng quý **+419,20** vs năm **−259,49 tỷ**; cầu nối từ BCTC riêng **FY25 − 9T25 + 9T26** cho CFO 4 quý **−610,76 tỷ**, không dùng **+67,93 tỷ** của chuỗi quý.
