import { act, StrictMode, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getHeroChapterContent,
  projectCaseStudies,
  type HeroProjectSlug,
  syringeMeterCaseStudy,
  syringeMeterShowcaseUi,
} from "../src/chapters/content";
import {
  HeroSiteStateProvider,
  useHeroSiteState,
} from "../src/experience/HeroSiteState";
import { useHeroLocaleState } from "../src/experience/useHeroExperienceState";
import { heroLocaleStorageKey } from "../src/preferences/locale";
import { ProjectExhibition } from "../src/projects/ProjectExhibition";
import { ProjectVideo } from "../src/projects/ProjectVideo";
import { ProjectShowcase } from "../src/projects/ProjectShowcase";
import { syringeMeterMedia } from "../src/projects/media";

const { goBack, resumeScroll, restorePosition, suspendScroll } = vi.hoisted(
  () => {
    const resumeScroll = vi.fn();
    return {
      goBack: vi.fn(),
      resumeScroll,
      restorePosition: vi.fn<(top: number) => void>(),
      suspendScroll: vi.fn(() => resumeScroll),
    };
  },
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: goBack }),
}));

vi.mock("../src/experience/smoothScroll", () => ({
  restoreHeroReadingPosition: restorePosition,
  suspendHeroScroll: suspendScroll,
}));

let host: HTMLDivElement;
let root: Root;
let siteState: ReturnType<typeof useHeroSiteState> | undefined;
let reducedMotion: boolean;
let restoreDialogMethods: () => void;
let previousOverflow: string;
let previousGutter: string;
let currentScrollTop: number;
let previousScrollY: PropertyDescriptor | undefined;
let animationFrames: FrameRequestCallback[];

function SiteStateConsumer() {
  const state = useHeroSiteState();
  const { locale, store } = useHeroLocaleState();
  useEffect(() => {
    siteState = state;
  }, [state]);
  return (
    <div data-locale-consumer>
      <output>{locale}</output>
      <button onClick={() => store.commit(locale === "zh" ? "en" : "zh")}>
        Change shared language
      </button>
    </div>
  );
}

function renderSite(children: ReactNode) {
  return act(() =>
    root.render(
      <HeroSiteStateProvider>
        <SiteStateConsumer />
        {children}
      </HeroSiteStateProvider>,
    ),
  );
}

function buttonWithText(text: string, within: ParentNode = host) {
  const button = [...within.querySelectorAll<HTMLButtonElement>("button")].find(
    (element) => element.textContent?.includes(text),
  );
  expect(button, `Expected a button containing ${text}`).toBeDefined();
  return button!;
}

async function loadMetadata(player: HTMLVideoElement) {
  Object.defineProperty(player, "readyState", { configurable: true, value: 1 });
  await act(async () => {
    player.dispatchEvent(new Event("loadedmetadata"));
    await Promise.resolve();
  });
}

async function flushAnimationFrame() {
  const callbacks = animationFrames.splice(0);
  await act(() => {
    for (const callback of callbacks) callback(16);
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  localStorage.clear();
  siteState = undefined;
  reducedMotion = false;
  currentScrollTop = 0;
  previousScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => currentScrollTop,
  });
  restorePosition.mockImplementation((top) => {
    currentScrollTop = top;
  });
  animationFrames = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    animationFrames.push(callback);
    return animationFrames.length;
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const matchMedia = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...matchMedia(query),
    matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
  }));
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(
    () => undefined,
  );
  previousOverflow = document.documentElement.style.overflow;
  previousGutter = document.documentElement.style.scrollbarGutter;
  const prototype = HTMLDialogElement.prototype;
  const showModal = Object.getOwnPropertyDescriptor(prototype, "showModal");
  const close = Object.getOwnPropertyDescriptor(prototype, "close");
  Object.defineProperty(prototype, "showModal", {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    }),
  });
  Object.defineProperty(prototype, "close", {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    }),
  });
  restoreDialogMethods = () => {
    if (showModal) Object.defineProperty(prototype, "showModal", showModal);
    else Reflect.deleteProperty(prototype, "showModal");
    if (close) Object.defineProperty(prototype, "close", close);
    else Reflect.deleteProperty(prototype, "close");
  };
});

