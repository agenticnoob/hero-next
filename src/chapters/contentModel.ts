export type HeroChapterLink = {
  readonly href: string;
  readonly label: string;
};

export type HeroProjectCaseStudy = {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly introduction: string;
  readonly backLabel: string;
  readonly tocLabel: string;
  readonly readLabel: string;
  readonly sections: readonly {
    readonly id: string;
    readonly title: string;
    readonly paragraphs: readonly string[];
    readonly points?: readonly string[];
  }[];
  readonly pipelineTitle: string;
  readonly pipeline: readonly {
    readonly title: string;
    readonly detail: string;
  }[];
  readonly linksTitle: string;
  readonly links: readonly HeroChapterLink[];
};

export type HeroChapterBodySection = {
  readonly label: string;
  readonly title: string;
  readonly body: string;
  readonly link?: HeroChapterLink;
  readonly showcase?: HeroChapterLink;
  readonly directory?: { readonly name: string; readonly detail: string };
  readonly image?: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
    readonly alt: string;
  };
};

export type HeroChapterBodyContent = {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro: string;
  readonly sections: readonly HeroChapterBodySection[];
  readonly closing?: string;
};

export type HeroChapterLocalizedContent = {
  readonly portal: {
    readonly left: { readonly label: string; readonly body: string };
    readonly right: {
      readonly label: string;
      readonly items: readonly string[];
    };
  };
  readonly body: HeroChapterBodyContent;
};
