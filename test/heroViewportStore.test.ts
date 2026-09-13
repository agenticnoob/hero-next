import { afterEach, describe, expect, test, vi } from "vitest";
import { createHeroViewportStore } from "../src/shared/viewportStore";
import { heroReadingQuery } from "../src/shared/layoutTokens";

afterEach(() => {
  document.documentElement.style.removeProperty("font-size");
  vi.restoreAllMocks();
});

describe("shared viewport subscriptions", () => {
  test("updates reading mode when the input capability changes without a resize", () => {
    let frame: FrameRequestCallback | undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((next) => {
      frame = next;
      return 1;
    });
    let changed: (() => void) | undefined;
    const remove = vi.fn();
    const media = {
      matches: false,
      addEventListener: (_name: string, listener: () => void) => {
        changed = listener;
      },
      removeEventListener: remove,
    };
    vi.spyOn(window, "matchMedia").mockImplementation((query) => {
      expect(query).toBe(heroReadingQuery);
      return media as unknown as MediaQueryList;
    });
    const store = createHeroViewportStore();
    const stop = store.subscribe(vi.fn());
    expect(store.getSnapshot().reading).toBe(false);
    media.matches = true;
    changed?.();
    frame?.(0);
    expect(store.getSnapshot().reading).toBe(true);
    media.matches = false;
    changed?.();
    frame?.(0);
    expect(store.getSnapshot().reading).toBe(false);
    stop();
    expect(remove).toHaveBeenCalledWith("change", changed);
  });
  test("shares one listener, coalesces resize events and preserves unchanged snapshots", () => {
    let frame: FrameRequestCallback | undefined;
    const request = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((next) => {
        frame = next;
        return 1;
      });
    const cancel = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const store = createHeroViewportStore();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = store.subscribe(first);
    const stopSecond = store.subscribe(second);
    first.mockClear();
    second.mockClear();
    const before = store.getSnapshot();
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    expect(request).toHaveBeenCalledTimes(1);
    frame?.(0);
    expect(store.getSnapshot()).toBe(before);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(add.mock.calls.filter(([type]) => type === "resize")).toHaveLength(
      1,
    );
    stopFirst();
    expect(
      remove.mock.calls.filter(([type]) => type === "resize"),
    ).toHaveLength(0);
    stopSecond();
    expect(
      remove.mock.calls.filter(([type]) => type === "resize"),
    ).toHaveLength(1);
    expect(cancel).toHaveBeenCalled();
  });

  test("publishes root font changes without resizing and refreshes on resubscription", async () => {
    let frame: FrameRequestCallback | undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((next) => {
      frame = next;
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );
    const store = createHeroViewportStore();
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    const before = store.getSnapshot();
    document.documentElement.style.fontSize = "20px";
    await Promise.resolve();
    frame?.(0);
    expect(store.getSnapshot()).toMatchObject({
      width: before.width,
      height: before.height,
      rootFontSize: 20,
    });
    expect(store.getSnapshot()).not.toBe(before);
    expect(store.getServerSnapshot().rootFontSize).toBe(16);
    stop();
    document.documentElement.style.fontSize = "24px";
    const stopAgain = store.subscribe(listener);
    expect(store.getSnapshot().rootFontSize).toBe(24);
    stopAgain();
  });
});
