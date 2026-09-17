import {
  formatHeroChapterHeading,
  heroChapterDefinitions,
} from "../chapters/definitions";
import type { HeroLocale } from "../preferences/locale";
import type { HeroChapterLocalizedContent } from "../chapters/contentModel";
import type { AxiomsArticle, AxiomsArticleContent } from "./model";

// This ordered collection is the only article registry. Keep translations with their stable ID.
export const heroAxiomsArticles: readonly AxiomsArticle[] = [
  {
    id: "ai-premises",
    translations: {
      zh: {
        label: "命题一",
        title: "AI 改写问题的前提",
        body: "当 Agent 能接手从理解需求到执行验证的一段完整工作，变化就不只是谁写代码更快。我开始重新思考个人能力如何被看见：提出了什么问题，如何组织工具，做出了什么作品，又凭什么相信结果。对我而言，简历也应该呈现这些过程，并让作品提供证据。",
      },
      en: {
        label: "PROPOSITION ONE",
        title: "AI rewrites the premises",
        body: "When an agent can carry a task from interpreting a request through execution and verification, the change reaches beyond coding speed. I find myself reconsidering how personal capability becomes visible: the problems we choose, the tools we organize, the work we deliver, and the reasons we trust it. I want my résumé to show that process, with projects as evidence.",
      },
    },
  },
  {
    id: "agent-first",
    translations: {
      zh: {
        label: "命题二",
        title: "为 Agent 设计可操作的软件",
        body: "在视频生产项目里，我逐渐把输入、任务边界、产物和失败状态说明白。Agent 需要知道能改什么、如何检查、失败后从哪里继续。这是我对 Agent-first 的理解：把可操作的接口和清楚的状态纳入产品设计，同时让人能够观察、判断和接管。",
      },
      en: {
        label: "PROPOSITION TWO",
        title: "Design software agents can operate",
        body: "In my video-production project, I have made inputs, task boundaries, artifacts, and failure states increasingly explicit. An agent needs to know what it may change, how to check it, and where to resume after failure. This is what agent-first means in my practice: usable interfaces and clear state, with people able to observe, judge, and take over.",
      },
    },
  },
  {
    id: "language-projection",
    translations: {
      zh: {
        label: "命题三",
        title: "语言可能只是认知的投影",
        body: "与 AI 对话越多，我越想区分“说得流畅”和“理解了问题”。语言能帮助我整理想法，也可能掩盖遗漏和误解。我仍好奇：认知是否存在难以被语言完整表达的部分？这是一种开放的思考；在工作中，我会把漂亮的解释带回代码、来源与实际结果中检验。",
      },
      en: {
        label: "PROPOSITION THREE",
        title: "Language may be a projection",
        body: "The more I talk with AI, the more I want to distinguish fluent expression from understanding a problem. Language helps organize my thinking, but it can also conceal omissions and misunderstandings. Could cognition include forms that language cannot fully express? I keep that question open. In practical work, I test convincing explanations against sources, code, and actual results.",
      },
    },
  },
  {
    id: "accountable-automation",
    translations: {
      zh: {
        label: "命题四",
        title: "自动化不能消解责任",
        body: "让 Agent 执行更多工作，并不意味着把判断也交出去。我的发布自动化会完成素材上传和字段填写，再回读页面状态，把最终发布留给人确认。代码也是如此：完成一次操作、通过测试、真正上线，是不同的状态。授权、验收和对外承诺，需要有人负责。",
      },
      en: {
        label: "PROPOSITION FOUR",
        title: "Automation does not dissolve responsibility",
        body: "Giving agents more work does not remove the need for judgment. My publishing automation uploads media, fills fields, and reads back the page state, leaving final publication to a person. The same distinction matters in code: an operation executed, tests passed, and a release deployed are different states. Authorization, acceptance, and external commitments need an accountable owner.",
      },
    },
  },
  {
    id: "explore-before-instructing",
    translations: {
      zh: {
        label: "命题五",
        title: "先问有哪些路，再决定怎么走",
        body: "我自己的经验也有局限。过早告诉 AI 每一步该怎么做，可能只是把它限制在我已有的答案里。我更愿意先说明目标、背景和约束，让 AI 查找实践、比较方案、指出盲点，再结合来源和自己的思考做决定。所谓最佳实践，也要回到当前问题里验证。",
      },
      en: {
        label: "PROPOSITION FIVE",
        title: "Explore before prescribing",
        body: "My own experience has limits. Prescribing every step too early can confine AI to the answer I already have in mind. I prefer to explain the goal, context, and constraints, then ask it to research practices, compare options, and expose blind spots. I weigh the sources and make a decision. Even a best practice still has to prove useful for the problem at hand.",
      },
    },
  },
  {
    id: "tool-judgment",
    translations: {
      zh: {
        label: "命题六",
        title: "工具会换，判断需要持续更新",
        body: "我试过多种浏览器自动化方案，当前留下 Ego Lite，原因是它更适合我的实际工作。3D 素材探索也经历了从 Blender MCP 到混元图生 3D 的尝试。我看重知道工具能解决哪一段问题，以及何时值得替换；这种认识需要小实验和持续使用来更新，不能停在收藏列表里。",
      },
      en: {
        label: "PROPOSITION SIX",
        title: "Tools change; judgment must keep up",
        body: "I tried several browser-automation approaches and currently use Ego Lite because it fits my work. My 3D asset experiments also took me from Blender MCP to Hunyuan image-to-3D. I value knowing which part of a problem a tool can solve and when a replacement is worth trying. Small experiments and continued use must keep that judgment current; a list of bookmarks is only a starting point.",
      },
    },
  },
  {
    id: "agent-workspace",
    translations: {
      zh: {
        label: "命题七",
        title: "给 Agent 清楚的工作身份",
        body: "我为 Agent 工作准备独立账号、Mac 用户环境和专用 Ubuntu 主机，用 Tailscale 连接异地工作。这些安排让项目资料、登录状态和个人日常数据更容易分清，也减少旧配置对任务的干扰。它们不能保证 Agent 不出错，但能让我更清楚它在使用什么、操作哪里，以及如何追溯结果。",
      },
      en: {
        label: "PROPOSITION SEVEN",
        title: "Give agents a clear working context",
        body: "I use separate accounts, a dedicated Mac user environment, and an Ubuntu machine for agent work, connecting remotely through Tailscale. This helps distinguish project resources, login state, and everyday personal data, while reducing interference from old configuration. It cannot guarantee that an agent will avoid mistakes, but it makes the resources it uses and the actions it takes easier to trace.",
      },
    },
  },
  {
    id: "maintained-context",
    translations: {
      zh: {
        label: "命题八",
        title: "把一次经验，变成可接续的方法",
        body: "反复纠正同一个问题，让我开始重视 Skills、工程规范和文档维护。我把入口、职责、操作步骤与验收条件写下来，能自动检查的部分再交给脚本和测试。实现变化后，文档也要更新，旧方案要归档。只有这样，下一次对话里的 Agent 才能沿着当前事实继续工作。",
      },
      en: {
        label: "PROPOSITION EIGHT",
        title: "Turn experience into reusable context",
        body: "Correcting the same problem repeatedly taught me to value Skills, engineering conventions, and maintained documentation. I record entry points, responsibilities, steps, and acceptance conditions, then put repeatable checks into scripts and tests. When implementation changes, documentation must follow and old plans must be archived. That gives an agent in the next conversation a reliable place to continue.",
      },
    },
  },
];

