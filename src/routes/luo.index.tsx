import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/youku/Sidebar";
import { TopBar } from "@/components/youku/TopBar";
import { MobileNav } from "@/components/youku/MobileNav";
import { LuoLibrary } from "@/components/luo/LuoLibrary";

export const Route = createFileRoute("/luo/")({
  head: () => ({
    meta: [
      { title: "Luo Movies & Series — LUOFILM.SITE" },
      {
        name: "description",
        content: "Watch Luo translated movies and series uploaded by the LUOFILM admin team.",
      },
      { property: "og:title", content: "Luo Movies & Series — LUOFILM.SITE" },
      {
        property: "og:description",
        content: "Watch Luo translated movies and series uploaded by the LUOFILM admin team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LuoPage,
});

function LuoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-[var(--sidebar-w)]">
        <div className="relative h-14">
          <TopBar />
        </div>
        <main className="px-3 pb-28 sm:px-4 lg:px-8 lg:pb-16">
          <div className="mt-4">
            <LuoLibrary language="luo" />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
