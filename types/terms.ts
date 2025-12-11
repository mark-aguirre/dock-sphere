export interface TermsMetadata {
  title: string;
  version: string;
  lastUpdated: string;
  effectiveDate: string;
}

export interface TermsSubsection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface TermsSection {
  id: string;
  title: string;
  content: string;
  order: number;
  subsections?: TermsSubsection[];
}

export interface TermsContent {
  metadata: TermsMetadata;
  sections: TermsSection[];
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
}

export interface TermsContentManager {
  getTermsContent(): TermsContent;
  getLastUpdated(): string;
  formatContent(content: string): string;
  generateTableOfContents(sections: TermsSection[]): TableOfContentsItem[];
}