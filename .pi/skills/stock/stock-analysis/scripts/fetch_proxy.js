// fetch_proxy.js — pull "proxy sector" datasets (sectors that match a company's real business segments)
// into <outDir>/raw/proxy_<sectorId>.json. Use after fetch_stock.js when the stock's own sector is a
// heterogeneous basket (Đa ngành 5555) or a segment needs its own benchmark. Run from codemode:
//   const AF = Object.getPrototypeOf(async function(){}).constructor;
//   const src = await tools.read({ path: ".pi/skills/stock/stock-analysis/scripts/fetch_proxy.js" });
//   return await new AF("tools", "args", src)(tools, { outDir: "stock-reports/REE-2026-11-15", sectorIds: [13, 26, 32] });
// args: outDir (required), sectorIds (required, ids from raw/sector_rrg.json), perMin=20.
// 4 calls per sector: get_stock_rrg (tracked stocks), get_sector_valuation (P/E, P/B history),
// get_sector_fa (Q, aggregate of the full basket), get_sector_companies (full basket + market cap).
const P = "mcp__sstock__";
const outDir = String(args.outDir).replace(/\/$/, "");
const ids = (args.sectorIds || []).map(Number);
const perMin = args.perMin ?? 20;
const stamps = [];
const sleep = (s) => tools.bash({ command: "sleep " + s });
async function throttle() {
  for (;;) {
    const now = Date.now();
    while (stamps.length && now - stamps[0] > 61000) stamps.shift();
    if (stamps.length < perMin) { stamps.push(now); return; }
    await sleep(Math.ceil((61000 - (now - stamps[0])) / 1000) + 1);
  }
}
async function call(tool, a) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await throttle();
    try {
      const r = await tools[P + tool](a);
      const txt = (r.content || []).map((c) => c.text || "").join("");
      let data; try { data = JSON.parse(txt); } catch { data = { _raw: txt }; }
      return { tool, args: a, isError: !!r.isError, data };
    } catch (e) {
      const m = String(e);
      if (m.includes("429") || m.includes("rate_limited")) {
        const s = Number((m.match(/sau (\d+) gi/) || [])[1] || 30);
        await sleep(s + 2); continue;
      }
      return { tool, args: a, isError: true, data: { _raw: m } };
    }
  }
  return { tool, args: a, isError: true, data: { _raw: "rate limited 5x" } };
}
if (!ids.length) return "sectorIds is empty";
const summary = {};
for (const id of ids) {
  const res = {
    rrg: await call("get_stock_rrg", { sectorId: id }),
    val: await call("get_sector_valuation", { sectorId: id }),
    fa: await call("get_sector_fa", { sector: id, unit: "Q" }),
    companies: await call("get_sector_companies", { sector: id }),
  };
  await tools.write({ path: outDir + "/raw/proxy_" + id + ".json", content: JSON.stringify(res) });
  summary[id] = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.isError ? "ERR" : "ok"]));
}
return summary;
