import { Link, useRouterState } from "@tanstack/react-router";
import { Icon3D } from "@/components/Icon3D";

/** Floating liquid-glass bottom navigation with 3D icons, mobile only. */
export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const shell =
    "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold transition-all duration-300";
  const tone = (active: boolean) => (active ? "text-foreground" : "text-muted-foreground");

  const Glow = ({ active }: { active: boolean }) => (
    <span
      className={`pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,color-mix(in_oklab,var(--brand)_38%,transparent),transparent)] transition-opacity duration-300 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  );

  const iconClass = (active: boolean) =>
    `size-6 transition-transform duration-300 ${active ? "-translate-y-0.5 scale-110" : "scale-95 opacity-80"}`;

  const items = [
    { to: "/" as const, label: "Home", icon: "home", active: pathname === "/" },
    {
      to: "/category/$slug" as const,
      params: { slug: "movies" },
      label: "Movies",
      icon: "movies",
      active: pathname === "/category/movies",
    },
    {
      to: "/category/$slug" as const,
      params: { slug: "drama" },
      label: "Series",
      icon: "drama",
      active: pathname === "/category/drama",
    },
    {
      to: "/category/$slug" as const,
      params: { slug: "trending" },
      label: "Trending",
      icon: "trending",
      active: pathname === "/category/trending",
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] lg:hidden">
      <nav className="pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-[26px] border border-foreground/10 bg-background/70 p-1.5 shadow-[0_10px_34px_-8px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
        {items.map((item) =>
          item.params ? (
            <Link
              key={item.label}
              to={item.to}
              params={item.params}
              className={`${shell} ${tone(item.active)}`}
            >
              <Glow active={item.active} />
              <Icon3D name={item.icon} className={`relative ${iconClass(item.active)}`} />
              <span className="relative">{item.label}</span>
            </Link>
          ) : (
            <Link key={item.label} to="/" className={`${shell} ${tone(item.active)}`}>
              <Glow active={item.active} />
              <Icon3D name={item.icon} className={`relative ${iconClass(item.active)}`} />
              <span className="relative">{item.label}</span>
            </Link>
          ),
        )}
        <Link to="/search" search={{ q: "" }} className={`${shell} ${tone(pathname === "/search")}`}>
          <Glow active={pathname === "/search"} />
          <Icon3D name="search" className={`relative ${iconClass(pathname === "/search")}`} />
          <span className="relative">Search</span>
        </Link>
      </nav>
    </div>
  );
}
