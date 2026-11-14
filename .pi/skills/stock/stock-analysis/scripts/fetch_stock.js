// fetch_stock.js — pull every sstock dataset needed to analyse ONE ticker into <outDir>/raw/*.json
// Run from codemode (the sandbox has no imports, so eval the file):
//   const AF = Object.getPrototypeOf(async function(){}).constructor;
//   const src = await tools.read({ path: ".pi/skills/stock/stock-analysis/scripts/fetch_stock.js" });
//   return await new AF("tools", "args", src)(tools, { symbol: "HPG", outDir: "stock-reports/HPG-2026-11-14" });
// args: symbol (required), outDir (required), perMin=25 (rate budget, server cap is 30/min),
//       priceYears=3 (250 rows per page), only=[jobNames] to re-fetch a subset.
// Each raw file = { tool, args, isError, data }. A manifest.json summarises every job.
const P = "mcp__sstock__";
const sym = String(args.symbol).toUpperCase();
const outDir = String(args.outDir).replace(/\/$/, "");
const perMin = args.perMin ?? 25;
const priceYears = args.priceYears ?? 3;
const only = args.only ? new Set(args.only) : null;
const stamps = [];
const manifest = { symbol: sym, fetchedAt: new Date().toISOString(), jobs: {} };

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
      return { isError: !!r.isError, data, txt };
    } catch (e) {
      const m = String(e);
      if (m.includes("429") || m.includes("rate_limited")) {
        const s = Number((m.match(/sau (\d+) gi/) || [])[1] || 30);
        await sleep(s + 2); continue;
      }
      return { isError: true, data: { _raw: m }, txt: m };
    }
  }
  return { isError: true, data: { _raw: "rate limited 5x" }, txt: "rate limited" };
}
async function save(name, obj) {
  await tools.write({ path: outDir + "/raw/" + name + ".json", content: JSON.stringify(obj) });
}
async function job(name, tool, a) {
  if (only && !only.has(name)) return null;
  const r = await call(tool, a);
  await save(name, { tool, args: a, isError: r.isError, data: r.data });
  manifest.jobs[name] = { tool, ok: !r.isError, note: r.data && r.data.note || undefined,
    err: r.isError ? r.txt.slice(0, 200) : undefined };
  return r;
}
const dayBefore = (d) => { const t = new Date(d); t.setDate(t.getDate() - 1); return t.toISOString().slice(0, 10); };
async function paged(name, tool, symbol, pages) {
  if (only && !only.has(name)) return;
  const rows = []; let to; let note;
  for (let i = 0; i < pages; i++) {
    const a = { symbol, limit: 250 }; if (to) a.to = to;
    const r = await call(tool, a);
    if (r.isError || !r.data.rows || !r.data.rows.length) { if (r.isError) note = r.txt.slice(0, 200); break; }
    rows.push(...r.data.rows); if (r.data.note) note = r.data.note;
    to = dayBefore(r.data.rows[r.data.rows.length - 1].date);
    if (r.data.rows.length < 250) break;
  }
  await save(name, { tool, args: { symbol, pages }, isError: rows.length === 0, data: { symbol, rows } });
  manifest.jobs[name] = { tool, ok: rows.length > 0, rows: rows.length, note,
    range: rows.length ? rows[rows.length - 1].date + " -> " + rows[0].date : undefined };
}

// Phase 1 — identity and report structure (always fetched: later jobs depend on them).
const company = await call("get_company_tool", { symbol: sym });
await save("company", { tool: "get_company_tool", args: { symbol: sym }, isError: company.isError, data: company.data });
if (company.isError) return "company lookup failed: " + company.txt;
const sectorId = company.data.sector_id || company.data.sectorId;
const sc = await call("get_sector_companies", { sector: String(sectorId) });
await save("sector_companies", { tool: "get_sector_companies", args: { sector: String(sectorId) }, isError: sc.isError, data: sc.data });
const structure = (sc.data && sc.data.structure) || "nonfinancial";
Object.assign(manifest, { sectorId, sectorName: company.data.sectorName, exchange: company.data.exchange, structure });
const faTool = { nonfinancial: "get_stock_fa_nonfinancial", bank: "get_stock_fa_bank",
  securities: "get_stock_fa_securities", insurance: "get_stock_fa_insurance" }[structure];
const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1); yearAgo.setMonth(yearAgo.getMonth() - 3);

// Phase 2 — stock, sector and market datasets.
await job("fa_q", faTool, { symbol: sym, unit: "Q", periods: 40 });
await job("fa_y", faTool, { symbol: sym, unit: "Y", periods: 10 });
await job("valuation_1m", "get_stock_valuation", { symbol: sym, resolution: "1M", charts: ["pe", "pb", "peSstock", "pbSstock"] });
await job("valuation_1d", "get_stock_valuation", { symbol: sym, resolution: "1D", from: yearAgo.toISOString().slice(0, 10), charts: ["pe", "pb"] });
await paged("price", "get_price_history", sym, priceYears);
await paged("vnindex", "get_price_history", "VNINDEX", priceYears);
await paged("active_flow", "get_active_flow", sym, 2);
await job("power_rs6", "get_power_scores", { symbol: sym, sessions: 500, rsType: "RS6M" });
await job("power_rs3", "get_power_scores", { symbol: sym, sessions: 500, rsType: "RS3M" });
await job("stock_rrg", "get_stock_rrg", { symbols: [sym], tailLength: 13 });
await job("peers_rrg", "get_stock_rrg", { sectorId, tailLength: 1 });
await job("elite_diag", "get_elite_diagnostic", { symbol: sym });
await job("elite_sector", "get_elite_stocks", { status: "all", sectorId, fromDate: "2021-01-01", limit: 100 });
await job("sector_rrg", "get_sector_rrg", { tailLength: 13 });
await job("sector_fa", "get_sector_fa", { sector: String(sectorId), unit: "Q", periods: 17 });
await job("sector_val_all", "get_sector_valuation", {});
await job("sector_val_hist", "get_sector_valuation", { sectorId, years: 10, resolution: "1M" });
await job("market_state", "get_market_state", { sessions: 250, includeTransitions: true });
await job("market_sentiment", "get_market_sentiment", { includeSeries: true });
await job("money_diffusion", "get_money_flow_diffusion", { includeSeries: true });
await job("market_val", "get_market_valuation", { basket: "VNINDEX", resolution: "1M" });

await tools.write({ path: outDir + "/manifest.json", content: JSON.stringify(manifest, null, 1) });
const bad = Object.entries(manifest.jobs).filter(([, j]) => !j.ok).map(([k, j]) => k + ": " + j.err);
return { symbol: sym, structure, sectorId, sectorName: manifest.sectorName, jobs: Object.keys(manifest.jobs).length,
  failed: bad, notes: Object.entries(manifest.jobs).filter(([, j]) => j.note).map(([k, j]) => k + ": " + j.note) };
