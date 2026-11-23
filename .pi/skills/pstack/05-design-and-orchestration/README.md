# 05-design-and-orchestration

Nhóm này gồm các skill hỗ trợ thiết kế trước khi viết mã, tổ chức công việc nhiều bước và điều phối các lượt làm song song.

## Các skill

- [architect](architect/SKILL.md) — Phác thảo kiểu dữ liệu, chữ ký và ranh giới module trước khi triển khai. Dùng khi thiết kế một thay đổi đáng kể hoặc bắt đầu viết mã có thể khiến cấu trúc sai khó sửa. Trước khi chọn phương án, skill yêu cầu xem xét các hệ thống bị ảnh hưởng và phác thảo hai cấu trúc khác nhau. Với thiết kế lớn hoặc còn tranh cãi, skill chỉ định dùng `arena` thay vì tự phác thảo đơn lẻ.

- [arena](arena/SKILL.md) — Cho nhiều ứng viên tạo cùng một sản phẩm, đánh giá theo tiêu chí đã định, chọn phương án nền rồi chắt lọc điểm mạnh từ các phương án còn lại. Dùng khi một lần thử duy nhất có thể khóa vào cấu trúc không phù hợp. Skill yêu cầu chuẩn bị danh sách công việc theo sáu giai đoạn và mô tả đầu ra tổng hợp cùng ghi chú về lựa chọn, phần ghép, phần loại bỏ và xác minh. Quy trình trong file dựa vào cấu hình model, Task tool và một số skill khác của Cursor; không nên mặc định các thành phần đó có sẵn trong pi.

- [figure-it-out](figure-it-out/SKILL.md) — Thiết kế một playbook có thể kiểm tra và để lại dấu vết quyết định khi không có playbook hẹp hơn phù hợp, chẳng hạn với migration lớn hoặc thay đổi nhiều phần. Dùng khi cần quy trình thích ứng với mức độ rủi ro, thử nghiệm từng đơn vị thay đổi và bàn giao để người khác xem lại. Skill yêu cầu xác định tiêu chí hoàn thành, thiết kế các giai đoạn, ghi lại quyết định và xác minh trên sản phẩm thực. Nó tham chiếu nhiều skill khác, trong đó có `architect`, cùng các công cụ và quy trình của Cursor.

- [swarm](swarm/SKILL.md) — Phân chia hoặc giao cùng một nhiệm vụ cho nhiều worker song song, thu kết quả và trả về một báo cáo tổng hợp. Dùng cho việc cần độ bao phủ song song, khảo sát, kiểm tra hoặc so sánh nhiều lượt làm. Skill yêu cầu xác định tiêu chí hoàn thành và cách tổng hợp trước khi khởi chạy; kết quả thiếu bằng chứng hoặc thông tin đo lường bắt buộc không được tính là đạt. Quy trình trong file dùng Task tool và cấu hình model của Cursor.

## Kết hợp các skill

Các cách dưới đây là gợi ý áp dụng, không phải quy trình bắt buộc chung:

1. **`architect` → `arena` cho thiết kế lớn hoặc còn tranh cãi.** Đây là liên kết được `architect` nêu rõ: thay vì chỉ phác thảo một mình, dùng `arena` để so sánh các phương án.
2. **`figure-it-out` → `architect` khi có quyết định thiết kế khó đảo ngược.** Đây là bước được `figure-it-out` quy định trong playbook; skill cũng nói `architect` sẽ chạy `arena`. Bỏ qua bước này với công việc cơ học đã có cấu trúc rõ ràng.
3. **`figure-it-out` + `swarm` khi có thể chia việc theo ranh giới độc lập.** Có thể dùng `swarm` để tổ chức và tổng hợp phần việc song song trong kế hoạch. Đây là cách phối hợp gợi ý, không phải liên kết được các skill quy định; `figure-it-out` chỉ yêu cầu song song hóa qua các ranh giới phù hợp và tách riêng nơi làm việc.

Không cần ghép các skill nếu công việc không phù hợp; các file không đặt ra một chuỗi tuần tự bắt buộc cho cả nhóm.

## Giới hạn tương thích

Đây là các skill gốc của Cursor được sao chép vào pi, nên chưa đảm bảo tương thích. Nội dung có tham chiếu đến cấu hình Cursor, Task tool, worker/agent và các skill khác; có thể cần chỉnh đường dẫn, công cụ hoặc agent riêng cho pi. Không nên xem tên `/architect`, `/arena`, `/figure-it-out` hay `/swarm` trong mô tả là lệnh đã được đăng ký hoặc chạy được trong pi.
