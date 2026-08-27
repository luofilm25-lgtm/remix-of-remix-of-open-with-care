import { request } from "../src/lib/moviebox";
const paths = [
 "/wefeed-mobile-bff/subject-api/home-tabs",
 "/wefeed-mobile-bff/tab-operating?page=1&tabId=0&version=",
 "/wefeed-mobile-bff/subject-api/tab-list",
 "/wefeed-mobile-bff/subject-api/rank-list",
 "/wefeed-mobile-bff/subject-api/ranking",
];
for (const p of paths) {
  try { const d = await request("GET", p); console.log("OK", p, JSON.stringify(d).slice(0,600)); }
  catch (e:any) { console.log("ERR", p, String(e).slice(0,120)); }
}
