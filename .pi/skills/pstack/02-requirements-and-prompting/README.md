# 02-requirements-and-prompting

Nhóm này gồm hai skill hỗ trợ làm rõ mục tiêu của yêu cầu và viết lại prompt theo hướng sâu hơn, không mở rộng phạm vi.

## Các skill

- [`in-your-own-words`](in-your-own-words/SKILL.md)  
  **Công dụng:** Diễn đạt lại bằng lời của mình mục tiêu người dùng và vấn đề họ đang tìm cách giải quyết.  
  **Khi dùng:** Khi cần kiểm tra hoặc làm rõ cách hiểu về mục tiêu trước khi tiếp tục.  
  **Lưu ý:** Skill chỉ yêu cầu diễn đạt lại; không quy định thêm bước xử lý.

- [`sharpen`](sharpen/SKILL.md)  
  **Công dụng:** Viết lại yêu cầu để đi sâu hơn, không làm nó lớn hơn. Trước khi viết lại, skill yêu cầu nêu điều chuyên gia hàng đầu có thể làm thêm, nguyên liệu gốc nên bắt đầu từ đó, phương pháp và công cụ cụ thể, cùng căn cứ độc lập để đánh giá kết quả. Prompt mới cần yêu cầu thử nghiệm những lựa chọn có thể được giải quyết bằng thực nghiệm và đề xuất phương án dựa trên quan sát; lựa chọn về sản phẩm hoặc sở thích mà thực nghiệm không thể giải quyết vẫn do người dùng quyết định.  
  **Khi dùng:** Khi muốn cải thiện độ sâu và tính kiểm chứng của một nhiệm vụ mà không mở rộng phạm vi.  
  **Lưu ý:** Skill quy định các nội dung cần nêu trước khi viết lại prompt.

## Kết hợp các skill

Một cách phối hợp gợi ý là: **`in-your-own-words` → `sharpen`**. Trước tiên, diễn đạt lại mục tiêu và vấn đề để kiểm tra cách hiểu; tiếp đó, dùng `sharpen` để viết prompt sâu hơn dựa trên yêu cầu đã làm rõ. Đây là quy trình gợi ý, không phải phụ thuộc hay thứ tự bắt buộc được các skill quy định.

## Giới hạn tương thích

Đây là các skill gốc của Cursor được sao chép vào pi; chưa thể đảm bảo tương thích. Có thể cần chỉnh đường dẫn hoặc cách dùng công cụ, agent riêng. Mô tả skill có nhắc `/in-your-own-words` và `/sharpen`, nhưng điều đó không xác nhận các slash này hợp lệ trong pi.
