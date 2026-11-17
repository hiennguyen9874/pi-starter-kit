---
name: stock-analysis
description: Phân tích toàn diện một cổ phiếu Việt Nam bằng MCP sstock (thị trường, ngành, BCTC, định giá, kỹ thuật, dòng tiền/smart-money) kèm script Python vẽ biểu đồ và báo cáo markdown. Dùng khi người dùng yêu cầu phân tích/đánh giá một mã cổ phiếu (VD "phân tích HPG", "TCB có đáng mua", "đánh giá SSI").
---

# Phân tích cổ phiếu với sstock

Pipeline có 4 tầng: **fetch** (ipython hoặc codemode gọi MCP rồi ghi JSON thô) → **compute** (Python tính metrics, scorecard, bảng) → **look** (đọc bảng và xem từng biểu đồ) → **write** (báo cáo theo template). Mọi nhận định trong báo cáo phải là **evidence**: có con số, có ngày, có nguồn.

Tham chiếu dùng khi cần:
- **ipython:** khi có tool `ipython`, đọc [references/runtime-ipython.md](references/runtime-ipython.md) trước bước 1: fetch Python qua `pi`, điều phối compute và phát PNG từ kernel.
- **codemode:** khi dùng codemode, đọc [references/runtime-codemode.md](references/runtime-codemode.md) trước bước 1: fetch JavaScript qua `tools`, chạy compute và xem PNG. Chỉ đọc file khớp runtime đang dùng.
- [references/sstock-tools.md](references/sstock-tools.md): 26 tool, đơn vị, thứ tự trục, giới hạn gói/rate-limit, các gotcha dữ liệu. Đọc khi gọi tool ngoài pipeline hoặc khi một số liệu trông bất thường.
- [references/analysis-framework.md](references/analysis-framework.md): cách đọc từng khía cạnh, KPI và ngưỡng theo 4 cấu trúc BCTC (phi tài chính / ngân hàng / chứng khoán / bảo hiểm), cách diễn giải scorecard. Đọc trước bước 4.
- [references/securities.md](references/securities.md): đọc trước bước 3 khi `structure` = securities (công ty chứng khoán). Gồm lợi nhuận theo mảng và chi phí không phân bổ, NIM/COF, nền cao theo chu kỳ, phân loại sự kiện tăng vốn, nguồn vốn/tự doanh/đòn bẩy, P/B đi cùng ROE.
- **Ngân hàng** (`structure = bank`): đọc [references/banking.md](references/banking.md) và [references/banking-checks.md](references/banking-checks.md) trước bước 3. File đầu là khung phân tích; file sau kiểm chứng số dư/chi phí dự phòng, NPL cuối năm, độ nhạy LLR, khoản mục tổng hợp, sự kiện quyền lệch nguồn và override điểm.
- [references/industrial-park.md](references/industrial-park.md): đọc trước bước 3 khi ngành là Khu công nghiệp (sectorId 4). Gồm doanh thu ghi nhận theo đợt (lumpy), quỹ đất trên bảng cân đối, phân loại lại XDCB/tồn kho, định giá khi không có RNAV.
- [references/retail.md](references/retail.md): đọc trước bước 3 khi ngành là Bán lẻ (sectorId 1). Gồm đòn bẩy hoạt động (chi phí bán hàng/doanh thu), tồn kho và vốn lưu động, LCTT đầu tư là gửi tiền hay capex, ROE theo đòn bẩy, EV/EBITDA.
- [references/conglomerate-power.md](references/conglomerate-power.md): đọc trước bước 3 khi ngành là Đa ngành (sectorId 5555), Điện (13), Nước (26) hoặc Thiết bị điện & điện tử (32), hoặc khi doanh nghiệp ở ngành khác nhưng có mảng điện/M&E lớn. Gồm ngành proxy theo mảng (`fetch_proxy.py` / `fetch_proxy.js` + `proxy_sectors.py`), lãi liên kết nằm trong `financialProfit`, thủy văn và capex nguồn điện, backlog M&E/thiết bị, P/E sau tái định giá.
- [templates/report.md](templates/report.md) là khung báo cáo; [examples/HPG-report.md](examples/HPG-report.md) là một báo cáo mẫu hoàn chỉnh.

