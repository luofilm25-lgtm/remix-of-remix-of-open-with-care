import { fdb } from "../src/lib/fdb";
const { data } = await fdb.from("media").select("*");
for (const r of (data as any[])) {
  if (/magic|coma|premature|beyonce/i.test(String(r.title ?? r.caption))) console.log(JSON.stringify({t:r.title??r.caption, c:r.created_at, u:r.updated_at, k:r.kind}));
}
const { data: eps } = await fdb.from("episodes").select("*");
console.log("eps", JSON.stringify((eps as any[]).slice(0,4)));
process.exit(0)
