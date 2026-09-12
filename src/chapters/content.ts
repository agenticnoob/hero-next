import { heroAxiomsContent } from "../axioms/content";
import {
  formatHeroChapterHeading,
  heroChapterDefinitions,
  type HeroChapterId,
} from "./definitions";
import type { HeroChapterLocalizedContent } from "./contentModel";
import type { ProjectRoomChapterContent } from "../projects/model";
import type { HeroLocale } from "../preferences/locale";

export const heroPublicLinks = {
  douyin:
    "https://www.douyin.com/user/MS4wLjABAAAATcqt2Tq3UxNiJz8Qg5eEHhOkdpfNuEP1KuthHYn-oIycjaF24_KxkL9pY8bgbW3Z",
  xiaohongshu:
    "https://www.xiaohongshu.com/user/profile/651c334600000000240144aa",
  bilibili: "https://space.bilibili.com/269573670",
  githubProfile: "https://github.com/agenticnoob",
  currentProject: "https://github.com/agenticnoob/dom-webgl-workspace",
  axmorfStudio: "https://github.com/AXMORF/axmorf-studio",
  syringeMeter: "https://github.com/agenticnoob/syringe-meter",
  vibeJournalPipeline: "https://github.com/agenticnoob/vibe-journal-pipeline",
  blog: "https://blog.zzzxc.com",
  leetcode: "https://leetcode.cn/u/skedush/",
} as const;

export const heroSiteContent = {
  zh: {
    ariaLabel: "noobli 的四章节 Agent-first 个人站",
    localeControlLabel: "选择语言",
    intro: {
      eyebrow: "NOOBLI / 独立构建者",
      title: "为智能体重新思考软件",
      summary: "在技术、认知与自由的交界处，构建 AI-native 系统。",
      hint: "滚动进入四个章节 · 长按四面体切换主题",
    },
    intermediateHub: "回到完整四面体，继续前往下一章。",
    profileModelLabel: "抽象个人形象",
  },
  en: {
    ariaLabel: "noobli's four-chapter agent-first personal site",
    localeControlLabel: "Choose language",
    intro: {
      eyebrow: "NOOBLI / INDEPENDENT BUILDER",
      title: "Rethinking software for agents",
      summary:
        "Building AI-native systems where technology, cognition, and freedom meet.",
      hint: "Scroll through four chapters · Hold the tetrahedron to switch theme",
    },
    intermediateHub:
      "Back at the complete tetrahedron. Continue to the next chapter.",
    profileModelLabel: "Abstract personal figure",
  },
} as const satisfies Readonly<
  Record<
    HeroLocale,
    {
      readonly ariaLabel: string;
      readonly localeControlLabel: string;
      readonly intro: {
        readonly eyebrow: string;
        readonly title: string;
        readonly summary: string;
        readonly hint: string;
      };
      readonly intermediateHub: string;
      readonly profileModelLabel: string;
    }
  >
>;