Đường dẫn script tính từ thư mục skill này: `.pi/skills/stock/stock-analysis/scripts/`.

## Bước 1 — Fetch dữ liệu thô

Workdir mặc định: `stock-reports/<MÃ>-<YYYY-MM-DD>/` (tính từ cwd). Dùng mục **Fetch một mã** trong file runtime đã chọn ở trên. Cả hai ghi cùng định dạng raw cho bước 2; chỉ chạy một fetcher cho mỗi lượt lấy dữ liệu. Fetcher tự throttle ở 25 lần gọi/phút và retry khi gặp 429. Một mã tốn khoảng 27 lần gọi MCP và khoảng 60 giây.

Kết quả gồm `structure` (nonfinancial | bank | securities | insurance), `failed` và `notes` (giới hạn gói). Tên job trong `manifest.json`; cách retry và giới hạn manifest nằm trong file runtime đã chọn. Giữ các lỗi/notes từ lượt đầu để báo cáo đủ giới hạn.

**Xong khi:** `failed` rỗng, hoặc mỗi job lỗi đã được retry một lần và lỗi còn lại được ghi vào phần giới hạn của báo cáo. Lỗi "không có trong gói" là cố định, không retry.

## Bước 2 — Compute và vẽ biểu đồ

```bash
.pi/skills/stock/stock-analysis/scripts/run_pipeline.sh stock-reports/HPG-2026-11-14
```

Thực thi và kiểm tra output theo mục **Compute** trong file runtime đã chọn.

Lệnh này dùng `uv run --with pandas numpy matplotlib seaborn`, không cài gì ra global. Output:
- `metrics.json`: toàn bộ chỉ số (price, flows, rs, elite, fa, valuation, sector, peers, market, signals).
- `tables.md`: các bảng markdown dựng sẵn, gồm scorecard và cảnh báo dữ liệu.
- `charts/01…09_*.png`: giá & kỹ thuật, sức mạnh tương đối, dòng tiền, FA chính, dashboard FA, FA theo năm, định giá, RRG, thị trường.

**Xong khi:** đủ 2 file và 9 PNG, dòng cuối stdout in ra score và verdict.

## Bước 3 — Look: đọc bảng và từng biểu đồ

1. Đọc toàn bộ `tables.md`. Chú ý các khối `> ⚠️` (giới hạn gói, chuỗi số 0 nghi lỗi, P/E/P/B TB 3 năm bị méo, tháng P/B ngoại lai, GTGD bị giao dịch thỏa thuận thổi phồng).
2. Mở **từng** PNG theo mục **Look** trong file runtime đã chọn. Với mỗi biểu đồ, ghi một quan sát mà bảng số không cho thấy: điểm gãy xu hướng, biến động bất thường của một chỉ tiêu, quỹ đạo RRG, vùng nền giá, giai đoạn khối ngoại đảo chiều.
3. Giải thích mọi bước nhảy lớn trong FA bằng chính dữ liệu. Với mọi mã, đọc "Sự kiện quyền" ở mục Giá: hệ số ≥1,1, hoặc dòng có đuôi "khớp vốn điều lệ", là cổ phiếu thưởng/cổ tức CP/chia tách; dòng ghi "phát hành quyền mua" (nhãn này thắng ngưỡng hệ số) là tăng vốn có tiền mới. Cả hai loại đều buộc mọi mức giá trước ngày GDKHQ lấy theo `adjClose`. Với ngân hàng, bắt đầu từ "Sự kiện ngân hàng". Với phi tài chính, bắt đầu từ danh sách "Sự kiện bảng cân đối" trong `tables.md`: XDCB dở dang chuyển sang TSCĐ là nhà máy mới đi vào vận hành, chuyển sang hàng tồn kho là quỹ đất/BĐS chuyển sang để bán (dòng đuôi "(năm)" là lần chuyển trước cửa sổ 17 quý, giải thích nền tồn kho/TSCĐ hiện tại); vốn điều lệ tăng khớp với phần LNGPP giảm, hoặc có đuôi "khớp sự kiện quyền" (đuôi này thắng gợi ý LNGPP), là cổ tức bằng cổ phiếu (pha loãng, không có tiền mới); `financialProfit` đột biến là lợi nhuận một lần (riêng holding có công ty liên kết lớn thì chuỗi này gồm cả lãi liên kết định kỳ, xem sstock-tools); dòng lợi ích CĐ thiểu số là thay đổi sở hữu ở công ty con; dòng "cashBank … tiền cuối kỳ LCTT" là tiền gửi có kỳ hạn, giải thích LCTT đầu tư âm khi TSCĐ không tăng. Khi lợi nhuận quý dao động mạnh, đọc dòng "Lũy kế năm so với cùng kỳ" trước khi kết luận về tăng trưởng.

