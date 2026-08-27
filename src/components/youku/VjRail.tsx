import { Link } from "@tanstack/react-router";
import seniorPaulLogo from "@/assets/vj-senior-paul.png";

/**
 * Featured VJ chip — matches the category-card design: a wide rounded
 * rectangle with a tinted image backdrop and a bold label bottom-left.
 */
export function VjRail() {
  return (
    <nav aria-label="Featured VJ" className="flex items-center">
      <Link
        to="/luo"
        className="group relative mt-4 flex h-[40px] w-[118px] shrink-0 items-end overflow-hidden rounded-2xl sm:mt-3 sm:h-[48px] sm:w-[152px] shadow-[0_6px_18px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        <img
          src={seniorPaulLogo}
          alt=""
          aria-hidden
          loading="eager"
          className="absolute inset-0 size-full object-cover object-[center_40%] opacity-80"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-[#4a1360]/90 via-[#4a1360]/55 to-transparent" />
        <span className="relative z-10 truncate px-2 pb-1.5 text-[11px] sm:px-2.5 sm:pb-2 sm:text-[13px] font-bold text-foreground drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          VJ Senior Paul
        </span>
      </Link>
    </nav>
  );
}
