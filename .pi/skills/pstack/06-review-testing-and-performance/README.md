# 06-review-testing-and-performance

Nhóm này hỗ trợ kiểm tra thay đổi, xây dựng kiểm thử hồi quy, rà soát TypeScript và đánh giá bằng chứng hiệu năng. Mỗi skill có phạm vi và quy trình riêng; không phải mọi thay đổi đều cần dùng tất cả.

## Các skill

### [`benchmark-checklist`](benchmark-checklist/SKILL.md)

- **Công dụng:** Thẩm định số liệu hiệu năng trước khi báo cáo hoặc quyết định dựa trên số liệu đó.
- **Khi dùng:** Khi chạy benchmark hoặc báo cáo mức tăng tốc hay suy giảm đã đo được.
- **Lưu ý:** Kiểm tra giới hạn, cấu hình chạy, lỗi và tính đúng đắn của kết quả, khả năng lặp lại, ý nghĩa với người dùng và việc công việc thực sự xảy ra trong vùng đo. Thông thường cần ít nhất 5 lần chạy mỗi phía theo thứ tự xen kẽ; nếu chỉ đo một lần để ước lượng nhanh, phải nêu rõ. Kết luận nên là “chưa đủ cơ sở” khi không xác định được giới hạn, một phía chưa được tinh chỉnh hoặc chưa kiểm tra lỗi và công việc thực sự chạy.

### [`interrogate`](interrogate/SKILL.md)

- **Công dụng:** Tìm cách phá vỡ một thay đổi hoặc thiết kế và chỉ giữ lại phát hiện được chứng minh bằng lần chạy thực tế.
- **Khi dùng:** Khi được yêu cầu rà soát đối kháng, tìm điểm mù, kiểm tra căng thẳng hoặc thách thức một thay đổi hay thiết kế.
- **Lưu ý:** Phạm vi là phần người dùng chỉ định; nếu không có, skill dùng diff từ merge base đến working tree. Báo cáo phải nêu ý định, từng phát hiện đã xác minh cùng lệnh và đầu ra, và các phát hiện bị loại. Skill yêu cầu các bước từ `arena` và các adversary; không áp dụng sửa lỗi.

### [`no-comments`](no-comments/SKILL.md)

- **Công dụng:** Dùng góc nhìn của Comment Sicko để rà soát comment, xử lý các phát hiện được chấp nhận và xem xét cách mã hóa các ràng buộc.
- **Khi dùng:** Khi cần kiểm tra comment trong các tệp hoặc diff được chỉ định; nếu không có, phạm vi là diff hiện tại so với nhánh cơ sở.
- **Lưu ý:** Đây không chỉ là skill rà soát: quy trình có thể xóa comment và sửa mã trong phạm vi. Các bước yêu cầu `Task` với `comment-sicko`, và có thể tham chiếu `poteto-mode`, `/architect`, `/why` cùng các skill nguyên tắc khác. Phải giữ nguyên phạm vi, kiểm tra bằng chứng trước khi chấp nhận hoặc khôi phục comment, và chờ phê duyệt tương tác trước khi mã hóa ràng buộc.

### [`tdd`](tdd/SKILL.md)

- **Công dụng:** Dùng kiểm thử hồi quy tập trung để ghi nhận hành vi lỗi trước khi sửa và xác nhận hành vi sau khi sửa.
- **Khi dùng:** Chỉ khi người dùng yêu cầu rõ TDD, kiểm thử lỗi hoặc kiểm thử hồi quy; hoặc khi lỗi có cách kiểm tra cục bộ rõ ràng, ít tốn công.
- **Lưu ý:** Không ép tạo test nếu đường kiểm thử không rõ, quá tốn kém hoặc cần hạ tầng không phù hợp. Ưu tiên kiểm tra thực tế hẹp nhất; nếu không thể chứng minh lỗi trước khi sửa, nêu lý do và bằng chứng thay thế.

### [`typescript-best-practices`](typescript-best-practices/SKILL.md)

- **Công dụng:** Hướng dẫn đọc và sửa tệp `.ts` hoặc `.tsx` theo các thực hành TypeScript được nêu trong skill.
- **Khi dùng:** Khi làm việc với các tệp TypeScript; phần mô tả của skill giới hạn phạm vi theo các phần mở rộng này.
- **Lưu ý:** Ưu tiên mô hình kiểu biểu đạt trạng thái hợp lệ, `unknown` thay vì `any`, xác thực dữ liệu tại ranh giới, schema thay cho type guard tự viết khi phù hợp, thu hẹp kiểu an toàn và kiểm tra exhaustiveness. Tránh ép kiểu `as` trừ khi đã xác thực; ưu tiên kiểm thử thực và telemetry có cấu trúc. Skill yêu cầu áp dụng nguyên tắc `type-system-discipline` trước và dẫn tới `references/patterns.md`.

## Kết hợp các skill

Các chuỗi dưới đây là **gợi ý phối hợp**, không phải quy trình bắt buộc hay phụ thuộc được các skill quy định:

- **Sửa lỗi có đường kiểm tra rõ:** `tdd` → `interrogate`. TDD ghi lại lỗi và kiểm tra bản sửa; sau đó có thể dùng interrogate để tìm thêm lỗi đối kháng. Interrogate vẫn chỉ báo cáo phát hiện, không sửa lỗi.
- **Đánh giá thay đổi TypeScript có tuyên bố hiệu năng:** `typescript-best-practices` → `benchmark-checklist`. Skill TypeScript hướng dẫn cách đọc và sửa mã; checklist thẩm định số liệu trước khi báo cáo. Đây là cách phối hợp gợi ý, không phải quan hệ phụ thuộc.
- **Rà soát comment có phát hiện cần thay đổi mã:** `no-comments` có thể đứng riêng; nếu thay đổi liên quan có đường kiểm thử hồi quy rõ, có thể cân nhắc `tdd` để kiểm chứng. No-comments có quy trình xử lý và phê duyệt riêng.

## Giới hạn tương thích

Đây là các skill gốc của Cursor được sao chép vào pi; chưa đảm bảo tương thích với pi. Một số skill tham chiếu đường dẫn, skill, công cụ, `Task`, subagent hoặc quy trình riêng có thể không tồn tại ở môi trường đích và cần chỉnh sửa. Không nên coi các tên lệnh hay slash trong nội dung skill là lệnh pi hợp lệ.
