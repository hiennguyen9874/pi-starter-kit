# sstock MCP — tham chiếu tool

Server `sstock` (`https://api.sstock.vn/api/v1/mcp`) đi qua codemode: tên tool là `tools.mcp__sstock__<tool>`. Kết quả là một `CallToolResult`, dữ liệu là JSON nằm trong `content[0].text`, và phải kiểm tra `isError`. Mô tả đầy đủ của từng tool lấy bằng `await describeTool("mcp__sstock__<tool>")`; file này chỉ ghi lại những điều mà mô tả tool không nói rõ hoặc dễ bị bỏ qua.

## Giới hạn gói & rate-limit

- **30 lần gọi/phút, 1.000 lần/24 giờ**. Vượt ngưỡng thì codemode throw `MCP HTTP request failed with status 429 … Thử lại sau N giây`. Codemode không có timer, nên muốn chờ thì dùng `tools.bash({command:"sleep N"})` (`fetch_stock.js` đã làm sẵn việc này).
- **Chỉ admin mới gọi được**, gói thường nhận `isError` "không có trong gói hiện tại": `get_financial_periods`, `get_financial_report`, `get_financial_metric_trend`, `search_data_series`, `get_data_series_values`, `get_macro_derived_series`, và 2 chart dự phóng `priceForecast`/`profitForecast` của `get_stock_valuation`. Không retry, không tìm đường khác để lấy cùng dữ liệu đó. Thay vào đó dùng `get_stock_fa_*` / `get_sector_fa`.
- Trường `note` trong kết quả nghĩa là cửa sổ dữ liệu đã bị cắt theo gói (S1: BCTC 17 quý hoặc từ 2018 theo năm; giá và dòng tiền chủ động 3 năm; định giá thị trường từ 2016). Trong báo cáo phải ghi "khoảng dữ liệu ngắn hơn", không ghi "thiếu dữ liệu".

## Danh mục (20 tool dùng được ở gói thường)

| Nhóm | Tool | Tham số chính | Ghi chú |
|---|---|---|---|
| Công ty | `get_company_tool` | `symbol` (3 ký tự) | trả về `sector_id` và `sectorName` |
| Giá | `get_price_history` | `symbol`, `limit≤250`, `from`/`to` | `symbol:"VNINDEX"` cho chỉ số; muốn lấy dài hơn thì phân trang bằng `to` = ngày cũ nhất − 1 |
| Dòng tiền | `get_active_flow` | như trên | mua/bán chủ động, chỉ khớp lệnh, chỉ có giá trị (không có khối lượng) |
| FA mã | `get_stock_fa_nonfinancial / _bank / _securities / _insurance` | `symbol`, `unit` Q/Y, `periods≤40`, `charts` | gọi sai cấu trúc thì nhận lỗi `wrong_structure` |
| FA ngành | `get_sector_fa` | `sector` (tên hoặc id), `unit`, `from`/`to` | số liệu = tổng toàn ngành, tỷ lệ = tỷ lệ của tổng |
| Ngành | `get_sector_companies` | `sector` | rổ ĐẦY ĐỦ kèm vốn hóa (tỷ); trường `structure` cho biết loại BCTC của ngành |
| RRG | `get_sector_rrg` | `tailLength≤13`, `asOf`, `observationWeek` | 42 ngành |
| RRG | `get_stock_rrg` | **bắt buộc** `symbols[]` (≤50) hoặc `sectorId` | gọi theo `sectorId` trả thêm `rs3D5/rs6D5/close/netForeign20/inElite/entryStreak` |
| Sức mạnh | `get_power_scores` | `symbol`, `sessions≤1250`, `rsType` RS6M/RS3M | chuỗi điểm của cả mã và ngành |
| Elite | `get_elite_stocks` | `status` open/closed/all, `sectorId`, `fromDate`, `limit≤100`, `offset` | chỉ liệt kê các episode; dữ liệu nhiều thì phân trang theo `hasMore` |
| Elite | `get_elite_diagnostic` | `symbol`, `asOf` | giải thích chính xác trụ nào đạt, guard nào chặn |
| Thị trường | `get_market_state` | `sessions` hoặc `from`/`to`, `includeTransitions` | uptrend / pressure / downtrend |
| Thị trường | `get_market_sentiment`, `get_money_flow_diffusion` | `includeSeries`, `from`/`to` | đồng hồ 0-100 kèm mốc so sánh ngày/tuần/tháng |
| Định giá | `get_market_valuation` | `basket`, `resolution` | `summary` chứa P/E, P/B hiện tại và TB 3 năm |
| Định giá | `get_sector_valuation` | bỏ `sectorId` thì lấy tất cả ngành; có `sectorId` thì lấy lịch sử | |
| Định giá | `get_stock_valuation` | `symbol`, `charts`, `resolution`, `from` | `snapshot` gồm pe/pb/eps/roe/roa; thêm peSstock |

