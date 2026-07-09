import { ThunderSDK } from "thunder-sdk";
import { hash } from "ohash";

const cacheTTL = parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1");

export const getWallets = (query: Record<string, unknown> = {}) => {
    return ThunderSDK.useCaching(
        ["wallets.get", query && hash(query)],
        async () => (await ThunderSDK.wallets.get({params: {}, query: {}})),
        { cacheTTL },
    );
};

export const getWalletLedgers = (query: Record<string, unknown> = {}) => {
    return ThunderSDK.useCaching(
        ["walletLedgers.get", query && hash(query)],
        async () => (await ThunderSDK.walletLedgers.get({params: {}, query: {}})),
        { cacheTTL },
    );
};