export function localizeAxiomsArticles(
  articles: readonly AxiomsArticle[],
  locale: HeroLocale,
): readonly AxiomsArticleContent[] {
  return articles.map(({ id, paper, translations }) => ({
    id,
    paper,
    ...translations[locale],
  }));
}

export const heroAxiomsContent = {
  zh: {
    portal: {
      left: {
        label: formatHeroChapterHeading(heroChapterDefinitions.axioms, "公理"),
        body: "AI 如何改变工作？从实际使用出发，重新思考工具、能力与责任。",
      },
      right: {
        label: "持续追问",
        items: ["能力与认知", "工具与协作", "工程与责任"],
      },
    },
    body: {
      eyebrow: "AXIOMS / WORKING NOTES",
      title: "与 AI 一起工作之后，我重新想过这些事。",
      intro:
        "这些想法来自与 AI 的长期讨论，也来自工具试用、项目返工和实际交付。我把它们记成工作命题：有些已成为日常方法，有些仍是开放的问题，都可以随新的证据改变。",
      sections: localizeAxiomsArticles(heroAxiomsArticles, "zh"),
    },
  },
  en: {
    portal: {
      left: {
        label: formatHeroChapterHeading(
          heroChapterDefinitions.axioms,
          "AXIOMS",
        ),
        body: "How does AI change work? Practice keeps reshaping my view of tools, capability, and responsibility.",
      },
      right: {
        label: "OPEN QUESTIONS",
        items: [
          "Capability and cognition",
          "Tools and collaboration",
          "Engineering and responsibility",
        ],
      },
    },
    body: {
      eyebrow: "AXIOMS / WORKING NOTES",
      title: "Working with AI has changed how I think.",
      intro:
        "These notes come from long conversations with AI, tool experiments, project rework, and actual delivery. Some have become daily practices; others remain open questions. All are working propositions that can change with new evidence.",
      sections: localizeAxiomsArticles(heroAxiomsArticles, "en"),
    },
  },
} satisfies Readonly<Record<HeroLocale, HeroChapterLocalizedContent>>;

export function getAxiomsContent(locale: HeroLocale) {
  return heroAxiomsContent[locale];
}
