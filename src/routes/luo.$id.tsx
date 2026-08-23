import { createFileRoute } from "@tanstack/react-router";
import { LuoWatch } from "@/components/luo/LuoWatch";

export const Route = createFileRoute("/luo/$id")({
  head: () => ({
    meta: [
      { title: "Watch Luo Title — LUOFILM.SITE" },
      { name: "description", content: "Stream this Luo translated title on LUOFILM.SITE." },
      { property: "og:title", content: "Watch Luo Title — LUOFILM.SITE" },
      {
        property: "og:description",
        content: "Stream this Luo translated title on LUOFILM.SITE.",
      },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LuoWatch id={Route.useParams().id} language="luo" />,
});
