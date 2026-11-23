# 01-getting-started-and-setup

Nhóm này giúp tìm hiểu pstack, chọn cách bắt đầu một công việc và cấu hình các lựa chọn mô hình theo vai trò. Các skill có nguồn gốc từ Cursor; việc sao chép vào pi không đảm bảo chúng tương thích.

## Các skill

### [poteto-help](poteto-help/SKILL.md)

- **Công dụng:** Hướng dẫn về pstack, cách bắt đầu với `poteto-mode` và chọn skill, playbook hoặc principle phù hợp.
- **Dùng khi:** Cần tìm hiểu cách thiết lập, chọn hướng xử lý cho một tình huống hoặc khắc phục một lần chạy không như mong đợi.
- **Lưu ý:** Với câu hỏi, skill giải thích cách làm và đưa prompt gợi ý, không tự bắt đầu công việc. Nếu người dùng yêu cầu thực hiện công việc, nội dung hướng dẫn chuyển sang `poteto-mode`. Các tên lệnh và tính năng trong skill thuộc hệ sinh thái Cursor, không nên mặc định chúng dùng được trong pi.

### [poteto-mode](poteto-mode/SKILL.md)

- **Công dụng:** Định hướng cách xử lý công việc theo phong cách pstack, gồm lựa chọn playbook, sử dụng skill khác khi cần và xác minh kết quả.
- **Dùng khi:** Muốn thực hiện một công việc theo quy trình này hoặc yêu cầu phản hồi theo phong cách pstack.
- **Lưu ý:** Skill mô tả các tính năng và cơ chế riêng của Cursor, như subagent, Custom Mode và một số plugin. Các chỉ dẫn đó có thể cần điều chỉnh để phù hợp với đường dẫn, công cụ và agent của pi.

### [setup-pstack](setup-pstack/SKILL.md)

- **Công dụng:** Cấu hình mô hình và ngân sách suy luận theo vai trò bằng cách ghi quy tắc vào `~/.cursor/rules/pstack-models.mdc`.
- **Dùng khi:** Muốn thay đổi lựa chọn mô hình hoặc ngân sách của pstack.
- **Lưu ý:** Quy trình dựa vào khả năng phát hiện mô hình cho `Task` subagent trong Cursor và ghi cấu hình vào thư mục `.cursor`. Không giả định cơ chế đó tồn tại hoặc áp dụng trong pi; có thể cần chỉnh đường dẫn và cách chọn mô hình.

## Kết hợp các skill

Các cách dưới đây là gợi ý sử dụng, không phải quy trình tuần tự bắt buộc:

- **Cần tìm hiểu rồi cấu hình:** `poteto-help` → `setup-pstack`. Skill trợ giúp định tuyến câu hỏi về thiết lập; skill thiết lập mô tả cách chọn ngân sách và mô hình. Đây là hướng phối hợp được nội dung `poteto-help` nêu cho việc thiết lập, nhưng cách thực thi trên pi chưa được xác nhận.
- **Cần hỏi về một công việc rồi thực hiện:** `poteto-help` → `poteto-mode`. `poteto-help` phân biệt câu hỏi “làm thế nào” với yêu cầu thực hiện; với yêu cầu thực hiện, nó hướng sang `poteto-mode`. Đây là liên kết được quy định trong skill, không đồng nghĩa các tính năng Cursor của `poteto-mode` sẽ hoạt động trên pi.
- **Muốn cấu hình trước khi làm việc:** `setup-pstack` → `poteto-mode` là một cách phối hợp có thể cân nhắc: skill đầu cấu hình lựa chọn mô hình, skill sau mô tả cách xử lý công việc. Đây là gợi ý, không phải phụ thuộc bắt buộc; quy tắc cấu hình được mô tả là áp dụng cho phiên Cursor mới.

## Giới hạn tương thích

Đây là các skill gốc của Cursor được sao chép vào pi, nên chưa đảm bảo tương thích. Nội dung có thể phụ thuộc vào đường dẫn, thư mục `.cursor`, `Task` subagent hoặc tính năng riêng của Cursor; có thể cần chỉnh để dùng công cụ và agent của pi. Chỉ dựa trên các file này thì không thể khẳng định cách gọi skill hay các lệnh của chúng hợp lệ trong pi.
