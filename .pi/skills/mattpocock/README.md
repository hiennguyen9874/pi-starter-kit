# mattpocock/skills: bộ kỹ năng giúp coding agent làm việc như một kỹ sư thực thụ

> Bài viết tổng hợp từ 4 video của Matt Pocock (*Watch me ship a 21,000-line feature*, *v1.3*, *v1.2*, */wayfinder*, */prototype*) và 2 bài tóm tắt trên X.

---

## 1. mattpocock/skills là gì?

**mattpocock/skills** là kho "skill" mã nguồn mở của Matt Pocock, người trước đây nổi tiếng với các khóa học TypeScript. Một skill là một file `SKILL.md` hướng dẫn coding agent (Claude Code, Codex, Pi…) làm một quy trình cụ thể: phỏng vấn người dùng, viết spec, chia ticket, review code, viết PR, nhìn lại phiên làm việc...

Một vài con số Matt nhắc đến:

- Khoảng **204K sao**. Theo lời Matt, đây là khoảng repo nhiều sao thứ 24 trên GitHub và là repo skill nhiều sao nhất.
- Có trong **marketplace plugin chính thức của Claude Code**.
- Có tài liệu đầy đủ tại **aihero.dev/skills**, gắn với một "từ điển AI coding" do Matt biên soạn.
- Bộ skill **không phụ thuộc vào issue tracker**: dùng được với GitHub, Linear, Jira… sau khi cấu hình một lần bằng skill setup.

Matt nói rõ đây không phải "prompt ma thuật". Bộ skill dựa trên **những nguyên tắc nền tảng của kỹ thuật phần mềm** mà anh học được khi còn là lập trình viên trước thời AI: Domain-Driven Design, Agile/prototyping, Shape Up, vertical slice, review, retro.

---

## 2. Triết lý cốt lõi

### 2.1. Con người giỏi nhất ở **đầu** và **cuối** quy trình
Matt kết luận rằng anh có giá trị nhất ở hai thời điểm:
1. **Đầu quy trình (alignment):** grilling, đặt tên khái niệm, làm prototype, chốt mô hình dữ liệu.
2. **Cuối quy trình:** QA, review, áp đặt coding standards và chạy retro.

Phần ở giữa là triển khai. Phần này agent tự chạy ở chế độ **AFK (away from keyboard)**.

### 2.2. Đưa cho agent cái "tại sao", không phải cái "làm gì"
Khi mở đầu một phiên, Matt mô tả **vấn đề và nỗi khó chịu** chứ không ra lệnh "làm XYZ". Theo anh, biết lý do thì agent chủ động đề xuất giải pháp sáng tạo hơn. Chỉ nhận lệnh thì nó làm đúng chữ, ít sáng tạo.

### 2.3. Thu hẹp không gian quyết định của agent
> "Càng giao nhiều quyết định cho agent, nó càng có nhiều khả năng chọn sai."

Khi tới bước triển khai, agent đã có glossary, spec, ticket và prototype. Việc còn lại chỉ là "ghép các mảnh". Vì vậy chất lượng đầu ra ổn định hơn nhiều.

### 2.4. Smart zone và dumb zone
Khái niệm này Matt mượn từ Dex Horthy. Context càng dài thì agent càng kém. Lý do là số quan hệ giữa các token tăng theo bình phương. Với model đời mới, Matt coi ngưỡng này là bài toán **chi phí và tối ưu chất lượng** hơn là nỗi lo hallucination. Làm việc trong smart zone cho kết quả tốt hơn và rẻ hơn, vì context 750K token rất đắt mỗi khi cache hết hạn. Hệ quả thực tế:
- Chia việc lớn thành nhiều phiên, mỗi phiên một ticket, giao cho sub-agent có context sạch.
- Dùng `/compact` có chủ đích, nhất là ngay sau khi hội thoại đã được "đóng gói" thành tài liệu như spec hay ticket.

### 2.5. Bắt agent chứng minh, đừng tin lời nó
Bằng chứng (before/after, screenshot, test) là điều bắt buộc. Nếu không đòi bằng chứng, agent rất dễ nói "chắc là chạy được vì tôi đã đọc code".

---

## 3. Bản đồ các skill

