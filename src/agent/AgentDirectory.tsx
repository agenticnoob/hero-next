import Link from "next/link";
import type { HeroLocale } from "../preferences/locale";
import type { JournalSnapshot } from "../journal/model";
import { agentCopy, agentMarkdownPath, getAgentContent } from "./content";
import { AxiomStatus } from "../axioms/AxiomStatus";
import { axmorfBrand } from "../shared/brand";

export function AgentDirectory({
  locale,
  snapshot,
}: {
  readonly locale: HeroLocale;
  readonly snapshot: JournalSnapshot;
}) {
  const copy = agentCopy[locale];
  const content = getAgentContent(locale, snapshot);
  return (
    <main className="agent-directory" lang={locale === "zh" ? "zh-CN" : "en"}>
      <div className="agent-directory__inner">
        <header>
          <div className="agent-directory__bar">
            <Link href="/" prefetch={false}>
              ← {copy.home}
            </Link>
            <nav aria-label={locale === "zh" ? "语言" : "Language"}>
              <Link
                href="/agent"
                prefetch={false}
                lang="zh-CN"
                aria-current={locale === "zh" ? "page" : undefined}
              >
                中文
              </Link>
              <Link
                href="/agent/en"
                prefetch={false}
                lang="en"
                aria-current={locale === "en" ? "page" : undefined}
              >
                English
              </Link>
            </nav>
          </div>
          <p className="agent-directory__eyebrow">AXMORF / AGENT</p>
          <h1>{copy.title}</h1>
          <p className="agent-directory__intro">{copy.intro}</p>
          <p>{axmorfBrand.tagline}</p>
          {locale === "zh" && <p>{axmorfBrand.taglineZh}</p>}
          <div className="agent-directory__links">
            <a href={agentMarkdownPath(locale)}>{copy.markdown} ↗</a>
            <a href="/llms.txt">llms.txt ↗</a>
          </div>
          <nav
            className="agent-directory__contents"
            aria-label={copy.navigation}
          >
            <a href="#profile">{copy.profile}</a>
            <a href="#axioms">{copy.axioms}</a>
            <a href="#projects">{copy.projects}</a>
            <a href="#signals">{copy.signals}</a>
            <a href="#journal">{copy.journal}</a>
          </nav>
        </header>

        <section id="profile" aria-labelledby="agent-profile-title">
          <h2 id="agent-profile-title">{copy.profile}</h2>
          <h3>{content.profile.title}</h3>
          <p>{content.profile.intro}</p>
          {content.profile.sections.map((section) => (
            <section key={section.title}>
              <p className="agent-directory__eyebrow">{section.label}</p>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              {section.link && (
                <a href={section.link.href}>{section.link.label} ↗</a>
              )}
            </section>
          ))}
          {content.profile.closing && <p>{content.profile.closing}</p>}
        </section>

        <section id="axioms" aria-labelledby="agent-axioms-title">
          <h2 id="agent-axioms-title">{copy.axioms}</h2>
          <ol className="agent-directory__list">
            {content.axioms.map((article) => (
              <li key={article.id}>
                <h3>{article.title}</h3>
                <AxiomStatus status={article.status} locale={locale} />
                <p>{article.body}</p>
                <a href={agentMarkdownPath(locale, `axioms/${article.id}.md`)}>
                  {copy.markdown} ↗
                </a>
              </li>
            ))}
          </ol>
          <p>{axmorfBrand.tagline}</p>
          {locale === "zh" && <p>{axmorfBrand.taglineZh}</p>}
        </section>

        <section id="projects" aria-labelledby="agent-projects-title">
          <h2 id="agent-projects-title">{copy.projects}</h2>
          <ol className="agent-directory__list">
            {content.projects.map((entry) => (
              <li key={entry.slug}>
                <h3>{entry.title[locale]}</h3>
                <p>{entry.summary[locale]}</p>
                <div className="agent-directory__links">
                  <a href={entry.href}>{copy.readCase} ↗</a>
                  <a
                    href={agentMarkdownPath(
                      locale,
                      `projects/${entry.slug}.md`,
                    )}
                  >
                    {copy.markdown} ↗
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="signals" aria-labelledby="agent-signals-title">
          <h2 id="agent-signals-title">{copy.signals}</h2>
          <p>{content.signals.intro}</p>
          <ul className="agent-directory__list">
            {content.signals.sections.map((section) => (
              <li key={section.title}>
                <h3>{section.title}</h3>
                {section.directory && (
                  <p>
                    {section.directory.name} · {section.directory.detail}
                  </p>
                )}
                <p>{section.body}</p>
                {section.link && (
                  <a href={section.link.href}>{section.link.label} ↗</a>
                )}
              </li>
            ))}
          </ul>
          {content.signals.closing && <p>{content.signals.closing}</p>}
        </section>

        <section id="journal" aria-labelledby="agent-journal-title">
          <h2 id="agent-journal-title">{copy.journal}</h2>
          <p>{copy.journalLanguage}</p>
          <div lang="zh-CN">
            {content.recentEntries.map((entry) => (
              <article key={entry.date}>
                <h3>
                  <time dateTime={entry.date}>{entry.date}</time>
                </h3>
                {entry.tools.length > 0 && (
                  <p>
                    {agentCopy.zh.tools}：{entry.tools.join(" · ")}
                  </p>
                )}
                <p className="agent-directory__event">{entry.event}</p>
              </article>
            ))}
          </div>
          <h3>{copy.archive}</h3>
          <ul className="agent-directory__months">
            {content.journalMonths.map((month) => (
              <li key={month}>
                <a href={agentMarkdownPath(locale, `journal/${month}.md`)}>
                  {month}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