**Xong khi:** đủ 9 quan sát (mỗi biểu đồ một), mỗi dòng "Sự kiện bảng cân đối"/"Sự kiện ngân hàng"/"Sự kiện quyền" (12 tháng gần nhất) và mỗi bất thường khác trong FA đều đã có lời giải thích hoặc được đánh dấu "chưa rõ, cần tin doanh nghiệp".

## Bước 4 — Đào sâu (tùy theo từng mã)

Gọi thêm tool khi câu hỏi hoặc dữ liệu cần đến. Mỗi trường hợp dưới đây là một nhánh riêng:
- Muốn biết tại sao mã chưa phải Elite, hoặc guard nào đang chặn: xem `raw/elite_diag.json`, tuyệt đối không suy đoán.
- So sánh với một thời điểm trong quá khứ: `get_stock_rrg` hoặc `get_sector_rrg` với `asOf`, `get_market_state` với `from`/`to`.
- Cần FA theo năm cho ngân hàng (cơ cấu cho vay theo ngành / loại hình): đọc thêm chart `loanStructureBySector` trong `raw/fa_y.json`.
- Cần dữ liệu hàng hóa hoặc vĩ mô (giá thép, quặng…): `search_data_series` chỉ dành cho admin. Gói thường bị từ chối thì ghi vào phần giới hạn.
- Muốn phân tích thêm bằng Python: lưu script ad-hoc trong workdir và chạy qua runner của runtime bằng `uv run -q --with pandas --with numpy python <script>.py` (giữ dependency phân tích trong môi trường `uv`, không cài vào kernel). Loader nhận payload chứ không nhận `Work`:
  ```python
  import sys; sys.path.insert(0, "../../.pi/skills/stock/stock-analysis/scripts")  # từ stock-reports/<MÃ>-<ngày>/
  from sstock_lib import Work, price_frame, fa_frames, fa_series
  w = Work(".")
  px = price_frame(w.load("price"))  # index ngày cũ → mới; có matchedValue / putThroughValue
  fq = fa_frames(w.load("fa_q"))      # {chartId: DataFrame}; fa_series(fq, "inventory")
  ```

## Bước 5 — Viết báo cáo

Copy [templates/report.md](templates/report.md) thành `<workdir>/report.md` rồi điền vào. Mức độ chi tiết tham khảo [examples/HPG-report.md](examples/HPG-report.md). Quy tắc:
- Mọi con số lấy từ `tables.md`/`metrics.json`/raw và ghi rõ `asOf`. Tiền trình bày theo tỷ đồng, giá theo nghìn đồng.
- Kết luận dựa trên **ma trận hai trục** (Cơ bản & định giá × Kỹ thuật & dòng tiền) cùng với bối cảnh, như mô tả trong analysis-framework. Scorecard là điểm khởi đầu; được phép override nhưng phải ghi lý do.
- Kịch bản phải gắn với mức giá và điều kiện kiểm chứng được (MA200, đỉnh/đáy 52 tuần, ngưỡng RS ≥ 80/60 của Elite, GTGD so với TB20; dùng TB20 khớp lệnh khi `tables.md` cảnh báo giao dịch thỏa thuận).
- Ghi đủ các caveat: giới hạn gói, chuỗi dữ liệu nghi lỗi, P/E SSTOCK bị giữ nguyên từ ngày nào, P/E/P/B TB 3 năm bị méo.
- Kết thúc bằng câu "không phải khuyến nghị đầu tư".

**Xong khi:** đủ 10 mục của template, mỗi biểu đồ được nhúng vào đúng mục, không có placeholder `{…}` nào sót lại. Trả lời người dùng bằng phần Tóm tắt kèm đường dẫn `report.md` và `charts/`.
