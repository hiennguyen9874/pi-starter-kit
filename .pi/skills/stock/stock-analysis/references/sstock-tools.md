# sstock MCP — tham chiếu tool

Server `sstock` (`https://api.sstock.vn/api/v1/mcp`) có tên tool `mcp__sstock__<tool>`. Cách đọc schema/guidelines và gọi tool: xem [runtime-ipython.md](runtime-ipython.md) khi có tool `ipython`, hoặc [runtime-codemode.md](runtime-codemode.md) khi dùng codemode; chỉ đọc file khớp runtime.

Kết quả MCP là `CallToolResult`: kiểm tra `isError`, ưu tiên `structuredContent` khi có, còn lại parse JSON trong các block `content[].text`. File này ghi lại những điều mô tả tool không nói rõ hoặc dễ bị bỏ qua.

## Giới hạn gói & rate-limit

- **30 lần gọi/phút, 1.000 lần/24 giờ**. Vượt ngưỡng có thể throw lỗi HTTP 429 hoặc trả `isError` kèm rate-limit. Các fetcher tự throttle/retry; chạy các fetch tuần tự và giữ chung ngân sách theo hướng dẫn runtime. Lời gọi thủ công hoặc runtime khác vẫn dùng cùng hạn mức server.
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

- **P/E TB 3 năm bị méo** ở cổ phiếu chu kỳ (HPG 2023: P/E vọt trên 200 vì lợi nhuận đáy, khiến `avg3YPe` = 18,9 trong khi trung vị là 8,9). Nên dùng trung vị P/E dương và P/B. `analyze.py` tự gắn cờ `avg3Y_distorted` cho cả P/E và P/B. Có năm lỗ trong cửa sổ 3 năm thì `avg3YPe` có thể âm (FRT: -8,88 do lỗ 2023); giá trị ≤ 0 cũng bị gắn cờ và `at_pe_avg3Y` bị bỏ.
- **Khối P/B ngoại lai do lỗi nguồn**: IDC năm 2023 có P/B 13–27 trong 12 tháng liền, trong khi các tháng xung quanh ở mức 2–3 (ROE, giá đều không giải thích được). Biểu đồ `07_valuation.png` hiện thành một bậc nhảy vọt rồi đứt. `analyze.py` liệt kê các tháng > 3× trung vị 10N trong `valuation.pb.outlier_months` và bỏ `at_pb_avg3Y` khi TB 3 năm bị méo. Min–max và percentile 10N vẫn chứa các tháng này. Ngược lại, P/B cao ngay sau một năm lỗ có thể là thật vì VCSH co lại (FRT 2024: P/B 15–18 trên VCSH cty mẹ ~1.900 tỷ sau khoản lỗ 2023). Khi có năm lỗ quanh khối ngoại lai, cảnh báo trong `tables.md` nêu cả hai cách đọc; đối chiếu VCSH theo năm trước khi gọi là lỗi nguồn.
- **`cashBank` gồm cả tiền gửi có kỳ hạn**, còn `cashEndOfPeriod` (chart `cashFlow`) chỉ là tiền và tương đương tiền. FRT Q3/26: 11.784 so với 511 tỷ, và `finInvest` = 0. Gửi tiền có kỳ hạn hiện thành LCTT đầu tư âm (FRT 4Q: -5.958 tỷ trong khi TSCĐ+XDCB chỉ +100 tỷ), làm FCF TTM trông âm sâu. `analyze.py` in dòng "cashBank … tiền cuối kỳ LCTT" trong "Sự kiện bảng cân đối" khi chênh lệch ≥ 30% cashBank và ≥ 5% tổng TS.
- **`financialProfit` (phi tài chính) là số ròng và gồm cả lãi công ty liên kết:** EBT = `operatingProfit` + `financialProfit` + `otherProfit`, với `operatingProfit` = lãi gộp − bán hàng − quản lý (REE Q3/26: 855 + 232 − 2 = 1.085 = `ebt`). sstock không có dòng lãi liên kết riêng, nên với holding (REE, các công ty mẹ ngành điện/nước) chuỗi này là lợi nhuận định kỳ chứ không phải lợi nhuận một lần.
- **`peSstock`/`pbSstock` bị giữ nguyên** từ `peSstockLastComputableDate` (cần BCTC của 2 quý tương lai), nên không phản ánh giá hôm nay. Khi trích dẫn phải ghi rõ giữ nguyên từ ngày nào.
- **`*TTMPct` theo năm bị lỗi**: với `fa_y` ngân hàng, `roeTTMPct`/`roaTTMPct` ≈ 4× `roePct`/`roaPct` (TCB: 59–83% so với 15–22%), trong khi bản theo quý vẫn đúng. `sstock_lib.bogus_annual_ttm` phát hiện lỗi này, `charts.py` bỏ chuỗi lỗi khỏi `06_fa_annual.png`, và `tables.md` in cảnh báo. Dùng chuỗi `*Pct`.
- **Chuỗi toàn số 0**: `profitPerformance` của SSI trả ROE/ROA = 0 ở mọi kỳ. `analyze.py` gắn cờ `suspect` và dùng `snapshot.roe` thay thế; với securities có thêm `roeTTMDerivedPct` để đối chiếu. `depreciation` (chart `costStructure`) theo quý của SZC = 0 ở mọi kỳ trong khi `fa_y` vẫn có khấu hao đến 2024, nên `ebitda` = `ebit`; `tables.md` in cảnh báo này cho phi tài chính. Gặp chuỗi 0 phẳng thì coi là lỗi nguồn, không phải số thật.
- `get_stock_rrg` / `get_sector_rrg` chỉ chứa các mã mà engine theo dõi (một tập con, mặc định bỏ Tier-3 thanh khoản thấp). Muốn có danh sách ngành đầy đủ thì dùng `get_sector_companies`.
- `get_elite_stocks` chỉ liệt kê các mã đã hoặc đang là Elite. Mã không xuất hiện không có nghĩa là bị guard chặn; muốn biết lý do thì dùng `get_elite_diagnostic`.
- Sentiment/diffusion: `band` của đồng hồ và `band` của ô so sánh dùng hai bộ ngưỡng khác nhau. So sánh thì dùng `change`/`direction`, đừng so tên band.
- `totalValue/totalVolume` trong giá là số tổng do sở công bố; trích nguyên số đó, không tự cộng khớp lệnh với thỏa thuận. Một phiên thỏa thuận lớn (IDC 2026-10-05: 551 tỷ, gấp ~17 lần một phiên thường) thổi phồng TB20/TB60 trong 20–60 phiên sau đó. `tables.md` in thêm TB20 khớp lệnh (`avg_matched_20_bil`, cùng gốc với `gtgdAvg20` của Elite) và cảnh báo khi thỏa thuận ≥ 20% GTGD 60 phiên.
- `marketCap` trong `rows` của giá có thể là `null` ở mọi phiên (IDC). `analyze.py` lấy vốn hóa từ `get_sector_companies` thay thế và ghi nguồn bên cạnh.
- `get_price_history` trả cả giá gốc (`open/high/low/close`) lẫn `adjClose`. Chỉ báo kỹ thuật dùng `adjClose`, còn mức giá hiển thị cho người dùng dùng `close`. Script ad-hoc tính đỉnh/đáy bằng `high/low` thì phải nhân với `adjClose/close` (TCB: `high` 52 tuần là 38,2, giá gốc trước đợt thưởng; giá điều chỉnh là 24,83).
- **Sự kiện quyền** (cổ phiếu thưởng, cổ tức bằng cổ phiếu, chia tách): tại ngày GDKHQ, `close` gãy hơn 10% giữa hai phiên trong khi `adjClose` vẫn liên tục (SSI 14/08→17/08/2026: 24,5 → 19,8). `analyze.py` liệt kê các ngày này ở mục "Sự kiện quyền" trong `tables.md` (hệ số = close/adjClose phiên trước ÷ phiên GDKHQ). Hệ số dưới 1,1 không tự phân biệt được cổ tức CP nhỏ với cổ tức tiền (FRT 2026-06-29: cổ tức CP 5% in ra 1,0499). Khi vốn điều lệ tăng đúng tỷ lệ đó trong cùng quý hoặc quý kế tiếp, dòng sự kiện được gán lại thành "cổ tức CP/thưởng ~x% (khớp vốn điều lệ …)". Ngược lại, hệ số ≥1,1 chưa chắc là thưởng: **quyền mua** cho hệ số nhỏ hơn mức tăng vốn (SZC 2024-01-05: hệ số 1,219 với vốn +48,7%, LCTT tài chính +1.174 tỷ). Khi vốn tăng không khớp chuyển từ LNGPP, hệ số − 1 < 0,8 × mức tăng và LCTT tài chính quý ≥ 50% phần vốn tăng, dòng được gán lại thành "phát hành quyền mua ~x% giá ước ~S" (S suy từ TERP: P/k = (P + r·S)/(1+r)). Các dòng vốn điều lệ được xét trên mọi quý có dữ liệu, không chỉ 8 quý. Nhãn cổ tức tiền kèm "~X đ/cp" = giá phiên trước × (1 − 1/hệ số). Nếu số CP lưu hành của snapshot định giá lệch vốn điều lệ BCTC/10.000 thì có thêm cảnh báo: BCTC chưa cập nhật, còn EPS đã tính theo số CP mới. Đối chiếu với vốn góp/vốn điều lệ tăng trong FA. Mọi mức giá lịch sử trước ngày đó lấy theo `adjClose` để so sánh được với giá hiện tại. Lưu ý `rows` sắp xếp mới → cũ: sort theo `date` trước khi so phiên liền kề.
- MCP có thể trả dữ liệu vượt mốc kiến thức của model (ví dụ năm 2026). Tin vào `asOf` của dữ liệu, không tự "sửa" ngày.

## Các job của fetch_stock.py / fetch_stock.js

`company, sector_companies` (phase 1), sau đó `fa_q, fa_y, valuation_1m, valuation_1d, price` (3 trang), `vnindex` (3 trang), `active_flow` (2 trang), `power_rs6, power_rs3, stock_rrg, peers_rrg, elite_diag, elite_sector, sector_rrg, sector_fa, sector_val_all, sector_val_hist, market_state, market_sentiment, money_diffusion, market_val`. Mỗi file `raw/<job>.json` có dạng `{tool, args, isError, data}`. `fetch_proxy.py` / `fetch_proxy.js` (tùy chọn, xem conglomerate-power.md) ghi thêm `raw/proxy_<sectorId>.json` gồm `{rrg, val, fa, companies}`. Pipeline chính không đọc file này.
