# 14-delegation-and-learning

Nhóm này tập hợp các nguyên tắc về mã hóa bài học thành cấu trúc, quản lý ngữ cảnh và tiếp tục công việc mà không chờ phê duyệt cho các thay đổi có thể đảo ngược.

## Các skill

### [principle-encode-lessons-in-structure](principle-encode-lessons-in-structure/SKILL.md)

- **Công dụng:** Chuyển hướng dẫn lặp lại hoặc những lần sửa đi sửa lại thành giải pháp có cấu trúc như lint, metadata flag, kiểm tra lúc chạy hoặc script.
- **Khi dùng:** Khi nhận ra mình đang viết lại cùng một hướng dẫn hoặc gặp một lỗi lặp lại.
- **Lưu ý:** Nếu bài học cần phán đoán và không thể mã hóa, hãy làm hướng dẫn nổi bật hơn và thêm ví dụ về lỗi. Nếu có thể sửa bằng cấu trúc, chỉ dùng cách sửa đó thay vì thêm văn bản hướng dẫn.

### [principle-guard-the-context-window](principle-guard-the-context-window/SKILL.md)

- **Công dụng:** Giữ ngữ cảnh đủ gọn để tránh suy giảm chất lượng suy luận và gián đoạn tiến độ.
- **Khi dùng:** Khi ngữ cảnh sắp đầy do đầu ra lớn, tệp dài, đọc lặp lại hoặc lập kế hoạch chia việc.
- **Lưu ý:** Chia công việc thành các giai đoạn, giới hạn số tệp mỗi giai đoạn và ngân sách lượt làm việc; tính đến chi phí của cơ chế sử dụng. Mô tả skill cũng khuyến nghị chuyển phần lớn sang subagent và giữ bản tóm tắt ở luồng chính thay vì dữ liệu thô.

### [principle-never-block-on-the-human](principle-never-block-on-the-human/SKILL.md)

- **Công dụng:** Giúp agent tiếp tục công việc có thể đảo ngược thay vì dừng lại để hỏi người giám sát có muốn thực hiện hay không.
- **Khi dùng:** Khi đang định hỏi “có nên làm X không?” với một việc có thể đảo ngược và xem xét lại được.
- **Lưu ý:** Hãy quyết định hợp lý, thực hiện rồi trình bày kết quả để con người có thể điều chỉnh. Việc không thể đảo ngược—như force-push, xóa dữ liệu production hoặc gửi tin nhắn ra bên ngoài—vẫn cần xác nhận. Định hướng sản phẩm thuộc về con người; việc thực thi không nên bị đình trệ.

## Kết hợp các skill

Các cách dưới đây là **quy trình gợi ý**, không phải liên kết phụ thuộc hay thứ tự bắt buộc được các skill quy định:

- **Lỗi lặp lại trong một đợt sửa:** Dùng `principle-guard-the-context-window` để giới hạn phạm vi và chia giai đoạn; nếu phát hiện cùng một hướng dẫn phải nhắc lại, dùng `principle-encode-lessons-in-structure` để cân nhắc chuyển bài học thành kiểm tra hoặc quy tắc cấu trúc.
- **Việc sửa có thể đảo ngược:** Dùng `principle-never-block-on-the-human` để tiếp tục và trình bày kết quả; nếu khối lượng công việc hoặc ngữ cảnh tăng, áp dụng `principle-guard-the-context-window` để giới hạn phạm vi.

Các nguyên tắc có thể dùng riêng lẻ; không bắt buộc phải thực hiện tuần tự.

## Giới hạn khi dùng trong pi

Đây là các skill gốc của Cursor được sao chép vào pi; việc sao chép **không đảm bảo tương thích**. Có thể cần điều chỉnh đường dẫn và công cụ hoặc agent riêng cho môi trường pi. Cả ba tệp đều đặt `disable-model-invocation: true`, nên cần lưu ý thiết lập này khi tích hợp.
