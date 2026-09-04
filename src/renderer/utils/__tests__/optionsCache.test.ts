import { describe, expect, it, vi } from "vitest";
import { createOptionsCache } from "@/renderer/utils/optionsCache";
import { InputOption } from "@/shared/types/node";

const options: InputOption[] = [{ label: { en: "France" }, value: "fr" }];

describe("createOptionsCache", () => {
  it("memoizes a completed request and serves it synchronously afterwards", async () => {
    const cache = createOptionsCache();
    const fetch = vi.fn().mockResolvedValue(options);

    await expect(cache.resolve("plan", fetch)).resolves.toBe(options);
    expect(cache.get("plan")).toBe(options);

    await expect(cache.resolve("plan", fetch)).resolves.toBe(options);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shares the request in flight between simultaneous callers", async () => {
    const cache = createOptionsCache();
    const fetch = vi.fn().mockResolvedValue(options);

    const [first, second] = await Promise.all([cache.resolve("plan", fetch), cache.resolve("plan", fetch)]);

    expect(first).toBe(options);
    expect(second).toBe(options);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not memoize failures: the next caller fetches again", async () => {
    const cache = createOptionsCache();
    const fetch = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(options);

    await expect(cache.resolve("plan", fetch)).rejects.toThrow("boom");
    expect(cache.get("plan")).toBeUndefined();

    await expect(cache.resolve("plan", fetch)).resolves.toBe(options);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not memoize empty results", async () => {
    const cache = createOptionsCache();
    const fetch = vi.fn().mockResolvedValue([]);

    await expect(cache.resolve("plan", fetch)).resolves.toEqual([]);
    expect(cache.get("plan")).toBeUndefined();

    await cache.resolve("plan", fetch);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keys entries by plan", async () => {
    const cache = createOptionsCache();
    const other: InputOption[] = [{ label: { en: "Germany" }, value: "de" }];

    await cache.resolve("a", () => Promise.resolve(options));
    await cache.resolve("b", () => Promise.resolve(other));

    expect(cache.get("a")).toBe(options);
    expect(cache.get("b")).toBe(other);
  });
});
