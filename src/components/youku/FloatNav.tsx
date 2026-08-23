import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Crown, LogIn, LogOut, Shield, User as UserIcon } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useIsAdmin } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { db as supabase } from "@/lib/db";

/** Floating glass pill nav: LUO · LUGANDA · SUBSCRIBE · LOGIN */
export function FloatNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin, user } = useIsAdmin();
  const { openSubscribe } = useSubscription();
  const [authOpen, setAuthOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const pill = (active: boolean) =>
    `grid h-8 place-items-center rounded-full px-3.5 text-[12px] font-black uppercase tracking-wide transition ${
      active
        ? "bg-brand text-brand-foreground shadow-[0_4px_18px_-4px_var(--brand)]"
        : "text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
    }`;

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-foreground/10 p-1 shadow-lg ring-1 ring-white/10 backdrop-blur-xl">
        <Link to="/luo" className={pill(pathname.startsWith("/luo"))}>
          Luo
        </Link>
        <Link to="/luganda" className={pill(pathname.startsWith("/luganda"))}>
          Luganda
        </Link>
        <button
          type="button"
          onClick={openSubscribe}
          className="grid h-8 place-items-center rounded-full bg-[linear-gradient(100deg,oklch(0.95_0.06_95),oklch(0.87_0.11_82))] px-3.5 text-[12px] font-bold uppercase tracking-wide text-vip-foreground shadow-[0_6px_18px_-8px_var(--vip)] transition hover:brightness-105"
        >
          <span className="flex items-center gap-1">
            <Crown className="size-3.5" />
            Subscribe
          </span>
        </button>

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label="Account"
              className="grid size-8 place-items-center rounded-full bg-foreground/15 text-foreground transition hover:bg-foreground/25"
            >
              <UserIcon className="size-4" />
            </button>
            {menu && (
              <div
                className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl bg-card/95 p-1 shadow-2xl ring-1 ring-border backdrop-blur-xl"
                onMouseLeave={() => setMenu(false)}
              >
                <p className="truncate px-3 py-2 text-[11px] text-muted-foreground">{user.email}</p>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-foreground hover:bg-foreground/10"
                  >
                    <Shield className="size-4" /> Admin panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    void supabase.auth.signOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-foreground hover:bg-foreground/10"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="grid h-8 place-items-center rounded-full bg-foreground px-3.5 text-[12px] font-black uppercase tracking-wide text-background transition hover:opacity-90"
          >
            <span className="flex items-center gap-1">
              <LogIn className="size-3.5" />
              Login
            </span>
          </button>
        )}
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
