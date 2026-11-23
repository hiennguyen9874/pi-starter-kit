# 12-architecture-data-and-types

Nhóm skill này tập hợp các nguyên tắc về ranh giới hệ thống, mô hình dữ liệu, kiểu, thao tác có thể chạy lại và trạng thái dùng chung.

## Các skill

### [principle-boundary-discipline](principle-boundary-discipline/SKILL.md)
- **Công dụng:** Tập trung xác thực, thu hẹp kiểu và xử lý lỗi tại nơi dữ liệu đi qua ranh giới như CLI, cấu hình, mạng hoặc API bên ngoài; giữ logic nghiệp vụ thuần và phần vỏ gọi nó mỏng.
- **Khi dùng:** Khi nối các lớp xác thực, xử lý lỗi hoặc adapter framework.
- **Lưu ý:** Không xác thực lại dữ liệu nội bộ đã có kiểu, cũng không thêm kiểm tra nil dư thừa.

### [principle-make-operations-idempotent](principle-make-operations-idempotent/SKILL.md)
- **Công dụng:** Thiết kế thao tác thay đổi trạng thái để hội tụ về đúng trạng thái dù chạy lặp, bị dừng giữa chừng hoặc được chạy lại.
- **Khi dùng:** Khi thiết kế lệnh, bước vòng đời hoặc vòng xử lý có thể gặp crash, khởi động lại hay retry.
- **Lưu ý:** Đọc trạng thái hiện có rồi áp dụng phần chênh lệch; xem xét dấu vết còn lại sau crash và cách nhận biết, hòa giải chúng. Skill gợi ý ghi vào đường dẫn tạm rồi đổi tên vào vị trí đích.

### [principle-migrate-callers-then-delete-legacy-apis](principle-migrate-callers-then-delete-legacy-apis/SKILL.md)
- **Công dụng:** Khi thay API nội bộ, chuyển các caller sang API mới và xóa API cũ trong cùng một đợt thay đổi.
- **Khi dùng:** Khi không có người dùng bên ngoài phụ thuộc tương thích ngược, dự án chấp nhận được thay đổi phá vỡ tương thích, và API mới thuộc một đợt đơn giản hóa hoặc refactor.
- **Lưu ý:** Cập nhật kiểm thử để xác nhận hợp đồng mới; xóa kiểm thử chỉ bảo vệ chi tiết triển khai trước refactor.

### [principle-model-the-domain](principle-model-the-domain/SKILL.md)
- **Công dụng:** Biểu diễn quy tắc miền bằng cấu trúc dữ liệu để giảm nhánh và làm trạng thái không hợp lệ khó biểu diễn.
- **Khi dùng:** Khi viết logic có trạng thái, nhiều nhánh hoặc lặp lại giả định về hình dạng dữ liệu ở nhiều nơi.
- **Lưu ý:** Có thể cân nhắc state machine, kiểu có cấu trúc, map/registry, discriminated union, reducer hoặc collection phù hợp; không ép trừu tượng hóa nếu mã đơn giản, cục bộ và ít có khả năng phát triển.

### [principle-separate-before-serializing-shared-state](principle-separate-before-serializing-shared-state/SKILL.md)
- **Công dụng:** Giảm tranh chấp bằng cách tách trạng thái của các tác nhân trước khi dùng cơ chế tuần tự hóa.
- **Khi dùng:** Khi nhiều tác nhân có thể ghi vào cùng file, branch, key hoặc đối tượng trạng thái.
- **Lưu ý:** Ưu tiên nơi ghi riêng rồi hợp nhất khi đọc. Chỉ tuần tự hóa bằng lockfile, một writer, các pha tuần tự hoặc compare-and-swap khi một đích ghi chung thực sự là bất biến cần giữ.

### [principle-type-system-discipline](principle-type-system-discipline/SKILL.md)
- **Công dụng:** Dùng hệ thống kiểu để ngăn trạng thái bất khả thi, nhầm lẫn giữa các primitive và biến thể chưa được xử lý.
- **Khi dùng:** Khi thiết kế kiểu, xem xét chữ ký hàm hoặc viết mã trong ngôn ngữ có kiểu tĩnh.
- **Lưu ý:** Có thể tạo kiểu riêng cho các primitive mang ý nghĩa khác nhau, phân tích dữ liệu bên ngoài tại ranh giới, và suy ra kiểu từ schema có thẩm quyền thay vì tạo bản song song. Skill nhắc đến `typescript-best-practices` khi cần cú pháp TypeScript.

## Kết hợp các skill

Các chuỗi dưới đây là **gợi ý áp dụng**, không phải phụ thuộc hay quy trình tuần tự bắt buộc do các skill quy định:

- **Dữ liệu đầu vào và kiểu miền:** `principle-type-system-discipline` → `principle-boundary-discipline` → `principle-model-the-domain`. Dùng kiểu để định hình mô hình; phân tích dữ liệu chưa tin cậy tại ranh giới; chọn cấu trúc miền phù hợp nếu logic có nhiều trạng thái hoặc nhánh.
- **Tác vụ có retry và ghi đồng thời:** `principle-separate-before-serializing-shared-state` → `principle-make-operations-idempotent`. Trước hết giảm chia sẻ bằng cách tách nơi ghi; sau đó thiết kế thao tác để chạy lại an toàn khi có gián đoạn. Nếu vẫn cần một đích ghi chung, skill về trạng thái chia sẻ nêu các cách tuần tự hóa có cấu trúc.
- **Thay API trong refactor:** `principle-model-the-domain` → `principle-migrate-callers-then-delete-legacy-apis`. Có thể làm rõ mô hình hoặc hợp đồng cần thay đổi trước, rồi chuyển caller và bỏ API cũ nếu các điều kiện áp dụng của skill được đáp ứng.

## Lưu ý về tương thích

Đây là các skill gốc của Cursor được sao chép vào pi; chưa có bảo đảm chúng tương thích với pi. Có thể cần chỉnh đường dẫn hoặc công cụ, agent riêng của dự án.
