import { useLayoutEffect, useSyncExternalStore } from "react";
import {
  refreshHeroScrollLayout,
  restoreHeroReadingPosition,
} from "../experience/smoothScroll";
import type { HeroViewportSnapshot } from "../shared/viewportStore";
import { projectRoomAnchorId, type ProjectRoomStore } from "./room";

export function useProjectRoomReturn(
  room: ProjectRoomStore,
  viewport: HeroViewportSnapshot,
) {
  const { returnRequested } = useSyncExternalStore(
    room.subscribe,
    room.getSnapshot,
    room.getServerSnapshot,
  );
  useLayoutEffect(() => {
    if (!returnRequested) return;
    let commitFrame = 0;
    // A first visit mounts with server geometry. Let the viewport subscription
    // and the existing scroll controller settle before resolving the return.
    const layoutFrame = window.requestAnimationFrame(() => {
      refreshHeroScrollLayout();
      commitFrame = window.requestAnimationFrame(() => {
        const target = viewport.reading
          ? document
              .querySelector(".hero-projects__case-link")
              ?.closest("section")
          : document.getElementById(projectRoomAnchorId);
        if (target)
          restoreHeroReadingPosition(
            window.scrollY +
              target.getBoundingClientRect().top -
              (viewport.reading ? 80 : 0),
          );
        room.finishReturn();
      });
    });
    return () => {
      window.cancelAnimationFrame(layoutFrame);
      window.cancelAnimationFrame(commitFrame);
    };
  }, [room, returnRequested, viewport]);
}
