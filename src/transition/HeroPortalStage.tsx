import type {
  WebGLDeclaration,
  WebGLProgressSignalSource,
} from "@viselora/dom-webgl";
import { WebGLTarget, type WebGLTargetProps } from "@viselora/dom-webgl/react";
import React, {
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useHeroViewport } from "../shared/useHeroViewport";
import { getHeroChapterContent, heroSiteContent } from "../chapters/content";
import {
  heroChapterDefinitions,
  heroChapterOrder,
} from "../chapters/definitions";
import type { HeroLocale } from "../preferences/locale";
import type { HeroPortalMotionParams } from "./portalEffect";
import { heroTextPaletteDeclaration } from "./textPaletteEffect";
import {
  resolveHeroPortalRenderKey,
  heroPortalTerminalContentId,
  type HeroPortalContentId,
  type HeroPortalNarrativeContentId,
  type HeroPortalRenderKey,
  type HeroPortalSide,
} from "./portalState";

const portalDepth = 3.65;
const portalTravelViewportFraction = 0.16;
const portalMaxTravelPx = 240;

type HeroPortalPair = {
  readonly left: readonly [WebGLDeclaration, WebGLDeclaration];
  readonly right: readonly [WebGLDeclaration, WebGLDeclaration];
};

const heroPortalContentOrder = [
  "site",
  ...heroChapterOrder,
] as const satisfies readonly HeroPortalContentId[];
const portalDeclarations = new Map<HeroPortalContentId, HeroPortalPair>(
  heroPortalContentOrder.map((contentId) => [
    contentId,
    createPortalPair(contentId),
  ]),
);

export function HeroPortalStage({
  locale,
  progress,
}: {
  readonly locale: HeroLocale;
  readonly progress: WebGLProgressSignalSource;
}) {
  const renderKey = useHeroPortalRenderKey(progress);
  const viewport = useHeroViewport();
  const textKey = `${locale}:${viewport.width}:${viewport.height}:${viewport.rootFontSize}`;
  const showSite = renderKey === "site" || renderKey === "site+content";
  const activeContentId: HeroPortalNarrativeContentId | undefined =
    renderKey === "site" || renderKey === "none"
      ? undefined
      : renderKey === "site+content"
        ? heroChapterOrder[0]
        : renderKey;

  return (
    <div className="hero-portal-stage" aria-hidden="true">
      {showSite ? (
        <HeroPortalContent
          key={`${textKey}:site`}
          contentId="site"
          locale={locale}
        />
      ) : null}
      {activeContentId ? (
        <HeroPortalContent
          key={`${textKey}:${activeContentId}`}
          contentId={activeContentId}
          locale={locale}
        />
      ) : null}
    </div>
  );
}

function HeroPortalContent({
  contentId,
  locale,
}: {
  readonly contentId: HeroPortalContentId;
  readonly locale: HeroLocale;
}) {
  if (contentId === heroPortalTerminalContentId) {
    return null;
  }
  const declarations = readPortalDeclarations(contentId);

  const copy = resolvePortalCopy(contentId, locale);

  return (
    <>
      <PortalColumn
        side="left"
        webgl={declarations.left}
        primary={copy.left.primary}
        secondary={copy.left.secondary}
        secondaryClassName={copy.left.secondaryClassName}
      />
      <PortalColumn
        side="right"
        webgl={declarations.right}
        primary={copy.right.primary}
        secondary={copy.right.secondary}
        secondaryClassName={copy.right.secondaryClassName}
      />
    </>
  );
}

function PortalColumn({
  primary,
  secondary,
  secondaryClassName,
  side,
  webgl,
}: {
  readonly primary: ReactNode;
  readonly secondary: ReactNode;
  readonly secondaryClassName?: string;
  readonly side: HeroPortalSide;
  readonly webgl: readonly [WebGLDeclaration, WebGLDeclaration];
}) {
  return (
    <section className={`hero-portal-copy hero-portal-copy--${side}`}>
      <PortalText webgl={webgl[0]}>{primary}</PortalText>
      <PortalText className={secondaryClassName} webgl={webgl[1]}>
        {secondary}
      </PortalText>
    </section>
  );
}

function PortalText({
  children,
  className,
  webgl,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly webgl: WebGLDeclaration;
}) {
  const classes = ["hero-portal-line", className].filter(Boolean).join(" ");

  return (
    <WebGLTarget as="p" className={classes} webgl={webgl}>
      {children}
    </WebGLTarget>
  );
}

function useHeroPortalRenderKey(
  progress: WebGLProgressSignalSource,
): HeroPortalRenderKey {
  const subscribe = useCallback(
    (listener: () => void) =>
      progress.subscribe?.(listener) ?? (() => undefined),
    [progress],
  );
  const getSnapshot = useCallback(
    () => resolveHeroPortalRenderKey(progress),
    [progress],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => "site");
}

function createPortalPair(contentId: HeroPortalContentId): HeroPortalPair {
  return {
    left: [
      createPortalDeclaration(contentId, "left", "primary"),
      createPortalDeclaration(contentId, "left", "secondary"),
    ],
    right: [
      createPortalDeclaration(contentId, "right", "primary"),
      createPortalDeclaration(contentId, "right", "secondary"),
    ],
  };
}

function createPortalDeclaration(
  contentId: HeroPortalContentId,
  side: HeroPortalSide,
  slot: "primary" | "secondary",
): WebGLDeclaration {
  const effect = {
    kind: "hero.portal.motion",
    contentId,
    side,
    travelViewportFraction: portalTravelViewportFraction,
    maxTravelPx: portalMaxTravelPx,
    ...(contentId === "self"
      ? {
          hideAfterProgressKey: heroChapterDefinitions.self.signals.entry,
        }
      : {}),
  } satisfies HeroPortalMotionParams;

  return {
    key: `hero.portal.${contentId}.${side}.${slot}`,
    placement: { mode: "screen-depth", depth: portalDepth, size: "dom" },
    source: { kind: "dom", type: "text" },
    renderRole: "model",
    lifecycle: { hideWhenReady: true, hideMode: "self" },
    effects: [effect, heroTextPaletteDeclaration],
  } satisfies WebGLTargetProps<"p">["webgl"];
}

type PortalCopy = {
  readonly left: PortalCopyColumn;
  readonly right: PortalCopyColumn;
};

type PortalCopyColumn = {
  readonly primary: ReactNode;
  readonly secondary: ReactNode;
  readonly secondaryClassName?: string;
};

function resolvePortalCopy(
  contentId: Exclude<HeroPortalContentId, typeof heroPortalTerminalContentId>,
  locale: HeroLocale,
): PortalCopy {
  const site = heroSiteContent[locale];

  if (contentId === "site") {
    return {
      left: {
        primary: site.intro.eyebrow,
        secondary: site.intro.title,
        secondaryClassName: "hero-portal-copy__headline",
      },
      right: {
        primary: site.intro.summary,
        secondary: site.intro.hint,
      },
    };
  }

  const chapter = getHeroChapterContent(contentId, locale);

  return {
    left: {
      primary: chapter.portal.left.label,
      secondary: chapter.portal.left.body,
    },
    right: {
      primary: chapter.portal.right.label,
      secondary: chapter.portal.right.items.join("\n"),
    },
  };
}

function readPortalDeclarations(
  contentId: HeroPortalContentId,
): HeroPortalPair {
  const declarations = portalDeclarations.get(contentId);

  if (!declarations) {
    throw new Error(`Missing portal declaration for ${contentId}`);
  }

  return declarations;
}