| Nhóm | Skill | Công dụng |
|---|---|---|
| **Thiết lập** | setup | Cấu hình một lần cách repo hoạt động (issue tracker…) |
| **Căn chỉnh / lập kế hoạch** | `/grill-me` | Agent phỏng vấn bạn cho đến khi mọi nhánh quyết định được giải quyết |
| | `/grill-with-docs` | Grilling kèm cập nhật `glossary.md` và ADR |
| | `/wayfinder` | Lập kế hoạch cho việc lớn hơn một phiên, quản lý "sương mù" bằng ticket quyết định |
| | `/prototype` | Code dùng một lần để trả lời một câu hỏi (UI hoặc logic) |
| | `/to-questionnaire` | Xuất câu hỏi của phiên grilling ra tài liệu để bàn với người khác |
| **Đóng gói công việc** | `/to-spec` | Tạo spec, tức "tài liệu đích" cho công việc nhiều phiên |
| | `/to-tickets` | Chia spec thành ticket theo vertical slice, có quan hệ phụ thuộc |
| **Triển khai** | `/implement-spec` | Agent điều phối, sub-agent triển khai từng ticket song song, cuối cùng ra một PR |
| **Kiểm soát chất lượng** | `/code-review` | Reviewer context sạch đối chiếu code với coding standards |
| | `/pr` | Viết PR mô tả dễ review: tóm tắt, bằng chứng, rủi ro merge, blast radius |
| | `/retro` | Đọc transcript các phiên và review comment, đề xuất cải tiến môi trường |
| **Giao tiếp và tiện ích** | `/wait-what` | Bắt agent nói lại bằng ngôn ngữ đơn giản, dùng thuật ngữ của dự án |
| | `/writing-for-agents` | Viết tài liệu cho agent đọc: AGENTS.md, CLAUDE.md, skill |
| | `/wizard` | Sinh wizard bash tương tác, dẫn người dùng qua các bước chỉ con người làm được |

---

## 4. Luồng làm việc chính

```
         ┌──────────── diff nhỏ? ──── one-shot luôn
         │
Ý tưởng ─┼── diff lớn ──► /grill-with-docs ──(lớn hơn dự kiến)──► /wayfinder
         │                     │   ↕ /prototype                      │
         │                     ▼                                     ▼
         │                 /to-spec ◄──────────────────────────────── map
         │                     ▼
         │                 /to-tickets
         │                     ▼
         │              /compact → /implement-spec  (AFK)
         │                     ▼
         │              /code-review → /pr (stacked diffs nếu cần)
         │                     ▼
         └──────────── QA + human review → /retro → issue/lint rule mới
```

Cây quyết định khi bắt đầu việc mới: **sản phẩm cuối cùng là một diff.** Diff nhỏ thì cứ one-shot. Diff lớn thì bắt đầu bằng `/grill-with-docs`. Nếu việc hóa ra lớn hơn dự kiến thì chuyển sang `/wayfinder`. Matt thích bắt đầu bằng grill vì nếu việc nhỏ hơn tưởng tượng thì không phải gánh overhead của Wayfinder.

Một bài tóm tắt trên X gói gọn quy trình thành công thức:

> **Feature = Codebase + Grill + Spec + Tickets + AFK Loop + Retro**

Bài đó còn thêm **layer 0: codebase**. Codebase cần deep module và vòng phản hồi nhanh, vì *codebase tệ thì agent cũng tệ*.

---

## 5. Đi sâu từng skill

### 5.1. `/grill-me` và `/grill-with-docs`: grilling là một nghệ thuật

Agent đặt câu hỏi kèm **câu trả lời đề xuất**. Bạn trả lời, thường bằng giọng nói (Matt dùng Whisper Flow).

**Thay đổi ở v1.2: hỏi theo vòng, đi theo đồ thị phụ thuộc.**
- Trước đây mỗi lượt chỉ có một câu hỏi. Cuối phiên còn toàn câu dễ, người dùng phải gõ "ừ, được" từng câu một, rất chậm.
- Hỏi nhiều câu một lúc lại vướng vấn đề: câu 3 có thể phụ thuộc vào câu 1.
- Giải pháp: coi các câu hỏi là một **đồ thị**. Mỗi vòng chỉ hỏi những câu đang mở được (là "frontier"). Vòng đầu có thể chỉ có một câu then chốt, các vòng sau mở rộng dần.
- Mỗi câu có emoji đánh dấu để dễ nhìn. Người dùng trả lời kiểu "Q1 đồng ý, Q2 đồng ý, Q3 cần sửa…".

