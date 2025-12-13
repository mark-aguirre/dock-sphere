import { readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { TermsContent, TermsSection, TermsMetadata, TableOfContentsItem, TermsContentManager } from '@/types/terms';
import { validateContentStructure, TermsContentError, TermsValidationError } from './terms-validation';

class TermsContentManagerImpl implements TermsContentManager {
  private static instance: TermsContentManagerImpl;
  private cachedContent: TermsContent | null = null;

  private constructor() {}

  static getInstance(): TermsContentManagerImpl {
    if (!TermsContentManagerImpl.instance) {
      TermsContentManagerImpl.instance = new TermsContentManagerImpl();
    }
    return TermsContentManagerImpl.instance;
  }

  getTermsContent(): TermsContent {
    if (this.cachedContent) {
      return this.cachedContent;
    }

    try {
      const filePath = join(process.cwd(), 'data', 'terms.md');
      const fileContent = readFileSync(filePath, 'utf-8');
      
      const { metadata, content } = this.parseFrontmatter(fileContent);
      const sections = this.parseContentSections(content);
      
      const termsContent = {
        metadata,
        sections
      };

      // Validate the content structure
      validateContentStructure(termsContent);
      
      this.cachedContent = termsContent;
      return this.cachedContent;
    } catch (error) {
      // Error loading terms content
      
      if (error instanceof TermsValidationError) {
        throw new TermsContentError(`Terms validation failed: ${error.message}`, error);
      }
      
      if (error instanceof Error) {
        throw new TermsContentError(`Failed to load terms content: ${error.message}`, error);
      }
      
      throw new TermsContentError('Unknown error loading terms content');
    }
  }

  getLastUpdated(): string {
    const content = this.getTermsContent();
    return content.metadata.lastUpdated;
  }

  formatContent(content: string): string {
    // Simple markdown to HTML conversion
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|o|l])/gm, '<p>')
      .replace(/(?<!>)$/gm, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[h|u|o])/g, '$1')
      .replace(/(<\/[h|u|o|l]>)<\/p>/g, '$1');
  }

  generateTableOfContents(sections: TermsSection[]): TableOfContentsItem[] {
    return sections.map(section => ({
      id: section.id,
      title: section.title,
      level: 1,
      children: section.subsections?.map(subsection => ({
        id: subsection.id,
        title: subsection.title,
        level: 2
      }))
    }));
  }

  private parseFrontmatter(content: string): { metadata: TermsMetadata; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('Invalid frontmatter format');
    }

    const [, frontmatterYaml, markdownContent] = match;
    const metadata = parseYaml(frontmatterYaml) as TermsMetadata;

    return { metadata, content: markdownContent };
  }

  private parseContentSections(content: string): TermsSection[] {
    const sections: TermsSection[] = [];
    const lines = content.split('\n');
    let currentSection: TermsSection | null = null;
    let currentSubsection: any = null;
    let contentBuffer: string[] = [];

    for (const line of lines) {
      // Main section (## heading)
      if (line.startsWith('## ')) {
        // Save previous section
        if (currentSection) {
          if (currentSubsection) {
            currentSubsection.content = contentBuffer.join('\n').trim();
            currentSection.subsections = currentSection.subsections || [];
            currentSection.subsections.push(currentSubsection);
            currentSubsection = null;
          } else {
            currentSection.content = contentBuffer.join('\n').trim();
          }
          sections.push(currentSection);
        }

        // Start new section
        const title = line.replace('## ', '').trim();
        const id = this.generateId(title);
        currentSection = {
          id,
          title,
          content: '',
          order: sections.length + 1
        };
        contentBuffer = [];
      }
      // Subsection (### heading)
      else if (line.startsWith('### ')) {
        // Save previous subsection
        if (currentSubsection && currentSection) {
          currentSubsection.content = contentBuffer.join('\n').trim();
          currentSection.subsections = currentSection.subsections || [];
          currentSection.subsections.push(currentSubsection);
        } else if (currentSection && contentBuffer.length > 0) {
          currentSection.content = contentBuffer.join('\n').trim();
        }

        // Start new subsection
        const title = line.replace('### ', '').trim();
        const id = this.generateId(title);
        currentSubsection = {
          id,
          title,
          content: '',
          order: (currentSection?.subsections?.length || 0) + 1
        };
        contentBuffer = [];
      }
      // Regular content
      else {
        contentBuffer.push(line);
      }
    }

    // Save the last section/subsection
    if (currentSection) {
      if (currentSubsection) {
        currentSubsection.content = contentBuffer.join('\n').trim();
        currentSection.subsections = currentSection.subsections || [];
        currentSection.subsections.push(currentSubsection);
      } else {
        currentSection.content = contentBuffer.join('\n').trim();
      }
      sections.push(currentSection);
    }

    return sections;
  }

  private generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private getFallbackContent(): TermsContent {
    return {
      metadata: {
        title: 'Terms of Service',
        version: '1.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0]
      },
      sections: [
        {
          id: 'service-unavailable',
          title: 'Service Unavailable',
          content: 'The terms of service content is currently unavailable. Please contact support for assistance.',
          order: 1
        }
      ]
    };
  }

  // Method to clear cache when content is updated
  clearCache(): void {
    this.cachedContent = null;
  }

  // Safe method that returns fallback content on errors
  getTermsContentSafe(): TermsContent {
    try {
      return this.getTermsContent();
    } catch (error) {
      // Error loading terms content, using fallback
      return this.getFallbackContent();
    }
  }
}

// Export singleton instance
export const termsContentManager = TermsContentManagerImpl.getInstance();

// Export utility functions
export function getTermsContent(): TermsContent {
  return termsContentManager.getTermsContent();
}

export function getTermsContentSafe(): TermsContent {
  return termsContentManager.getTermsContentSafe();
}

export function getLastUpdated(): string {
  return termsContentManager.getLastUpdated();
}

export function formatContent(content: string): string {
  return termsContentManager.formatContent(content);
}

export function generateTableOfContents(sections: TermsSection[]): TableOfContentsItem[] {
  return termsContentManager.generateTableOfContents(sections);
}