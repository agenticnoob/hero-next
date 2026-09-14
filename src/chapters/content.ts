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
