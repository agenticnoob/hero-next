export const projectRoomAnchorId = "project-room";

export function projectRoomEntrySelector(index: number, reading: boolean) {
  const className = reading
    ? "hero-projects__case-link"
    : "hero-projects__exhibit";
  return `.${className}[data-project-index="${index}"]`;
}

export function readProjectRoomReturnPosition(
  entry: HTMLElement | null,
  reading: boolean,
  viewportHeight: number,
): number | undefined {
  const anchor = reading
    ? entry?.closest("section")
    : document.getElementById(projectRoomAnchorId);
  if (!anchor) return;
  const top = window.scrollY + anchor.getBoundingClientRect().top;
  if (!reading) return top;
  const bounds = entry?.closest(".hero-projects")?.getBoundingClientRect();
  if (!bounds) return;
  // A short final card cannot be aligned to the top without entering the
  // chapter's exit runway. Keep both ends inside its visible reading range.
  const start = window.scrollY + bounds.top + 1;
  const end = window.scrollY + bounds.bottom - viewportHeight - 1;
  return Math.max(start, Math.min(top - 80, end));
}

export function captureRoomReturn(
  trigger: HTMLElement | null,
  index: number,
  restorePosition: (top: number) => void,
) {
  const scrollTop = window.scrollY;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const room = document.querySelector<HTMLElement>(".hero-projects");
  const roomHeight = room?.offsetHeight;
  return (dialog: HTMLDialogElement) => {
    if (dialog.open) return;
    const changed =
      width !== window.innerWidth ||
      height !== window.innerHeight ||
      roomHeight !== room?.offsetHeight;
    const reading =
      document
        .querySelector(".hero-space")
        ?.getAttribute("data-reading-layout") === "true";
    const target = changed
      ? document.querySelector<HTMLElement>(
          index < 0
            ? `[data-project-directory-entry="${reading ? "reading" : "desktop"}"]`
            : projectRoomEntrySelector(index, reading),
        )
      : trigger;
    if (!target?.isConnected) return;
    const top = changed
      ? readProjectRoomReturnPosition(target, reading, window.innerHeight)
      : scrollTop;
    if (top !== undefined) restorePosition(top);
    target.focus({ preventScroll: true });
    if (changed)
      window.requestAnimationFrame(() => {
        if (!dialog.open && target.isConnected)
          target.focus({ preventScroll: true });
      });
  };
}