**Mẹo điều khiển phiên grilling:**
- *"For now let's just focus on this question. Ask me one question at a time until I say otherwise"*: dùng khi đang ở điểm mấu chốt cần tập trung.
- *"Let's now have multiple questions at once"*: dùng khi đã qua phần khó.
- **Người dùng cầm lái chứ không phải agent.** Lúc nào thấy đủ thì dừng.
- Dấu hiệu sắp xong: bạn chỉ còn nói "yes, yes, yes". Lúc đó agent đã ra quyết định như chính bạn.

**`glossary.md` và ADR: ngôn ngữ chính là mô hình dữ liệu**

`/grill-with-docs` lấy cảm hứng từ *Domain-Driven Design* của Eric Evans:

- **`glossary.md`** (ở v1.3 đổi tên từ `context.md`) là bảng thuật ngữ, "mỗi ý tưởng một từ". Tên cũ `context.md` bắt nguồn từ khái niệm "bounded context" của DDD nhưng khó hiểu, và agent không dùng đúng lúc. Glossary của dự án CVM (Course Video Manager) dài khoảng 560 dòng, được Matt gọi là "niềm tự hào".
- **ADR (Architectural Decision Record)** giải thích *tại sao* đưa ra một quyết định. Matt dẫn ví dụ **hàng rào của Chesterton**: đừng dỡ hàng rào khi chưa biết vì sao người ta dựng nó. Glossary mô tả hệ thống hiện tại. ADR mô tả lý do.

Tại sao phải "ám ảnh" ngôn ngữ đến vậy? Vì **từ ngữ trở thành tên bảng, tên module và quan hệ giữa chúng.** Khi chốt được ngôn ngữ thì gần như đã chốt được thiết kế.

**Scenario testing cho từ ngữ:** agent lập bảng các câu mô tả tình huống thực tế, rồi thử từng phương án tên (ví dụ *thumbnail diagram snapshot*, *thumbnail diagram*, *thumbnail scene*) xem câu nào tự nhiên và không gây hiểu lầm. Một tiêu chí được Matt cho trọng số rất cao là *"Matt có nói như vậy khi làm việc không?"*, tức tên có khớp với mô hình trong đầu người dùng hay không.

### 5.2. `/prototype`: đừng phí thời gian vào spec, hãy làm prototype

> "Prototype là code dùng một lần để trả lời một câu hỏi."

Matt rất khó chịu với xu hướng "spec-driven development", tức là dồn sức viết spec thật chi tiết rồi mong AI làm đúng từng chữ. Người ta quên mất rằng **mình có thể viết code ngay trong lúc làm spec.**

**Độ trung thực (fidelity):**
- Câu hỏi đơn giản như "modal có nút Hủy và Xác nhận" thì thảo luận là đủ. Rẻ nhưng độ trung thực thấp.
- Câu hỏi về cảm giác như "trông thế nào, dùng ra sao" thì cần prototype. Tốn token hơn nhưng độ trung thực cao.
- Code ngày nay rẻ, nên Matt có xu hướng **nâng độ trung thực của các cuộc thảo luận**.

**Cách skill hoạt động:**
- Tạo **nhiều biến thể** (A/B/C) và có bộ chuyển đổi để so sánh. Biến thể bạn *ghét* nhiều khi cho agent biết nhiều hơn biến thể bạn thích.
- Gắn trực tiếp vào route thật của ứng dụng, nên phản ánh đúng hơn cách code sẽ chạy.
- Lặp lại theo phản hồi, ví dụ "ô tìm kiếm của A, bố cục của C" thành ra biến thể D.
- Lưu prototype vào **nhánh dùng một lần**. Agent triển khai sau đó có cả spec lẫn code UI thật để tham khảo.
- Có hai nhánh tài liệu tham khảo: **UI prototype** và **logic prototype**. Logic prototype là một app terminal nhỏ để chạy thử state machine qua các trường hợp khó suy luận trên giấy. Prototype không chỉ dành cho front-end.

