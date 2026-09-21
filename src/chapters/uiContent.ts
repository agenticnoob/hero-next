import type { HeroLocale } from "../preferences/locale";

type HeroInterfaceContent = {
  readonly projects: {
    readonly title: string;
    readonly hint: string;
    readonly nav: string;
    readonly link: string;
    readonly previous: string;
    readonly next: string;
  };
  readonly signals: {
    readonly title: string;
    readonly visit: string;
    readonly missingLink: string;
    readonly hoverHint: string;
    readonly touchHint: string;
  };
  readonly journal: {
    readonly title: string;
    readonly tools: string;
    readonly error: string;
    readonly loading: string;
    readonly empty: string;
    readonly retry: string;
  };
};

export const heroInterfaceContent = {
  zh: {
    projects: {
      title: "项目空间",
      hint: "移向左右边缘，转向另一面。回到中央阅读。",
      nav: "选择项目",
      link: "查看项目源码",
      previous: "上一面",
      next: "下一面",
    },
    signals: {
      title: "在别处，继续",
      visit: "点击当前行前往主页 ↗",
      missingLink: "链接待补充",
      hoverHint: "移动预览 · 点击前往",
      touchHint: "点击内容，前往主页 ↗",
    },
    journal: {
      title: "每日 Timeline",
      tools: "今天用了什么",
      error: "日志暂时未能载入。",
      loading: "正在载入日志…",
      empty: "暂无开发日志。",
      retry: "重新载入",
    },
  },
  en: {
    projects: {
      title: "Project space",
      hint: "Move to either edge to turn. Return to the center to read.",
      nav: "Choose a project",
      link: "View project source",
      previous: "Previous wall",
      next: "Next wall",
    },
    signals: {
      title: "ELSEWHERE",
      visit: "Click the row to visit ↗",
      missingLink: "Link coming soon",
      hoverHint: "Move to preview · Click to visit",
      touchHint: "Tap to visit the profile ↗",
    },
    journal: {
      title: "Daily timeline",
      tools: "Tools used today",
      error: "The journal could not be loaded.",
      loading: "Loading journal…",
      empty: "No development journal yet.",
      retry: "Reload",
    },
  },
} as const satisfies Readonly<Record<HeroLocale, HeroInterfaceContent>>;

export const projectDirectoryCopy = {
  zh: {
    title: "全部项目",
    intro: "从创意到实现，持续构建与探索。",
    back: "返回项目空间",
    selected: "精选项目",
    more: "更多项目",
    source: "项目源码",
    read: "阅读项目",
    toc: "阅读目录",
    links: "继续了解",
    generated: "根据项目 README 整理",
    backToDirectory: "返回全部项目",
  },
  en: {
    title: "All projects",
    intro:
      "From ideas to working software. An ongoing collection of builds and explorations.",
    back: "Back to project space",
    selected: "Selected work",
    more: "More projects",
    source: "Project source",
    read: "Read project",
    toc: "Contents",
    links: "Explore further",
    generated: "Adapted from the project README",
    backToDirectory: "Back to all projects",
  },
} as const;
