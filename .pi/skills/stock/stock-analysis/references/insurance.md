# Bảo hiểm — nghiệp vụ, đầu tư và bộ đệm vốn

Đọc khi `structure=insurance`. Tách **lợi nhuận nghiệp vụ**, **lợi nhuận đầu tư** và **rủi ro dự phòng/vốn**; khả năng sinh lời của danh mục không xác nhận chất lượng bảo hiểm.

1. **Nghiệp vụ:** đặt `insuranceProfit`, tỷ lệ bồi thường, tỷ lệ chi phí và combined ratio quý cạnh cùng kỳ và lũy kế. Đối chiếu mẫu số phí bảo hiểm được hưởng (gộp hay thuần tái bảo hiểm) trước khi so peer; combined ratio <100% là dấu hiệu có lãi nghiệp vụ khi hai tỷ lệ có cùng cơ sở. Khi bồi thường đột biến, tìm tổn thất lớn, giải phóng/tăng dự phòng, tỷ lệ nhượng và khả năng thu hồi tái bảo hiểm trong thuyết minh; số thiếu ghi chưa xác nhận.
2. **Đầu tư:** đặt `financialProfit` và tỷ trọng đầu tư/tổng tài sản cạnh trái phiếu, tiền gửi, cổ phiếu nếu có cơ cấu. Tách thu nhập lãi định kỳ khỏi hiện thực hóa/đánh giá lại; đối chiếu lợi suất với thay đổi quy mô và kỳ hạn, không suy ra độ nhạy lãi suất từ tỷ trọng đơn lẻ.
3. **Dự phòng/vốn:** đọc biến động dự phòng phí, bồi thường và phần thu hồi tái bảo hiểm; lấy chỉ tiêu khả năng thanh toán/vốn đúng chế độ báo cáo từ công bố gốc nếu trọng yếu. Không lấy vốn chủ/TTS hay CFO/LNST của sản xuất làm chỉ báo thay thế. Đặt P/B cạnh ROE chuẩn hóa sau khoản đầu tư bất thường, so peer cùng loại nghiệp vụ.

**Chấm điểm:** chỉ giữ điểm `Combined ratio %` tự động khi công bố xác nhận tỷ lệ đo nghiệp vụ phi nhân thọ trên cơ sở nhất quán. Nếu là nhân thọ, số hợp nhất pha trộn hoặc chưa rõ phạm vi, ghi **không chấm**. Giữ điểm pipeline để truy vết; tính lại độ phủ, nhóm Chất lượng (giới hạn ±2), tổng phụ Cơ bản & định giá và tổng điểm/kết luận sau khi bỏ tiêu chí. Ghi trước/sau và nguồn hoặc phần chưa xác nhận.

**Xong khi:** mỗi động lực lợi nhuận có số cùng kỳ hoặc lý do không có; kết luận có một điều kiện xác nhận về bồi thường/dự phòng hoặc vốn và một giới hạn về khả năng so peer.