Matt ghi công cho cuốn **Shape Up** của Ryan Singer. Theo anh, khoảng cách từ spec đến code production rất lớn, còn từ prototype đến production thì gần hơn nhiều.

### 5.3. `/wayfinder`: không việc gì quá lớn để lập kế hoạch

Grilling gắn chặt với **một phiên**. Có những việc vượt quá smart zone của một context window, hoặc gặp câu hỏi chưa thể trả lời vì còn "sương mù".

**Ý tưởng:** đi từ điểm xuất phát mơ hồ đến một **đích đến** (destination) bằng cách vẽ **bản đồ**. Mỗi điểm trên bản đồ là một **ticket quyết định**, và mỗi ticket được xử lý trong một phiên riêng.

**Bốn loại ticket:**
1. **Research:** agent đi tìm thông tin, thường chạy ngầm trong sub-agent rồi báo lại.
2. **Prototype:** dùng lại skill `/prototype`. Đây là thứ giúp Wayfinder **không biến thành waterfall**.
3. **Grilling:** thảo luận một khía cạnh cụ thể.
4. **Task:** việc ngoài đời thực như cấu hình, liên hệ ai đó, chạy việc vặt.

**Cơ chế:**
- Bản đồ là issue cha trong issue tracker, các ticket là sub-issue.
- Ticket có quan hệ chặn (blocking). Wayfinder theo dõi **frontier** (những gì quyết định được ngay) và **fog** (những gì chưa quyết được).
- Khi một ticket được giải quyết, kết quả được ghi vào ticket và tóm tắt ngược lên bản đồ.
- Cách dùng: gọi `/wayfinder <mô tả>` để vẽ bản đồ, rồi `/wayfinder <URL ticket>` cho từng ticket, mỗi lần một phiên mới.
- Bản đồ xong thì chạy `/to-spec` trên bản đồ, rồi `/to-tickets`. Spec có link ngược về các ticket quyết định, nên agent có thể đọc **nguồn gốc** thay vì chỉ đọc bản tóm tắt. Đây là điểm yếu cũ của grill-with-docs mà Wayfinder khắc phục được.

**FAQ:**
- *"Quy trình nặng quá?"* Nếu lập kế hoạch được trong một phiên thì cứ làm trong một phiên. Wayfinder chỉ dành cho việc có "sương mù".
- *"Đây là SDD à?"* Không. Với Matt, spec chỉ là **tài liệu đích cho công việc nhiều phiên**. Xong việc thì đóng issue, spec biến mất. Spec **không tồn tại lâu dài** như trong spec-driven development.
- Ticket quyết định (của Wayfinder) khác ticket triển khai (của `/to-tickets`).
- Wayfinder dùng được cả cho việc ngoài code. Matt dùng nó để lên kế hoạch xây văn phòng trong vườn và để soạn khóa học.

### 5.4. `/to-spec` và `/to-tickets`

- **Spec là đích đến:** khi các phiên kết thúc, hệ thống phải ở trạng thái nào. Trong case study, spec là một GitHub issue với khoảng **47 user story**, các quyết định triển khai, phần *out of scope* và link tới prototype.
- **Ticket xác định phạm vi từng phiên:** mỗi sub-agent nhận đúng một ticket. Ticket được chia theo **vertical slice** (mỗi ticket demo được), có quan hệ chặn, và **chạy song song được**. Ticket đầu tiên thường là một "pre-factor", ví dụ tách component dùng chung.

### 5.5. `/implement-spec` (v1.3): agent đóng vai người điều phối

Matt so sánh ba cách chạy nhiều ticket:
1. **Vòng lặp thủ công:** con người bảo agent làm ticket 1, đợi, rồi ticket 2… Rất mệt.
2. **Vòng lặp tất định:** một script đọc từng ticket rồi tự chạy (kiểu "Ralph loop"). Rẻ và đáng tin cậy, nhưng khó thiết lập với người mới.
3. **`/implement-spec`:** **agent điều phối thay con người**. Gần đây sub-agent đã có thể tự sinh sub-agent khác, nên cách này khả thi.

