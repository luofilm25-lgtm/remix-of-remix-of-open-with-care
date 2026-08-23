import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownToLine, Wallet, TrendingUp, Receipt } from "lucide-react";
import { db as supabase } from "@/lib/db";
import { fullDate, money, seriesByDay } from "@/lib/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, Panel, Pill, SoftArea, Stat, goldBtn, softField } from "./ui";

type Tx = {
  id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  method: string | null;
  phone: string | null;
  reference: string | null;
  note: string | null;
  kind: string;
  status: string;
  created_at: string;
};

async function loadWallet() {
  const [tx, wd, profiles] = await Promise.all([
    supabase.from("luo_transactions").select("*").order("created_at", { ascending: false }),
    supabase.from("luo_withdrawals").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, email, phone"),
  ]);
  return {
    tx: (tx.data ?? []) as Tx[],
    wd: wd.data ?? [],
    profiles: profiles.data ?? [],
  };
}

export function WalletTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-wallet"], queryFn: loadWallet });
  const [openTx, setOpenTx] = useState<Tx | null>(null);
  const [wdOpen, setWdOpen] = useState(false);
  const [form, setForm] = useState({ phone: "", amount: "", reason: "" });

  const earned = (q.data?.tx ?? []).filter((t) => t.status === "success").reduce((s, t) => s + Number(t.amount), 0);
  const paidOut = (q.data?.wd ?? []).filter((w) => w.status !== "rejected").reduce((s, w) => s + Number(w.amount), 0);
  const balance = earned - paidOut;
  const chart = seriesByDay((q.data?.tx ?? []).filter((t) => t.status === "success"), 21, (t) => Number(t.amount));

  const profileOf = (uid: string | null) => (q.data?.profiles ?? []).find((p) => p.id === uid);

  const withdraw = useMutation({
    mutationFn: async () => {
      const amount = Number(form.amount);
      if (!form.phone.trim()) throw new Error("Phone number is required");
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      if (amount > balance) throw new Error("Amount is more than the available balance");
      const { data: me } = await supabase.auth.getUser();
      const { error } = await supabase.from("luo_withdrawals").insert({
        amount,
        phone: form.phone.trim(),
        reason: form.reason.trim() || null,
        status: "pending",
        created_by: me.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal request created");
      setForm({ phone: "", amount: "", reason: "" });
      setWdOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-wallet"] });
      void qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Available balance" value={money(balance)} tone="mint" sub="Ready to withdraw" icon={<Wallet className="size-4" />} />
        <Stat label="Total earned" value={money(earned)} tone="gold" sub={`${q.data?.tx.length ?? 0} transactions`} icon={<TrendingUp className="size-4" />} />
        <Stat label="Withdrawn" value={money(paidOut)} tone="rose" sub={`${q.data?.wd.length ?? 0} requests`} icon={<ArrowDownToLine className="size-4" />} />
        <Stat
          label="Withdraw money"
          value="Cash out"
          tone="violet"
          sub="Phone · amount · reason"
          icon={<Receipt className="size-4" />}
          onClick={() => setWdOpen(true)}
        />
      </div>

      <Panel title="Income · last 21 days">
        <SoftArea data={chart} prefix="UGX " color="oklch(0.68 0.14 160)" />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Transactions">
          {(q.data?.tx.length ?? 0) === 0 ? (
            <Empty>No transactions yet.</Empty>
          ) : (
            <div className="space-y-2">
              {q.data?.tx.map((t) => {
                const p = profileOf(t.user_id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setOpenTx(t)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/65 px-3 py-3 text-left text-[13px] transition hover:bg-white"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(120deg,oklch(0.95_0.05_160),oklch(0.9_0.09_170))] font-black">
                      {(p?.display_name ?? p?.email ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p?.display_name ?? p?.email ?? "Unknown user"}</span>
                      <span className="block truncate text-[11px] opacity-60">
                        {t.kind} · {t.method ?? "manual"} · {fullDate(t.created_at)}
                      </span>
                    </span>
                    <span className="shrink-0 font-black">{money(Number(t.amount), t.currency)}</span>
                    <Pill tone={t.status === "success" ? "on" : "warn"}>{t.status}</Pill>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Withdrawals" action={<button type="button" onClick={() => setWdOpen(true)} className={goldBtn}>Withdraw</button>}>
          {(q.data?.wd.length ?? 0) === 0 ? (
            <Empty>No withdrawals yet.</Empty>
          ) : (
            <ul className="space-y-2">
              {q.data?.wd.map((w) => (
                <li key={w.id} className="rounded-2xl bg-white/65 px-3 py-3 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[14px]">{money(Number(w.amount), w.currency)}</b>
                    <Pill tone={w.status === "paid" ? "on" : "warn"}>{w.status}</Pill>
                  </div>
                  <p className="mt-1 opacity-70">{w.phone}</p>
                  {w.reason && <p className="mt-0.5 opacity-60">{w.reason}</p>}
                  <p className="mt-0.5 opacity-50">{fullDate(w.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* transaction detail */}
      <Dialog open={!!openTx} onOpenChange={(v) => !v && setOpenTx(null)}>
        <DialogContent className="max-w-[440px] border-0 bg-[linear-gradient(165deg,oklch(0.98_0.02_20),oklch(0.97_0.03_320)_55%,oklch(0.98_0.03_80))] p-6 text-[oklch(0.28_0.03_320)]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">Transaction details</DialogTitle>
          </DialogHeader>
          {openTx && (
            <div className="space-y-2 text-[13px]">
              <p className="text-[28px] font-black leading-none">{money(Number(openTx.amount), openTx.currency)}</p>
              {[
                ["User", profileOf(openTx.user_id)?.display_name ?? "Unknown"],
                ["Email", profileOf(openTx.user_id)?.email ?? "—"],
                ["Phone", openTx.phone ?? profileOf(openTx.user_id)?.phone ?? "—"],
                ["Kind", openTx.kind],
                ["Method", openTx.method ?? "manual"],
                ["Reference", openTx.reference ?? "—"],
                ["Note", openTx.note ?? "—"],
                ["Status", openTx.status],
                ["Date", fullDate(openTx.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 rounded-2xl bg-white/65 px-3 py-2">
                  <span className="opacity-60">{k}</span>
                  <span className="max-w-[60%] truncate text-right font-semibold">{v}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* withdraw modal */}
      <Dialog open={wdOpen} onOpenChange={setWdOpen}>
        <DialogContent className="max-w-[420px] border-0 bg-[linear-gradient(165deg,oklch(0.98_0.02_20),oklch(0.97_0.03_320)_55%,oklch(0.98_0.03_80))] p-6 text-[oklch(0.28_0.03_320)]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">Withdraw money</DialogTitle>
          </DialogHeader>
          <p className="text-[12px] opacity-65">Available balance: <b>{money(balance)}</b></p>
          <form
            className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              withdraw.mutate();
            }}
          >
            <input className={softField} placeholder="Phone number (MoMo / Airtel)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className={softField} inputMode="numeric" placeholder="Amount (UGX)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <textarea
              className="min-h-20 w-full rounded-2xl bg-white/70 p-3 text-sm outline-none ring-1 ring-black/5 placeholder:opacity-50 focus:bg-white focus:ring-2 focus:ring-[oklch(0.82_0.1_65)]"
              placeholder="Reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
            <button type="submit" disabled={withdraw.isPending} className={`${goldBtn} w-full`}>
              Request withdrawal
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
