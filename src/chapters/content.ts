import { heroAxiomsContent } from "../axioms/content";
import {
  formatHeroChapterHeading,
  heroChapterDefinitions,
  type HeroChapterId,
} from "./definitions";
import type {
  HeroChapterLocalizedContent,
  HeroProjectCaseStudy,
} from "./contentModel";
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
    themeControlLabel: "反转配色",
    intro: {
      eyebrow: "NOOBLI / 独立构建者",
      title: "为智能体重新思考软件",
      summary:
        "与 Agent 一起开发应用、连接工具，让想法成为可以运行和验证的作品。",
      hint: "滚动进入四个章节 · 长按四面体切换主题",
      readingHint: "滚动进入四个章节 · 右上角按钮切换主题",
    },
    intermediateHub: "回到完整四面体，继续前往下一章。",
    profileModelLabel: "抽象个人形象",
  },
  en: {
    ariaLabel: "noobli's four-chapter agent-first personal site",
    localeControlLabel: "Choose language",
    themeControlLabel: "Invert colors",
    intro: {
      eyebrow: "NOOBLI / INDEPENDENT BUILDER",
      title: "Rethinking software for agents",
      summary:
        "Building applications and connecting tools with agents, turning ideas into work that can run and be verified.",
      hint: "Scroll through four chapters · Hold the tetrahedron to switch theme",
      readingHint:
        "Scroll through four chapters · Use the theme button at the top right",
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
      readonly themeControlLabel: string;
      readonly intro: {
        readonly eyebrow: string;
        readonly title: string;
        readonly summary: string;
        readonly hint: string;
        readonly readingHint: string;
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
          body: "从一个真实问题出发，和 AI 一起做出作品，再把经验变成下一次构建的方法。",
        },
        right: {
          label: "我在做什么",
          items: ["AI 应用与自动化", "全栈构建与交付", "Agent 协作与验证"],
        },
      },
      body: {
        eyebrow: "SELF / NOOBLI",
        title: "把想法做成作品，也把方法留下来。",
        intro:
          "我是 noobli，一名面向 AI 应用的独立构建者。我围绕自己的需求，与 Agent 一起开发软件、连接工具、验证结果。从视频生产到全栈应用，我关心一个想法怎样真正运行起来，以及下一次能否做得更好。",
        sections: [
          {
            label: "作品 / 从零到可用",
            title: "这个网站，也建立在我自己发布的工具上。",
            body: "我主导构建并发布了 Viselora，让 DOM 内容与 WebGL 视觉通过公开接口协作；你正在浏览的网站就是它的实际应用。另一个项目 AXMORF Studio，把视频创作组织成 Agent 能参与、程序能校验的生产流程。",
          },
          {
            label: "全栈 / 走完交付",
            title: "从页面和接口，一直做到数据与部署。",
            body: "在庐居项目中，我与 Agent 一起贯通选房、报价、预订和入住流程，把服务与数据库部署到 Ubuntu 演示环境。也探索了本地视觉测量、文档问答与开发日志流水线。每个项目都明确记录做到哪里、验证过什么。",
          },
          {
            label: "探索 / 工具判断",
            title: "先弄清问题，再选择当下合适的工具。",
            body: "许多工具是我在与 AI 讨论、查阅官方资料和尝试开源项目时逐步认识的。我先比较可选路径，再用小任务试验；效果不合适就调整。我并不精通每一种工具，但愿意深入关键环节，持续更新自己的判断。",
          },
          {
            label: "协作 / 工程习惯",
            title: "让 Agent 接得上，也让结果经得起检查。",
            body: "我在独立的 Mac 用户环境与专用 Ubuntu 主机上开展 Agent 工作，通过 Tailscale 远程连接。把反复使用的方法整理为 Skills，维护代码边界、项目文档和验证流程；AI 参与执行，我负责目标、取舍与最终验收。",
          },
        ],
        closing:
          "对我来说，AI 时代的能力，体现在提出的问题、做出的作品，以及不断修正方法的过程里。",
      },
    },
    en: {
      portal: {
        left: {
          label: formatHeroChapterHeading(
            heroChapterDefinitions.self,
            "THE WAY HERE",
          ),
          body: "Start with a real problem, build with AI, and carry what worked into the next project.",
        },
        right: {
          label: "WHAT I WORK ON",
          items: [
            "AI applications and automation",
            "Full-stack delivery",
            "Agent collaboration and verification",
          ],
        },
      },
      body: {
        eyebrow: "SELF / NOOBLI",
        title: "Build something real. Keep what it teaches you.",
        intro:
          "I’m noobli, an independent builder focused on AI applications. I work with agents to develop software, connect tools, and verify results for problems I encounter. From video production to full-stack applications, I care about getting an idea to work—and learning how to build the next one better.",
        sections: [
          {
            label: "PROJECTS / IDEA TO USE",
            title: "This site runs on a tool I built and published.",
            body: "I led the development and publication of Viselora, a runtime connecting DOM content and WebGL visuals through public APIs. This website puts it to use. Another project, AXMORF Studio, organizes video production into creative tasks for agents and verifiable steps for software.",
          },
          {
            label: "FULL STACK / DELIVERY",
            title: "From pages and APIs to data and deployment.",
            body: "For Luju Living, I worked with agents on room selection, quotes, bookings, and check-in, deploying the service and database to an Ubuntu demo environment. I also explore local vision measurement, document Q&A, and development-journal pipelines. Each project records its progress and verification limits.",
          },
          {
            label: "EXPLORATION / JUDGMENT",
            title: "Understand the problem, then choose the tools.",
            body: "I discover tools through conversations with AI, official documentation, and open-source experiments. I compare approaches and try small tasks before committing, changing direction when the results call for it. I don’t claim mastery of every tool; I learn the parts that matter and keep revising my judgment.",
          },
          {
            label: "COLLABORATION / ENGINEERING",
            title: "Give agents context. Give results a check.",
            body: "I use a separate Mac user environment and a dedicated Ubuntu machine, connected remotely through Tailscale. I turn recurring methods into Skills and maintain code boundaries, project documentation, and verification steps. AI helps execute; I own the goals, tradeoffs, and final acceptance.",
          },
        ],
        closing:
          "For me, capability in the AI era shows in the questions we ask, the work we deliver, and the methods we keep improving.",
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
            body: "基于 Remotion 的本地视频生产工作区。让 Agent 组织场景、旁白与封面，经过校验和渲染，交付视频、两张封面与发布清单。",
            showcase: {
              href: "/projects/axmorf-studio",
              label: "进入项目 · 阅读案例",
            },
            link: {
              href: heroPublicLinks.axmorfStudio,
              label: "在 GitHub 查看 AXMORF Studio",
            },
          },
          {
            label: "网页视觉",
            title: "Viselora DOM WebGL",
            body: "让网页内容连接三维视觉的 DOM-first WebGL 运行时。保留 DOM 布局与交互语义，统一管理渲染、资源与输入。这个站点也是它的实际应用。",
            showcase: {
              href: "/projects/viselora",
              label: "进入项目 · 阅读案例",
            },
            link: {
              href: heroPublicLinks.currentProject,
              label: "在 GitHub 查看 Viselora",
            },
          },
          {
            label: "视觉测量",
            title: "SyringeMeter",
            body: "在受控场景中，将摄像头里的针筒画面转化为稳定容量读数、实时曲线与 CSV 记录的本地桌面应用。",
            showcase: {
              href: "/projects/syringe-meter",
              label: "进入项目 · 观看演示",
            },
            link: {
              href: heroPublicLinks.syringeMeter,
              label: "在 GitHub 查看 SyringeMeter",
            },
          },
          {
            label: "开发日志",
            title: "vibe-journal-pipeline",
            body: "用 Python 标准库汇集 Hermes、Codex 与可选 OpenCode 会话，按日生成结构化日志、技术清单与时间线，为网站提供经过筛选的公开记录。",
            showcase: {
              href: "/projects/vibe-journal-pipeline",
              label: "进入项目 · 阅读案例",
            },
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
            body: "A local video production workspace built on Remotion. An agent organizes scenes, narration and covers, then validation and rendering produce a video, two covers and a publishing manifest.",
            showcase: {
              href: "/projects/axmorf-studio",
              label: "Explore the project · Read the case",
            },
            link: {
              href: heroPublicLinks.axmorfStudio,
              label: "View AXMORF Studio on GitHub",
            },
          },
          {
            label: "WEB VISUALS",
            title: "Viselora DOM WebGL",
            body: "A DOM-first WebGL runtime connecting web content with 3D visuals. It preserves DOM layout and interaction semantics while managing rendering, resources and input. This site is one of its applications.",
            showcase: {
              href: "/projects/viselora",
              label: "Explore the project · Read the case",
            },
            link: {
              href: heroPublicLinks.currentProject,
              label: "View Viselora on GitHub",
            },
          },
          {
            label: "VISUAL MEASUREMENT",
            title: "SyringeMeter",
            body: "A local desktop application that turns camera images of a syringe into stable volume readings, live charts and CSV records under controlled conditions.",
            showcase: {
              href: "/projects/syringe-meter",
              label: "Explore project · Watch demo",
            },
            link: {
              href: heroPublicLinks.syringeMeter,
              label: "View SyringeMeter on GitHub",
            },
          },
          {
            label: "DEV JOURNALS",
            title: "vibe-journal-pipeline",
            body: "A Python standard-library pipeline that brings Hermes, Codex and optional OpenCode sessions into daily journals, a technology inventory and a timeline, with selected public records feeding this site.",
            showcase: {
              href: "/projects/vibe-journal-pipeline",
              label: "Explore the project · Read the case",
            },
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

export const syringeMeterCaseStudy = {
  zh: {
    eyebrow: "计算机视觉 / 桌面应用 · v0.2.0 MVP",
    title: "SyringeMeter",
    subtitle: "从摄像头画面，到稳定读数与可追溯的记录。",
    introduction:
      "一个在本地 CPU 上运行的针筒视觉测量应用。定位、方向、量程和活塞位置共同生成连续容量读数，再接上实时曲线和由用户控制的 CSV 记录。这份案例记录了一个视觉原型如何走到桌面交互、失败处理与 Windows 分发。",
    previewLabel: "效果预览 · 17 秒",
    fullLabel: "完整演示 · 3:13",
    videoCaption:
      "演示录制于 macOS，以 Python 源码运行，展示该次运行中的可见行为。Windows 安装包的验证范围见文末。",
    videoFallback: "浏览器无法播放时，可直接打开视频文件。",
    backLabel: "返回项目空间",
    tocLabel: "阅读目录",
    chaptersLabel: "按片段观看",
    sections: [
      {
        id: "problem",
        title: "一次检测，怎样变成连续测量？",
        paragraphs: [
          "起点是一支出现在摄像头里的针筒。它可能倾斜，活塞会移动，颜色标记也可能暂时看不清。检测框只能告诉系统目标在哪里；要回答“现在还有多少容量”，还需要确认方向、量程与活塞位置，并让这些证据落在同一帧、同一套坐标里。",
          "当读数走进桌面应用，问题也随之扩大：界面要保持响应，曲线要跟上测量，开始和停止必须有明确含义，异常退出时也不能把记录状态留给用户猜测。SyringeMeter 因而围绕从画面到记录的整条工作流展开。",
        ],
      },
      {
        id: "measurement",
        title: "先统一方向，再计算容量",
        paragraphs: [
          "系统先用 YOLO OBB 定位带有旋转角度的针筒区域，再把这块画面转换成方向统一的局部测量区域。针筒在摄像头里转动时，后续判断仍然可以使用一致的坐标。",
          "在这个区域里，绿色标记提供方向，双红色量程线给出测量范围，活塞位置提供当前容量的依据。只有这些条件共同成立，才会产生连续容量结果，再经过时间稳定处理，进入界面的读数和曲线。",
        ],
        points: [
          "目标定位：确定针筒在画面中的位置和角度。",
          "局部测量：将方向、量程和活塞放进统一坐标。",
          "结果展示：把有效容量转换成可持续观察的读数与曲线。",
        ],
      },
      {
        id: "reliability",
        title: "稳定读数，也要诚实地失效",
        paragraphs: [
          "平滑可以减轻跳动，也可能掩盖丢失的证据。如果当前帧的颜色标记、量程锚点或上游判断无效，应用会明确显示没有有效读数，不继续沿用上一帧容量。这样，屏幕上的稳定仍然对应眼前的画面。",
          "运行时把不同的数据分开处理。子进程独占摄像头、模型、视觉测量和 CSV 写入；父进程负责 Qt 界面与用户操作。视频通道只保留最新画面，测量样本则使用有界无损通道，让显示的流畅性与记录的完整性各自有明确的处理方式。",
        ],
      },
      {
        id: "recording",
        title: "每一段记录，都由用户明确开始",
        paragraphs: [
          "打开摄像头不等于开始保存数据。只有点击 Start，应用才会创建记录会话并写入标量 CSV。产品不保存摄像头图片或视频，留下的是测量数据，以及能与这次操作对应的时间记录。",
          "Start、Stop、Reset 和退出命令都在处理帧的边界生效。Reset 会结束当前会话、清空曲线并回到 READY；下一次显式 Start 才创建新的 CSV，从 0 ms 重新计时。一次重置因此有清楚的前后边界。",
        ],
        points: [
          "观看：实时查看容量与曲线，不自动开始 CSV 记录。",
          "记录：点击 Start，开启一次独立的测量会话。",
          "重置：关闭当前会话，清空曲线，等待下一次 Start。",
        ],
      },
      {
        id: "delivery",
        title: "把原型交付成可以安装的应用",
        paragraphs: [
          "项目把摄像头、连续测量、Qt 交互、曲线和 CSV 串成了端到端链路，并为单元逻辑、集成行为、界面、进程和记录建立测试。接口约定与文档也进入验证范围，便于区分代码行为、测试结果和真实设备证据。",
          "v0.2.0 提供 Windows x64 CPU-only 安装程序和便携 ZIP，由 GitHub Actions 配合 PyInstaller 与 Inno Setup 构建。发布任务对两份分发产物执行校验；模型不进入 Git 历史，只经获批的 Release 链路，在 SHA-256 校验后装入产物。",
          "这些工作建立了可重复的构建与分发路径。安装包在目标机器上的安装、摄像头与真实推理，需要单独完成硬件验证，不能由自动化构建结果替代。",
        ],
      },
      {
        id: "role",
        title: "我的角色：定义系统应该如何成立",
        paragraphs: [
          "这是我主导的个人工程项目。我负责定义问题、产品目标、测量语义、失败边界和验收标准，并推动算法、运行时、桌面交互与 Windows 分发形成完整工作流。最终发布决策也由我作出。",
          "AI 工具参与实现、重构、测试和文档整理。我持续判断哪些行为值得实现、哪些证据足以接受，以及哪些结果还必须回到真实硬件上确认。这个项目也是一次 AI-native 协作实践：让迭代最终收敛成行为明确、结果可验证、责任清楚的系统。",
        ],
      },
      {
        id: "boundaries",
        title: "当前证据与适用边界",
        paragraphs: [
          "SyringeMeter 是受控场景中的工程 MVP，当前展示围绕带标记的单支针筒展开。它不是医疗设备，不宣称适用于任意针筒、光照或部署环境。",
          "本页视频来自 macOS Python 源码运行，只证明该次演示中可见的行为。v0.2.0 的 Windows 构建和 Release 已完成自动化验证；当前 Windows 包的安装、摄像头和真实推理尚未重新完成目标机实测。源码、自动化检查、演示与安装包验证分别记录，最新进展以项目验证状态为准。",
        ],
      },
    ],
    pipelineTitle: "从画面到记录",
    pipeline: [
      { title: "采集画面", detail: "摄像头提供当前帧，在本地处理。" },
      { title: "定位针筒", detail: "YOLO OBB 找到目标位置与旋转角度。" },
      { title: "统一坐标", detail: "转换局部画面，建立一致的测量方向。" },
      { title: "读取证据", detail: "结合绿色方向标记、双红线量程与活塞位置。" },
      { title: "稳定容量", detail: "质量检查与时间稳定共同决定有效读数。" },
      {
        title: "显示与记录",
        detail: "实时读数和曲线；显式开始后写入标量 CSV。",
      },
    ],
    linksTitle: "继续查看项目",
    githubLabel: "源码与项目文档",
    releaseLabel: "Windows v0.2.0 发布包",
    statusLabel: "当前验证状态",
    roleTitle: "我的角色",
  },
  en: {
    eyebrow: "COMPUTER VISION / DESKTOP · v0.2.0 MVP",
    title: "SyringeMeter",
    subtitle: "From camera images to stable readings and traceable records.",
    introduction:
      "A syringe measurement application that runs locally on the CPU. Detection, orientation, range markers and plunger position produce continuous volume readings, live charts and CSV records controlled by the user. This case study follows a vision prototype through desktop interaction, failure handling and Windows distribution.",
    previewLabel: "Quick preview · 17 sec",
    fullLabel: "Full demonstration · 3:13",
    videoCaption:
      "Recorded on macOS running the Python source. The video shows the behavior visible in that session. See the verification scope below for the Windows package.",
    videoFallback:
      "If your browser cannot play the video, open the video file directly.",
    backLabel: "Back to the project room",
    tocLabel: "In this case study",
    chaptersLabel: "Watch by chapter",
    sections: [
      {
        id: "problem",
        title: "How does a detection become a continuous measurement?",
        paragraphs: [
          "The starting point is a syringe in a camera image. It can tilt, its plunger moves, and its color markers may briefly become unreadable. A detection box locates the object. Answering how much volume it contains also requires orientation, range and plunger evidence from the same frame, in the same coordinate system.",
          "Bringing that reading into a desktop application adds further responsibilities. The interface must stay responsive, charts must follow measurements, and starting or stopping must have a clear meaning. Unexpected exits must not leave recording state ambiguous. SyringeMeter was built around this entire journey from image to record.",
        ],
      },
      {
        id: "measurement",
        title: "Align the measurement before calculating volume",
        paragraphs: [
          "YOLO OBB first locates the syringe and its rotation. The detected region is then transformed into a consistently oriented local image. As the syringe turns in the camera view, the measurement logic can continue working in the same coordinates.",
          "Within that image, a green marker establishes direction, two red range lines define the measurement span, and the plunger position supplies the current volume evidence. Together, valid observations produce a continuous volume result. Temporal stabilization then prepares it for the live reading and chart.",
        ],
        points: [
          "Locate the object: establish the syringe's position and angle.",
          "Measure locally: bring direction, range and plunger into one coordinate system.",
          "Display the result: turn valid volume estimates into readings and charts that can be followed over time.",
        ],
      },
      {
        id: "reliability",
        title: "A stable reading must also know when to disappear",
        paragraphs: [
          "Smoothing can reduce jitter, but it can also conceal missing evidence. When the current frame has invalid color markers, range anchors or upstream evidence, the application explicitly reports no valid reading. It does not retain the previous volume. A steady number must still correspond to the image being observed.",
          "The runtime treats video and measurements separately. A worker process owns the camera, model, visual measurement and CSV writing; the parent process handles the Qt interface and user actions. The video channel keeps only the latest frame, while measurement samples use a bounded lossless channel. Display responsiveness and recording integrity each have their own data path.",
        ],
      },
      {
        id: "recording",
        title: "Every recording begins with an explicit action",
        paragraphs: [
          "Opening the camera does not start saving data. A recording session and scalar CSV are created only after the user presses Start. The product does not save camera images or video. It records measurements and timing that belong to that session.",
          "Start, Stop, Reset and exit commands take effect at processing frame boundaries. Reset closes the current session, clears the chart and returns the application to READY. Only the next explicit Start creates a new CSV and restarts timing at 0 ms, giving each session a clear boundary.",
        ],
        points: [
          "Observe: follow the live volume and chart without automatically recording a CSV.",
          "Record: press Start to begin a separate measurement session.",
          "Reset: close the session, clear the chart and wait for the next Start.",
        ],
      },
      {
        id: "delivery",
        title: "Delivering an application people can install",
        paragraphs: [
          "The project connects camera input, continuous measurement, Qt interaction, charts and CSV in an end-to-end workflow. Tests cover unit logic, integration, the interface, processes and recording. Interface contracts and documentation are also checked, keeping implemented behavior, automated results and physical evidence distinguishable.",
          "Version 0.2.0 provides a Windows x64 CPU-only installer and portable ZIP, built by GitHub Actions with PyInstaller and Inno Setup. The release job verifies checksums for both artifacts. Model files stay out of Git history and enter installation artifacts through the approved release pipeline after SHA-256 verification.",
          "This establishes a repeatable build and distribution path. Installation, camera access and real inference on the target machine still require their own physical verification; a successful automated build cannot establish those results.",
        ],
      },
      {
        id: "role",
        title: "My role: defining what the system must get right",
        paragraphs: [
          "I led this personal engineering project, defining the problem, product goals, measurement semantics, failure boundaries and acceptance criteria. I brought the algorithm, runtime, desktop interaction and Windows distribution into one workflow, and retained the final release decision.",
          "AI tools contributed to implementation, refactoring, tests and documentation. My responsibility was to decide which behavior to build, which evidence was sufficient to accept it, and which results still needed real hardware. The project is also a practice in AI-native collaboration: bringing iteration to a system with explicit behavior, verifiable results and clear responsibility.",
        ],
      },
      {
        id: "boundaries",
        title: "Evidence and scope",
        paragraphs: [
          "SyringeMeter is an engineering MVP for controlled conditions, demonstrated with a single marked syringe. It is not a medical device and makes no claim to support arbitrary syringes, lighting or deployment environments.",
          "The videos on this page were recorded on macOS running the Python source and establish only the behavior visible in those sessions. The v0.2.0 Windows build and release have passed automated verification. Installation, camera access and real inference for the current Windows package have not yet been reverified on the target machine. Source, automated checks, demonstrations and package verification are recorded separately; the project status tracks further progress.",
        ],
      },
    ],
    pipelineTitle: "From image to record",
    pipeline: [
      { title: "Capture", detail: "Process the current camera frame locally." },
      {
        title: "Locate",
        detail: "Find the syringe and its rotation with YOLO OBB.",
      },
      {
        title: "Align",
        detail:
          "Transform the local image into a consistent measurement direction.",
      },
      {
        title: "Read evidence",
        detail:
          "Combine the green direction marker, two red range lines and plunger position.",
      },
      {
        title: "Stabilize",
        detail:
          "Use quality checks and temporal stabilization to determine valid readings.",
      },
      {
        title: "Display & record",
        detail:
          "Show live readings and charts; write scalar CSV after an explicit Start.",
      },
    ],
    linksTitle: "Explore the project",
    githubLabel: "Source & project documentation",
    releaseLabel: "Windows v0.2.0 release",
    statusLabel: "Current verification status",
    roleTitle: "My role",
  },
} as const;

export const syringeMeterShowcaseUi = {
  zh: {
    demoTitle: "SyringeMeter 运行演示",
    posterAlt: "针筒实时画面、容量读数和随活塞变化的曲线",
    readCase: "阅读完整案例",
    chapters: ["实时测量", "开始记录", "查看 CSV"],
    playbackError: "视频暂时无法播放。可重试播放按钮，或直接打开视频。",
    openVideo: "打开视频",
    measurementAlt:
      "macOS 上运行的 SyringeMeter：右侧针筒检测与容量读数，左侧实时曲线",
    measurementCaption:
      "完整演示 02:00：检测画面、容量读数与正在记录的曲线。截图来自实际运行。",
    csvAlt:
      "演示中打开的 CSV 表格，包含时间、会话标识、测量值和无有效检测的记录",
    csvCaption:
      "完整演示 03:00：查看生成的 CSV。记录保留会话与测量状态，便于回看一次操作。",
  },
  en: {
    demoTitle: "SyringeMeter demonstration",
    posterAlt:
      "Live syringe image, volume reading and a chart following the plunger",
    readCase: "Read the full case study",
    chapters: ["Live measurement", "Start recording", "Inspect the CSV"],
    playbackError:
      "The video could not play. Try a playback button again or open the video directly.",
    openVideo: "Open video",
    measurementAlt:
      "SyringeMeter running on macOS, with detection and volume on the right and a live chart on the left",
    measurementCaption:
      "Full demo at 02:00: detection, volume readings and the chart during recording. Captured from the running application.",
    csvAlt:
      "The exported CSV with timestamps, session identifiers, measurements and invalid detection records",
    csvCaption:
      "Full demo at 03:00: inspecting the generated CSV. Session and measurement states make the operation traceable.",
  },
} as const;

export const projectCaseStudies = {
  "axmorf-studio": {
    zh: {
      eyebrow: "AGENT 视频创作 / 本地工作区",
      title: "AXMORF Studio",
      subtitle: "让 Agent 的创作，走到可以检查的本地视频交付。",
      introduction:
        "基于 Remotion 的本地视频生产工作区。由 coding Agent 组织场景、旁白与封面，通过固定的生产流程和校验，交付视频、两张封面与发布清单，并支持有效产物复用和隔离修订。",
      backLabel: "返回项目空间",
      tocLabel: "阅读目录",
      readLabel: "阅读完整案例",
      sections: [
        {
          id: "problem",
          title: "从一个视频需求开始",
          paragraphs: [
            "制作一条视频，要把主题、叙事、场景、旁白、字幕、声音和封面组织成同一个作品。Agent 可以参与这些工作，但要让各部分在时间、画面和文件交付上真正对齐，仍然需要一个明确的生产过程。",
            "AXMORF Studio 围绕这个过程建立了用户自有的本地工作区。用户把创作需求交给正在使用的 coding Agent；Agent 根据项目规则组织内容、编写视觉场景并执行生产。项目源码、素材、配置、中间产物和最终文件都保存在工作区中，可以检查，也可以继续修改。",
          ],
        },
        {
          id: "production",
          title: "把创作拆成有明确输入与结果的任务",
          paragraphs: [
            "一个故事对应一个 Remotion Composition，内容段落对应具体场景。场景、整体视觉和封面各自承担清楚的职责，旁白与字幕由统一的时间结构组织，避免多个创作任务重复控制同一层内容。",
            "生产开始前，系统先检查输入是否完整、哪些产物可以复用、哪些任务需要重新执行，以及有哪些阻塞。需要调用媒体服务的准备步骤有单独入口。随后，Agent 在分配的任务范围内完成创作，固定程序负责校验、组装和渲染。",
            "实际流程是：创作需求 → 项目定义 → 生产检查 → 媒体准备 → 场景与封面创作 → 校验与渲染 → 本地交付。",
          ],
        },
        {
          id: "timing",
          title: "让声音成为时间安排的依据",
          paragraphs: [
            "旁白的真实时长会影响字幕、场景切换和视觉节奏。AXMORF 以生成后音频的实际采样数计算时间，再映射到视频帧；经校验的音频被固定下来，后续生产使用同一份声音与时间信息。",
            "这样，场景与字幕能够围绕实际旁白展开。旁白、背景音乐和音效也有各自的职责：旁白承担叙述，背景音乐覆盖规定的内容区间，场景音效作为独立声音参与作品。",
          ],
        },
        {
          id: "revisions",
          title: "把已经完成的工作保留下来",
          paragraphs: [
            "创作通常需要反复调整。AXMORF 根据任务输入和产物内容识别可复用结果；输入没有变化且文件仍通过校验的部分，可以继续使用。修改一个场景时，重新生产的范围沿实际依赖传播，其他仍然有效的场景、封面或旁白能够保留。",
            "修改已有作品时，新版本先在隔离的候选区域中完成。只有候选结果通过检查，才替换当前项目与交付；候选制作失败时，上一份作品仍然可用。这个安排让试错有了明确边界，也降低了修改中途损坏现有成果的风险。",
          ],
        },
        {
          id: "delivery",
          title: "完成意味着四个可检查的文件",
          paragraphs: [
            "一次交付包含 video.mp4、横向的 cover-4x3.png、纵向的 cover-3x4.png 和 publish.json。发布清单保存用于发布的文案与交付信息，实际上传由用户另行完成。",
            "交付检查覆盖文件集合、校验和、媒体格式、尺寸、帧率与帧数，以及媒体能否完整解码。工作区还提供本地 Web 控制中心和 Remotion Studio，分别用于查看配置、诊断、进度、当前交付和画面预览。",
          ],
        },
        {
          id: "engineering",
          title: "这个项目的工程重点",
          paragraphs: [
            "AXMORF 将开放的创作判断放在 Agent 一侧，把输入规则、任务边界、结果校验和交付替换交给程序。Agent 可以决定一段内容怎样表达，系统则负责检查它是否产出了可接入作品的结果。",
            "这种分工使失败发生的位置更容易辨认：环境准备、素材服务、某个场景、渲染或最终交付，都有各自的状态与检查。有效结果也能在后续执行中继续使用，让创作过程具备可追踪、可修改的基础。",
          ],
        },
        {
          id: "boundaries",
          title: "当前阶段与适用范围",
          paragraphs: [
            "项目处于公开测试阶段，已有 npm 工作区发行与 Codex、Hermes 的真实制作记录。它需要可用的 Node.js、渲染浏览器及配置的媒体服务；工作区保存在本地，所选外部服务仍可能涉及网络调用和费用。",
            "自动检查可以确认文件与部分制作约束，画面美感、叙事效果和完整听审仍需要人工判断。项目目前不承担平台账号、视频上传或云端生产调度。不同宿主和执行模式的证据范围，以对应版本的验收记录为准。",
          ],
        },
      ],
      pipelineTitle: "从创作需求到本地交付",
      pipeline: [
        {
          title: "定义项目",
          detail: "把创作需求组织为故事与场景结构。",
        },
        {
          title: "检查生产",
          detail: "确认输入、可复用产物、重做范围与阻塞。",
        },
        {
          title: "准备媒体",
          detail: "准备所需素材，以经校验的旁白建立时间依据。",
        },
        {
          title: "创作场景与封面",
          detail: "Agent 按明确的场景、整体视觉与封面职责创作。",
        },
        {
          title: "校验与渲染",
          detail: "组装作品，检查文件、媒体属性与完整解码。",
        },
        {
          title: "本地交付",
          detail: "在工作区保留视频、两张封面与发布清单。",
        },
      ],
      linksTitle: "继续查看项目",
      links: [
        {
          href: heroPublicLinks.axmorfStudio,
          label: "源码与项目文档",
        },
      ],
    },
    en: {
      eyebrow: "AGENT VIDEO PRODUCTION / LOCAL WORKSPACE",
      title: "AXMORF Studio",
      subtitle:
        "Taking agent-led creation through to verifiable local video delivery.",
      introduction:
        "A local video production workspace built on Remotion. A coding agent organizes scenes, narration and covers, while a defined production process and validation deliver a video, two covers and a publishing manifest. Valid artifacts can be reused, and revisions are developed in isolation.",
      backLabel: "Back to the project room",
      tocLabel: "In this case study",
      readLabel: "Read the full case study",
      sections: [
        {
          id: "problem",
          title: "Starting with a video brief",
          paragraphs: [
            "Making a video means bringing a topic, narrative, scenes, narration, subtitles, sound and covers into one work. An agent can contribute to each part, but aligning them in timing, visuals and delivered files still requires a clear production process.",
            "AXMORF Studio builds that process around a local workspace owned by the user. The user gives a creative brief to their coding agent; the agent follows the project rules to organize content, write visual scenes and run production. Source code, media, configuration, intermediate artifacts and final files remain in the workspace, where they can be inspected and revised.",
          ],
        },
        {
          id: "production",
          title: "Giving creative tasks explicit inputs and results",
          paragraphs: [
            "Each story corresponds to a Remotion Composition, with its content divided into individual scenes. Scenes, the overall visual direction and covers have distinct responsibilities. Narration and subtitles follow a shared timing structure, keeping multiple creative tasks from taking control of the same content layer.",
            "Before production, the system checks whether inputs are complete, which artifacts can be reused, which tasks must run again and what is blocked. Preparation that calls media services has its own entry point. The agent then creates within the assigned task scope, while fixed programs handle validation, assembly and rendering.",
            "The workflow is: creative brief → project definition → production checks → media preparation → scene and cover creation → validation and rendering → local delivery.",
          ],
        },
        {
          id: "timing",
          title: "Letting sound establish the timing",
          paragraphs: [
            "The actual duration of narration affects subtitles, scene transitions and visual rhythm. AXMORF derives timing from the sample count of the generated audio, then maps it to video frames. Validated audio is fixed so that later production uses the same sound and timing information.",
            "Scenes and subtitles can therefore follow the narration that will actually be heard. Narration, background music and sound effects also have distinct roles: narration carries the story, background music covers the prescribed content interval, and scene sound effects contribute as separate audio.",
          ],
        },
        {
          id: "revisions",
          title: "Keeping work that is already complete",
          paragraphs: [
            "Creation usually involves repeated adjustments. AXMORF identifies reusable results from task inputs and artifact contents. When inputs are unchanged and files still pass validation, those results can be retained. Editing one scene propagates reruns through its actual dependencies, preserving other scenes, covers or narration that remain valid.",
            "When revising an existing work, the new version is produced in an isolated candidate area first. It replaces the current project and delivery only after passing checks. If candidate production fails, the previous work remains available. This gives experimentation a clear boundary and reduces the risk of damaging an existing result halfway through a revision.",
          ],
        },
        {
          id: "delivery",
          title: "Completion means four inspectable files",
          paragraphs: [
            "A delivery contains video.mp4, a landscape cover-4x3.png, a portrait cover-3x4.png and publish.json. The publishing manifest holds publication copy and delivery information; the user handles the actual upload separately.",
            "Delivery checks cover the file set, checksums, media formats, dimensions, frame rate, frame count and whether the media decodes completely. The workspace also provides a local web control center for configuration, diagnostics, progress and the current delivery, alongside Remotion Studio for visual previews.",
          ],
        },
        {
          id: "engineering",
          title: "The engineering focus",
          paragraphs: [
            "AXMORF leaves open-ended creative judgment to the agent and assigns input rules, task boundaries, result validation and delivery replacement to programs. The agent decides how a passage should be expressed; the system checks whether it produced a result that can become part of the work.",
            "This division makes failures easier to locate. Environment preparation, media services, individual scenes, rendering and final delivery each have their own status and checks. Valid results can also survive into later runs, giving the creative process a traceable foundation for revision.",
          ],
        },
        {
          id: "boundaries",
          title: "Current stage and scope",
          paragraphs: [
            "The project is in public beta, with an npm workspace distribution and recorded production runs using Codex and Hermes. It requires a working Node.js environment, a rendering browser and configured media services. The workspace is local, while selected external services may still involve network requests and costs.",
            "Automated checks establish file validity and some production constraints. Visual quality, storytelling and a complete listening review still require human judgment. The project does not currently manage platform accounts, upload videos or schedule cloud production. Verification scope across hosts and execution modes is documented in the acceptance records for each version.",
          ],
        },
      ],
      pipelineTitle: "From brief to local delivery",
      pipeline: [
        {
          title: "Define the project",
          detail: "Turn the creative brief into a story and scene structure.",
        },
        {
          title: "Check production",
          detail:
            "Identify missing inputs, reusable artifacts, reruns and blockers.",
        },
        {
          title: "Prepare media",
          detail:
            "Prepare required media and establish timing from validated narration.",
        },
        {
          title: "Create scenes & covers",
          detail:
            "The agent works within explicit scene, visual and cover responsibilities.",
        },
        {
          title: "Validate & render",
          detail:
            "Assemble the work and check its files, media properties and decoding.",
        },
        {
          title: "Deliver locally",
          detail:
            "Keep a video, two covers and a publishing manifest in the workspace.",
        },
      ],
      linksTitle: "Explore the project",
      links: [
        {
          href: heroPublicLinks.axmorfStudio,
          label: "Source & project documentation",
        },
      ],
    },
  },
  viselora: {
    zh: {
      eyebrow: "DOM-FIRST WEBGL / 托管运行时",
      title: "Viselora DOM WebGL",
      subtitle: "让网页保留自己的结构，也拥有空间与运动。",
      introduction:
        "面向 React 与浏览器应用的 DOM-first WebGL 运行时。保留网页的布局和交互语义，以公开声明连接文字、媒体和三维对象，统一管理渲染、资源、输入与生命周期。",
      backLabel: "返回项目空间",
      tocLabel: "阅读目录",
      readLabel: "阅读完整案例",
      sections: [
        {
          id: "problem",
          title: "当网页内容进入三维画面",
          paragraphs: [
            "文字、图片、链接和阅读顺序原本由网页组织。当它们进入 WebGL 画面，布局、坐标、鼠标命中、滚动响应和资源释放也需要相互配合。每一种视觉效果单独维护这些关系，会让后续组合与修改越来越困难。",
            "Viselora 从 DOM 出发：网页保留内容、布局与可访问性的基础，运行时把需要视觉表现的目标连接到 WebGL。应用描述想呈现的对象与效果，底层统一处理渲染和资源生命周期。",
          ],
        },
        {
          id: "declarations",
          title: "用声明连接内容与视觉",
          paragraphs: [
            "DOM 文字、图片、视频、序列帧和模型可以成为运行时管理的视觉来源。应用通过目标声明提供来源与效果；需要程序化几何或场景原生模型时，则使用相应的网格与模型声明。",
            "这让视觉表达有了清楚的入口：网页内容由语义元素承载，效果描述变换、材质或运动意图。更复杂的画面可以声明场景、相机、灯光和渲染通道，并通过受控接口更新对象。应用代码始终使用公开接口，底层对象的创建和销毁由运行时负责。",
          ],
        },
        {
          id: "lifecycle",
          title: "把生命周期放在同一处",
          paragraphs: [
            "每个运行时拥有一个透明画布和渲染循环，并集中处理 DOM 测量、场景投影、资源加载与缓存、离屏策略和清理。效果离开页面或组件卸载时，对应资源也有明确的释放路径。",
            "对于依附 DOM 的目标，加载、错误和离屏状态还要与原内容的显示策略配合。这个设计的价值，在于让文字、图片、视频和三维效果能够组合在同一页面中，并保持可理解的资源与状态关系。",
          ],
        },
        {
          id: "interaction",
          title: "让滚动和交互成为共同输入",
          paragraphs: [
            "Viselora 提供进度信号、时间线与滚动适配能力，可以连接原生滚动，也可以接入 Lenis、GSAP 和 ScrollTrigger。多个视觉对象能够使用一致的进度来源，表达靠近、旋转、展开、阅读和退回等阶段。",
            "指针输入同样进入运行时管理。应用通过目标或场景对象的指针状态设计反馈，无需自行维护另一套底层拾取工具。逐帧视觉变化在效果逻辑中完成，让组件继续承担声明与界面组织。",
          ],
        },
        {
          id: "application",
          title: "从运行时走到一个实际网站",
          paragraphs: [
            "这个个人网站是 Viselora 的实际应用之一。四面体随滚动靠近，面上的内容逐渐与屏幕对齐，再交给可阅读、可交互的正文；人物模型、文章纸卡和项目空间继续使用同一套公开运行时能力。",
            "网页布局、链接与移动端阅读由站点负责，三维投影、材质和运动通过运行时表达。站点作为独立项目安装已发布的 npm 包，也让公共接口接受真实使用场景的检验。",
          ],
        },
        {
          id: "examples",
          title: "将具体效果整理成可复用示例",
          paragraphs: [
            "示例项目进一步把纸卡阅读、项目空间、模型叙事、面投影转场、指针预览和透视时间线整理为可复用模块。它们使用中立内容和公开接口，开发者可以阅读模块说明、替换数据，再组合进自己的应用。",
            "这些模块属于应用层示例，视觉与内容由调用方组织；运行时包继续承担通用能力。接口文档、能力状态说明和面向 Agent 的使用指引，帮助使用者区分公开入口、实际证据与应用自己的责任。",
          ],
        },
        {
          id: "boundaries",
          title: "当前阶段与适用范围",
          paragraphs: [
            "项目处于预发布阶段，核心运行时与滚动适配器分别通过 npm 提供。当前实现覆盖 DOM 与媒体目标、托管场景、网格、模型、交互、灯光、受控材质扩展和后期处理，具体能力的验证成熟度并不完全相同。",
            "使用这一结构需要接受运行时对渲染和资源生命周期的管理。场景原生模型与网格需要应用自行安排语义说明和回退内容，物理能力也只覆盖有限范围。真实设备表现、复杂场景性能和最终视觉效果，仍需要在具体产品中验证。",
          ],
        },
      ],
      pipelineTitle: "从网页内容到空间表达",
      pipeline: [
        {
          title: "组织 DOM",
          detail: "由语义元素保留内容、链接、布局与阅读顺序。",
        },
        {
          title: "声明视觉目标",
          detail: "通过公开声明提供文字、媒体、网格或模型。",
        },
        {
          title: "测量与投影",
          detail: "运行时连接 DOM 几何与场景坐标。",
        },
        {
          title: "接入共同输入",
          detail: "以滚动进度、时间线与指针状态驱动效果。",
        },
        {
          title: "渲染画面",
          detail: "在托管效果与通道中表达材质、灯光和运动。",
        },
        {
          title: "管理生命周期",
          detail: "协调可见性、加载、缓存与资源清理。",
        },
      ],
      linksTitle: "继续查看项目",
      links: [
        {
          href: heroPublicLinks.currentProject,
          label: "源码与项目文档",
        },
      ],
    },
    en: {
      eyebrow: "DOM-FIRST WEBGL / MANAGED RUNTIME",
      title: "Viselora DOM WebGL",
      subtitle:
        "Giving web pages depth and motion while preserving their structure.",
      introduction:
        "A DOM-first WebGL runtime for React and browser applications. It preserves web layout and interaction semantics, connects text, media and 3D objects through public declarations, and manages rendering, resources, input and lifecycle in one place.",
      backLabel: "Back to the project room",
      tocLabel: "In this case study",
      readLabel: "Read the full case study",
      sections: [
        {
          id: "problem",
          title: "When web content enters a 3D scene",
          paragraphs: [
            "Text, images, links and reading order are already organized by the web page. When they enter a WebGL scene, layout, coordinates, pointer hits, scroll responses and resource disposal must work together too. Maintaining those relationships separately for every visual effect makes later composition and changes increasingly difficult.",
            "Viselora starts from the DOM. The page keeps the foundation for content, layout and accessibility, while the runtime connects targets that need visual treatment to WebGL. The application describes the objects and effects it wants to present; the runtime coordinates rendering and resource lifecycles underneath.",
          ],
        },
        {
          id: "declarations",
          title: "Connecting content and visuals through declarations",
          paragraphs: [
            "DOM text, images, video, frame sequences and models can become visual sources managed by the runtime. Target declarations provide their sources and effects. Procedural geometry and scene-native models use the corresponding mesh and model declarations.",
            "This gives visual expression a clear entry point: semantic elements carry web content, while effects describe transformations, materials or intended motion. More complex visuals can declare scenes, cameras, lights and render passes, then update objects through controlled interfaces. Application code uses public APIs throughout; the runtime creates and destroys the underlying objects.",
          ],
        },
        {
          id: "lifecycle",
          title: "Keeping lifecycle management in one place",
          paragraphs: [
            "Each runtime owns one transparent canvas and render loop, coordinating DOM measurement, scene projection, resource loading and caching, off-screen policy and cleanup. When an effect leaves the page or a component unmounts, its resources have an explicit disposal path.",
            "For targets attached to the DOM, loading, error and off-screen states must also work with the visibility policy for the original content. This design allows text, images, video and 3D effects to coexist on a page while keeping the relationships between resources and states understandable.",
          ],
        },
        {
          id: "interaction",
          title: "Using shared inputs for scrolling and interaction",
          paragraphs: [
            "Viselora provides progress signals, timelines and scroll adapters. It can follow native scrolling or integrate with Lenis, GSAP and ScrollTrigger. Multiple visual objects can use the same progress source to express stages such as approaching, rotating, unfolding, reading and retreating.",
            "Pointer input is also managed by the runtime. Applications design feedback from pointer state on targets or scene objects, without maintaining another low-level picking system. Visual changes from frame to frame stay in effect logic, leaving components responsible for declarations and interface organization.",
          ],
        },
        {
          id: "application",
          title: "Bringing the runtime into a real website",
          paragraphs: [
            "This personal website is one application of Viselora. A tetrahedron approaches as the page scrolls; content on its faces gradually aligns with the screen, then hands off to readable, interactive prose. The profile model, article sheets and project room continue to use the same public runtime capabilities.",
            "The site owns web layout, links and mobile reading, while the runtime expresses 3D projection, materials and motion. The site is an independent project that installs published npm packages, putting the public interfaces to work in an actual application.",
          ],
        },
        {
          id: "examples",
          title: "Turning specific effects into reusable examples",
          paragraphs: [
            "The example application packages paper-card reading, a project room, model storytelling, face-projection transitions, pointer previews and a perspective timeline as reusable modules. They use neutral content and public APIs. Developers can read the module guides, replace the data and combine them in their own applications.",
            "These modules are application-level examples whose visuals and content are organized by the caller. Runtime packages continue to provide general capabilities. API documentation, capability status records and agent-facing guidance help users distinguish public entry points, available evidence and their own application responsibilities.",
          ],
        },
        {
          id: "boundaries",
          title: "Current stage and scope",
          paragraphs: [
            "The project is in prerelease, with the core runtime and scroll adapters distributed separately through npm. The current implementation covers DOM and media targets, managed scenes, meshes, models, interaction, lighting, controlled material extensions and postprocessing. The maturity of verification varies across these capabilities.",
            "Using this structure means letting the runtime manage rendering and resource lifecycles. Applications must supply semantic descriptions and fallback content for scene-native models and meshes, and physics support is limited in scope. Real-device behavior, complex-scene performance and final visual quality still need verification in each product.",
          ],
        },
      ],
      pipelineTitle: "From web content to spatial expression",
      pipeline: [
        {
          title: "Organize the DOM",
          detail:
            "Keep content, links, layout and reading order in semantic elements.",
        },
        {
          title: "Declare visual targets",
          detail:
            "Provide public declarations for text, media, meshes or models.",
        },
        {
          title: "Measure & project",
          detail:
            "Connect DOM geometry and scene coordinates through the runtime.",
        },
        {
          title: "Connect shared inputs",
          detail:
            "Use scroll progress, timelines and pointer state to drive effects.",
        },
        {
          title: "Render the scene",
          detail:
            "Apply materials, lighting and motion through managed effects and passes.",
        },
        {
          title: "Handle lifecycle",
          detail:
            "Coordinate visibility, loading, caching and resource cleanup.",
        },
      ],
      linksTitle: "Explore the project",
      links: [
        {
          href: heroPublicLinks.currentProject,
          label: "Source & project documentation",
        },
      ],
    },
  },
  "syringe-meter": {
    zh: {
      ...syringeMeterCaseStudy.zh,
      readLabel: syringeMeterShowcaseUi.zh.readCase,
      links: [
        {
          href: heroPublicLinks.syringeMeter,
          label: syringeMeterCaseStudy.zh.githubLabel,
        },
        {
          href: `${heroPublicLinks.syringeMeter}/releases/tag/v0.2.0`,
          label: syringeMeterCaseStudy.zh.releaseLabel,
        },
        {
          href: `${heroPublicLinks.syringeMeter}/blob/main/docs/status/current.yaml`,
          label: syringeMeterCaseStudy.zh.statusLabel,
        },
      ],
    },
    en: {
      ...syringeMeterCaseStudy.en,
      readLabel: syringeMeterShowcaseUi.en.readCase,
      links: [
        {
          href: heroPublicLinks.syringeMeter,
          label: syringeMeterCaseStudy.en.githubLabel,
        },
        {
          href: `${heroPublicLinks.syringeMeter}/releases/tag/v0.2.0`,
          label: syringeMeterCaseStudy.en.releaseLabel,
        },
        {
          href: `${heroPublicLinks.syringeMeter}/blob/main/docs/status/current.yaml`,
          label: syringeMeterCaseStudy.en.statusLabel,
        },
      ],
    },
  },
  "vibe-journal-pipeline": {
    zh: {
      eyebrow: "开发日志 / PYTHON 流水线",
      title: "vibe-journal-pipeline",
      subtitle: "把分散的开发对话，整理成可以回顾的日常记录。",
      introduction:
        "使用 Python 标准库构建的开发日志流水线。汇集 Hermes、Codex 与可选 OpenCode 会话，按日期生成结构化中文日志，再从日志重建技术清单和时间线，并为网站提供经过筛选的公开记录。",
      backLabel: "返回项目空间",
      tocLabel: "阅读目录",
      readLabel: "阅读完整案例",
      sections: [
        {
          id: "problem",
          title: "让开发过程留下可回顾的记录",
          paragraphs: [
            "使用多个 Agent 开发时，一天的工作会分散在不同工具与会话中：有些记录需求，有些讨论实现，有些保留排障和验证过程。重新回看这些对话，需要先找齐来源，再从大量往返中整理出有意义的工作内容。",
            "vibe-journal-pipeline 按日期汇集这些材料，生成一份结构化日志。它记录当天使用的技术、完成的工作与一条可复用的成果描述，并进一步整理出时间线，让零散会话能够按天回顾。",
          ],
        },
        {
          id: "sources",
          title: "先把一天的数据放在一起",
          paragraphs: [
            "流水线可以读取 Hermes 的 SQLite 会话数据库、Codex CLI/Desktop 的 JSONL 会话，以及可选的本地 OpenCode 数据库。Hermes 与 Codex 也支持通过 SSH 读取配置的远程来源。",
            "不同来源经过各自的筛选与标准化后，按时间合并到同一个日期窗口。日期边界使用本机时区或显式指定的时区；记录按整天组织，保留来源与会话信息，再交给后续摘要步骤。",
          ],
        },
        {
          id: "compression",
          title: "为繁忙的一天分段整理",
          paragraphs: [
            "普通日期直接根据合并后的对话生成日志。合并消息超过 300 条时，程序先按顺序拆成大小接近的片段，分别压缩，再据此生成当天日志。筛选后的每条输入都会进入某个处理片段。",
            "中间摘要根据输入指纹缓存，相同输入在再次运行时可以复用。这个过程减少了单次请求承载的内容，也保留了长会话的处理路径；压缩仍由语言模型完成，摘要可能遗漏或误解细节，因此结果需要结合原始材料判断。",
          ],
        },
        {
          id: "validation",
          title: "让模型输出经过结构检查",
          paragraphs: [
            "最终日志直接保存为 JSON，正文包含“今天用了啥”“干了啥”和“可写进简历的一件事”。程序检查字段类型、非空内容与最低详细程度；遇到格式问题时，尝试要求模型修复，再经过同一套检查。",
            "日期、会话数和轮次数由程序根据实际输入写入，其中轮次数是根据消息数量计算的近似值。这样，生成内容和可计算的元数据各有来源。结构检查能够拦住格式错误与明显过短的输出，事实判断仍依赖来源质量和内容复核。",
          ],
        },
        {
          id: "traceability",
          title: "保存依据，也让汇总可以重建",
          paragraphs: [
            "每日日志是主要记录，技术清单和时间线都从现有日志重新汇总。技术名称会进行轻量的别名归一，使常见大小写和分隔符差异尽量归到同一条记录；不能识别的名称保留日志提供的信息。",
            "如果需要追溯生成依据，可以选择保存压缩前的标准化消息归档。归档记录合并后的输入、顺序、日期、时区和指纹，也支持单独补存而不调用模型、不改写日志。它保存的是流水线实际读取并筛选后的输入；文件默认私有、排除自动提交，gzip 只负责压缩。",
          ],
        },
        {
          id: "publishing",
          title: "从本地日志走到网站时间线",
          paragraphs: [
            "项目已经与这个网站建立数据更新链路。日志数据推送后，源仓库先运行测试并验证日志，再通知网站处理对应的数据版本。网站导出公开快照、完成构建与部署，并读取发布结果核对版本和内容。",
            "公开内容按日期配对，只包含日期、精简工具名称和当天的时间线事件。完整日志正文、会话归档、缓存和完整技术清单不进入网站快照。日志生成、Git 推送与网站发布是相互衔接的步骤，各自保留状态和验证依据。",
          ],
        },
        {
          id: "boundaries",
          title: "保持一个小工具的规模",
          paragraphs: [
            "整个生成器使用 Python 标准库，以单脚本为核心，支持指定日期、日期区间、预演和历史补处理。配置完成后就可以围绕已有本地数据使用，无需为日志整理再部署后台服务。",
            "它的覆盖范围取决于可读到的会话来源，生成质量取决于模型与输入，输出应作为工作回顾材料。当前生成会调用配置的模型接口，并非默认离线处理；私有归档的本地保护也不代表数据从未发送给模型服务。源读取警告、生成失败和公开内容复核都需要认真对待。",
          ],
        },
      ],
      pipelineTitle: "从开发会话到公开时间线",
      pipeline: [
        {
          title: "读取来源",
          detail: "汇集可读取的 Hermes、Codex 与可选 OpenCode 记录。",
        },
        {
          title: "按日期合并",
          detail: "在指定时区内筛选、标准化并排列输入。",
        },
        {
          title: "分段整理",
          detail: "繁忙日期按顺序压缩，相同输入复用已有摘要。",
        },
        {
          title: "校验日志",
          detail: "检查 JSON 结构，写入由程序计算的元数据。",
        },
        {
          title: "重建汇总",
          detail: "从每日日志整理技术清单与时间线。",
        },
        {
          title: "更新网站",
          detail: "导出公开字段，构建发布，再核对发布结果。",
        },
      ],
      linksTitle: "继续查看项目",
      links: [
        {
          href: heroPublicLinks.vibeJournalPipeline,
          label: "源码与项目文档",
        },
      ],
    },
    en: {
      eyebrow: "DEVELOPMENT JOURNALS / PYTHON PIPELINE",
      title: "vibe-journal-pipeline",
      subtitle:
        "Turning scattered development conversations into a record worth revisiting.",
      introduction:
        "A development journaling pipeline built with the Python standard library. It brings together Hermes, Codex and optional OpenCode sessions, produces structured Chinese journals by date, rebuilds a technology inventory and timeline from those journals, and supplies selected public records to this website.",
      backLabel: "Back to the project room",
      tocLabel: "In this case study",
      readLabel: "Read the full case study",
      sections: [
        {
          id: "problem",
          title: "Leaving a useful record of development",
          paragraphs: [
            "When development involves multiple agents, a day's work is scattered across tools and sessions. Some conversations record requirements, others discuss implementation, and others preserve debugging and verification. Reviewing that work means finding the sources first, then extracting meaningful activity from many exchanges.",
            "vibe-journal-pipeline gathers these materials by date into a structured journal. It records the technologies used, the work completed and a reusable description of an achievement, then builds a timeline so scattered sessions can be revisited day by day.",
          ],
        },
        {
          id: "sources",
          title: "Gathering a day's data first",
          paragraphs: [
            "The pipeline can read Hermes's SQLite session database, Codex CLI/Desktop JSONL sessions and an optional local OpenCode database. Hermes and Codex also support reading configured remote sources over SSH.",
            "Each source is filtered and normalized, then merged chronologically within the same date window. Date boundaries follow the local timezone or an explicitly chosen timezone. Records are organized as complete days, retaining source and session information before moving to summarization.",
          ],
        },
        {
          id: "compression",
          title: "Breaking down a busy day",
          paragraphs: [
            "For ordinary dates, the journal is generated directly from the merged conversations. When the merged input exceeds 300 messages, the program splits it in order into similarly sized chunks, compresses each chunk and generates the daily journal from those summaries. Every filtered input message belongs to a processing chunk.",
            "Intermediate summaries are cached by input fingerprint, so the same input can be reused on a later run. This reduces the content carried by a single request while preserving a processing path for long conversations. Compression still relies on a language model, which may omit or misinterpret details, so results need to be judged alongside the original material.",
          ],
        },
        {
          id: "validation",
          title: "Checking the structure of model output",
          paragraphs: [
            "The final journal is saved directly as JSON. Its body contains sections for technologies used today, work completed and one achievement that could go on a résumé. The program checks field types, nonempty content and a minimum level of detail. When formatting fails, it attempts a model-assisted repair and applies the same checks again.",
            "The program writes the date, session count and turn count from the actual input; the turn count is an approximation calculated from the number of messages. Generated content and computable metadata therefore have distinct sources. Structural checks catch malformed or clearly too-short output, while factual assessment still depends on source quality and content review.",
          ],
        },
        {
          id: "traceability",
          title: "Preserving evidence and rebuilding summaries",
          paragraphs: [
            "Daily journals are the primary records. The technology inventory and timeline are rebuilt from the journals already present. Lightweight alias normalization brings common differences in capitalization and separators under the same technology entry where possible. Unrecognized names retain the information supplied by the journal.",
            "To trace what a journal was based on, users can optionally archive normalized messages before compression. The archive records the merged input, order, date, timezone and fingerprint. Archives can also be backfilled separately without calling the model or rewriting journals. They preserve the input the pipeline actually read and filtered. Files are private by default and excluded from automatic commits; gzip provides compression only.",
          ],
        },
        {
          id: "publishing",
          title: "From local journals to the website timeline",
          paragraphs: [
            "The project already has a data update path to this website. After journal data is pushed, the source repository runs tests and validates the journals, then asks the website to process that data version. The website exports a public snapshot, builds and deploys it, and reads back the published result to check its version and contents.",
            "Public content is paired by date and contains only the date, concise tool names and that day's timeline event. Full journal bodies, conversation archives, caches and the complete technology inventory are excluded from the website snapshot. Journal generation, Git pushes and website publication are connected steps, each with its own status and verification evidence.",
          ],
        },
        {
          id: "boundaries",
          title: "Keeping the scale of a small tool",
          paragraphs: [
            "The generator uses the Python standard library and is centered on one script. It supports individual dates, date ranges, dry runs and historical backfills. Once configured, it works with existing local data without requiring a backend service just to organize journals.",
            "Coverage depends on the session sources it can read, and output quality depends on the model and its input. Results should be treated as material for reviewing work. Generation currently calls the configured model API and is not offline by default. Local protections for private archives also do not mean the data was never sent to a model service. Source-reading warnings, generation failures and public-content review all require attention.",
          ],
        },
      ],
      pipelineTitle: "From sessions to a public timeline",
      pipeline: [
        {
          title: "Read session sources",
          detail:
            "Gather readable Hermes, Codex and optional OpenCode records.",
        },
        {
          title: "Merge by date",
          detail:
            "Filter, normalize and order inputs within the selected timezone.",
        },
        {
          title: "Summarize in chunks",
          detail:
            "Compress busy days in sequence and reuse summaries with matching inputs.",
        },
        {
          title: "Validate the journal",
          detail:
            "Check JSON structure and add metadata calculated from the input.",
        },
        {
          title: "Rebuild summaries",
          detail:
            "Derive the technology inventory and timeline from saved daily journals.",
        },
        {
          title: "Update the website",
          detail:
            "Export public fields, build and publish, then verify the public result.",
        },
      ],
      linksTitle: "Explore the project",
      links: [
        {
          href: heroPublicLinks.vibeJournalPipeline,
          label: "Source & project documentation",
        },
      ],
    },
  },
} as const satisfies Readonly<
  Record<string, Readonly<Record<HeroLocale, HeroProjectCaseStudy>>>
>;

export type HeroProjectSlug = keyof typeof projectCaseStudies;