Kém tất định hơn cách 2 nhưng là điểm khởi đầu rất tốt cho quy trình AFK. Quy trình khoảng 9 bước:
1. Đọc spec và ticket. Coi ticket là **đồ thị** chứ không phải danh sách.
2. Khảo sát codebase qua sub-agent.
3. Tạo **integration branch**.
4. Sub-agent triển khai từng ticket theo **TDD** trên git worktree riêng.
5. Merge vào integration branch qua sub-agent, mở khóa các ticket tiếp theo.
6. Lặp lại đến khi hết ticket.
7. Chạy **code review** trên toàn nhánh.
8. Dọn dẹp và sửa lỗi review.
9. Mở **một PR** sẵn sàng để review.

### 5.6. `/code-review`
Reviewer có **context sạch**, đối chiếu code với coding standards của repo *trước khi* con người nhìn vào. Trong case study, nó tìm ra một vi phạm nghiêm trọng và vài chỗ scope creep rồi tự sửa. Retro cũng phát hiện điểm yếu của nó: một agent không bao quát nổi diff quá lớn. Cần chia thêm việc cho sub-agent.

### 5.7. `/pr` (v1.3): PR dễ review nhất có thể

Lấy cảm hứng từ skill *"show me"* của Dex Horthy. Template PR gồm:
1. **Tóm tắt** kèm sơ đồ ngắn gọn để nhanh chóng nắm ngữ cảnh.
2. **Bằng chứng** before/after: chạy test, chụp màn hình.
3. **Rủi ro khi merge**: đây là **cửa một chiều hay cửa hai chiều?**
   - *Cửa hai chiều*: merge rồi revert dễ dàng.
   - *Cửa một chiều*: khó quay lại, ví dụ đụng tới dữ liệu, gọi dịch vụ bên ngoài, mở lỗ hổng bảo mật.
4. **Blast radius**: phạm vi ảnh hưởng nếu có sự cố. Cửa hai chiều có blast radius nhỏ thì không cần review kỹ.

### 5.8. `/retro` (v1.3): retrospective cho agent

Đây là skill Matt cho là gây sốt nhất. Nó đọc **transcript các phiên agent**, kể cả các phiên đã compact vì transcript vẫn nằm trên đĩa, và có thể kéo review comment qua GitHub CLI. Sau đó nó trả về **danh sách đề xuất cải tiến xếp theo thứ tự ưu tiên**.

Các câu hỏi retro đặt ra:
- Codebase có dễ điều hướng không?
- Có thêm được bước kiểm tra tự động hay lint rule nào không?
- AGENTS.md có gọn không? Công cụ có tiết kiệm token không?
- Tài liệu có chỉ dẫn nào lỗi thời không?
- Agent có truy cập được mọi thông tin nó cần không?

**Lưu ý quan trọng:** retro được thiết kế để **có con người tham gia**.
> "Ai xem cũng nói muốn tự động hóa nó. Đừng làm vậy."

Nếu tự động hóa, agent sẽ chạy theo false positive và kéo repo đi những hướng kỳ quặc. Hãy chạy retro định kỳ trên một mẫu phiên, và dùng phán đoán của mình để lọc đề xuất.

### 5.9. Các skill v1.2 khác

- **`/wait-what`**: dành cho lúc Opus nói một câu dài dòng toàn từ ngữ kiểu LLM mà bạn không hiểu. Skill yêu cầu agent dùng **ASD-STE100 Simplified Technical English** (câu khẳng định ngắn, rõ) và **dùng thuật ngữ trong glossary**. Theo Matt, thuốc chữa dài dòng thực sự là bắt agent *dùng ngôn ngữ của bạn*.
- **`/writing-for-agents`**: đổi tên từ skill *writing great skills*. Dùng cho mọi tài liệu agent đọc (AGENTS.md, CLAUDE.md, skill), đặc biệt khi tách AGENTS.md thành skill để tránh nhồi hết vào context từ đầu. Skill này model-invocable, tức agent tự gọi khi sửa AGENTS.md.
- **`/wizard`**: sinh **script bash tất định** dẫn người dùng qua những bước chỉ con người làm được, ví dụ cấp phát hạ tầng AWS. Script mở đúng trang cần mở, nhận API key rồi ghi vào file hoặc GitHub secrets. Không có dữ liệu nào đi qua agent. Matt mô tả trải nghiệm từ "cực kỳ đau khổ" thành "vui một cách kỳ lạ".
- **`/to-questionnaire`**: biến câu hỏi grilling thành tài liệu (đưa lên Google Docs) để bàn với người khác. Matt dùng nó để thiết kế văn phòng cùng vợ. Anh coi đây là bản vá tạm, hy vọng sẽ bỏ khi agent cộng tác tốt hơn, ví dụ agent nằm ngay trong Slack.

