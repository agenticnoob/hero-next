"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createHeroLocaleStore } from "../preferences/locale";
import { createHeroThemeStore } from "../preferences/theme";
import { createProjectRoomStore } from "../projects/room";

function createHeroSiteState() {
  return {
    locale: createHeroLocaleStore(),
    theme: createHeroThemeStore(),
    projectRoom: createProjectRoomStore(),
  };
}

const HeroSiteContext = createContext<ReturnType<
  typeof createHeroSiteState
> | null>(null);

export function HeroSiteStateProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [state] = useState(createHeroSiteState);
  return (
    <HeroSiteContext.Provider value={state}>
      {children}
    </HeroSiteContext.Provider>
  );
}

export function useHeroSiteState() {
  const state = useContext(HeroSiteContext);
  if (!state)
    throw new Error("Hero site state requires HeroSiteStateProvider.");
  return state;
}
