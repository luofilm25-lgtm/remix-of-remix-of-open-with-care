import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Icon3D } from "@/components/Icon3D";
import markAsset from "@/assets/luofilm-mark.png";
import { FloatNav } from "@/components/youku/FloatNav";

export function TopBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (q) navigate({ to: "/search", search: { q } });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex flex-col gap-1.5 bg-background/70 px-3 pb-2 pt-2 backdrop-blur-xl lg:h-14 lg:flex-row lg:items-center lg:gap-4 lg:py-0 lg:pl-[calc(var(--sidebar-w)+20px)]">
      {/* Row 1 on mobile: site name + search. Desktop keeps everything inline. */}
      <div className="flex h-10 items-center gap-3 lg:h-auto lg:flex-1 lg:justify-center">
        <Link to="/" className="flex min-w-0 items-center gap-1.5 lg:hidden">
          <img src={markAsset} alt="" className="h-7 w-auto shrink-0" />
          <span className="whitespace-nowrap font-[Bebas_Neue,system-ui,sans-serif] text-[18px] leading-none tracking-wide">
            <span className="bg-gradient-to-r from-[#00EAFF] to-[#5CFF00] bg-clip-text text-transparent">
              LUOFILM
            </span>
            <span className="text-[#C822FF]">.SITE</span>
          </span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:hidden">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground/12 backdrop-blur-md"
          >
            <Icon3D name="search" className="size-5" />
          </button>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <FloatNav />
        </div>
      </div>

      {/* Row 2 on mobile: the floating pill nav, scrollable so it always fits. */}
      <div className="-mx-3 flex justify-center overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        <FloatNav />
      </div>

      <div className="hidden min-w-0 shrink-0 items-center gap-2 lg:flex">
        <form
          onSubmit={submit}
          className="flex h-9 w-[300px] items-center gap-2 rounded-full bg-foreground/12 px-4 backdrop-blur-md"
        >
          <Icon3D name="search" className="size-4" />
          <input
            aria-label="Search movies and series"
            placeholder="Search movies and series"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/50"
          />
        </form>
      </div>


      {searchOpen && (
        <form
          onSubmit={submit}
          className="absolute inset-x-3 top-14 flex h-10 items-center gap-2 rounded-full bg-background/90 px-4 shadow-lg ring-1 ring-border backdrop-blur-md lg:hidden"
        >
          <Icon3D name="search" className="size-4" />
          <input
            autoFocus
            aria-label="Search movies and series"
            placeholder="Search movies and series"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/50"
          />
        </form>
      )}
    </header>
  );
}