## Đơn vị

| Nguồn | Đơn vị |
|---|---|
| Giá, MA trong `get_price_history` | nghìn đồng (21.05 = 21.050 đ) |
| `*Value`, `foreign*Value`, `marketCap` (giá, định giá mã), `gtgdAvg20`, `buy/sell/net` của dòng tiền chủ động | đồng (chia 1e9 để ra tỷ) |
| Mọi tool FA (mã và ngành), `get_sector_companies.marketCap`, `get_market_valuation.series.marketCap` | tỷ đồng |
| `get_sector_valuation.marketCap` | đồng (dù mô tả tool ghi là tỷ, cần kiểm tra lại độ lớn) |
| `*Pct` | % ; `eps4Q/bvps` tính theo đồng/cp |
| `netForeign20` trong `get_stock_rrg` | tỷ đồng |

## Thứ tự trục (dễ nhầm)

- **Cũ → mới:** `periods` của FA, `dates` của `get_stock_valuation` và `get_market_valuation`.
- **Mới → cũ:** `rows` của giá và dòng tiền chủ động, `get_power_scores`, `series` của sentiment/diffusion, `recent` của market_state, `history` của sector_valuation.
- `tail[]` của RRG có `weeksAgo`, cần sort trước khi vẽ quỹ đạo.

## Gotcha dữ liệu đã gặp

- **P/E TB 3 năm bị méo** ở cổ phiếu chu kỳ (HPG 2023: P/E vọt trên 200 vì lợi nhuận đáy, khiến `avg3YPe` = 18,9 trong khi trung vị là 8,9). Nên dùng trung vị P/E dương và P/B. `analyze.py` tự gắn cờ `avg3Y_distorted`.
- **`peSstock`/`pbSstock` bị giữ nguyên** từ `peSstockLastComputableDate` (cần BCTC của 2 quý tương lai), nên không phản ánh giá hôm nay. Khi trích dẫn phải ghi rõ giữ nguyên từ ngày nào.
- **Chuỗi toàn số 0**: `profitPerformance` của SSI trả ROE/ROA = 0 ở mọi kỳ. `analyze.py` gắn cờ `suspect` và dùng `snapshot.roe` thay thế. Gặp chuỗi 0 phẳng thì coi là lỗi nguồn, không phải số thật.
- `get_stock_rrg` / `get_sector_rrg` chỉ chứa các mã mà engine theo dõi (một tập con, mặc định bỏ Tier-3 thanh khoản thấp). Muốn có danh sách ngành đầy đủ thì dùng `get_sector_companies`.
- `get_elite_stocks` chỉ liệt kê các mã đã hoặc đang là Elite. Mã không xuất hiện không có nghĩa là bị guard chặn; muốn biết lý do thì dùng `get_elite_diagnostic`.
- Sentiment/diffusion: `band` của đồng hồ và `band` của ô so sánh dùng hai bộ ngưỡng khác nhau. So sánh thì dùng `change`/`direction`, đừng so tên band.
- `totalValue/totalVolume` trong giá là số tổng do sở công bố; trích nguyên số đó, không tự cộng khớp lệnh với thỏa thuận.
- `get_price_history` trả cả giá gốc (`close`) lẫn `adjClose`. Chỉ báo kỹ thuật dùng `adjClose`, còn mức giá hiển thị cho người dùng dùng `close`.
- MCP có thể trả dữ liệu vượt mốc kiến thức của model (ví dụ năm 2026). Tin vào `asOf` của dữ liệu, không tự "sửa" ngày.

## Các job của fetch_stock.js

`company, sector_companies` (phase 1), sau đó `fa_q, fa_y, valuation_1m, valuation_1d, price` (3 trang), `vnindex` (3 trang), `active_flow` (2 trang), `power_rs6, power_rs3, stock_rrg, peers_rrg, elite_diag, elite_sector, sector_rrg, sector_fa, sector_val_all, sector_val_hist, market_state, market_sentiment, money_diffusion, market_val`. Mỗi file `raw/<job>.json` có dạng `{tool, args, isError, data}`.
