export type TCardsOverride = Record<
    string,
    React.ComponentType<{
        isLoading: boolean;
        data: unknown[];
        fetcher: (projection: Record<string, 1>) => void;
    }>
>;

export type TListPagesOverride = Record<
    string,
    React.ComponentType<{ group?: string; name: string }>
>;

export type TViewsOverride = Record<
    string,
    React.ComponentType<{ data: unknown }>
>;

export type TFormsOverride = Record<
    string,
    React.ComponentType
>;