export const heroChapterContent = {
  self: {
    zh: {
      portal: {
        left: {
          label: formatHeroChapterHeading(heroChapterDefinitions.self, "来路"),
          body: "一条没有被预先写好的线，在阅读、代码与独立构建之间展开。",
        },
        right: {
          label: "沿途坐标",
          items: ["阅读与疑问", "书页与像素", "智能与自由"],
        },
      },
      body: {
        eyebrow: "SELF / NOOBLI",
        title: "我不是沿一条直线抵达这里。",
        intro:
          "以独立构建者的视角，在书页与浏览器的微光里寻找方向。让好奇心引路，让想法接受实践的检验，继续探问智能、软件与自由如何彼此照亮。",
        sections: [
          {
            label: "阅读 / 疑问",
            title: "让每一次阅读，打开一个新的问题。",
            body: "知识不必是一张通往确定答案的地图，也可以是一扇扇窗。在不同的观点之间停留，为尚未理解的事物留出空间，让判断在思考与实践中慢慢成形。",
          },
          {
            label: "代码 / 像素",
            title: "在浏览器的光里，构建可以运行的世界。",
            body: "代码把抽象变成可触碰的界面。一个布局、一次交互、一段流动的光，让想法有了形状，也让每个设计决定都能接受真实使用的检验。",
          },
          {
            label: "构建 / 实验",
            title: "把尚未确定的想法，交给一次具体的尝试。",
            body: "从一个问题出发，做出能够运行的最小作品，再观察、修正与继续。保留独立判断，也欢迎不同的反馈，让构建成为理解世界的一种方式。",
          },
          {
            label: "此刻 / 未完成",
            title: "让软件理解意图，也让自己继续改变。",
            body: "现在，我把目光投向 AI、Agent 与认知边界：尝试让系统不只执行指令，也能承接意图；同时保留人的判断、责任，以及随时改变方向的权利。",
          },
        ],
        closing: "不把身份写成终点，只把它当作下一次出发前，暂时落下的坐标。",
      },
    },
    en: {
      portal: {
        left: {
          label: formatHeroChapterHeading(
            heroChapterDefinitions.self,
            "THE WAY HERE",
          ),
          body: "An unwritten line through reading, code, and independent building.",
        },
        right: {
          label: "COORDINATES",
          items: [
            "Reading and questions",
            "Pages and pixels",
            "Intelligence and freedom",
          ],
        },
      },
      body: {
        eyebrow: "SELF / NOOBLI",
        title: "I did not arrive here in a straight line.",
        intro:
          "Looking for direction in the quiet glow of books and browsers, through the lens of an independent builder. Curiosity leads, practice tests each idea, and the question remains: how might intelligence, software, and freedom illuminate one another?",
        sections: [
          {
            label: "READING / QUESTIONS",
            title: "Let every page open a new question.",
            body: "Knowledge can be a field of windows rather than a map to certain answers. Spend time with different perspectives, leave room for what remains unclear, and let judgment take shape through thought and practice.",
          },
          {
            label: "CODE / PIXELS",
            title: "Build small worlds that can run in the browser's light.",
            body: "Code turns abstraction into touchable surfaces. A layout, an interaction, a moving patch of light gives an idea a shape and lets each design decision meet the test of actual use.",
          },
          {
            label: "BUILDING / EXPERIMENTS",
            title: "Give an uncertain idea a concrete first attempt.",
            body: "Start with a question, make the smallest working version, then observe, revise, and continue. Keep an independent judgment and welcome different feedback, treating building as a way to understand the world.",
          },
          {
            label: "NOW / UNFINISHED",
            title:
              "Let software understand intent—and let the self keep changing.",
            body: "Today I look toward AI, agents, and the edges of cognition: building systems that can carry intent, while preserving human judgment, responsibility, and the right to change direction.",
          },
        ],
        closing:
          "I do not write identity as an ending—only as a coordinate set down briefly before the next departure.",
      },
    },
  },
  axioms: heroAxiomsContent,
  builds: {
    zh: {
      portal: {
        left: {
          label: formatHeroChapterHeading(
            heroChapterDefinitions.builds,
            "构建",
          ),
          body: "从视频与网页，到测量与记录，把想法做成可以运行的东西。",
        },
        right: {
          label: "项目方向",
          items: ["视频创作", "网页视觉", "视觉测量", "开发日志"],
        },
      },
      body: {
        eyebrow: "BUILDS / SELECTED PROJECTS",
        title: "把想法，做成可以运行的东西。",
        intro:
          "这四个项目，是我在不同问题上的动手尝试：让 Agent 制作视频，让网页拥有空间，从画面读取测量结果，再把日常开发沉淀成记录。",
        sections: [
          {
            label: "视频创作",
            title: "AXMORF Studio",
            body: "一个基于 Remotion 的 Agent-first 本地视频生产工作区。让 coding Agent 从创作需求出发，组织场景、旁白与封面，经过校验和渲染，交付视频、两张封面与发布清单。项目和素材保留在用户自己的工作区中。",
            link: {
              href: heroPublicLinks.axmorfStudio,
              label: "在 GitHub 查看 AXMORF Studio",
            },
          },
          {
            label: "网页视觉",
            title: "Viselora DOM WebGL",
            body: "一个开放、可复用的 DOM-first WebGL 运行时。由 DOM 保留布局与交互语义，运行时统一管理渲染、资源、滚动与指针响应，把网页元素连接到三维视觉。你正在浏览的这个站点，也是它的一个实际应用。",
            link: {
              href: heroPublicLinks.currentProject,
              label: "在 GitHub 查看 Viselora",
            },
          },
          {
            label: "视觉测量",
            title: "SyringeMeter",
            body: "一个用于受控场景的本地针筒视觉测量原型。结合目标检测、颜色标记与活塞边缘，从摄像头画面计算容量，在桌面界面展示稳定读数和实时曲线，并支持 CSV 记录。当前面向纯黑背景下的单支带标记针筒。",
            link: {
              href: heroPublicLinks.syringeMeter,
              label: "在 GitHub 查看 SyringeMeter",
            },
          },
          {
            label: "开发日志",
            title: "vibe-journal-pipeline",
            body: "一条用 Python 标准库搭建的开发日志流水线。汇集 Hermes、Codex 与可选 OpenCode 会话，借助语言模型按日整理工作内容，生成结构化日志、技能清单与时间线，让分散的开发过程留下可回顾的记录。",
            link: {
              href: heroPublicLinks.vibeJournalPipeline,
              label: "在 GitHub 查看 vibe-journal-pipeline",
            },
          },
        ],
      },
    },
    en: {
      portal: {
        left: {
          label: formatHeroChapterHeading(
            heroChapterDefinitions.builds,
            "BUILDS",
          ),
          body: "From video and the web to measurement and journals, turning ideas into working software.",
        },
        right: {
          label: "PROJECT AREAS",
          items: [
            "Video creation",
            "Web visuals",
            "Visual measurement",
            "Dev journals",
          ],
        },
      },
      body: {
        eyebrow: "BUILDS / SELECTED PROJECTS",
        title: "Turning ideas into working software.",
        intro:
          "Four projects, four practical questions: how agents can produce videos, how web pages can gain depth, how images can become measurements, and how daily development can leave a useful record.",
        sections: [
          {
            label: "VIDEO CREATION",
            title: "AXMORF Studio",
            body: "An agent-first local video production workspace built on Remotion. A coding agent takes a creative brief through scenes, narration and covers to validation and rendering, delivering a video, two covers and a publishing manifest. Projects and media stay in the user's own workspace.",
            link: {
              href: heroPublicLinks.axmorfStudio,
              label: "View AXMORF Studio on GitHub",
            },
          },
          {
            label: "WEB VISUALS",
            title: "Viselora DOM WebGL",
            body: "An open, reusable DOM-first WebGL runtime. The DOM keeps layout and interaction semantics, while the runtime manages rendering, resources, scroll and pointer input to connect page elements with 3D visuals. The site you are browsing is one of its applications.",
            link: {
              href: heroPublicLinks.currentProject,
              label: "View Viselora on GitHub",
            },
          },
          {
            label: "VISUAL MEASUREMENT",
            title: "SyringeMeter",
            body: "A local vision-based syringe measurement prototype for controlled conditions. Object detection, color markers and the plunger edge turn camera images into volume readings, with stabilized values, live charts and CSV recording in a desktop interface. Its current scope is one marked syringe against a pure black background.",
            link: {
              href: heroPublicLinks.syringeMeter,
              label: "View SyringeMeter on GitHub",
            },
          },
          {
            label: "DEV JOURNALS",
            title: "vibe-journal-pipeline",
            body: "A development journaling pipeline built with the Python standard library. It brings together Hermes, Codex and optional OpenCode sessions, uses a language model to summarize each day's work, and produces structured journals, a skills inventory and a timeline for later reflection.",
            link: {
              href: heroPublicLinks.vibeJournalPipeline,
              label: "View vibe-journal-pipeline on GitHub",
            },
          },
        ],
      },
    },
  },
  signals: {
    zh: {
      portal: {
        left: {
          label: formatHeroChapterHeading(
            heroChapterDefinitions.signals,
            "联结",
          ),
          body: "构建之外，在文字、影像和代码中继续交流。",
        },
        right: {
          label: "公共信号",
          items: ["抖音", "小红书", "哔哩哔哩", "博客", "GitHub", "力扣"],
        },
      },
      body: {
        eyebrow: "SIGNALS / ELSEWHERE",
        title: "把未完成的思考，放进真实交流。",
        intro: "在影像里分享，在文字里沉淀，在代码里实践。",
        sections: [
          {
            label: "DOUYIN / 抖音",
            title: "抖音",
            directory: { name: "AXMORF", detail: "@Cognition_hub" },
            body: "AXMORF · 抖音号：Cognition_hub",
            link: { href: heroPublicLinks.douyin, label: "前往抖音主页" },
            image: {
              src: "/channels/douyin.jpg",
              width: 1219,
              height: 1820,
              alt: "AXMORF 的抖音账号二维码，使用抖音扫码",
            },
          },
          {
            label: "XIAOHONGSHU / 小红书",
            title: "小红书",
            directory: { name: "AXMORF", detail: "@Cognition_hub" },
            body: "AXMORF · 小红书号：Cognition_hub",
            link: {
              href: heroPublicLinks.xiaohongshu,
              label: "前往小红书主页",
            },
            image: {
              src: "/channels/xiaohongshu.jpg",
              width: 987,
              height: 1347,
              alt: "AXMORF 的小红书账号二维码，使用小红书扫码",
            },
          },
          {
            label: "BILIBILI / 哔哩哔哩",
            title: "哔哩哔哩",
            directory: { name: "AXMORF", detail: "UID 269573670" },
            body: "AXMORF · UID：269573670",
            link: { href: heroPublicLinks.bilibili, label: "前往哔哩哔哩主页" },
            image: {
              src: "/channels/bilibili.jpg",
              width: 1027,
              height: 1459,
              alt: "AXMORF 的哔哩哔哩账号二维码，使用哔哩哔哩扫码",
            },
          },
          {
            label: "文字 / WRITING",
            title: "博客",
            directory: { name: "长期思考", detail: "blog.zzzxc.com" },
            body: "记录长期思考、实践轨迹与尚未结束的问题。",
            link: { href: heroPublicLinks.blog, label: "阅读博客" },
          },
          {
            label: "代码 / OPEN SOURCE",
            title: "GitHub",
            directory: { name: "开源实践", detail: "@agenticnoob" },
            body: "可运行的实验、工具与开放项目。每一次提交，都是想法落地的痕迹。",
            link: { href: heroPublicLinks.githubProfile, label: "查看 GitHub" },
          },
          {
            label: "算法 / LEETCODE",
            title: "力扣",
            directory: { name: "算法练习", detail: "@skedush" },
            body: "skedush 的力扣主页，在一道道问题里练习拆解、推理与实现。",
            link: { href: heroPublicLinks.leetcode, label: "查看力扣主页" },
          },
        ],
        closing: "愿与同道者共研同进，或有所得，亦未可知。",
      },
    },
    en: {
      portal: {
        left: {
          label: formatHeroChapterHeading(
            heroChapterDefinitions.signals,
            "SIGNALS",
          ),
          body: "Beyond building, keep the conversation going in words, video and code.",
        },
        right: {
          label: "PUBLIC SIGNALS",
          items: [
            "Douyin",
            "Xiaohongshu",
            "Bilibili",
            "Blog",
            "GitHub",
            "LeetCode",
          ],
        },
      },
      body: {
        eyebrow: "SIGNALS / ELSEWHERE",
        title: "Put unfinished thought into real exchange.",
        intro: "Share through video. Reflect in writing. Put ideas into code.",
        sections: [
          {
            label: "DOUYIN",
            title: "Douyin",
            directory: { name: "AXMORF", detail: "@Cognition_hub" },
            body: "AXMORF · Douyin ID: Cognition_hub",
            link: {
              href: heroPublicLinks.douyin,
              label: "Visit Douyin profile",
            },
            image: {
              src: "/channels/douyin.jpg",
              width: 1219,
              height: 1820,
              alt: "AXMORF Douyin profile QR code. Scan with Douyin.",
            },
          },
          {
            label: "XIAOHONGSHU",
            title: "Xiaohongshu",
            directory: { name: "AXMORF", detail: "@Cognition_hub" },
            body: "AXMORF · Xiaohongshu ID: Cognition_hub",
            link: {
              href: heroPublicLinks.xiaohongshu,
              label: "Visit Xiaohongshu profile",
            },
            image: {
              src: "/channels/xiaohongshu.jpg",
              width: 987,
              height: 1347,
              alt: "AXMORF Xiaohongshu profile QR code. Scan with Xiaohongshu.",
            },
          },
          {
            label: "BILIBILI",
            title: "Bilibili",
            directory: { name: "AXMORF", detail: "UID 269573670" },
            body: "AXMORF · UID: 269573670",
            link: {
              href: heroPublicLinks.bilibili,
              label: "Visit Bilibili profile",
            },
            image: {
              src: "/channels/bilibili.jpg",
              width: 1027,
              height: 1459,
              alt: "AXMORF Bilibili profile QR code. Scan with Bilibili.",
            },
          },
          {
            label: "WRITING",
            title: "Blog",
            directory: { name: "Notes", detail: "blog.zzzxc.com" },
            body: "Long-form notes on practice, changing beliefs and questions that remain open.",
            link: { href: heroPublicLinks.blog, label: "Read the blog" },
          },
          {
            label: "OPEN SOURCE",
            title: "GitHub",
            directory: { name: "Open source", detail: "@agenticnoob" },
            body: "Runnable experiments, tools and open projects. Ideas made tangible, one commit at a time.",
            link: {
              href: heroPublicLinks.githubProfile,
              label: "Explore GitHub",
            },
          },
          {
            label: "ALGORITHMS / LEETCODE",
            title: "LeetCode",
            directory: { name: "Practice", detail: "@skedush" },
            body: "skedush on LeetCode. Practice reasoning and turning ideas into code.",
            link: {
              href: heroPublicLinks.leetcode,
              label: "Visit LeetCode profile",
            },
          },
        ],
        closing: "May kindred minds inquire and move forward together.",
      },
    },
  },
} as const satisfies {
  readonly [Id in HeroChapterId]: Readonly<
    Record<
      HeroLocale,
      Id extends "builds"
        ? ProjectRoomChapterContent
        : HeroChapterLocalizedContent
    >
  >;
};

export function getHeroChapterContent(
  chapterId: HeroChapterId,
  locale: HeroLocale,
): HeroChapterLocalizedContent {
  return heroChapterContent[chapterId][locale];
}
