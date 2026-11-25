# 02-requirements-and-prompting

Nhóm này gồm ba skill hỗ trợ làm rõ mục tiêu của yêu cầu, tìm thuật ngữ chuyên môn cho thứ đang xây và viết lại prompt theo hướng sâu hơn, không mở rộng phạm vi.

## Các skill

- [`in-your-own-words`](in-your-own-words/SKILL.md)  
  **Công dụng:** Diễn đạt lại bằng lời của mình mục tiêu người dùng và vấn đề họ đang tìm cách giải quyết.  
  **Khi dùng:** Khi cần kiểm tra hoặc làm rõ cách hiểu về mục tiêu trước khi tiếp tục.  
  **Lưu ý:** Skill chỉ yêu cầu diễn đạt lại; không quy định thêm bước xử lý.

- [`sharpen`](sharpen/SKILL.md)  
  **Công dụng:** Viết lại yêu cầu để đi sâu hơn, không làm nó lớn hơn. Trước khi viết lại, skill yêu cầu nêu điều chuyên gia hàng đầu có thể làm thêm, nguyên liệu gốc nên bắt đầu từ đó, phương pháp và công cụ cụ thể, cùng căn cứ độc lập để đánh giá kết quả. Prompt mới cần yêu cầu thử nghiệm những lựa chọn có thể được giải quyết bằng thực nghiệm và đề xuất phương án dựa trên quan sát; lựa chọn về sản phẩm hoặc sở thích mà thực nghiệm không thể giải quyết vẫn do người dùng quyết định.  
  **Khi dùng:** Khi muốn cải thiện độ sâu và tính kiểm chứng của một nhiệm vụ mà không mở rộng phạm vi.  
  **Lưu ý:** Skill quy định các nội dung cần nêu trước khi viết lại prompt.

- [`reframe`](reframe/SKILL.md)  
  **Công dụng:** Dạy các thuật ngữ chuyên môn cho thứ người dùng đang xây, bắt đầu từ file và mô tả của họ. Nếu mô tả có thể chỉ nhiều vấn đề, skill liệt kê 2–3 khả năng kèm dấu hiệu phân biệt, rồi chọn khả năng cao nhất. Skill đưa ra 8–12 thuật ngữ xếp theo mức ảnh hưởng, mượn thuật ngữ từ 2–3 lĩnh vực lân cận (nêu chỗ phép so sánh không còn đúng), xác minh mọi liên kết trích dẫn và viết lại mô tả bằng từ mới.  
  **Khi dùng:** Khi chưa gọi tên được thứ đang xây nên khó yêu cầu agent rõ ràng.  
  **Lưu ý:** Chỉ chạy khi người dùng gõ `/reframe` (`disable-model-invocation: true`).

## Kết hợp các skill

Một cách phối hợp gợi ý là: **`in-your-own-words` → `reframe` → `sharpen`**. Trước tiên, diễn đạt lại mục tiêu và vấn đề để kiểm tra cách hiểu; nếu chưa gọi tên được vấn đề, dùng `reframe` để có từ vựng chuyên môn; tiếp đó, dùng `sharpen` để viết prompt sâu hơn dựa trên yêu cầu đã làm rõ. Đây là quy trình gợi ý, không phải phụ thuộc hay thứ tự bắt buộc được các skill quy định.

## Giới hạn tương thích

Đây là các skill gốc của Cursor được sao chép vào pi; chưa thể đảm bảo tương thích. Có thể cần chỉnh đường dẫn hoặc cách dùng công cụ, agent riêng. Mô tả skill có nhắc `/in-your-own-words`, `/sharpen` và `/reframe`, nhưng điều đó không xác nhận các slash này hợp lệ trong pi.
