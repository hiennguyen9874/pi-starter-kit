# 11-product-and-execution

Nhóm skill này hỗ trợ cân nhắc trải nghiệm sản phẩm, khám phá phương án thiết kế và thực thi công việc hướng tới kết quả có thể kiểm chứng.

## Các skill

- [`principle-build-the-lever`](principle-build-the-lever/SKILL.md) — Dùng khi công việc không tầm thường, kể cả chỉnh sửa, migration, phân tích hay kiểm tra: tạo công cụ nhỏ có thể chạy lại để thực hiện hoặc chứng minh công việc thay vì làm thủ công. Thường nên làm đơn vị đầu tiên bằng tay, sau đó xây công cụ an toàn khi chạy lại và kiểm chứng bằng cách chạy lại trên đơn vị đó. Chỉ bỏ qua công cụ với vài chỉnh sửa hiển nhiên; tránh xây framework. Nếu giao việc cho nhiều bên, skill yêu cầu ghi công thức, tiêu chí kiểm chứng và giới hạn trong một skill mà bên được giao không thể sửa.

- [`principle-exhaust-the-design-space`](principle-exhaust-the-design-space/SKILL.md) — Dùng khi gặp tương tác UI mới hoặc quyết định kiến trúc chưa có tiền lệ trong codebase; cũng áp dụng cho quyết định thiết kế sản phẩm phụ thuộc vào cảm nhận. Tạo 2–3 prototype cạnh tranh và so sánh song song trước khi quyết định.

- [`principle-experience-first`](principle-experience-first/SKILL.md) — Dùng khi cân nhắc đánh đổi về sản phẩm, UX hoặc phạm vi tính năng. Ưu tiên trải nghiệm người dùng hơn sự tiện lợi khi triển khai; chọn ít tính năng nhưng hoàn thiện. Mỗi tính năng, điều khiển và tùy chọn cần có lý do; prototype trước khi chốt thiết kế, chăm chút chi tiết và giữ trọng tâm vào quy trình cốt lõi. Người dùng ở đây có thể là người dùng cuối, người sử dụng thư viện/API hoặc kỹ sư bảo trì tiếp theo.

- [`principle-outcome-oriented-execution`](principle-outcome-oriented-execution/SKILL.md) — Dùng cho rewrite và migration đã được lập kế hoạch với các ranh giới giai đoạn rõ ràng. Tập trung hội tụ về kiến trúc đích và tính đúng đắn cuối cùng, thay vì duy trì trạng thái trung gian trơn tru bằng mã tương thích tạm thời. Cần nêu rõ nơi có thể chấp nhận gián đoạn tạm thời, giữ các kiểm tra quan trọng cho phần đang sửa và thực hiện đầy đủ kiểm chứng tĩnh lẫn runtime khi hoàn tất kế hoạch.

## Kết hợp các skill

Các chuỗi dưới đây là **gợi ý phối hợp**, không phải quy trình bắt buộc hay phụ thuộc do các skill quy định:

- **Quyết định UI mới:** `principle-exhaust-the-design-space` để so sánh prototype → `principle-experience-first` để chọn phương án và hoàn thiện trải nghiệm. Bước đầu giúp khám phá lựa chọn; bước sau định hướng tiêu chí chọn.
- **Migration có kế hoạch:** `principle-outcome-oriented-execution` để xác định đích và ranh giới kiểm chứng → `principle-build-the-lever` để tạo công cụ có thể chạy lại cho phần việc không tầm thường. Hai skill xử lý các khía cạnh khác nhau; không phải migration nào cũng cần công cụ riêng.

## Lưu ý về tương thích

Đây là các skill gốc của Cursor được sao chép vào pi; chưa đảm bảo tương thích hoàn toàn. Có thể cần chỉnh đường dẫn hoặc công cụ/agent riêng. Không có cơ sở ở đây để khẳng định cách đăng ký hay gọi chúng trong pi.
