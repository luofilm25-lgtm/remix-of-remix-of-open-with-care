import { request } from "../src/lib/moviebox";
for (const tabId of [0,1,2,3,4,5]) {
  for (const page of [1,2,3]) {
    try {
      const d:any = await request("GET", `/wefeed-mobile-bff/tab-operating?page=${page}&tabId=${tabId}&version=`);
      const items:any[] = d?.items ?? [];
      console.log(`tab=${tabId} page=${page}`, items.map(b=>`${b.type}:${b.title}(${(b.subjects?.length||0)+(b.groups?.reduce((a:any,g:any)=>a+(g.subjects?.length||0),0)||0)})`).join(" | "));
    } catch(e:any){ console.log(`tab=${tabId} page=${page} ERR`); }
  }
}