afterEach(async () => {
  await act(() => root.unmount());
  host.remove();
  document.documentElement.style.overflow = previousOverflow;
  document.documentElement.style.scrollbarGutter = previousGutter;
  if (previousScrollY)
    Object.defineProperty(window, "scrollY", previousScrollY);
  restoreDialogMethods();
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("project case studies", () => {
  const writtenProjects: HeroProjectSlug[] = [
    "axmorf-studio",
    "viselora",
    "vibe-journal-pipeline",
  ];
  test.each(
    writtenProjects.flatMap((project) =>
      ["zh", "en"].map((locale) => ({
        project,
        locale: locale as "zh" | "en",
      })),
    ),
  )(
    "renders every paragraph and anchor for $project in $locale without unrelated media",
    async ({ project, locale }) => {
      localStorage.setItem(heroLocaleStorageKey, locale);
      await renderSite(<ProjectShowcase project={project} />);
      const copy = projectCaseStudies[project][locale];
      const article = host.querySelector("article")!;
      expect(article.querySelector("h1")?.textContent).toBe(copy.title);
      expect(article.querySelectorAll(".project-case__section")).toHaveLength(
        7,
      );
      expect(
        article.querySelector(".project-video, video, img, canvas"),
      ).toBeNull();
      const anchors = [
        ...article.querySelectorAll<HTMLAnchorElement>("aside nav a"),
      ];
      expect(anchors).toHaveLength(7);
      expect(new Set(anchors.map((a) => a.hash)).size).toBe(7);
      for (const [index, section] of copy.sections.entries()) {
        const target = article.querySelector(anchors[index].hash)!;
        expect(target.querySelector("h2")?.textContent).toBe(section.title);
        expect(
          [...target.querySelectorAll(":scope > p")].map((p) => p.textContent),
        ).toEqual(section.paragraphs);
      }
      await act(() => anchors[6].click());
      expect(document.activeElement).toBe(
        article.querySelector(anchors[6].hash),
      );
      expect(
        [
          ...article.querySelectorAll<HTMLAnchorElement>(
            ".project-case__footer a",
          ),
        ].map((a) => a.href),
      ).toEqual(copy.links.map((link) => link.href));
      const back = article.querySelector<HTMLAnchorElement>(
        ".project-case__bar > a",
      )!;
      back.addEventListener("click", (event) => event.preventDefault());
      await act(() => back.click());
      const index = getHeroChapterContent(
        "builds",
        locale,
      ).body.sections.findIndex(
        (section) => section.showcase?.href === `/projects/${project}`,
      );
      expect(siteState!.projectRoom.getSnapshot()).toMatchObject({
        selected: index,
        returnRequested: true,
      });
      const otherLocale = locale === "zh" ? "en" : "zh";
      await act(() =>
        host
          .querySelector<HTMLButtonElement>(
            `[data-hero-locale-option="${otherLocale}"]`,
          )!
          .click(),
      );
      expect(article.lang).toBe(otherLocale === "zh" ? "zh-CN" : "en");
      expect(article.textContent).toContain(
        projectCaseStudies[project][otherLocale].sections[6].paragraphs[0],
      );
    },
  );

  test.each(["zh", "en"] as const)(
    "renders the complete %s case with seven real reading destinations",
    async (locale) => {
      localStorage.setItem(heroLocaleStorageKey, locale);
      await renderSite(<ProjectShowcase project="syringe-meter" />);
      const copy = syringeMeterCaseStudy[locale];
      const article = host.querySelector("article")!;
      const links = [
        ...article.querySelectorAll<HTMLAnchorElement>("aside nav a"),
      ];
      expect(article.lang).toBe(locale === "zh" ? "zh-CN" : "en");
      expect(article.querySelector("h1")?.textContent).toBe("SyringeMeter");
      expect(links).toHaveLength(7);
      expect(article.querySelectorAll(".project-case__section")).toHaveLength(
        7,
      );
      expect(links.map((link) => link.hash)).toEqual([
        "#project-problem",
        "#project-measurement",
        "#project-reliability",
        "#project-recording",
        "#project-delivery",
        "#project-role",
        "#project-boundaries",
      ]);
      for (const [index, section] of copy.sections.entries()) {
        const target = document.getElementById(links[index].hash.slice(1))!;
        expect(target).not.toBeNull();
        expect(target.getAttribute("tabindex")).toBe("-1");
        expect(target.querySelector("h2")?.textContent).toBe(section.title);
        for (const paragraph of section.paragraphs) {
          expect(
            [...target.querySelectorAll(":scope > p")].map(
              (p) => p.textContent,
            ),
          ).toContain(paragraph);
        }
        if ("points" in section) {
          expect(
            [...target.querySelectorAll(":scope > ul > li")].map(
              (li) => li.textContent,
            ),
          ).toEqual(section.points);
        }
      }
      const pipeline = article.querySelectorAll(
        ".project-case__pipeline ol > li",
      );
      expect(pipeline).toHaveLength(6);
      for (const [index, step] of copy.pipeline.entries()) {
        expect(pipeline[index].textContent).toContain(step.title);
        expect(pipeline[index].textContent).toContain(step.detail);
      }
      expect(article.textContent).toContain(copy.introduction);
      expect(article.textContent).toContain(copy.videoCaption);
      expect(
        article.querySelector(".project-case__bar > a")?.getAttribute("href"),
      ).toBe("/#project-room");
      await act(() => links[3].click());
      expect(document.activeElement).toBe(
        document.getElementById("project-recording"),
      );
      expect(window.scrollTo).toHaveBeenCalled();
    },
  );

  test("selects SyringeMeter before returning from its standalone page to the room", async () => {
    await renderSite(<ProjectShowcase project="syringe-meter" />);
    const back = host.querySelector<HTMLAnchorElement>(
      ".project-case__bar > a",
    )!;
    expect(back.getAttribute("href")).toBe("/#project-room");
    expect(siteState!.projectRoom.getSnapshot().selected).toBe(0);
    back.addEventListener("click", (event) => event.preventDefault());
    await act(() => back.click());
    expect(siteState!.projectRoom.getSnapshot().selected).toBe(2);
    expect(siteState!.projectRoom.getSnapshot().returnRequested).toBe(true);
  });

  test("shares locale changes between the case and another consumer without remounting content", async () => {
    await renderSite(<ProjectShowcase project="syringe-meter" />);
    const originalSection = host.querySelector("#project-measurement");
    expect(
      host.querySelector("[data-locale-consumer] output")?.textContent,
    ).toBe("zh");
    await act(() =>
      host
        .querySelector<HTMLButtonElement>('[data-hero-locale-option="en"]')!
        .click(),
    );
    expect(
      host.querySelector("[data-locale-consumer] output")?.textContent,
    ).toBe("en");
    expect(host.querySelector("article")?.lang).toBe("en");
    expect(host.textContent).toContain(
      syringeMeterCaseStudy.en.sections[1].paragraphs[0],
    );
    expect(localStorage.getItem(heroLocaleStorageKey)).toBe("en");
    expect(host.querySelector("#project-measurement")).toBe(originalSection);
    await act(() => buttonWithText("Change shared language").click());
    expect(host.querySelector("article")?.lang).toBe("zh-CN");
    expect(host.textContent).toContain(
      syringeMeterCaseStudy.zh.sections[1].paragraphs[0],
    );
    expect(
      host
        .querySelector('[data-hero-locale-option="zh"]')
        ?.getAttribute("aria-pressed"),
    ).toBe("true");
  });
});

describe("on-demand project video", () => {
  test("loads a preview only on request, switches to the full film and seeks within it", async () => {
    await act(() => root.render(<ProjectVideo locale="zh" />));
    expect(host.querySelector("video[src], source[src]")).toBeNull();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    await act(() =>
      buttonWithText(syringeMeterCaseStudy.zh.previewLabel).click(),
    );
    const preview = host.querySelector("video")!;
    expect(preview.getAttribute("src")).toBe(syringeMeterMedia.preview);
    expect(preview.controls).toBe(true);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    await loadMetadata(preview);
    expect(preview.currentTime).toBe(0);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    await act(() => buttonWithText(syringeMeterCaseStudy.zh.fullLabel).click());
    const full = host.querySelector("video")!;
    expect(full.getAttribute("src")).toBe(syringeMeterMedia.full);
    await loadMetadata(full);
    expect(full.currentTime).toBe(0);
    const chapterButtons =
      host.querySelectorAll<HTMLButtonElement>("nav button");
    expect(chapterButtons).toHaveLength(3);
    for (const [index, expectedTime] of [18, 66, 166].entries()) {
      await act(() => chapterButtons[index].click());
      expect(host.querySelector("video")).toBe(full);
      expect(full.currentTime).toBe(expectedTime);
    }
    await act(() =>
      buttonWithText(syringeMeterCaseStudy.zh.previewLabel).click(),
    );
    const replay = host.querySelector("video")!;
    expect(replay.getAttribute("src")).toBe(syringeMeterMedia.preview);
    await loadMetadata(replay);
    expect(replay.currentTime).toBe(0);
  });

  test("can open a chapter directly and waits for its metadata before seeking", async () => {
    await act(() => root.render(<ProjectVideo locale="en" />));
    const chapter = host.querySelectorAll<HTMLButtonElement>("nav button")[2];
    await act(() => chapter.click());
    const player = host.querySelector("video")!;
    expect(player.getAttribute("src")).toBe(syringeMeterMedia.full);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    await loadMetadata(player);
    expect(player.currentTime).toBe(166);
  });

  test("keeps a usable file link when playback is rejected, then clears the error on a new choice", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new Error("Playback denied"),
    );
    await act(() => root.render(<ProjectVideo locale="en" />));
    await act(() => buttonWithText(syringeMeterCaseStudy.en.fullLabel).click());
    await loadMetadata(host.querySelector("video")!);
    const status = host.querySelector('[role="status"]')!;
    expect(status.textContent).toContain(
      syringeMeterShowcaseUi.en.playbackError,
    );
    expect(status.querySelector("a")?.getAttribute("href")).toBe(
      syringeMeterMedia.full,
    );
    expect(status.querySelector("a")?.textContent).toContain(
      syringeMeterShowcaseUi.en.openVideo,
    );
    await act(() =>
      buttonWithText(syringeMeterCaseStudy.en.previewLabel).click(),
    );
    expect(host.querySelector('[role="status"]')).toBeNull();
  });

  test("offers the preview file when a media loading error occurs", async () => {
    await act(() => root.render(<ProjectVideo locale="zh" />));
    await act(() =>
      buttonWithText(syringeMeterCaseStudy.zh.previewLabel).click(),
    );
    await act(() =>
      host.querySelector("video")!.dispatchEvent(new Event("error")),
    );
    expect(host.querySelector('[role="status"] a')?.getAttribute("href")).toBe(
      syringeMeterMedia.preview,
    );
  });
});

