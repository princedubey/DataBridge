export interface SyncResult<T> {
  data: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface IntegrationProvider<T> {
  /**
   * Identifies the source integration (e.g., 'hubspot', 'stripe')
   */
  getName(): string;

  /**
   * Fetches data incrementally using the provided cursor.
   * If no cursor is provided, it should behave as a full sync (or fetch from the beginning).
   * 
   * @param cursor The pagination cursor or timestamp from the last successful sync
   */
  fetchData(cursor?: string): Promise<SyncResult<T>>;
}
