# 08-workflow-and-automation

Nhóm này gồm các skill hỗ trợ ghi nhận cách làm việc, rút kinh nghiệm từ hội thoại, ngăn lỗi lặp lại và xây dựng giao diện đánh thức bot qua webhook.

## Các skill

### [`automate-me`](automate-me/SKILL.md)

- **Công dụng:** Tạo hoặc cập nhật skill `-mode` cá nhân dựa trên quy ước làm việc của người dùng.
- **Khi dùng:** Khi người dùng muốn ghi lại phong cách làm việc, tạo/cập nhật skill cá nhân hoặc để agent làm việc theo quy ước của họ.
- **Lưu ý:** Skill hướng dẫn khai thác transcript trong workspace hiện tại, hỏi người dùng, rồi soạn và chỉnh sửa skill. Quy trình tham chiếu `create-skill` và `unslop` của Cursor; mặc định yêu cầu làm trong worktree, tạo commit và mở PR. Không dùng cho skill chuyên biệt theo một tác vụ hoặc một quy trình hẹp.

### [`correct`](correct/SKILL.md)

- **Công dụng:** Tìm các loại lỗi agent lặp lại trong repo và ngăn chúng tái diễn, ưu tiên sửa bằng kiến trúc, sau đó đến kiểu, lint hoặc test; chỉ viết tài liệu cho những phán đoán không thể thực thi bằng kiểm tra.
- **Khi dùng:** Khi người vận hành thường xuyên phải sửa cùng một loại lỗi trong repo.
- **Lưu ý:** Chỉ tính một loại lỗi sau khi nó xuất hiện ít nhất hai lần. Skill yêu cầu chứng minh kiểm tra mới bắt được một lỗi thực tế trong quá khứ, chạy cùng lệnh ở local và CI, và duy trì bảng quy tắc cùng cơ chế thực thi. Frontmatter nêu `/correct` làm trigger.

### [`make-bot-ui`](make-bot-ui/SKILL.md)

- **Công dụng:** Hướng dẫn tạo trang có nút gửi JSON từ server cục bộ đến webhook để đánh thức Grok Bot, giữ sender key ở phía server và đưa trang lên tailnet.
- **Khi dùng:** Khi cần UI tùy chỉnh đánh thức bot qua webhook, cần người dùng cung cấp sender key, hoặc muốn truy cập UI qua Tailscale.
- **Lưu ý:** Quy trình dựa vào Cursor Automations, gồm `update_state` và yêu cầu bí mật bằng `SendToUser`; không đưa sender key vào trình duyệt, chat hoặc log. Dữ liệu webhook được xem là dữ liệu bên ngoài, không phải chỉ dẫn. Skill không khai báo slash trigger trong `SKILL.md`, nên không nên coi đây là slash command đã được đăng ký.

### [`reflect`](reflect/SKILL.md)

- **Công dụng:** Tìm bài học lâu bền trong transcript hiện tại và đề xuất chuyển từng bài học thành chỉnh sửa cho skill hiện có.
- **Khi dùng:** Khi người dùng yêu cầu reflect.
- **Lưu ý:** Phải trình bày mục Accepted, Rejected và Backlog, rồi chờ phê duyệt trước khi sửa. Không chỉnh skill trong `plugins/cache/`; sau khi được duyệt, sao chép skill vào `.cursor/skills/<skill>/` hoặc `~/.cursor/skills/<skill>/`. Không mở PR hoặc push.

## Kết hợp các skill

Các chuỗi dưới đây là **gợi ý phối hợp**, không phải quy trình tuần tự bắt buộc hay phụ thuộc do các skill quy định:

- **`reflect` → `correct`:** Dùng `reflect` để xác định một bài học bền vững và chờ duyệt đề xuất. Nếu đó là lỗi lặp lại trong repo, dùng `correct` để tìm bằng chứng và xem xét cách ngăn lỗi ở mức kiến trúc, kiểu, lint hoặc test.
- **`automate-me` → `reflect`:** Có thể dùng `automate-me` để xây dựng hoặc cập nhật skill phong cách cá nhân; về sau, `reflect` có thể đề xuất chỉnh sửa skill hiện có dựa trên bài học lâu bền trong transcript. Mỗi skill có mục đích và quy trình riêng, không bắt buộc phải dùng cùng nhau.

## Giới hạn tương thích

Đây là các skill gốc của Cursor được sao chép vào pi; chưa thể đảm bảo chúng tương thích với pi. Có thể cần chỉnh đường dẫn và thay đổi công cụ hoặc agent riêng mà skill tham chiếu. Đặc biệt, `make-bot-ui` yêu cầu các thành phần Cursor Automations và công cụ nêu trong nội dung skill; không nên giả định chúng có sẵn trong pi.
