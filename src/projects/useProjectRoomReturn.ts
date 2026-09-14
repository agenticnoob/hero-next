import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  refreshHeroScrollLayout,
  restoreHeroReadingPosition,
} from "../experience/smoothScroll";
import type { HeroViewportSnapshot } from "../shared/viewportStore";
import {
  projectRoomEntrySelector,
  readProjectRoomReturnPosition,
  type ProjectRoomStore,
} from "./room";

export function useProjectRoomReturn(
  room: ProjectRoomStore,
  viewport: HeroViewportSnapshot,
) {
  const { returnRequested, selected } = useSyncExternalStore(
    room.subscribe,
    room.getSnapshot,
    room.getServerSnapshot,
  );
  useLayoutEffect(() => {
    if (!returnRequested) return;
    let commitFrame = 0;
    let focusFrame = 0;
    // A first visit mounts with server geometry. Let the viewport subscription
    // and the existing scroll controller settle before resolving the return.
    const layoutFrame = window.requestAnimationFrame(() => {
      refreshHeroScrollLayout();
      commitFrame = window.requestAnimationFrame(() => {
        const entry = document.querySelector<HTMLAnchorElement>(
          projectRoomEntrySelector(selected, viewport.reading),
        );
        const top = readProjectRoomReturnPosition(
          entry,
          viewport.reading,
          viewport.height,
        );
        if (top !== undefined) restoreHeroReadingPosition(top);
        // The scroll signal must reveal the chapter before a hidden entry can
        // receive focus. Keep the request alive until that React commit.
        focusFrame = window.requestAnimationFrame(() => {
          entry?.focus({ preventScroll: true });
          room.finishReturn();
        });
      });
    });
    return () => {
      window.cancelAnimationFrame(layoutFrame);
      window.cancelAnimationFrame(commitFrame);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [room, returnRequested, selected, viewport]);
}