---

## 6. Case study: tính năng 21.000 dòng code

**Bối cảnh:** trong CVM (Course Video Manager), app cá nhân của Matt, quy trình làm thumbnail YouTube rất thủ công: chụp mặt, sang tab diagram, chụp màn hình, dán vào, căn chỉnh, sai thì làm lại. Matt muốn **vẽ diagram trực tiếp cạnh khuôn mặt** ngay trong trình sửa thumbnail, nhưng *không biết UI sẽ trông thế nào*.

**Môi trường:** Claude Code, Opus ở mức effort medium, chạy trong "home repo" của Matt. Home repo có thêm skill riêng như `verify-cvm` và handoff.

### Bước 1: Grilling (khoảng 40 câu hỏi)
- Mở đầu bằng mô tả nỗi khó chịu, không ra lệnh.
- Agent chạy research ngầm rồi tự sửa lại câu hỏi.
- **Tranh luận về từ ngữ:** thứ nằm trong thumbnail có phải "diagram" không? Theo glossary, diagram là nhóm các *diagram snapshot* theo thời gian. Agent đề xuất *thumbnail drawing*, Matt bác vì "drawing" và "diagram" đá nhau. Scenario testing loại *thumbnail scene* vì glossary đã có khái niệm "scene". Kết quả cuối là **thumbnail diagram**, kèm một **ADR** giải thích "nó tên là diagram nhưng không phải diagram".
- **Quyết định mô hình dữ liệu:** không trộn với mô hình diagram/snapshot đã ổn định. Chỉ lưu một tham chiếu nullable *started-from-snapshot*. Nguyên tắc: mô hình nào cũng được, miễn **không làm mất thông tin (not lossy)** và giữ đủ liên kết.
- Phát hiện phụ: "component" trong glossary đụng với React component, nên đổi thành **diagram component**. Thêm quy tắc soft delete (archive thay vì xóa cứng), editor dùng chung cho cả playground lẫn thumbnail, và tìm kiếm chéo giữa thumbnail diagram và diagram.

> Grilling không chỉ phục vụ tính năng đang làm. Theo Matt, nó là "một nghi thức để suy nghĩ về code" và giúp anh luôn nắm được codebase.

### Bước 2: Prototype song song với grilling
- Sub-agent làm 3 biến thể. Biến thể **A** thắng nhờ tính năng "ghost face": khuôn mặt mờ đi khi con trỏ ở trong khung. B quá to, C (split view) bị chê là "garbage".
- Phiên bản 2 được đặt vào trang thumbnail thật, có command palette, chèn component, tìm diagram.
- Một câu hỏi rất đáng giá: **undo cho việc di chuyển mặt và chụp lại có chung lịch sử với thao tác vẽ không?** Có, và tldraw cho cái này gần như miễn phí.
- Bug "vạch trắng": agent tự dựng bản tái hiện lỗi, đọc màu từng pixel, rồi kết luận nguyên nhân là Chrome scale 125% chứ không phải lỗi code.

### Bước 3: `/to-spec` và `/to-tickets`
Kết quả là spec với 47 user story và 9 ticket có quan hệ phụ thuộc. Ticket đầu tiên tách shared diagram editor.

### Bước 4: `/compact` rồi `/implement-spec`
Matt nói compact lúc này *"gần như miễn phí"* vì hội thoại đã được đóng gói vào tài liệu. Sau đó anh rời máy. Agent chạy 3 ticket song song đầu tiên, mất khoảng 45 đến 60 phút, kết quả là PR khoảng **21.000 dòng** kèm kết quả review.

### Bước 5: Chia nhỏ PR bằng stacked diffs
Matt "đóng vai" một hệ thống production có hàng trăm nghìn người dùng:
- Yêu cầu chia thành **một chuỗi cửa hai chiều, kết thúc bằng một cửa một chiều**.
- Yêu cầu ước lượng số dòng mỗi PR, và dùng **feature flag** để hai phiên bản chạy song song cho đến PR cuối bật flag.
- Kết quả: 7 PR, từ PR chỉ có thuật ngữ glossary và ADR cho đến PR migration bổ sung schema. Chỉ PR migration được coi là **bắt buộc phải review**.

