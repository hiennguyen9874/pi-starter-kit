# Nhóm skill `07-verification`

Nhóm này hỗ trợ tạo, chạy và duy trì cách kiểm chứng hành vi ứng dụng hoặc tính chất của mã; đồng thời có skill để trình bày trạng thái hệ thống và lưu vết quyết định.

## Các skill

- [`create-formal-verification-skill`](create-formal-verification-skill/SKILL.md) — Tạo skill kiểm chứng hình thức tại chỗ cho một thuộc tính quan trọng của dự án. Dùng khi cần kiểm tra bất biến, thứ tự sự kiện, đồng thời, retry, máy trạng thái, parser hoặc mã unsafe — đặc biệt khi kiểm thử thông thường khó chạm tới tình huống lỗi. Skill yêu cầu chọn công cụ theo câu hỏi, nêu rõ phạm vi và giới hạn, thử kiểm tra trên biến thể cố ý làm hỏng thuộc tính rồi xác nhận lại. Nếu dùng mô hình TLA+, nội dung chỉ định đọc kết quả bằng `statechart`.

- [`create-verification-skill`](create-verification-skill/SKILL.md) — Tạo skill kiểm chứng hành vi ứng dụng qua con đường người dùng thực sự sử dụng, kèm feature map và bằng chứng. Dùng khi dự án chưa có cách được lập trình hóa để kiểm tra UI, CLI, dịch vụ hoặc bề mặt ứng dụng khác. Cần dựa trên cách chạy, điều khiển và quan sát thực tế của repo; phải chạy thử quy trình tạo ra và xác nhận bằng chứng còn tồn tại sau cleanup. Skill tạo ra được mô tả theo cấu trúc Cursor, nên cần xem lưu ý tương thích bên dưới.

- [`maintain-formal-verification-skill`](maintain-formal-verification-skill/SKILL.md) — Đưa mô hình, harness hoặc thuộc tính kiểm chứng hình thức về khớp với mã sau các thay đổi chưa được kiểm tra. Dùng sau merge, refactor hoặc thay đổi mã được kiểm chứng. Skill yêu cầu phân biệt sai lệch của verification với lỗi trong mã, chỉ sửa phạm vi verification, không làm yếu thuộc tính để cho qua; nếu không có verify skill thì hướng tới `create-formal-verification-skill`.

- [`maintain-verification-skill`](maintain-verification-skill/SKILL.md) — Duy trì skill kiểm chứng ứng dụng và feature map. Dùng để rà soát định kỳ hoặc khi cần audit verify skill: kiểm tra nguồn cho từng feature, điều khiển ứng dụng trực tiếp, rồi phân loại thành tài liệu sai lệch, thiếu sót harness hoặc lỗi sản phẩm. Phạm vi sửa chỉ gồm thư mục của verification skill; lỗi sản phẩm được báo cáo, không được che bằng sửa tài liệu.

- [`show-me-your-work`](show-me-your-work/SKILL.md) — Ghi nhật ký quyết định dạng TSV để người khác rà soát công việc dài hạn hoặc chạy không giám sát. Dùng khi cần lưu lý do, bằng chứng và kết quả cho các quyết định quan trọng. Nhật ký mặc định là artifact làm việc, append-only; skill còn yêu cầu đối chiếu nhật ký với transcript và review chéo trước khi bàn giao. Các script và đường dẫn được nêu trong skill không mặc nhiên dùng được trong pi.

- [`statechart`](statechart/SKILL.md) — Kiểm tra mô hình TLA+ và biểu diễn các trạng thái, chuyển tiếp cùng đường đi ngắn nhất dẫn tới vi phạm quy tắc thành Mermaid statechart. Dùng khi cần xem đường đi qua các trạng thái hoặc trình bày lỗi mô hình dưới dạng dễ đọc. Cần hiểu giới hạn của mô hình, bounds và kết quả TLC; khi mô hình mô tả mã thực, skill yêu cầu đối chiếu đường đi lỗi với mã. Cách chạy phụ thuộc script, runtime và công cụ ngoài; không nên coi đó là lệnh pi.

## Kết hợp các skill

Các chuỗi dưới đây là **gợi ý sử dụng**, không phải quy trình tuần tự bắt buộc:

1. `create-formal-verification-skill` → `statechart`: skill tạo kiểm chứng nêu rõ dùng `statechart` để đọc kết quả khi kiểm tra bằng mô hình TLA+. Đây là liên kết được quy định trong nội dung skill.
2. `create-verification-skill` → `maintain-verification-skill`: tạo feature map và cách kiểm chứng trước, rồi dùng skill duy trì để rà soát chúng khi ứng dụng thay đổi. Skill tạo có chỉ dẫn hướng người dùng tới skill duy trì.
3. `show-me-your-work` có thể dùng để ghi lại các quyết định và bằng chứng trong một công việc kiểm chứng dài hạn. Đây là cách phối hợp gợi ý; các skill kiểm chứng không quy định phải dùng nó.

## Lưu ý tương thích

Các skill ở đây có nội dung gốc cho Cursor và được sao chép vào pi; **chưa được bảo đảm tương thích với pi**. Đường dẫn, script, runtime, công cụ, agent hoặc cơ chế tích hợp có thể cần điều chỉnh. Không nên suy ra từ nội dung rằng các slash command được nhắc đến là lệnh hợp lệ trong pi.