describe("project exhibition lifecycle", () => {
  test.each([
    {
      direction: "desktop to mobile",
      project: "syringe-meter" as const,
      index: 2,
      sectionTop: 6000,
      startedDesktop: true,
      savedTop: 33399,
      navigationTop: 8800,
      expectedTop: 5920,
    },
    {
      direction: "mobile to desktop",
      project: "syringe-meter" as const,
      index: 2,
      sectionTop: 6000,
      startedDesktop: false,
      savedTop: 5920,
      navigationTop: 32589,
      expectedTop: 33399,
    },
    {
      direction: "desktop to the last short mobile card",
      project: "vibe-journal-pipeline" as const,
      index: 3,
      sectionTop: 7490,
      startedDesktop: true,
      savedTop: 33399,
      navigationTop: 8800,
      expectedTop: 6955,
    },
  ])(
    "returns to the corresponding entry inside the reading range after $direction",
    async ({
      project,
      index,
      sectionTop,
      startedDesktop,
      savedTop,
      navigationTop,
      expectedTop,
    }) => {
      const width = Object.getOwnPropertyDescriptor(window, "innerWidth")!;
      const height = Object.getOwnPropertyDescriptor(window, "innerHeight")!;
      const space = document.createElement("div");
      space.className = "hero-space";
      space.innerHTML = `
        <div class="hero-projects">
          <span id="project-room"></span>
          <section><a class="hero-projects__case-link" data-project-index="0" href="/projects/axmorf-studio">Another project</a></section>
          <a class="hero-projects__exhibit" data-project-index="0" href="/projects/axmorf-studio">Another wall</a>
          <section>
            <h3>SyringeMeter</h3>
            <a class="hero-projects__case-link" data-project-index="${index}" href="/projects/${project}">Read project</a>
          </section>
          <a class="hero-projects__exhibit" data-project-index="${index}" href="/projects/${project}">Enter exhibition</a>
        </div>
        <button>Navigation focus</button>
      `;
      document.body.append(space);
      const room = space.querySelector<HTMLElement>(".hero-projects")!;
      const mobileEntry = space.querySelector<HTMLAnchorElement>(
        `.hero-projects__case-link[data-project-index="${index}"]`,
      )!;
      const desktopEntry = space.querySelector<HTMLAnchorElement>(
        `.hero-projects__exhibit[data-project-index="${index}"]`,
      )!;
      let roomHeight = 0;
      vi.spyOn(room, "getBoundingClientRect").mockImplementation(
        () => new DOMRect(0, 5200 - window.scrollY, 390, roomHeight),
      );
      Object.defineProperty(room, "offsetHeight", { get: () => roomHeight });
      vi.spyOn(
        mobileEntry.closest("section")!,
        "getBoundingClientRect",
      ).mockImplementation(
        () => new DOMRect(0, sectionTop - window.scrollY, 390, 480),
      );
      vi.spyOn(
        space.querySelector("#project-room")!,
        "getBoundingClientRect",
      ).mockImplementation(
        () => new DOMRect(0, 33399 - window.scrollY, 1440, 1),
      );
      const changeLayout = (desktop: boolean) => {
        Object.defineProperties(window, {
          innerWidth: { configurable: true, value: desktop ? 1440 : 390 },
          innerHeight: { configurable: true, value: desktop ? 900 : 844 },
        });
        space.setAttribute("data-reading-layout", String(!desktop));
        roomHeight = desktop ? 5000 : 2600;
        mobileEntry.hidden = desktop;
        desktopEntry.hidden = !desktop;
      };
      try {
        changeLayout(startedDesktop);
        currentScrollTop = savedTop;
        const originalEntry = startedDesktop ? desktopEntry : mobileEntry;
        originalEntry.focus();
        await renderSite(<ProjectExhibition project={project} />);
        changeLayout(!startedDesktop);
        const visibleEntry = startedDesktop ? mobileEntry : desktopEntry;
        await act(() => root.render(null));
        currentScrollTop = navigationTop;
        expect(restorePosition).not.toHaveBeenCalled();
        await flushAnimationFrame();
        expect(restorePosition).toHaveBeenCalledExactlyOnceWith(expectedTop);
        expect(window.scrollY).toBe(expectedTop);
        expect(visibleEntry.hidden).toBe(false);
        expect(document.activeElement).toBe(visibleEntry);
        space.querySelector("button")!.focus();
        await flushAnimationFrame();
        expect(document.activeElement).toBe(visibleEntry);
        expect(restorePosition).toHaveBeenCalledOnce();
      } finally {
        space.remove();
        Object.defineProperty(window, "innerWidth", width);
        Object.defineProperty(window, "innerHeight", height);
      }
    },
  );

  test("restores the saved room position and trigger after navigation overwrites both", async () => {
    reducedMotion = true;
    currentScrollTop = 33399;
    const trigger = document.createElement("button");
    const fragmentTarget = document.createElement("h2");
    fragmentTarget.tabIndex = -1;
    document.body.append(trigger, fragmentTarget);
    trigger.focus();
    try {
      await renderSite(<ProjectExhibition project="syringe-meter" />);
      await act(() =>
        buttonWithText(syringeMeterCaseStudy.zh.backLabel).click(),
      );
      expect(goBack).toHaveBeenCalledOnce();
      await act(() => root.render(null));
      expect(restorePosition).not.toHaveBeenCalled();
      currentScrollTop = 32589;
      fragmentTarget.focus();
      expect(document.activeElement).toBe(fragmentTarget);
      await flushAnimationFrame();
      expect(restorePosition).toHaveBeenCalledExactlyOnceWith(33399);
      expect(window.scrollY).toBe(33399);
      expect(document.activeElement).toBe(trigger);
    } finally {
      trigger.remove();
      fragmentTarget.remove();
    }
  });

  test("does not restore an old position or focus after its trigger leaves the document", async () => {
    currentScrollTop = 33399;
    const trigger = document.createElement("button");
    const destination = document.createElement("button");
    document.body.append(trigger, destination);
    trigger.focus();
    const focusTrigger = vi.spyOn(trigger, "focus");
    try {
      await renderSite(<ProjectExhibition project="syringe-meter" />);
      await act(() => root.render(null));
      trigger.remove();
      focusTrigger.mockClear();
      currentScrollTop = 32589;
      destination.focus();
      await flushAnimationFrame();
      expect(restorePosition).not.toHaveBeenCalled();
      expect(focusTrigger).not.toHaveBeenCalled();
      expect(window.scrollY).toBe(32589);
      expect(document.activeElement).toBe(destination);
    } finally {
      trigger.remove();
      destination.remove();
    }
  });

  test("ignores a stale cleanup frame when Strict Mode reopens the dialog", async () => {
    currentScrollTop = 33399;
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    try {
      await act(() =>
        root.render(
          <StrictMode>
            <HeroSiteStateProvider>
              <ProjectExhibition project="syringe-meter" />
            </HeroSiteStateProvider>
          </StrictMode>,
        ),
      );
      const dialog = host.querySelector("dialog")!;
      expect(dialog.showModal).toHaveBeenCalledTimes(2);
      expect(dialog.open).toBe(true);
      const heading = dialog.querySelector("h1");
      expect(document.activeElement).toBe(heading);
      await flushAnimationFrame();
      expect(restorePosition).not.toHaveBeenCalled();
      expect(dialog.open).toBe(true);
      expect(document.activeElement).toBe(heading);
      expect(document.documentElement.style.overflow).toBe("hidden");
    } finally {
      trigger.remove();
    }
  });

  test("opens a modal, locks the room, and restores scrolling and trigger focus on unmount", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    document.documentElement.style.overflow = "scroll";
    document.documentElement.style.scrollbarGutter = "auto";
    try {
      await renderSite(<ProjectExhibition project="syringe-meter" />);
      const dialog = host.querySelector("dialog")!;
      expect(dialog.open).toBe(true);
      expect(dialog.showModal).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(dialog.querySelector("h1"));
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.documentElement.style.scrollbarGutter).toBe("stable");
      expect(suspendScroll).toHaveBeenCalledOnce();
      const room = siteState!.projectRoom;
      expect(room.getSnapshot().exhibition).toBe(true);
      expect(room.pointerLocked()).toBe(true);
      const selected = room.getSnapshot().selected;
      room.select(selected + 1);
      expect(room.getSnapshot().selected).toBe(selected);
      await act(() =>
        buttonWithText(syringeMeterCaseStudy.zh.previewLabel).click(),
      );
      const player = dialog.querySelector("video")!;
      await loadMetadata(player);
      await act(() => root.render(null));
      expect(player.pause).toHaveBeenCalled();
      expect(dialog.open).toBe(false);
      expect(document.documentElement.style.overflow).toBe("scroll");
      expect(document.documentElement.style.scrollbarGutter).toBe("auto");
      expect(room.getSnapshot().exhibition).toBe(false);
      expect(room.pointerLocked()).toBe(false);
      expect(resumeScroll).toHaveBeenCalledOnce();
      expect(document.activeElement).toBe(trigger);
    } finally {
      trigger.remove();
    }
  });

  test("returns through router history after its close transition", async () => {
    vi.useFakeTimers();
    await renderSite(<ProjectExhibition project="syringe-meter" />);
    await act(() => buttonWithText(syringeMeterCaseStudy.zh.backLabel).click());
    expect(goBack).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(240));
    expect(goBack).toHaveBeenCalledOnce();
    await act(() => root.render(null));
    expect(resumeScroll).toHaveBeenCalledOnce();
  });

  test("handles the browser's Escape cancel event without a motion delay when reduced motion is enabled", async () => {
    reducedMotion = true;
    await renderSite(<ProjectExhibition project="syringe-meter" />);
    const cancel = new Event("cancel", { cancelable: true });
    await act(() => host.querySelector("dialog")!.dispatchEvent(cancel));
    expect(cancel.defaultPrevented).toBe(true);
    expect(goBack).toHaveBeenCalledOnce();
    await act(() => root.render(null));
    expect(resumeScroll).toHaveBeenCalledOnce();
    expect(document.documentElement.style.overflow).toBe(previousOverflow);
  });

  test.each(["cancel", "return button"] as const)(
    "goes back only once for repeated %s requests with reduced motion",
    async (action) => {
      reducedMotion = true;
      await renderSite(<ProjectExhibition project="syringe-meter" />);
      const dialog = host.querySelector("dialog")!;
      const back = buttonWithText(syringeMeterCaseStudy.zh.backLabel);
      await act(() => {
        for (let attempt = 0; attempt < 2; attempt++) {
          if (action === "cancel") {
            dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
          } else {
            back.click();
          }
        }
      });
      expect(goBack).toHaveBeenCalledOnce();
      await act(() => root.render(null));
      expect(resumeScroll).toHaveBeenCalledOnce();
    },
  );

  test("cancels a pending history change when the exhibition unmounts during closing", async () => {
    vi.useFakeTimers();
    await renderSite(<ProjectExhibition project="syringe-meter" />);
    await act(() => buttonWithText(syringeMeterCaseStudy.zh.backLabel).click());
    await act(() => root.render(null));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(goBack).not.toHaveBeenCalled();
    expect(resumeScroll).toHaveBeenCalledOnce();
  });
});
