import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchHome } = await import("./moviebox.server");
  try {
    return await fetchHome();
  } catch (error) {
    // Upstream catalog unreachable (blocked/flaky host): render the shell with
    // empty rails instead of failing the whole page render with a 500.
    console.error(error);
    return { hero: [], rows: [] as { title: string; items: [] }[], degraded: true as const };
  }
});

export const searchTitles = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ q: z.string().min(1), page: z.number().int().min(1).default(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { searchCatalog } = await import("./moviebox.server");
    try {
      return await searchCatalog(data.q, data.page);
    } catch (error) {
      console.error(error);
      return [];
    }
  });


export const getTitle = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { fetchDetails, unavailableTitle } = await import("./moviebox.server");
    try {
      return await fetchDetails(data.id);
    } catch (error) {
      // Never fail the render: return a placeholder the client can refetch over.
      console.error(error);
      return unavailableTitle(data.id);
    }
  });

export const getSources = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ id: z.string().min(1), season: z.number().default(0), episode: z.number().default(0) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { fetchSources } = await import("./moviebox.server");
    try {
      return await fetchSources(data.id, data.season, data.episode);
    } catch (error) {
      console.error(error);
      return [];
    }
  });
