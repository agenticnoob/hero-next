const locales = ["zh", "en"];
const sha = /^[a-f0-9]{40}$/;
const digest = /^[a-f0-9]{64}$/;
const repository = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/;

export function object(value, keys, label) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join() !== [...keys].sort().join()
  ) {
    throw new Error(`${label}: unexpected object fields`);
  }
  return value;
}

export function text(value, limit, label) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value !== value.trim() ||
    value.length > limit ||
    /[<>\u0000-\u0008\u000b-\u001f\u007f]/u.test(value)
  ) {
    throw new Error(`${label}: invalid plain text`);
  }
  return value;
}

export function validateContent(value) {
  object(value, locales, "content");
  for (const locale of locales) {
    const item = object(
      value[locale],
      ["title", "summary", "sections"],
      locale,
    );
    text(item.title, 100, "title");
    text(item.summary, 500, "summary");
    if (
      !Array.isArray(item.sections) ||
      item.sections.length < 1 ||
      item.sections.length > 5
    ) {
      throw new Error("Expected 1–5 sections");
    }
    const ids = new Set();
    for (const section of item.sections) {
      object(section, ["id", "title", "paragraphs"], "section");
      if (
        typeof section.id !== "string" ||
        !/^[a-z][a-z0-9-]{0,47}$/.test(section.id) ||
        ids.has(section.id)
      ) {
        throw new Error("Invalid or duplicate section id");
      }
      ids.add(section.id);
      text(section.title, 120, "section title");
      if (
        !Array.isArray(section.paragraphs) ||
        section.paragraphs.length < 1 ||
        section.paragraphs.length > 5
      ) {
        throw new Error("Expected 1–5 paragraphs");
      }
      section.paragraphs.forEach((paragraph) =>
        text(paragraph, 1500, "paragraph"),
      );
    }
  }
  if (
    value.zh.sections.map((s) => s.id).join() !==
    value.en.sections.map((s) => s.id).join()
  ) {
    throw new Error("Locale section identities must match");
  }
  return value;
}

export function validateProjectSnapshot(value) {
  object(value, ["version", "projects"], "snapshot");
  if (
    value.version !== 1 ||
    !Array.isArray(value.projects) ||
    value.projects.length > 500
  ) {
    throw new Error("Invalid project snapshot version or size");
  }
  const ids = new Set();
  for (const project of value.projects) {
    object(
      project,
      [
        "id",
        "slug",
        "repository",
        "url",
        "readmeSha",
        "sourceCommit",
        "sourceDigest",
        "updatedAt",
        "topics",
        "language",
        "content",
      ],
      "project",
    );
    if (
      !Number.isSafeInteger(project.id) ||
      project.id <= 0 ||
      ids.has(project.id)
    ) {
      throw new Error("Invalid or duplicate repository id");
    }
    ids.add(project.id);
    if (
      project.slug !== `gh-${project.id}` ||
      typeof project.repository !== "string" ||
      !repository.test(project.repository) ||
      project.url !== `https://github.com/${project.repository}`
    ) {
      throw new Error("Invalid repository identity or URL");
    }
    if (
      !sha.test(project.readmeSha) ||
      !sha.test(project.sourceCommit) ||
      !digest.test(project.sourceDigest)
    ) {
      throw new Error("Invalid source revision or digest");
    }
    if (
      typeof project.updatedAt !== "string" ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(project.updatedAt) ||
      Number.isNaN(Date.parse(project.updatedAt))
    ) {
      throw new Error("Invalid update date");
    }
    if (
      !Array.isArray(project.topics) ||
      project.topics.length > 20 ||
      new Set(project.topics).size !== project.topics.length ||
      project.topics.some(
        (topic) =>
          typeof topic !== "string" || !/^[a-z0-9-]{1,50}$/.test(topic),
      )
    ) {
      throw new Error("Invalid repository topics");
    }
    if (project.language !== null) text(project.language, 60, "language");
    validateContent(project.content);
  }
  return value;
}
