# 13-verification-principles

Nhóm này tập hợp các nguyên tắc để tìm nguyên nhân lỗi, kiểm tra hành vi và kết quả thực tế, cũng như chia công việc thành các phần có thể xác minh.

## Các skill

- [principle-explain-the-number](principle-explain-the-number/SKILL.md) — Dùng trước khi đo lường và trước khi tin, báo cáo hoặc hành động dựa trên một con số như tốc độ, độ trễ hay kết quả eval. Xác định trước kết quả nào sẽ làm thay đổi quyết định và mức nhiễu; tìm giới hạn bằng profile hoặc counter trong lúc chạy; kiểm tra xem con số có đang đo đúng công việc cần đo không. Ghi kèm số lần chạy, độ phân tán và yếu tố giới hạn. Với số liệu hiệu năng, skill chỉ định dùng thêm `benchmark-checklist`; skill đó không nằm trong danh sách file ở đây.
- [principle-fix-root-causes](principle-fix-root-causes/SKILL.md) — Dùng khi gỡ lỗi. Tái hiện lỗi, lần theo triệu chứng đến nơi đầu tiên hệ thống xử lý sai, rồi sửa nguyên nhân thay vì nơi lỗi biểu hiện. Trước khi thêm guard, hãy xác định trạng thái gây lỗi có hợp lệ không: guard có thể che lỗi nếu trạng thái lẽ ra không bao giờ xuất hiện. Tìm các chỗ có cùng kiểu lỗi và cân nhắc tín hiệu rẻ, luôn bật để phát hiện sớm.
- [principle-prove-it-works](principle-prove-it-works/SKILL.md) — Dùng sau khi hoàn thành việc, trước khi tuyên bố xong. Kiểm tra trực tiếp sản phẩm thực tế, chẳng hạn chạy tính năng, đọc giá trị hoặc xem diff; không thay thế việc đó bằng proxy như thời gian sửa file, tự báo cáo hay chỉ kiểm tra biên dịch. Khi có thể, tạo phép kiểm tra có thể chạy lại và để kết quả ở nơi người kiểm tra thấy được.
- [principle-sequence-verifiable-units](principle-sequence-verifiable-units/SKILL.md) — Dùng cho công việc nhiều bước như migration, sweep hoặc chuỗi chỉnh sửa tương tự, và khi sắp xếp commit/PR. Chia việc thành các phần nhỏ: bắt đầu từ trạng thái đã biết là tốt, thực hiện một thay đổi, kiểm tra rồi mới tiếp tục. Sắp thứ tự bàn giao để người review có thể xác minh tiến trình; mỗi commit đứng riêng.
- [principle-test-behavior-not-implementation](principle-test-behavior-not-implementation/SKILL.md) — Dùng khi viết, sửa hoặc giữ lại test. Test hành vi người dùng quan sát được qua giao diện công khai, không ghim vào helper riêng, thứ tự gọi nội bộ hay dữ liệu trung gian. Test cần bắt được thay đổi làm sai hành vi nhưng vẫn qua khi chỉ thay đổi nội bộ. Dùng đầu vào cụ thể, suy ra kết quả mong đợi từ yêu cầu; với lỗi, kiểm tra loại lỗi mà bên gọi dựa vào.

## Kết hợp các skill

Các chuỗi dưới đây là **cách phối hợp gợi ý**, không phải bước bắt buộc hay phụ thuộc được quy định giữa các skill:

- `principle-fix-root-causes` → `principle-sequence-verifiable-units` → `principle-prove-it-works`: tìm và sửa nguyên nhân, chia sửa đổi thành từng phần có kiểm tra, rồi xác minh trực tiếp kết quả cuối.
- `principle-test-behavior-not-implementation` → `principle-prove-it-works`: viết test dựa trên hành vi quan sát được, sau đó kiểm tra sản phẩm thực tế thay vì chỉ dựa vào test hoặc proxy.

Liên kết được quy định rõ trong nội dung skill là: `principle-explain-the-number` yêu cầu dùng `benchmark-checklist` cho số liệu hiệu năng. Đây không phải một skill trong danh sách năm skill trên.

## Lưu ý khi dùng trong pi

Đây là các skill gốc của Cursor được sao chép vào pi; chưa có gì đảm bảo chúng tương thích nguyên trạng. Có thể cần chỉnh đường dẫn hoặc cách dùng công cụ và agent riêng cho môi trường pi. Chưa kiểm chứng cách đăng ký hay gọi skill trong pi; không nên mặc định có slash command tương ứng.