### Bước 6: Human review nhằm cải thiện hệ thống, không chỉ sửa code
Matt review không chỉ để xem code chạy, mà để **tìm khuyết điểm của hệ thống đã sinh ra code đó**. 12 comment, gồm:
- Comment quá dài và quá nhiều. Comment là bề mặt agent phải cập nhật, và thường là "ghi chú cho phiên sau" mà rồi tồn tại mãi.
- Dùng `as` trong TypeScript ngoài shared utilities: cấm, viết helper thay thế.
- Dùng intersection (`&`, `Pick`): ưu tiên `interface extends`, tìm lint rule để "ratchet".
- `fetch` bị bỏ qua kết quả: cần một API client có kiểu.
- `useSearchParams` với magic string: cần helper có kiểu, và lint cấm dùng trực tiếp.

**"Ratchet"** nghĩa là thêm một luật tất định nhưng không áp hết ngay, mà siết dần theo thời gian.

### Bước 7: `/retro`
Retro đọc khoảng 30 transcript và 12 review comment. Kết luận chính:
- **Cả 12 comment có chung một nguyên nhân gốc**: coding standards không đề cập, còn tài liệu và code hiện có lại dạy đúng các pattern bị chê, với hàng nghìn chỗ trong main. Matt gọi đây là việc "quay đầu một tàu chở dầu".
- Đề xuất cụ thể: lint rule cho `as` (khoảng 2.000 chỗ), lint tùy biến cho intersection, cấm `useEffect` theo thư mục (khoảng 230 chỗ), typed search params, typed API client, sửa các tài liệu đang dạy sai pattern.
- Comment chiếm 18% số dòng của tính năng mới, so với 12% trung bình toàn repo. Kiểm tra comment kỹ hơn cho thấy khoảng 940 dòng có thể xóa ngay và 7 comment đã lỗi thời. Khi Matt yêu cầu "mạnh tay hơn", kết quả là 22 comment xóa được, 18 workaround cần thiết kế lại, 3 ADR mới.
- Matt dẫn quan điểm của Lauren Tan: **comment là "lá nho"** che cho workaround. Cấm comment thì agent buộc phải thiết kế đúng thay vì giải thích.
- Một số đề xuất trở thành **issue trên chính repo mattpocock/skills**, ví dụ "prototype bị copy thay vì triển khai lại", hay code-review không bao quát được diff lớn. Theo Matt, đây là cách bộ skill được cải thiện dần.

**Kết quả:** tính năng chạy đúng như prototype. Từ buổi retro ra khoảng 20 issue nhỏ có thể giao thẳng cho agent mà không cần grilling.

---

## 7. Lịch sử phiên bản

**v1.2**
- Trang tài liệu aihero.dev/skills, kèm FAQ lấy từ wiki cá nhân của Matt.
- Có mặt trong marketplace plugin chính thức của Claude Code (bundle chỉ đọc, tự cập nhật).
- Mỗi skill kèm file `openai.yaml` để chạy với Codex. Skill chỉ do người dùng gọi có `allow_implicit_invocation: false`, nên bị ẩn khỏi context của agent cho đến khi được gọi.
- Grill-me hỏi theo vòng và theo đồ thị phụ thuộc.
- Skill mới: `/wait-what`, `/writing-for-agents`, `/wizard`, `/to-questionnaire`.

**v1.3**
- Skill mới: `/implement-spec`, `/pr`, `/retro`.
- `context.md` đổi thành **`glossary.md`**, rút gọn còn bảng thuật ngữ thuần túy. Nếu bạn đang dùng bộ skill, **cần đổi tên file này**.
- Một chi tiết vui: retro của chính Matt phát hiện agent làm "mất" bản 1.3.0 khi tự ý release. Vì vậy trên GitHub chỉ có 1.3.1.

---

## 8. Cài đặt và bắt đầu

1. **Claude Code:** gõ `/plugin`, tìm "Matt Pocock skills", rồi cài đặt.
2. **Codex và các harness khác:** cài từ repo GitHub. File `openai.yaml` lo phần gọi ngầm.
3. Chạy **setup** một lần để khai báo issue tracker và cách repo hoạt động.
4. Lưu ý với Claude Code: skill do người dùng gọi phải đặt **ở đầu tin nhắn**, ví dụ `/to-spec let's write it up`, không được chèn giữa câu.

