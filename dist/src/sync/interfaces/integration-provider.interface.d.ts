export interface SyncResult<T> {
    data: T[];
    nextCursor?: string | null;
    hasMore: boolean;
}
export interface IntegrationProvider<T> {
    getName(): string;
    fetchData(cursor?: string): Promise<SyncResult<T>>;
}
