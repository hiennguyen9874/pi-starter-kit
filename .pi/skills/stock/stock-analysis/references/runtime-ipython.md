# Runtime ipython

Đọc file này khi có tool `ipython`. Fetch dùng Python thuần, top-level `await`, bridge `pi` và `bash()`. Script fetch chạy **trong kernel** để nhận `pi`; compute chạy trong môi trường `uv` bên ngoài kernel.

Ví dụ bắt đầu ở thư mục gốc repo. Nếu cwd khác, dùng đường dẫn tuyệt đối tới skill đã load. `workdir` tính từ cwd; giữ cùng một đường dẫn cho toàn bộ báo cáo.

## Fetch một mã

Khởi tạo một lần trong kernel; dùng lại `client` cho fetch mã, retry và ngành proxy để chia sẻ ngân sách rate-limit. Chờ task trước hoàn tất rồi mới khởi chạy task kế tiếp:

```python
import asyncio
import sys
from datetime import date
from pathlib import Path

skill_dir = Path(".pi/skills/stock/stock-analysis").resolve()
sys.path.insert(0, str(skill_dir / "scripts"))
from sstock_fetch import SStockClient
from fetch_stock import fetch_stock

symbol = "HPG"
workdir = (Path("stock-reports") / f"{symbol}-{date.today().isoformat()}").resolve()
client = SStockClient(pi, per_min=25)
fetch_task = asyncio.create_task(fetch_stock(client, symbol, workdir))
print("Fetch started; poll fetch_task in a later cell.")
```

Fetch có thể lâu hơn một lượt tool. Poll ở cell sau; kết quả/lỗi được giữ trong task:

```python
if fetch_task.done():
    fetch_summary = fetch_task.result()
    print(fetch_summary)
else:
    print("Still fetching; poll again in a later cell.")
```

Chỉ sang compute khi task đã kết thúc và `failed` đã được xử lý. Client dùng `await pi.describe(name)` trước lần gọi đầu tiên, lưu mô tả trong `client.descriptions`, gọi `await pi.tool(name, args)`, chờ bằng `asyncio.sleep`. Bridge có thể trả chuỗi khi tool không khai báo output schema; `sstock_fetch.py` xử lý chuỗi JSON, MCP envelope (`structuredContent` hoặc `content[].text`) và lỗi `pi.ToolError.result`. Đọc schema/guidelines trước khi thêm lời gọi ngoài pipeline. Với lời gọi ad-hoc, tìm tên bằng `await pi.search("sstock <tool>")`, đọc `await pi.describe(name)` rồi mới `await pi.tool(name, args)`.

Retry job cụ thể bằng cùng client (poll `fetch_task` như trên):

```python
fetch_task = asyncio.create_task(fetch_stock(client, symbol, workdir, only=["fa_q"]))
```

`price_years=3` là số trang giá (250 phiên/trang). Python checkpoint `manifest.json` sau mỗi job và giữ trạng thái các job không được chọn khi retry. Nếu trang sau lỗi, các dòng đã lấy vẫn dùng được, nhưng job xuất hiện trong `failed` và cảnh báo `Partial fetch` được ghi vào `note`. Lỗi identity/structure dừng fetch để tránh chọn sai BCTC.

Đọc/ghi JSON, markdown bằng `Path.read_text(encoding="utf-8")` / `Path.write_text(..., encoding="utf-8")`. Kernel giữ biến/import qua các cell; sau khi sửa script, reload module liên quan hoặc khởi động lại kernel trước khi kiểm chứng bản mới.


## Ngành proxy

Chạy khi cần benchmark theo mảng, với ID theo [conglomerate-power.md](conglomerate-power.md#ngành-proxy-chạy-ngay-sau-bước-2). Dùng lại `client` và `workdir` sau khi fetch mã hoàn tất:

```python
from fetch_proxy import fetch_proxy
proxy_task = asyncio.create_task(fetch_proxy(client, workdir, [13, 26, 32]))
```

Poll `proxy_task` như `fetch_task`. Mỗi giá trị trong summary phải là `ok`, hoặc lỗi được ghi vào giới hạn trước khi diễn giải bảng proxy. Output: `raw/proxy_<id>.json` với bốn khóa `rrg`, `val`, `fa`, `companies`.

Sau khi compute chính xong, tính bảng proxy qua `bash()`:

```python
proxy_pipeline = bash(
    f"uv run -q --with pandas --with numpy python "
    f"{shlex.quote(str(skill_dir / 'scripts/proxy_sectors.py'))} {shlex.quote(str(workdir))}",
    timeout=600,
)
```

Lấy kết quả ở cell sau bằng `await proxy_pipeline`, kiểm tra `exit_code == 0`, rồi đọc `(workdir / "proxy.md").read_text(encoding="utf-8")`.

## Compute

`run_pipeline.sh` compute/vẽ chart bằng `uv`; pandas/numpy/matplotlib/seaborn nằm ngoài kernel.

```python
import shlex
pipeline = bash(f"{shlex.quote(str(skill_dir / 'scripts/run_pipeline.sh'))} {shlex.quote(str(workdir))}", timeout=600)
```

Ở cell sau, lấy kết quả (có thể poll `pipeline.running` trước):

```python
result = await pipeline
print(result.output)
if result.exit_code != 0:
    raise RuntimeError(f"Pipeline failed: {result.exit_code}")
required = [workdir / "metrics.json", workdir / "tables.md"]
missing = [str(path) for path in required if not path.is_file()]
charts = sorted((workdir / "charts").glob("[0-9][0-9]_*.png"))
if missing or len(charts) != 9:
    raise RuntimeError(f"Incomplete output: missing={missing}, charts={len(charts)}/9")
print((workdir / "tables.md").read_text(encoding="utf-8"))
```


Runner shell hiện có có thể che exit status của chart; vì vậy kiểm tra đủ file như trên là tiêu chí hoàn tất, không chỉ exit code.

## Look

phát từng PNG ra output để xem bằng mắt, không chỉ in đường dẫn:

```python
import base64
from rlm.repl import emit

chart_path = charts[0]  # lặp lại với từng chart sau khi ghi quan sát
emit({"image/png": base64.b64encode(chart_path.read_bytes()).decode("ascii")})
```


**Xong khi:** đã đọc bảng, xem đủ 9 ảnh và ghi một quan sát cho mỗi ảnh; quay lại bước 3 của SKILL.md để kiểm chứng sự kiện tài chính.
