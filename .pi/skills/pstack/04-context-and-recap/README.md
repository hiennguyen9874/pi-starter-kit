# 04-context-and-recap

Nhóm skill này giúp khôi phục ngữ cảnh công việc và tóm tắt những thay đổi, quyết định còn chờ người dùng.

## Các skill

### [ketchup](ketchup/SKILL.md)

- **Công dụng:** Tóm tắt bằng lời dễ hiểu những gì đã thay đổi trong cuộc trò chuyện kể từ tin nhắn gần nhất của người dùng, rồi liệt kê từng quyết định hoặc hành động đang chờ họ.
- **Khi dùng:** Khi cần cập nhật nhanh cho người dùng về tiến độ và việc họ cần quyết định.
- **Lưu ý:** Chỉ đọc trạng thái, không thay đổi mã, khởi chạy ứng dụng hay công việc, hoặc đăng nội dung. Không tính thông báo và kết quả từ subagent là tin nhắn của người dùng. Ưu tiên nêu rõ bối cảnh, bằng chứng và rủi ro của từng lựa chọn; không tự tạo việc cần người dùng quyết định. Skill hướng dẫn dùng giọng văn của `bro`, một skill bên ngoài nhóm này.

### [ketchup-video](ketchup-video/SKILL.md)

- **Công dụng:** Tóm tắt như `ketchup`, nhưng trình bày phần diễn biến bằng video slide ngắn có phụ đề; các việc đang chờ người dùng được ghi bên dưới video.
- **Khi dùng:** Khi video slide phù hợp hơn văn bản và có tư liệu thực tế như ảnh chụp, bản ghi, diff hoặc dữ liệu để minh họa.
- **Lưu ý:** Tuân theo `ketchup` nhưng tính khoảng thời gian từ tin nhắn gần nhất của người dùng trước `/ketchup-video`. Việc viết và render video bên ngoài repo là ngoại lệ duy nhất với nguyên tắc chỉ đọc. Video phải được kiểm tra trước khi nhúng; nếu render thất bại, chỉ nêu các quyết định đang chờ.

### [recall](recall/SKILL.md)

- **Công dụng:** Khôi phục ngữ cảnh công việc gần đây từ lịch sử trò chuyện, trạng thái hiện tại và các nguồn dùng chung, rồi trả về bản tóm lược ngắn về tình hình và bước tiếp theo.
- **Khi dùng:** Trước khi bắt đầu hoặc tiếp tục công việc, chẳng hạn khi người dùng hỏi đang làm gì hoặc đã dừng ở đâu.
- **Lưu ý:** Chốt phạm vi thời gian, chủ đề và workspace trước khi tìm; mặc định “recent” là 7 ngày gần nhất. Khi có chủ đề cụ thể, skill yêu cầu rà soát cả các nguồn dùng chung và xác minh trạng thái hiện tại. Nếu người dùng đã cung cấp đầy đủ tình trạng công việc thì bỏ qua việc thu thập lại. Đầu ra theo hợp đồng riêng: capsule, trạng thái từng thread, vấn đề lặp lại và một bước tiếp theo cụ thể.

## Kết hợp các skill

Đây là các cách phối hợp gợi ý, không phải quy trình bắt buộc:

- **`recall` → `ketchup`:** Dùng `recall` để khôi phục bối cảnh trước khi tiếp tục một công việc; sau đó dùng `ketchup` để cập nhật những thay đổi và quyết định đang chờ kể từ tin nhắn gần nhất của người dùng. Hai skill có phạm vi tóm lược khác nhau, không thay thế nhau.
- **`ketchup-video` → quy tắc của `ketchup`:** Đây là quan hệ được quy định trong skill: `ketchup-video` tuân theo `ketchup`, nhưng thay phần tóm tắt và hình ảnh bằng video. Đây là lựa chọn định dạng, không phải bước phải chạy cả hai skill.

## Giới hạn tương thích

Các skill này có nguồn gốc từ Cursor và được sao chép vào pi; chưa có gì đảm bảo chúng tương thích đầy đủ. Có thể cần chỉnh đường dẫn, công cụ hoặc cách làm việc với agent cho môi trường pi. Chưa kiểm chứng các trigger như `/ketchup` hay `/ketchup-video` được pi đăng ký hoặc hỗ trợ.
