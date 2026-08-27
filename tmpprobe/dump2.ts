import { listAllEpisodes, listLuoTitles } from "../src/lib/luo";
const eps = await listAllEpisodes();
const t = await listLuoTitles("luo");
const last = new Map<string, number>();
for (const e of eps) { const at = Date.parse(e.created_at)||0; if (at > (last.get(e.title_id)??0)) last.set(e.title_id, at); }
const rows = t.map(x=>({title:x.title, act:new Date(Math.max(Date.parse(x.created_at)||0, last.get(x.id)??0)).toISOString()}))
  .sort((a,b)=>a.act<b.act?1:-1).slice(0,8);
console.log(rows);
process.exit(0)
