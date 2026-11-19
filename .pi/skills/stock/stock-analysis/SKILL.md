---
name: stock-analysis
description: Phân tích toàn diện một cổ phiếu Việt Nam bằng MCP sstock (thị trường, ngành, BCTC, định giá, kỹ thuật, dòng tiền/smart-money) kèm script Python vẽ biểu đồ và báo cáo markdown. Dùng khi người dùng yêu cầu phân tích/đánh giá một mã cổ phiếu (VD "phân tích HPG", "TCB có đáng mua", "đánh giá SSI").
---

# Phân tích cổ phiếu với sstock

Chạy **fetch → compute → look → đào sâu khi cần → write**. Mỗi nhận định có số, kỳ và nguồn; tách quan sát, giả thuyết và điều kiện xác nhận.

## 1. Fetch

Chọn đúng một runtime: [ipython](references/runtime-ipython.md) khi có `ipython`, hoặc [codemode](references/runtime-codemode.md) khi dùng `tools`. Theo mục **Fetch một mã** để lấy `structure`, `sectorId`, raw và `manifest.json` vào `stock-reports/<MÃ>-<YYYY-MM-DD>/`. Giữ notes/lỗi qua các lượt retry. Khi gọi MCP ngoài pipeline hoặc gặp số bất thường, đọc [sstock-tools](references/sstock-tools.md) để kiểm tra đơn vị và giới hạn gói.

**Xong khi:** xác định được mã và cấu trúc BCTC; mỗi job lỗi được retry một lần hoặc ghi rõ giới hạn cố định của gói; lưu lỗi còn lại cho báo cáo.

## 2. Compute

```bash
.pi/skills/stock/stock-analysis/scripts/run_pipeline.sh "$WORKDIR"
```

Theo mục **Compute** của runtime. Đặt `WORKDIR` thành thư mục đã fetch. Runner dùng `uv` và chỉ cập nhật bảng, chỉ số, biểu đồ sau khi kiểm tra đủ output. Biểu đồ báo thiếu nguồn là artefact hợp lệ, không phải bằng chứng.

**Xong khi:** exit code 0, stdout có score/verdict, có `metrics.json`, `tables.md` và 9 PNG của lượt chạy.

## 3. Look

1. Đọc toàn bộ `tables.md` và các cảnh báo. Mở từng PNG theo mục **Look** của runtime. Ghi một quan sát mà bảng không thể hiện cho mỗi ảnh; với ảnh báo thiếu nguồn, ghi giới hạn thay cho nhận định.
2. **Cấu trúc/ngành:** mở các nhánh phù hợp trước khi diễn giải BCTC:
   - **Ngân hàng** (`bank`): [khung ngân hàng](references/banking.md), [kiểm chứng ngân hàng](references/banking-checks.md) và [đối chiếu](references/data-reconciliation.md) — chất lượng tài sản, dự phòng, tài trợ, quyền.
   - **Chứng khoán** (`securities`): [mảng lợi nhuận, margin, vốn và chu kỳ](references/securities.md).
   - **KCN** (4): [ghi nhận theo đợt, quỹ đất, định giá](references/industrial-park.md).
   - **Bán lẻ** (1): [đòn bẩy hoạt động, tồn kho, vốn lưu động](references/retail.md).
   - **May mặc** (23) hoặc có mảng may xuất khẩu trọng yếu: [đơn hàng, biên, vòng quay và dòng tiền](references/apparel.md).
   - **Đa ngành/điện/nước/thiết bị** (5555/13/26/32) hoặc có mảng điện/M&E lớn: [proxy ngành, lãi liên kết, backlog, công suất](references/conglomerate-power.md).
3. **Đối chiếu:** trong `tables.md`, đọc mục **Sự kiện quyền** cho mọi mã và **Sự kiện ngân hàng** hoặc **Sự kiện bảng cân đối** theo cấu trúc BCTC, nếu có. Dùng [data-reconciliation](references/data-reconciliation.md) khi metadata xung đột, bảng và chart lệch, hoặc có sự kiện quyền/biến động FA chưa rõ. Dùng `adjClose` cho mức giá lịch sử; lúc quý dao động mạnh so lũy kế cùng kỳ trước khi kết luận.
4. **Phi tài chính:** kiểm tra mục **Chất lượng lợi nhuận & vốn lưu động** trong `tables.md`; đọc [chất lượng lợi nhuận](references/nonfinancial-quality.md) khi CFO lệch LNST, tồn kho/phải thu phình, LNST tăng ngược LNTT hoặc thiếu số liệu trọng yếu.

**Xong khi:** đủ 9 quan sát/giới hạn; từng sự kiện quyền 12 tháng gần nhất, sự kiện bảng cân đối/ngân hàng và bất thường FA có bằng chứng, hoặc ghi rõ khoản chưa xác nhận và nguồn cần kiểm tra.

## 4. Đào sâu khi cần

- **Elite:** dùng `raw/elite_diag.json` để xác định trụ và guard.
- **Quá khứ:** dùng `asOf` cho RRG; `from`/`to` cho trạng thái thị trường.
- **Cơ cấu tín dụng năm:** đọc `loanStructureBySector` trong `raw/fa_y.json`.
- **Vĩ mô/hàng hóa:** kiểm tra quyền trong [sstock-tools](references/sstock-tools.md); ghi giới hạn nếu gói không có, không retry lỗi cố định.
- **Python tùy biến:** lưu script trong workdir và chạy `uv run -q --with pandas --with numpy python <script>.py`. Loader nhận payload: `price_frame(w.load("price"))`, `fa_frames(w.load("fa_q"))` với `w = Work(workdir)` từ `scripts/sstock_lib.py`.

**Xong khi:** câu hỏi bổ sung có số liệu hoặc giới hạn cụ thể; nếu không cần đào sâu, chuyển sang viết.

## 5. Write

Đọc [analysis-framework](references/analysis-framework.md) rồi điền [template](templates/report.md) thành `<workdir>/report.md`; [báo cáo mẫu](examples/HPG-report.md) dùng để tham khảo độ sâu. Kết luận theo ma trận **Cơ bản & định giá × Kỹ thuật & dòng tiền**, sau đó điều chỉnh theo bối cảnh; nếu sửa điểm, ghi tiêu chí, điểm trước/sau và lý do. Gắn mỗi kịch bản với giá, RS và thanh khoản kiểm chứng được; dùng TB20 khớp lệnh nếu thỏa thuận làm méo GTGD. Ghi ngày chốt, kỳ FA và giới hạn nguồn; tỷ đồng cho tiền và nghìn đồng cho giá.

Đưa các cảnh báo trong `tables.md` có ảnh hưởng đến kết luận vào đúng mục báo cáo. Nếu trích P/E hoặc P/B SSTOCK dự phóng, ghi ngày giữ nguyên và phân biệt với bội số phiên chốt. Kết thúc bằng “không phải khuyến nghị đầu tư”.

**Xong khi:** 10 mục, 9 ảnh đúng mục, không sót placeholder; trả phần tóm tắt và liên kết `report.md`, `charts/`.
