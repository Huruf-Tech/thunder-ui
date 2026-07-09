"use client";
// beui.dev/components/blocks/wallet-card

import {IconEye , IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";
import { ActionSwapText } from "./action-swap";
// import { CurrencySwitcher } from "./currency-switcher";
// import { WalletActions } from "./actions";
import { TransactionHistory } from "./transaction-history";
import { BalanceDelta } from "./balance-delta";

import { Container } from "@/core/custom/Container";
/**
 * Composed wallet overview card: a currency switcher whose trigger morphs open
 * into a full-width panel, a search icon that morphs into a search bar, a
 * rolling balance with a transient change indicator, and Send / Deposit
 * actions. Actions and search are plain callbacks — the resulting flow is left
 * to the consumer.
 */

export interface WalletCardProps {
  // currencies: WalletCurrency[];
  // currencyId?: string;
  // defaultCurrencyId?: string;
  // onCurrencyChange?: (id: string) => void;
  balance: number;
  balancePrefix?: string;
  /** Initial balance change shown in the pill before any live change. */
  defaultChange?: number;
  /** Start with the balance hidden behind dots. */
  defaultBalanceHidden?: boolean;
  onSend?: () => void;
  onDeposit?: () => void;
  onSwap?: () => void;
  onBuy?: () => void;
  searchPlaceholder?: string;
  /** Recent searches shown in the expanded search panel. */
  searchRecent?: string[];
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  /** Show an unread pulse on the notifications bell. */
  hasNotifications?: boolean;
  onNotifications?: () => void;
  className?: string;
}
export function WalletCard({
  // currencies,
  // currencyId,
  // defaultCurrencyId,
  // onCurrencyChange,
  balance,
  balancePrefix = "$",
  defaultChange,
  defaultBalanceHidden = false,
  // onSend,
  // onDeposit,
  // onSwap,
  // onBuy
}: WalletCardProps) {
  // const currencyControlled = currencyId !== undefined;
  // const [internalCurrencyId, 
    // setInternalCurrencyId
  // ] = useState(
    // defaultCurrencyId ?? currencies[0]?.id,
  // );
  const [balanceHidden, setBalanceHidden] = useState(defaultBalanceHidden);

  const shownBalance = `${balancePrefix}${balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const maskedBalance = "*".repeat(7);
  // const activeCurrencyId = currencyControlled ? currencyId : internalCurrencyId;
  // const activeCurrency =
  //   currencies.find((a) => a.id === activeCurrencyId) ?? currencies[0];

  // const handleCurrencyChange = (id: string) => {
  //   if (!currencyControlled) setInternalCurrencyId(id);
  //   onCurrencyChange?.(id);
  // };

  return (
     <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%">
      <Container className="relative flex w-full flex-col gap-3">
      {/* relative anchor so the switcher + search panels span the whole row */}
      <div className="relative flex items-center justify-between gap-2">
        {/* <CurrencySwitcher
          currencies={currencies}
          activeCurrency={activeCurrency}
          onSelect={handleCurrencyChange}
        /> */}
      </div>

      <div className="mt-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">Balance</p>
          <button
            type="button"
            onClick={() => setBalanceHidden((h) => !h)}
            aria-label={balanceHidden ? "Show balance" : "Hide balance"}
            aria-pressed={balanceHidden}
            className="text-muted-foreground outline-none transition-colors hover:text-foreground"
          >
            {balanceHidden ? (
              <IconEyeOff className="h-3.5 w-3.5" />
            ) : (
              <IconEye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        {/* One ActionSwapText swaps the number and the asterisk mask with a
            per-letter cascade — same baseline, no overlap or layout shift. */}
        <ActionSwapText
          value={balanceHidden ? "hidden" : shownBalance}
          animation="cascade"
          className="text-3xl font-semibold text-foreground"
        >
          {balanceHidden ? maskedBalance : shownBalance}
        </ActionSwapText>
        {balanceHidden ? (
          <div className="mt-2 flex h-7 items-center justify-center">
            <span className="translate-y-0.75 text-sm font-semibold text-muted-foreground leading-none tracking-[0.3em]">
              *****
            </span>
          </div>
        ) : (
          <BalanceDelta balance={balance} initialChange={defaultChange} />
        )}
      </div>

      {/* <div className="mt-8">
        <WalletActions
          onSend={onSend}
          onDeposit={onDeposit}
          onSwap={onSwap}
          onBuy={onBuy}
        />
      </div> */}

      <div className="mt-6">
        <TransactionHistory />
      </div>
      </Container>
    </div>
  );
}
