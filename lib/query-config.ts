/**
 * Polling interval for data a partner can change from another device (couple workspace).
 * 30 s plus refresh-on-focus keeps both partners in sync without flooding the free Render instance
 * (it used to be 4-5 s across ~7 queries, i.e. ~90 requests per minute per open tab).
 */
export const SHARED_DATA_REFETCH_MS = 30_000;
