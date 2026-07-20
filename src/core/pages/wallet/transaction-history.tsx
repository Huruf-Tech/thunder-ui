"use client";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { ThunderSDK } from "thunder-sdk";
import {
  IconArrowDownDashed,
  IconArrowNarrowUp,
  IconCalendarCheck,
} from "@tabler/icons-react";
import { use } from "@/core/hooks/use";
import { getWalletLedgers } from "@/core/endpoints/wallet";
import { formatDateForInput } from "@/core/lib/utils";
import { useTranslation } from "react-i18next";
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater";
import { Filters, type TFilterValue } from "@/core/crud/filters";
import type { TField } from "@/core/lib/jsonSchemaToFields";

type TWalletLedger =
  typeof ThunderSDK.walletLedgers.type.get$return.results[number];

const TYPE_ICONS: Record<
  TWalletLedger["type"],
  ComponentType<{ className?: string }>
> = {
  credit: IconArrowDownDashed,
  debit: IconArrowNarrowUp,
};

// Direct Credit and Debit Labels
const TYPE_LABEL_KEYS: Record<TWalletLedger["type"], string> = {
  credit: "Credit",
  debit: "Debit",
};

const TYPE_COLOR_CLASS: Record<TWalletLedger["type"], string> = {
  credit: "text-success",
  debit: "text-destructive",
};

const TYPE_ICON_BG_CLASS: Record<TWalletLedger["type"], string> = {
  credit: "bg-success/15",
  debit: "bg-destructive/15",
};

const LRI = "\u2066";
const PDI = "\u2069";

const CURRENCY_LABELS_AR: Record<string, string> = {
  LYD: "د.ل",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function getCurrencyLabel(currency: string, lang: string) {
  const code = currency.toUpperCase();
  if (lang?.startsWith("ar")) {
    return CURRENCY_LABELS_AR[code] ?? code;
  }
  return code;
}

function formatAmount(amount: number, currency: string, lang: string) {
  const label = getCurrencyLabel(currency, lang);
  const numberStr = (Math.abs(amount) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${LRI}${numberStr} ${label}${PDI}`;
}

// Exactly 4 fields allowed in UI filter dropdown
const walletLedgerFields: TField[] = [
  {
    name: "type",
    label: "Type",
    type: "text",
    canFilter: true,
    enum: [{ label: "Credit", value: "credit" }, {
      label: "Debit",
      value: "debit",
    }] as any,
  },
  { name: "amount", label: "Amount", type: "number", canFilter: true },
  { name: "createdAt", label: "Created At", type: "date", canFilter: true },
  { name: "updatedAt", label: "Updated At", type: "date", canFilter: true },
];

/** Minimal Filter Parser for MongoDB Backend Query */
function parseFilterToBackendQuery(filters?: TFilterValue) {
  if (!filters || !Object.keys(filters).length) return undefined;
  const parsed: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, filter]) => {
    if (!filter || filter.value === undefined || filter.value === null) return;
    const { value } = filter;

    // Type Filter
    if (key === "type") {
      const arr = Array.isArray(value) ? value : [value];
      if (arr.length) {
        parsed[key] = {
          $in: arr.map((v) => ({ type: "string", value: String(v) })),
        };
      }
      return;
    }

    // Amount Filter (Units to Cents + Positive/Negative match)
    if (key === "amount") {
      const nums = (Array.isArray(value) ? value : [value]).map(Number).filter((
        n,
      ) => !isNaN(n));
      if (nums.length === 1) {
        const cents = Math.abs(nums[0]) * 100;
        parsed[key] = {
          $in: [{ type: "number", value: String(cents) }, {
            type: "number",
            value: String(-cents),
          }],
        };
      } else if (nums.length >= 2) {
        const [a, b] = [Math.abs(nums[0]) * 100, Math.abs(nums[1]) * 100];
        const min = Math.min(a, b), max = Math.max(a, b);
        parsed.$or = [
          {
            amount: {
              $gte: { type: "number", value: String(min) },
              $lte: { type: "number", value: String(max) },
            },
          },
          {
            amount: {
              $gte: { type: "number", value: String(-max) },
              $lte: { type: "number", value: String(-min) },
            },
          },
        ];
      }
      return;
    }

    // Date Filters (createdAt / updatedAt)
    if (
      (key === "createdAt" || key === "updatedAt") && Array.isArray(value) &&
      value.length
    ) {
      const dateQ: Record<string, unknown> = {};
      if (value[0]) {
        dateQ.$gte = { type: "date", value: new Date(value[0]).toISOString() };
      }
      const toDate = value[1]
        ? new Date(value[1])
        : value[0]
        ? new Date(value[0])
        : null;
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        dateQ.$lte = { type: "date", value: toDate.toISOString() };
      }
      parsed[key] = dateQ;
      return;
    }

    parsed[key] = {
      $eq: {
        type: typeof value === "number" ? "number" : "string",
        value: String(value),
      },
    };
  });

  return Object.keys(parsed).length ? parsed : undefined;
}

export function TransactionHistory(
  { fields = walletLedgerFields }: { fields?: TField[] },
) {
  const { t, i18n } = useTranslation();
  const [activeFilters, setActiveFilters] = useState<
    TFilterValue | undefined
  >();

  const query = useMemo(() => {
    const filters = parseFilterToBackendQuery(activeFilters);
    return { sort: { createdAt: -1 }, ...(filters && { filters }) };
  }, [activeFilters]);

  const ledgerRequest = useMemo(() => getWalletLedgers(query), [query]);
  const { data, isLoading } = use(ledgerRequest);

  const transactions = ((data as { results?: TWalletLedger[] })?.results) ?? [];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top Alignment: Dynamic Filters */}
      <div className="flex items-center gap-2">
        <Filters
          fields={fields}
          filters={activeFilters}
          onChange={setActiveFilters}
        />
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between mt-1">
        <h3 className="text-sm font-semibold text-foreground shrink-0">
          {t("Transactions")}
        </h3>
      </div>

      {/* Transaction List */}
      {isLoading && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRepeater key={i} />
          ))}
        </div>
      )}

      {!isLoading && transactions.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("No transactions to display")}
          </p>
        </div>
      )}

      {!isLoading && transactions.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {transactions.map((tx) => {
            const txType: TWalletLedger["type"] = tx.type === "credit"
              ? "credit"
              : "debit";
            const Icon = TYPE_ICONS[txType];
            let description = typeof tx.description === "string"
              ? tx.description
              : tx.purpose ?? tx.reference;

            if (tx.purpose === "wallet_transfer" && txType === "debit") {
              const target = (tx as any).oppositeTenant?.name ||
                (tx as any).oppositeWallet || t("Wallet");
              description = t("Transfer to {{target}}", { target });
            }

            return (
              <div
                key={tx._id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    TYPE_ICON_BG_CLASS[txType]
                  } ${TYPE_COLOR_CLASS[txType]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {t(TYPE_LABEL_KEYS[txType])}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                </div>

                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`text-sm font-medium ${
                      TYPE_COLOR_CLASS[txType]
                    }`}
                  >
                    {formatAmount(tx.amount, tx.currency, i18n.language)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <IconCalendarCheck className="size-3.5 text-success" />
                    <span className="text-xs text-muted-foreground">
                      {formatDateForInput(
                        tx.createdAt as TWalletLedger["createdAt"],
                      )}
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
