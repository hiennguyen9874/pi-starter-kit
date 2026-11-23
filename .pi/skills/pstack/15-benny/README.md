# benny

benny gives you two cursor automations for slack issue reports. one triages each report. the other reproduces confirmed bugs and may prepare a small draft fix.

the files in this directory are dormant setup and automation sources. they do not appear as slash skills.

## set it up

1. point cursor at [`FOR_AGENTS.md`](./FOR_AGENTS.md) and name the target repository.
2. let setup merge this whole directory into the target at `.cursor/automations/benny/`. it must preserve destination-only files and review conflicts instead of overwriting local edits.
3. let setup enable pstack in the target repository's `.cursor/settings.json` for shared dependencies:

```json
{
	"plugins": {
		"pstack": { "enabled": true }
	}
}
```

4. keep user-owned configuration outside the copied pack, for example in `.cursor/benny/`. adapt [`configuration.example.yaml`](./templates/configuration.example.yaml) and [`feature-map.example.md`](./skills/reproduce-and-fix-issues/references/feature-map.example.md).
5. commit `.cursor/settings.json`, `.cursor/automations/benny/`, and any secret-free configuration before enabling either automation.
6. review each new automation draft or update existing automations in their editors. then send a harmless test report and verify every source-channel post stays in the original thread.

---

## Nhóm skill `15-benny`

Nhóm này hỗ trợ cấu hình Benny và xử lý báo cáo sự cố từ Slack: phân loại báo cáo, rồi tái hiện và có thể sửa lỗi trong phạm vi được quy định.

### Các skill

- [`setup-benny`](skills/setup-benny/SKILL.md) — **Công dụng:** chuẩn bị cấu hình Benny và hai automation cho triage và tái hiện lỗi. **Khi dùng:** khi cài Benny hoặc thay đổi cấu hình Slack, tracker, repository, routing, control hay ngân sách. **Lưu ý:** cần cấu hình bên ngoài và thiết lập hai Cursor Automations. Không tạo hoặc cập nhật automation nếu người dùng chưa yêu cầu; không đưa bí mật vào file hoặc cấu hình đã commit.

- [`triage-issue-reports`](skills/triage-issue-reports/SKILL.md) — **Công dụng:** đọc báo cáo trong Slack, xem xét bằng chứng, phân loại, kiểm tra trùng lặp và có thể tạo issue cho lỗi mới, rõ ràng. Kết thúc bằng một verdict trong đúng thread nguồn. **Khi dùng:** chỉ từ Benny triage automation đã cấu hình. **Lưu ý:** không tái hiện hay sửa lỗi; nếu thiếu cấu hình, không xác minh được thread hoặc không đủ điều kiện ghi tracker thì phải dừng mà không ghi. Không đăng tin nhắn gốc vào kênh.

- [`reproduce-and-fix-issues`](skills/reproduce-and-fix-issues/SKILL.md) — **Công dụng:** tái hiện lỗi qua UI thật, xác minh bản sửa đã có hoặc cân nhắc sửa có giới hạn; chỉ mở draft pull request sau khi có bằng chứng trước–sau. **Khi dùng:** chỉ từ Benny repro automation đã cấu hình và sau khi nhận verdict triage đáng tin cậy. **Lưu ý:** cần cấu hình, control adapter và feature map đầy đủ; thiếu điều kiện thì dừng an toàn. Không có tái hiện được xác nhận thì không tự viết bản sửa. Không đăng tin nhắn gốc vào kênh.

### Kết hợp các skill

- **Quy trình gợi ý:** `setup-benny` → `triage-issue-reports` → `reproduce-and-fix-issues`. Setup chuẩn bị cấu hình và automation; triage phân loại và, nếu phù hợp, đăng marker trong thread; repro chỉ tiếp tục khi marker đến từ danh tính triage được cấu hình. Đây là cách phối hợp dựa trên luồng được các skill mô tả, **không phải bước tuần tự bắt buộc trong pi**. Đặc biệt, skill repro yêu cầu chờ marker; không nên suy diễn rằng chỉ cần cài skill là các automation đã được nối hoặc hoạt động.

### Giới hạn tương thích

Các skill này là skill gốc của Cursor được sao chép vào pi; việc sao chép **không đảm bảo tương thích**. Có thể cần chỉnh đường dẫn và thay thế hoặc cấu hình công cụ, adapter, agent riêng. `setup-benny` nêu rõ các file Benny được đọc trực tiếp bởi Cursor Automations và không được upstream đăng ký thành slash skill. Vì vậy, không giả định có thể gọi chúng bằng slash command trong pi hoặc chạy các lệnh Cursor trong pi.
