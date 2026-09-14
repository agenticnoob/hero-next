import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  createProjectRoomStore,
  type ProjectRoomStore,
} from "../src/projects/room";
import { useProjectRoomReturn } from "../src/projects/useProjectRoomReturn";
import type { HeroViewportSnapshot } from "../src/shared/viewportStore";

const { refreshLayout, restorePosition } = vi.hoisted(() => ({
  refreshLayout: vi.fn(),
  restorePosition: vi.fn(),
}));

vi.mock("../src/experience/smoothScroll", () => ({
  refreshHeroScrollLayout: refreshLayout,
  restoreHeroReadingPosition: restorePosition,
}));

const desktop: HeroViewportSnapshot = {
  width: 1440,
  height: 900,
  rootFontSize: 16,
  reading: false,
};
const mobile: HeroViewportSnapshot = {
  width: 390,
  height: 844,
  rootFontSize: 16,
  reading: true,
};

let host: HTMLDivElement;
let fixture: HTMLDivElement;
let root: Root;
let room: ProjectRoomStore;
let frames: Map<number, FrameRequestCallback>;
let previousScrollY: PropertyDescriptor | undefined;

function ReturnProbe({
  store,
  viewport,
}: {
  readonly store: ProjectRoomStore;
  readonly viewport: HeroViewportSnapshot;
}) {
  useProjectRoomReturn(store, viewport);
  return null;
}

function renderProbe(viewport: HeroViewportSnapshot) {
  return act(() =>
    root.render(<ReturnProbe store={room} viewport={viewport} />),
  );
}

async function nextFrame() {
  const current = [...frames];
  await act(() => {
    for (const [id, callback] of current) {
      if (!frames.delete(id)) continue;
      callback(16);
    }
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  room = createProjectRoomStore();
  frames = new Map();
  let nextFrameId = 1;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frames.delete(id);
  });
  previousScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: 32589,
  });
  host = document.createElement("div");
  fixture = document.createElement("div");
  fixture.innerHTML = `
    <span id="project-room"></span>
    <section><a class="hero-projects__case-link" href="/projects/syringe-meter">SyringeMeter</a></section>
  `;
  document.body.append(host, fixture);
  root = createRoot(host);
  vi.spyOn(
    fixture.querySelector("#project-room")!,
    "getBoundingClientRect",
  ).mockImplementation(() => new DOMRect(0, 33399 - window.scrollY, 1440, 1));
  vi.spyOn(
    fixture.querySelector("section")!,
    "getBoundingClientRect",
  ).mockImplementation(() => new DOMRect(0, 6000 - window.scrollY, 390, 480));
});

afterEach(async () => {
  await act(() => root.unmount());
  host.remove();
  fixture.remove();
  if (previousScrollY)
    Object.defineProperty(window, "scrollY", previousScrollY);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("returning from a standalone case to the project room", () => {
  test("does not refresh or scroll before a return is requested", async () => {
    await renderProbe(desktop);
    await renderProbe(mobile);
    await nextFrame();
    expect(frames.size).toBe(0);
    expect(refreshLayout).not.toHaveBeenCalled();
    expect(restorePosition).not.toHaveBeenCalled();
    expect(room.getSnapshot().returnRequested).toBe(false);
  });

  test.each([
    { label: "desktop room anchor", viewport: desktop, top: 33399 },
    {
      label: "mobile project section with header clearance",
      viewport: mobile,
      top: 5920,
    },
  ])(
    "waits for layout before restoring the $label",
    async ({ viewport, top }) => {
      await renderProbe(viewport);
      await act(() => room.requestReturn());
      expect(room.getSnapshot().returnRequested).toBe(true);
      expect(refreshLayout).not.toHaveBeenCalled();
      expect(restorePosition).not.toHaveBeenCalled();
      await nextFrame();
      expect(refreshLayout).toHaveBeenCalledOnce();
      expect(restorePosition).not.toHaveBeenCalled();
      expect(room.getSnapshot().returnRequested).toBe(true);
      await nextFrame();
      expect(restorePosition).toHaveBeenCalledExactlyOnceWith(top);
      expect(room.getSnapshot().returnRequested).toBe(false);
      await nextFrame();
      expect(frames.size).toBe(0);
      expect(restorePosition).toHaveBeenCalledOnce();
    },
  );

  test.each([false, true])(
    "replaces stale desktop work when the mobile viewport arrives (layout refreshed: %s)",
    async (layoutRefreshed) => {
      room.requestReturn();
      await renderProbe(desktop);
      if (layoutRefreshed) await nextFrame();
      const previousFrames = [...frames.keys()];
      expect(previousFrames).toHaveLength(1);
      await renderProbe(mobile);
      for (const id of previousFrames) {
        expect(window.cancelAnimationFrame).toHaveBeenCalledWith(id);
        expect(frames.has(id)).toBe(false);
      }
      await nextFrame();
      expect(restorePosition).not.toHaveBeenCalled();
      await nextFrame();
      expect(restorePosition).toHaveBeenCalledExactlyOnceWith(5920);
      expect(room.getSnapshot().returnRequested).toBe(false);
    },
  );

  test.each([false, true])(
    "cancels pending work and its subscription on unmount (layout refreshed: %s)",
    async (layoutRefreshed) => {
      room.requestReturn();
      await renderProbe(mobile);
      if (layoutRefreshed) await nextFrame();
      const pending = [...frames.keys()];
      expect(pending).toHaveLength(1);
      await act(() => root.render(null));
      for (const id of pending) {
        expect(window.cancelAnimationFrame).toHaveBeenCalledWith(id);
      }
      await nextFrame();
      expect(frames.size).toBe(0);
      expect(restorePosition).not.toHaveBeenCalled();
      expect(room.getSnapshot().returnRequested).toBe(true);
      await act(() => {
        room.finishReturn();
        room.requestReturn();
      });
      expect(frames.size).toBe(0);
    },
  );
});
