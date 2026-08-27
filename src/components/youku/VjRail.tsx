import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

/**
 * Featured VJ button — a clean glass pill (no artwork behind it) that sits
 * low in the hero so it slightly overlaps the "Trending now" rail.
 */
export function VjRail() {
  return (
    <nav aria-label="Featured VJ" className="flex items-center">
      <Link
        to="/luo"
        className="group inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/20 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand hover:bg-brand/35 sm:px-4 sm:py-2 sm:text-[13px]"
      >
        <span className="grid size-5 place-items-center rounded-full bg-brand text-brand-foreground sm:size-6">
          <Play className="size-3 fill-current" />
        </span>
        VJ Senior Paul
      </Link>
    </nav>
  );
}
