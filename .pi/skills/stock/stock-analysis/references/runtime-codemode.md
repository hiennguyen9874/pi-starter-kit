# Runtime codemode

Đọc file này khi dùng tool codemode. Fetch dùng JavaScript với `tools`; compute dùng các script Python hiện có thông qua `tools.bash` và `uv`.

Ví dụ bắt đầu ở thư mục gốc repo. Nếu cwd khác, dùng đường dẫn tuyệt đối tới skill đã load. `workdir` tính từ cwd; giữ cùng một đường dẫn cho toàn bộ báo cáo.

## Fetch một mã

Giữ entry point JavaScript hiện có:

```js
// @options: {"timeout_ms": 400000}
const AF = Object.getPrototypeOf(async function(){}).constructor;
const src = await tools.read({ path: ".pi/skills/stock/stock-analysis/scripts/fetch_stock.js" });
return await new AF("tools", "args", src)(tools, { symbol: "HPG", outDir: "stock-reports/HPG-2026-11-14" });
```

Tùy chọn: `perMin=25`, `priceYears=3`, `only: ["fa_q", ...]`. Mỗi lượt retry vẫn fetch identity; manifest của JS chỉ ghi các job trong lượt đó, còn raw cũ vẫn giữ nguyên.


Kết quả có `structure`, `failed`, `notes`. Khi retry, giữ lỗi/notes từ lượt đầu để báo cáo đủ giới hạn: manifest chỉ chứa job của lượt hiện tại. Lỗi "không có trong gói" là cố định, không retry.

Trước lời gọi MCP ngoài pipeline, đọc schema/guidelines bằng `await describeTool("mcp__sstock__<tool>")`, rồi gọi `tools.mcp__sstock__<tool>(args)`. Kiểm tra `isError` và parse JSON trong `content[].text`. Fetcher dùng `tools.bash({command:"sleep N"})` để chờ rate-limit.

## Ngành proxy

Chạy khi cần benchmark theo mảng, với ID theo [conglomerate-power.md](conglomerate-power.md#ngành-proxy-chạy-ngay-sau-bước-2):

```js
// @options: {"timeout_ms": 200000}
const AF = Object.getPrototypeOf(async function(){}).constructor;
const src = await tools.read({ path: ".pi/skills/stock/stock-analysis/scripts/fetch_proxy.js" });
return await new AF("tools", "args", src)(tools, { outDir: "stock-reports/REE-2026-11-15", sectorIds: [13, 26, 32] });
```


Output: `raw/proxy_<id>.json` với bốn khóa `rrg`, `val`, `fa`, `companies`. Mỗi giá trị trong summary phải là `ok`, hoặc lỗi được ghi vào giới hạn trước khi diễn giải bảng proxy.

Sau khi compute chính xong, chạy lệnh dưới bằng `tools.bash`, kiểm tra thành công rồi đọc `proxy.md` bằng `tools.read`:

```bash
uv run -q --with pandas --with numpy python .pi/skills/stock/stock-analysis/scripts/proxy_sectors.py stock-reports/REE-2026-11-15
```

## Compute

Gọi `tools.bash` với lệnh trong bước 2 của SKILL.md. `run_pipeline.sh` dùng `uv` để compute/vẽ chart mà không cài dependency toàn cục. Đọc stdout và kiểm tra đủ `metrics.json`, `tables.md`, 9 PNG trong `charts/`. Runner shell hiện có có thể che exit status của chart, nên số file thực tế là tiêu chí hoàn tất.

## Look

Đọc toàn bộ `tables.md` bằng `tools.read`. Mở từng PNG bằng `image(await tools.read({path}))`, dùng tên file thực tế trong `charts/`.

**Xong khi:** đã đọc bảng, xem đủ 9 ảnh và ghi một quan sát cho mỗi ảnh; quay lại bước 3 của SKILL.md để kiểm chứng sự kiện tài chính.
