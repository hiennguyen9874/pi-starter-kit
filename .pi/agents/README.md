# Cấu hình subagents (pi-subagents-lite)

Thư mục này chứa định nghĩa **custom agent** cho extension
[`pi-subagents-lite`](https://github.com/AlexParamonov/pi-subagents-lite).
Mỗi file `.md` là một loại agent: **frontmatter** là cấu hình, **phần thân** là system prompt.

> File `README.md` này không có `name` trong frontmatter nên extension tự bỏ qua, không bị coi là agent.

## 1. Cài đặt và bật extension

Yêu cầu Node.js >= 22.19.0 và pi >= 0.99.0.

```bash
pi install -l npm:pi-subagents-lite     # project-local
pi -e npm:pi-subagents-lite             # thử, không cài
```

Trong profile (`.pi/profiles/*.yaml`), bật extension mới và tắt các extension subagent cũ:

```yaml
packagesEnable:
  - npm:pi-subagents-lite
packagesDisable:
  - npm:@gotgenes/pi-subagents
  - npm:pi-subagents
```

Profile không cần subagent thì để `npm:pi-subagents-lite` trong `packagesDisable`.

## 2. Vị trí file agent

Thứ tự ưu tiên khi trùng tên (cao → thấp):

| Vị trí | Phạm vi |
|---|---|
| `.pi/agents/` | Project (thư mục này) |
| `.agents/agents/` | Shared |
| `~/.pi/agent/agents/` | Global (user) |
| Built-in | `general-purpose`, `Explore` |

Tên agent được tìm theo tên chính xác trước, sau đó theo tên không phân biệt hoa thường
nếu kết quả là duy nhất; các tên chỉ khác chữ hoa/thường cần gọi chính xác. Tên agent
hiện trong mô tả tham số `agent` của tool `Agent`, không cần đăng ký thêm. File trùng tên built-in sẽ ghi đè built-in.

## 3. Frontmatter

Chỉ `name` là bắt buộc, thiếu `name` thì file bị bỏ qua. Field lạ bị bỏ qua
(ví dụ `prompt_mode`, `enabled` của extension cũ không còn tác dụng).

```markdown
---
name: security-review
display_name: Security Review
description: Review code for security issues
color: red
tools: [read, bash, grep]
skills: false
extensions: false
model: openai/gpt-6.2-sol
thinking: medium
max_turns: 80
include_system_prompt: false
---

Bạn là chuyên gia review bảo mật...
```

### 3.1 Định danh

| Field | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `name` | string | — | Tên loại agent, duy nhất. **Bắt buộc**. |
| `display_name` | string | `name` | Nhãn hiển thị trên UI. |
| `description` | string | `""` | Mô tả một câu. LLM dựa vào đây để chọn agent. |
| `color` | string | không | Màu icon: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`; alias (`amber`, `teal`, `indigo`, `gold`, `violet`, `rose`, `lime`, `gray`, `slate`, `navy`...); hoặc hex `#RRGGBB`. |
| `hidden` | boolean | `false` | `true` thì ẩn khỏi enum nhưng vẫn gọi được theo tên. |

### 3.2 Tools

| Field | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `tools` | danh sách hoặc chuỗi phân cách bằng dấu phẩy | `defaultTools` của pi | Whitelist tool; danh sách rỗng = không có tool. Nếu bỏ trống, xem `loadToolsImplicitly`. |
| `exclude_tools` | danh sách hoặc chuỗi phân cách bằng dấu phẩy | không | Blacklist tool. Loại trừ lẫn nhau với `tools` (nếu đặt cả hai, `tools` thắng). |

- Giá trị hợp lệ: tên built-in (`read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`),
  tên tool của extension (`web_search`), glob `ext/*` (ví dụ `tavily/*`).
- Subagent không thể spawn hoặc dừng agent. Khi extension được load trong subagent,
  `MessageAgent` và `AgentStatus` có thể được cấp tùy cấu hình tool.
- `exclude_tools: [tavily/*]` chỉ ẩn tool, extension vẫn load. Muốn không load, dùng `exclude_extensions`.

```yaml
tools: [read, grep, web_search]     # whitelist
exclude_tools: [edit, write]        # hoặc blacklist (không dùng cùng tools)
```

### 3.3 Extensions

| Field | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `extensions` | `true` \| `string[]` \| `false` | `true` | Extension nào được load (bao gồm tool, hook, command); `tools` điều khiển quyền dùng tool riêng. |
| `exclude_extensions` | `string[]` | không | Blacklist extension, ngăn load hẳn. |

### 3.4 Skills

| Field | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `skills` | `true` \| `string[]` \| `false` | `true` | Whitelist skill. Chỉ đưa **metadata** vào system prompt. |
| `preload_skills` | `string[]` \| `false` | `false` | Nhúng **toàn bộ** `SKILL.md` vào system prompt. Tốn token, không nhận `true`. |

### 3.5 Model và giới hạn

| Field | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `model` | string | kế thừa agent cha | Dạng `provider/model-id`. |
| `thinking` | string | theo thứ tự chọn thinking | `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, hoặc `parent` để theo session cha. |
| `max_turns` | number | không giới hạn | Giới hạn mềm, sau đó có lượt gia hạn (`graceTurns`) rồi abort cứng. |
| `max_tokens` | number | không giới hạn | Số output token tối đa cho mỗi phản hồi LLM. |

### 3.6 Prompt và context

| Field | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `include_system_prompt` | boolean | theo global | `true` = kế thừa system prompt của agent cha; `false` = replace (prompt tối giản). Nếu global là `custom` thì custom prompt thắng `true`. |
| `include_context_files` | boolean | theo global | Đưa các `AGENTS.md` vào `<project_context>`. |
| `output_transcript` | boolean | theo global | Ghi transcript ra `/tmp/pi-agent-outputs/<agentId>.log` (xem bằng `tail -f`). |

Phần thân (sau frontmatter) là hướng dẫn riêng của agent, được nối vào sau prompt nền.

## 4. Mặc định khi bỏ trống

| Thứ | Khi frontmatter bỏ trống |
|---|---|
| `tools` | Theo `loadToolsImplicitly` (mặc định `true`: pi áp dụng `defaultTools`; `false`: không có tool). |
| `skills` | Theo `loadSkillsImplicitly` (mặc định `true` = load tất cả). |
| `extensions` | Theo `loadExtensionsImplicitly` (mặc định `true` = load tất cả). |

Agent chỉ có `name` và `description` sẽ có đầy đủ quyền như `general-purpose`.
Muốn giới hạn tool, hãy khai báo tường minh (lưu ý `bash` vẫn có thể sửa file, nên đây không phải sandbox chỉ đọc):

```yaml
tools: [read, bash, grep, find, ls]
skills: false
extensions: false
```

Các tùy chọn `loadToolsImplicitly`, `loadSkillsImplicitly` và `loadExtensionsImplicitly`
độc lập với nhau: tắt từng tùy chọn để agent không khai báo tương ứng mặc định không nhận tool, skill hoặc extension.

## 5. Agent trong thư mục này

| File | Vai trò | Ghi chú |
|---|---|---|
| `Explore.md` | Khám phá codebase, chỉ đọc | Ghi đè built-in `Explore`; có `bash`, không phải sandbox. |
| `general-purpose.md` | Tác vụ chung | Ghi đè built-in, `include_system_prompt: true`. |
| `Spec-Review.md` | Review độ khớp spec | Dùng codemode với các tool phục vụ đọc, `skills: false`. |
| `Standards-Review.md` | Review chất lượng code | Dùng codemode với các tool phục vụ đọc, có khai báo skills. |

Hai agent review khai báo `codemode` cùng các tool đọc để gọi lồng nhau. Để chỉ
hiện codemode như tool trực tiếp, bật profile `advance/code-mode-only` (hoặc cấu hình
tương đương: load extension codemode và `codemode.mode: only`). Frontmatter không tự
đặt mode này. `bash` và codemode không phải sandbox: chỉ đọc là quy tắc trong prompt,
không phải bảo vệ cưỡng chế.

Tắt agent built-in: `/agents`, hoặc đặt `disableDefaultAgents` trong config global.

## 6. Cấu hình extension (không nằm trong frontmatter)

### 6.1 Nơi lưu

- **Global**: `~/.pi/agent/subagents-lite.json`, chỉnh qua `/agents` hoặc sửa tay.
- **Project**: `.pi/subagents-lite.json`, chỉ là lớp ghi đè cho **model** và **concurrency**
  (`agent.default`, model theo từng loại, `concurrency`). Các cài đặt khác luôn lấy từ global.
- Thứ tự hiệu lực: session override > project file > global file > mặc định built-in.
- Với `worktree_path` trỏ sang repo khác, repo đích không được trust thì `.pi/subagents-lite.json`, `.pi/agents` và các project resource của repo đó không được nạp; agent vẫn chạy. Đường dẫn trong cùng repo không bị kiểm tra này.

> `.pi/subagents.json` của extension cũ không còn được đọc.

### 6.2 Thứ tự chọn model (cao → thấp)

1. Session, override theo từng loại agent (`/agents` > Model settings)
2. Session, mặc định chung
3. Config, override theo từng loại agent
4. Config, mặc định chung
5. Frontmatter `model`
6. Model của agent cha

Vì vậy `model` trong frontmatter chỉ là mặc định thấp; config hoặc session có thể ghi đè.

### 6.3 Thinking level

Thứ tự chọn: lựa chọn khi spawn từ `/agents` > frontmatter `thinking` >
`modelThinkingLevels` của pi cho model đã chọn > `defaultThinking` của subagent
(project trước global) > `defaultThinkingLevel` của pi (nếu không có thì `medium`).
Kết quả được giới hạn theo các mức model hỗ trợ. `parent` trong frontmatter hoặc
`defaultThinking` dùng mức hiện tại của agent cha.

### 6.4 Concurrency

Giới hạn số agent chạy song song; agent vượt giới hạn sẽ xếp hàng (`queued`) và tự chạy khi có slot.
Ưu tiên: **model** > **provider** > **default** (giới hạn mặc định theo từng model).

```json
{
  "concurrency": {
    "default": 4,
    "providers": { "llamacpp": 2 },
    "models": { "openai/gpt-6.2-sol": 3 }
  }
}
```

### 6.5 System prompt mode (`systemPromptMode`)

| Giá trị | Hành vi |
|---|---|
| `replace` (mặc định) | Prompt tối giản + hướng dẫn của agent. Rẻ và cô lập nhất. |
| `inherit` | System prompt của agent cha + hướng dẫn của agent. |
| `custom` | `~/.pi/agent/subagents-lite-prompt.md` + hướng dẫn của agent. |

`includeContextFiles` (mặc định `true`) nạp `AGENTS.md` làm context chung trước hướng dẫn agent,
giúp tăng tỉ lệ trúng KV cache.

### 6.6 Các key `agent.*` đáng chú ý

| Key | Ý nghĩa |
|---|---|
| `default` | Model mặc định cho mọi agent. |
| `defaultThinking`, `defaultMaxTurns` | Thinking và số lượt mặc định. |
| `graceTurns` | Số lượt gia hạn sau khi chạm `max_turns`. |
| `forceBackground` | Ép mọi agent chạy nền. |
| `loadToolsImplicitly`, `loadSkillsImplicitly`, `loadExtensionsImplicitly` | Mặc định tools/skills/extensions khi frontmatter bỏ trống. |
| `disableDefaultAgents` | Bỏ qua agent built-in. |
| `outputTranscript` | Bật transcript toàn cục. |
| `toolTimeoutMinutes`, `idleTimeoutMinutes` | Watchdog (xem 6.7). |
| `finishedRetentionMinutes`, `agentStatusLimit` | Thời gian giữ agent đã xong, số agent hiện trong `AgentStatus`. |
| `widget*`, `show*`, `statusBarFormat`, `modelDisplayStyle` | Tuỳ biến widget. |

### 6.7 Watchdog

Dừng agent bị treo; mặc định 45 phút, `0` là tắt:

- `toolTimeoutMinutes`: một tool call chạy quá lâu.
- `idleTimeoutMinutes`: không có hoạt động (tool event hoặc text stream) quá lâu.

Khi dừng agent, watchdog báo cho session chính.

## 7. Sử dụng

`Agent` tool (LLM gọi):

| Tham số | Ý nghĩa |
|---|---|
| `prompt` | Nhiệm vụ (bắt buộc). |
| `description` | Nhãn ngắn cho widget. |
| `agent` | Loại agent, mặc định `general-purpose`. |
| `run_in_background` | Yêu cầu chạy nền, tự báo khi xong. Nếu `MessageAgent` active trong child thì luôn chạy nền, kể cả khi truyền `false`. |
| `worktree_path` | Thư mục bên trong git repo làm working dir; đường dẫn tương đối tính từ working dir của agent cha. Có thể là worktree, main checkout hoặc repo khác. |

`model`, `thinking`, `max_turns`, `max_tokens` lấy từ config/frontmatter, LLM không truyền.
Tool khác: `StopAgent` (dừng theo ID), `AgentStatus` (liệt kê agent),
`MessageAgent` (gửi chỉ dẫn cho agent đang chạy hoặc tiếp tục agent đã kết thúc
nếu session còn sống và có slot). Subagent cũng có thể gửi tin cho agent khác;
bỏ `agent_id` hoặc đặt `null` để gửi cho agent cha. Tin nhắn không đảm bảo đã được nhận.

Menu `/agents`: xem, steer, continue, stop, clear agent; spawn thủ công; cấu hình model,
concurrency, widget, system prompt, watchdog.
Widget: `↑`/`↓` chọn, `Enter` mở viewer (và steer), `Esc` thoát.

## 8. Tham khảo

- Repo: https://github.com/AlexParamonov/pi-subagents-lite
- ADR: `docs/adr/` trong repo (đặc biệt 0002 concurrency, 0007/0008 project config).
