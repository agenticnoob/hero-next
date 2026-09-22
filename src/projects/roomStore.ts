import { projectRoomWallCount } from "./model";

export type RoomSnapshot = {
  readonly selected: number;
  readonly ready: boolean;
  readonly active: boolean;
  readonly settled: boolean;
  readonly exhibition: boolean;
  readonly returnRequested: boolean;
};
const initialRoomSnapshot: RoomSnapshot = {
  selected: 0,
  ready: false,
  active: false,
  settled: true,
  exhibition: false,
  returnRequested: false,
};

export function createProjectRoomStore() {
  let snapshot = initialRoomSnapshot;
  let directoryReturn: { slug: string; scrollTop: number } | undefined;
  let hovered = false;
  let focused = false;
  const exhibits = new Map<number, HTMLAnchorElement>();
  const listeners = new Set<() => void>();
  const publish = (next: RoomSnapshot) => {
    if (
      next.selected === snapshot.selected &&
      next.ready === snapshot.ready &&
      next.active === snapshot.active &&
      next.settled === snapshot.settled &&
      next.exhibition === snapshot.exhibition &&
      next.returnRequested === snapshot.returnRequested
    )
      return;
    snapshot = next;
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => snapshot,
    rememberDirectoryReturn(slug: string, scrollTop: number) {
      directoryReturn = { slug, scrollTop };
    },
    getDirectoryReturn: () => directoryReturn,
    finishDirectoryReturn() {
      directoryReturn = undefined;
    },
    getServerSnapshot: () => initialRoomSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    select(index: number) {
      if (snapshot.exhibition) return;
      if (!Number.isInteger(index)) return;
      const selected =
        ((index % projectRoomWallCount) + projectRoomWallCount) %
        projectRoomWallCount;
      if (selected !== snapshot.selected)
        publish({ ...snapshot, selected, settled: false });
    },
    publishFrame(
      frame: Omit<RoomSnapshot, "selected" | "exhibition" | "returnRequested">,
    ) {
      publish({ ...snapshot, ...frame });
    },
    setExhibition(exhibition: boolean) {
      publish({ ...snapshot, exhibition });
    },
    requestReturn() {
      publish({ ...snapshot, returnRequested: true });
    },
    finishReturn() {
      publish({ ...snapshot, returnRequested: false });
    },
    setHovered(value: boolean) {
      hovered = value;
    },
    setFocused(value: boolean) {
      focused = value;
    },
    registerExhibit(index: number, element: HTMLAnchorElement | null) {
      if (element) exhibits.set(index, element);
      else exhibits.delete(index);
    },
    getExhibits: (): ReadonlyMap<number, HTMLAnchorElement> => exhibits,
    pointerLocked: () => hovered || focused || snapshot.exhibition,
  };
}
export type ProjectRoomStore = ReturnType<typeof createProjectRoomStore>;