**Lộ trình gợi ý:**
- Tuần 1: dùng `/grill-me` hoặc `/grill-with-docs` cho mọi tính năng không tầm thường. Bắt đầu viết `glossary.md`.
- Thêm `/prototype` mỗi khi câu hỏi là "trông thế nào / chạy ra sao".
- Khi đã quen thì dùng `/to-spec` → `/to-tickets` → `/implement-spec`.
- Định kỳ chạy `/retro` trên vài phiên gần nhất.
- Dùng `/wayfinder` khi gặp việc "mờ mịt" vượt quá một phiên.

---

## 9. Bài học rút ra

1. **Đầu tư vào alignment, rồi để agent chạy AFK.** Thời gian người tham gia ở đầu quy trình quyết định chất lượng ở cuối.
2. **Ngôn ngữ là thiết kế.** Glossary và ADR không phải giấy tờ thủ tục mà là bộ nhớ dài hạn cho cả người lẫn agent. Lười ghi lại thì các phiên sau sẽ kém đi.
3. **Prototype thay cho spec dài.** Độ trung thực cao rất rẻ khi code rẻ.
4. **Spec là đích đến tạm thời, ticket là phạm vi một phiên.** Xong việc thì bỏ spec.
5. **Quản lý context như quản lý ngân sách.** Dùng sub-agent và compact đúng lúc, tránh để phiên chạy sâu vào dumb zone.
6. **Review để sửa hệ thống, không chỉ sửa code.** Mỗi comment nên trở thành lint rule, coding standard hoặc tài liệu.
7. **Retro có con người tham gia.** Tự động hóa hoàn toàn sẽ chạy theo false positive.
8. **Phân loại rủi ro bằng cửa một chiều và cửa hai chiều.** Tập trung review vào chỗ không thể quay lại.

---

## 10. Góc nhìn phản biện

- **Chi phí:** Matt dùng gói Claude cao cấp. Prototype một lần tốn khoảng 100K token, retro trên 30 phiên cũng tốn không ít.
- **Đường cong học tập:** grilling và domain modeling đòi hỏi người dùng thực sự hiểu hệ thống của mình. Bộ skill khuếch đại chuyên môn sẵn có chứ không thay thế nó.
- **Tính tất định:** chính Matt thừa nhận `/implement-spec` kém tin cậy hơn một vòng lặp script tất định.
- **Bối cảnh:** case study là phần mềm cá nhân, người dùng duy nhất là Matt. Phần stacked diffs và feature flag chỉ là "đóng vai" production.
- **Nguồn thứ cấp:** các bài trên X ("10-page PDF", "nhiều sao hơn React") là tóm tắt của cộng đồng, không phải lời Matt. Nên đối chiếu với video gốc.

---

**Nguồn:**
- *Watch me ship a 21,000-line feature with mattpocock/skills*: youtube.com/watch?v=jVBlkOF8sHk
- *New Skills! v1.3 brings /pr, /implement-spec, and /retro*: youtube.com/watch?v=BsJGo1wFTvQ
- *New Skills! v1.2 brings /wait-what, /writing-for-agents…*: youtube.com/watch?v=gaDdrDdczO4
- */wayfinder: Nothing is too big to plan anymore*: youtube.com/watch?v=F3lL98Pj90o
- *Don't waste time on specs: /prototype instead*: youtube.com/watch?v=n0VhIVtviC0
- Tài liệu: aihero.dev/skills

---

Bài viết được tổng hợp từ 5 transcript và 2 bài trên X trong thư mục `mattpocock/`. Mình chỉ có công cụ đọc file nên bài viết chưa được lưu ra file nào.

- **Bản dịch tự động:** transcript v1.3 và /prototype là bản dịch máy sang tiếng Việt khá lỗi (ví dụ "PR" bị dịch thành "yêu cầu rút tiền"), nên một số chi tiết của hai video này là suy luận lại.
- **Tên skill:** tên chính xác của một số skill, như skill setup, có thể khác một chút so với repo. Nên kiểm tra tại aihero.dev/skills.