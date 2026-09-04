import { InputOption } from "@/shared/types/node";

/**
 * Memo of options fetched from an `optionsSource`, keyed by the resolved
 * request plan (see `useInputOptions`). Shared by every input mounted under
 * one `TreegeRenderRuntimeProvider` that declares it.
 */
export interface OptionsCache {
  /** Options of a plan whose request already completed with at least one option. */
  get: (key: string) => InputOption[] | undefined;
  /**
   * Options of a plan: the memoized result when there is one, otherwise the
   * request already in flight for the same plan (so simultaneous callers
   * share a single request), otherwise a new request started with `fetch`.
   * Failures and empty results are not memoized: the next call fetches again.
   */
  resolve: (key: string, fetch: () => Promise<InputOption[]>) => Promise<InputOption[]>;
}

export const createOptionsCache = (): OptionsCache => {
  const settled = new Map<string, InputOption[]>();
  const pending = new Map<string, Promise<InputOption[]>>();

  const resolve: OptionsCache["resolve"] = (key, fetch) => {
    const memoized = settled.get(key);
    if (memoized) {
      return Promise.resolve(memoized);
    }

    const inFlight = pending.get(key);
    if (inFlight) {
      return inFlight;
    }

    const request = fetch().then(
      (options) => {
        pending.delete(key);
        if (options.length > 0) {
          settled.set(key, options);
        }
        return options;
      },
      (error: unknown) => {
        pending.delete(key);
        throw error;
      },
    );
    pending.set(key, request);

    return request;
  };

  return { get: (key) => settled.get(key), resolve };
};
