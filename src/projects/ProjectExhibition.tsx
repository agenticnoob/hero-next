"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useHeroSiteState } from "../experience/HeroSiteState";
import {
  restoreHeroReadingPosition,
  suspendHeroScroll,
} from "../experience/smoothScroll";
import { getHeroChapterContent } from "../chapters/content";
import { ProjectShowcase } from "./ProjectShowcase";
import { ProjectDirectory } from "./ProjectDirectory";
import {
  projectRoomEntrySelector,
  readProjectRoomReturnPosition,
} from "./room";

function captureRoomReturn(trigger: HTMLElement | null, index: number) {
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
    if (top !== undefined) restoreHeroReadingPosition(top);
    target.focus({ preventScroll: true });
    if (changed)
      window.requestAnimationFrame(() => {
        if (!dialog.open && target.isConnected)
          target.focus({ preventScroll: true });
      });
  };
}

export function ProjectExhibition({ project }: { readonly project?: string }) {
  const router = useRouter();
  const { projectRoom } = useHeroSiteState();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const index = getHeroChapterContent("builds", "zh").body.sections.findIndex(
      (section) => section.showcase?.href === `/projects/${project}`,
    );
    if (index >= 0 && !projectRoom.getDirectoryReturn())
      projectRoom.select(index);
    const restoreRoom = captureRoomReturn(trigger, index);
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    const previousGutter = html.style.scrollbarGutter;
    const resume = suspendHeroScroll();
    html.style.scrollbarGutter = "stable";
    html.style.overflow = "hidden";
    projectRoom.setExhibition(true);
    element.showModal();
    element.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    return () => {
      clearTimeout(closeTimer.current);
      element.querySelector("video")?.pause();
      element.close();
      html.style.overflow = previousOverflow;
      html.style.scrollbarGutter = previousGutter;
      projectRoom.setExhibition(false);
      projectRoom.setFocused(false);
      resume();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      // Next restores the origin fragment after dialog cleanup. Restore the
      // saved room coordinate after that navigation commit, through its Lenis.
      window.requestAnimationFrame(() => {
        restoreRoom(element);
      });
    };
  }, [projectRoom, project]);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    dialog.current?.querySelector("video")?.pause();
    projectRoom.setFocused(true);
    projectRoom.setExhibition(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.back();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(() => router.back(), 240);
  };

  return (
    <dialog
      ref={dialog}
      className="project-dialog"
      data-closing={closing}
      data-lenis-prevent
      aria-labelledby="project-case-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      {project ? (
        <ProjectShowcase project={project} onClose={close} />
      ) : (
        <ProjectDirectory onClose={close} />
      )}
    </dialog>
  );
}
