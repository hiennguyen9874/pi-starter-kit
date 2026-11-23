# 03-understanding-systems

Nhóm skill này hỗ trợ tìm hiểu cách hệ thống vận hành, lý do thiết kế và tác động của thay đổi. Mỗi skill phù hợp với một kiểu câu hỏi khác nhau.

## Các skill

- [`blast-radius`](blast-radius/SKILL.md) — Đánh giá thay đổi có thể gây hỏng gì ở nơi khác, vượt ra ngoài phần diff. Dùng khi xem xét phạm vi ảnh hưởng hoặc kiểm tra một thay đổi nhỏ còn đáng nghi. Skill yêu cầu tìm và kiểm chứng bằng code chạy thật một hoặc hai sự thật cốt lõi quyết định mức độ an toàn; cần phân biệt rủi ro đã xác nhận với rủi ro đã kiểm tra và loại trừ, đồng thời dẫn chứng vị trí code. Với thay đổi lớn hoặc rộng, skill gợi ý dùng nhiều mô hình để rà soát. Đây là skill bổ trợ cho `how` và `why`.

- [`how`](how/SKILL.md) — Giải thích một phần code hoạt động ra sao, luồng chạy thế nào, hoặc nên đặt trách nhiệm ở đâu. Dùng khi cần walkthrough trước khi sửa code, hiểu kiến trúc subsystem, hay xác định package/layer sở hữu một phần việc. Nội dung gốc yêu cầu một subagent chỉ đọc khám phá codebase rồi trình bày lời giải thích; nếu phạm vi câu hỏi chưa rõ, cần nêu cách hiểu và tiếp tục khám phá.

- [`teach`](teach/SKILL.md) — Giải thích một khối công việc theo cách dễ hiểu, nhằm giúp người đọc thực sự nắm được nó, không phải thay đổi code. Dùng khi muốn hiểu một thay đổi hoặc subsystem ở mức phù hợp với câu hỏi và kiến thức sẵn có. Skill đặt mình lên trên `how` và `why`, kết hợp các phát hiện thành một lời giải thích; có thể chạy hai skill song song và điều chỉnh phạm vi. Khi diễn giải phần `why`, cần giữ nguyên mức độ chắc chắn của kết luận đó.

- [`why`](why/SKILL.md) — Tìm lý do thiết kế và đánh đổi dựa trên hồ sơ thay đổi. Dùng cho câu hỏi vì sao hệ thống được xây theo cách hiện tại, vì sao chọn một phương án, hoặc để điều tra regression, postmortem và ngưỡng dựa trên dữ liệu. Skill hướng dẫn đọc commit, thảo luận PR và các nguồn liên quan; cần trích dẫn lời tác giả, đánh dấu suy luận của mình và nêu điều hồ sơ không trả lời. Khác với `how`, trọng tâm là lý do trong hồ sơ, không phải hành vi runtime.

## Kết hợp các skill

Các chuỗi dưới đây là **gợi ý sử dụng**, không phải quy trình bắt buộc:

- **Giải thích một subsystem:** `how` tìm hiểu cách subsystem vận hành; `why` tìm căn cứ về lý do thiết kế; `teach` kết hợp các phát hiện thành lời giải thích phù hợp với người hỏi. Quan hệ `teach` đặt trên `how` và `why` được mô tả trong chính skill `teach`.
- **Rà soát một thay đổi:** `how` giúp hiểu hành vi liên quan, `why` giúp tra cứu lý do và đánh đổi trong lịch sử, rồi `blast-radius` tập trung kiểm tra tác động ngoài diff và chứng minh sự thật cốt lõi bằng code chạy thật. Đây là cách phối hợp gợi ý; `blast-radius` chỉ tự mô tả mình là skill bổ trợ cho `how` và `why`, không quy định chuỗi này.

## Lưu ý khi dùng trong pi

Các skill này có nguồn gốc từ Cursor và được sao chép vào pi. Việc sao chép không đảm bảo tương thích; có thể cần chỉnh đường dẫn hoặc thay cách gọi công cụ và agent cho phù hợp với môi trường riêng. Nội dung gốc của `how` yêu cầu một subagent `generalPurpose` chỉ đọc, còn `teach` nhắc đến việc gọi `how` và `why`; không nên mặc định các cơ chế đó có sẵn trong pi.
