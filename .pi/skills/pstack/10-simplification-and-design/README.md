# 10-simplification-and-design

Nhóm này tập hợp các nguyên tắc giúp định hình thiết kế, giảm độ phức tạp và kiểm tra giả định trước khi tiếp tục sửa đổi.

## Các skill

- [`principle-attack-the-premise`](principle-attack-the-premise/SKILL.md) — Dùng khi từ hai cách sửa trở lên cùng dựa trên một tiền đề nhưng đều thất bại ở cùng một bước kiểm tra. Ghi rõ tiền đề và kiểm tra trực tiếp trước khi thử cách sửa khác. **Lưu ý:** Không bắt đầu cách sửa tiếp theo trước khi đã viết ra và kiểm tra tiền đề.

- [`principle-foundational-thinking`](principle-foundational-thinking/SKILL.md) — Dùng trước khi viết logic, chọn kiểu dữ liệu và cấu trúc dữ liệu, sắp xếp scaffold với tính năng, hoặc chia sẻ trạng thái giữa các tác nhân. Xác định hình dạng dữ liệu và các cách truy cập trước; nếu tác nhân khác có thể sửa trạng thái dùng chung, hãy cô lập trạng thái đó.

- [`principle-laziness-protocol`](principle-laziness-protocol/SKILL.md) — Dùng khi refactor, đánh giá kích thước diff hoặc cân nhắc thêm abstraction, layer hay truyền thêm tín hiệu. Ưu tiên thay đổi nhỏ nhất giải quyết được vấn đề và gom quyết định trùng lặp về một nguồn sự thật.

- [`principle-minimize-reader-load`](principle-minimize-reader-load/SKILL.md) — Dùng khi xem xét hoặc thiết kế code khó lần theo. Kiểm tra số lớp cần đi qua và lượng trạng thái ẩn người đọc phải nhớ; cân nhắc bỏ wrapper chỉ có một bên gọi, thu hẹp phạm vi trạng thái có thể thay đổi và suy ra giá trị thay vì đồng bộ nhiều bản.

- [`principle-redesign-from-first-principles`](principle-redesign-from-first-principles/SKILL.md) — Dùng khi tích hợp yêu cầu mới vào thiết kế hiện có. Đọc các file bị ảnh hưởng, hình dung thiết kế nếu yêu cầu đó có ngay từ đầu, rồi cập nhật các tham chiếu liên quan và triển khai theo từng phần.

- [`principle-subtract-before-you-add`](principle-subtract-before-you-add/SKILL.md) — Dùng khi sắp xếp việc bổ sung, refactor hoặc viết lại hệ thống. Loại bỏ mã chết, validator dư thừa và tham chiếu stub trước khi xây thêm; ưu tiên hành vi đã quan sát thay vì các trường hợp giả định.

## Kết hợp các skill

Các chuỗi dưới đây là **quy trình gợi ý**, không phải phụ thuộc hay thứ tự bắt buộc do các skill quy định:

- Khi một thay đổi mới làm thiết kế hiện tại khó xử lý: **`principle-subtract-before-you-add` → `principle-redesign-from-first-principles` → `principle-laziness-protocol`**. Trước tiên dọn phần dư thừa, sau đó thiết kế lại quanh yêu cầu mới, cuối cùng giữ phần triển khai ở mức tối thiểu cần thiết.
- Khi nhiều cách sửa cùng thất bại: **`principle-attack-the-premise` → `principle-foundational-thinking`**. Kiểm tra tiền đề trước khi thử tiếp; nếu tiền đề không đúng, xem lại cấu trúc dữ liệu và thiết kế nền trước khi viết logic mới.

## Giới hạn tương thích

Đây là các skill gốc của Cursor được sao chép vào pi; chưa có gì đảm bảo chúng tương thích hoàn toàn. Có thể cần chỉnh đường dẫn hoặc công cụ/agent riêng cho môi trường pi. Cả sáu file đều khai báo `disable-model-invocation: true`; chưa xác định cơ chế gọi tương ứng trong pi.
