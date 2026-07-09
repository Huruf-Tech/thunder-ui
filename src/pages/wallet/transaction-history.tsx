"use client";

import {
  IconArrowNarrowUp,
  IconArrowDownDashed,
  IconRepeat,
  IconCreditCardPay,
  IconCalendar,
  IconCreditCard,
} from "@tabler/icons-react";
import { type ComponentType, useMemo, useState } from "react";
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export type Transaction = {
  id: string;
  type: "send" | "deposit" | "swap" | "buy";
  title: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: "completed" | "pending" | "failed";
};

const TYPE_ICONS: Record<Transaction["type"], ComponentType<{ className?: string }>> = {
  send: IconArrowNarrowUp,
  deposit: IconArrowDownDashed,
  swap: IconRepeat,
  buy: IconCreditCardPay,
};

const STATUS_STYLES: Record<Transaction["status"], string> = {
  completed: "text-emerald-500",
  pending: "text-amber-500",
  failed: "text-red-500",
};

const STATIC_TRANSACTIONS: Transaction[] = [
  // {
  //   id: "1",
  //   type: "send",
  //   title: "Sent DZE",
  //   description: "To 0x8f3a...b2c1",
  //   amount: -50.00,
  //   currency: "DZE",
  //   date: "2026-07-08T10:30:00",
  //   status: "completed",
  // },
  // {
  //   id: "2",
  //   type: "deposit",
  //   title: "Deposit",
  //   description: "From bank account",
  //   amount: 200.00,
  //   currency: "DZE",
  //   date: "2026-07-07T14:15:00",
  //   status: "completed",
  // },
  // {
  //   id: "3",
  //   type: "buy",
  //   title: "Bought DZE",
  //   description: "Via credit card",
  //   amount: 150.00,
  //   currency: "DZE",
  //   date: "2026-07-06T09:45:00",
  //   status: "completed",
  // },
  // {
  //   id: "4",
  //   type: "swap",
  //   title: "Swapped ETH → DZE",
  //   description: "0.05 ETH",
  //   amount: 85.50,
  //   currency: "DZE",
  //   date: "2026-07-05T18:20:00",
  //   status: "completed",
  // },
  // {
  //   id: "5",
  //   type: "send",
  //   title: "Sent DZE",
  //   description: "To 0x2d4e...a8f3",
  //   amount: -25.00,
  //   currency: "DZE",
  //   date: "2026-07-04T11:00:00",
  //   status: "pending",
  // },
  // {
  //   id: "6",
  //   type: "deposit",
  //   title: "Deposit",
  //   description: "From external wallet",
  //   amount: 300.00,
  //   currency: "DZE",
  //   date: "2026-07-03T16:30:00",
  //   status: "completed",
  // },
  // {
  //   id: "7",
  //   type: "buy",
  //   title: "Bought DZE",
  //   description: "Via Apple Pay",
  //   amount: 75.00,
  //   currency: "DZE",
  //   date: "2026-07-02T08:10:00",
  //   status: "failed",
  // },
  // {
  //   id: "8",
  //   type: "send",
  //   title: "Sent DZE",
  //   description: "To 0x91ab...f4d2",
  //   amount: -120.00,
  //   currency: "DZE",
  //   date: "2026-06-15T09:00:00",
  //   status: "completed",
  // },
  // {
  //   id: "9",
  //   type: "deposit",
  //   title: "Deposit",
  //   description: "From savings",
  //   amount: 500.00,
  //   currency: "DZE",
  //   date: "2026-05-20T12:00:00",
  //   status: "completed",
  // },
  // {
  //   id: "10",
  //   type: "swap",
  //   title: "Swapped BTC → DZE",
  //   description: "0.002 BTC",
  //   amount: 210.00,
  //   currency: "DZE",
  //   date: "2026-04-10T15:30:00",
  //   status: "completed",
  // },
  // {
  //   id: "11",
  //   type: "buy",
  //   title: "Bought DZE",
  //   description: "Via bank transfer",
  //   amount: 1000.00,
  //   currency: "DZE",
  //   date: "2026-03-01T08:45:00",
  //   status: "completed",
  // },
  // {
  //   id: "12",
  //   type: "send",
  //   title: "Sent DZE",
  //   description: "To 0xc3e7...19a5",
  //   amount: -350.00,
  //   currency: "DZE",
  //   date: "2026-02-14T17:20:00",
  //   status: "completed",
  // },
];

type RangePreset = "1m" | "3m" | "6m" | "custom";

const RANGE_LABELS: Record<RangePreset, string> = {
  "1m": "1 Month",
  "3m": "3 Months",
  "6m": "6 Months",
  custom: "Custom",
};

function getPresetStartDate(preset: RangePreset): Date {
  const now = new Date();
  switch (preset) {
    case "1m":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3m":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6m":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    default:
      return new Date(0);
  }
}

function formatDateForInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAmount(amount: number, currency: string) {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function TransactionHistory() {
  const [activeRange, setActiveRange] = useState<RangePreset>("1m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const filteredTransactions = useMemo(() => {
    let startDate: Date;
    let endDate = new Date();

    if (activeRange === "custom") {
      startDate = customFrom ? new Date(customFrom) : new Date(0);
      endDate = customTo ? new Date(customTo + "T23:59:59") : new Date();
    } else {
      startDate = getPresetStartDate(activeRange);
    }

    return STATIC_TRANSACTIONS.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [activeRange, customFrom, customTo]);

  return (
    <div className="flex flex-col gap-3">
      {/* Date range presets */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(RANGE_LABELS) as RangePreset[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveRange(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeRange === key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {key === "custom" && <IconCalendar className="mr-1 inline-block h-3.5 w-3.5 align-[-3px]" />}
            {RANGE_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Custom date range inputs */}
      {activeRange === "custom" && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="tx-from">From</label>
            <input
              id="tx-from"
              type="date"
              value={customFrom}
              max={customTo || formatDateForInput(new Date())}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            />
          </div>
          <span className="mt-5 text-xs text-muted-foreground">—</span>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="tx-to">To</label>
            <input
              id="tx-to"
              type="date"
              value={customTo}
              min={customFrom}
              max={formatDateForInput(new Date())}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            />
          </div>
        </div>
      )}
       <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Transactions</h3>
      </div>
      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon" >
            <IconCreditCard/>
            </EmptyMedia>
          <EmptyTitle>No transactions found</EmptyTitle>
        </Empty>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {filteredTransactions.map((tx) => {
            const Icon = TYPE_ICONS[tx.type];
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {tx.title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {tx.description}
                  </span>
                </div>

                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`text-sm font-medium ${tx.amount >= 0 ? "text-emerald-500" : "text-foreground"}`}
                  >
                    {formatAmount(tx.amount, tx.currency)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${STATUS_STYLES[tx.status]}`}>
                      {tx.status === "completed" ? "✓" : tx.status === "pending" ? "◷" : "✕"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(tx.date)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
