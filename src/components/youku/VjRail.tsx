import { Link } from "@tanstack/react-router";
import seniorPaulLogo from "@/assets/vj-senior-paul.png.asset.json";

/**
 * Featured VJ chip — matches the category-card design: a wide rounded
 * rectangle with a tinted image backdrop and a bold label bottom-left.
 */
export function VjRail() {
  return (
    <nav aria-label="Featured VJ" className="flex items-center">
      <Link
        to="/luo"
        className="group relative flex h-[74px] w-[210px] shrink-0 items-end overflow-hidden rounded-lg shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        <img
          src={seniorPaulLogo.url}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 size-full object-cover object-center opacity-70"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-[#4a1360]/95 via-[#4a1360]/70 to-transparent" />
        <span className="relative z-10 truncate px-3 pb-3 text-[16px] font-bold text-foreground drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          VJ Senior Paul
        </span>
      </Link>
    </nav>
  );
}
