'use client';

import { type TermsSection } from '@/types/terms';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  sections: TermsSection[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for header
      
      // Find the current section based on scroll position
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Set initial active section

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="p-6 bg-card border border-border rounded-xl">
      <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
      <nav className="space-y-2">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "block text-left text-sm transition-colors py-1 hover:text-primary",
                activeSection === section.id 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground"
              )}
            >
              {section.order}. {section.title}
            </button>
            {section.subsections && section.subsections.length > 0 && (
              <div className="ml-4 space-y-1">
                {section.subsections.map((subsection) => (
                  <button
                    key={subsection.id}
                    onClick={() => scrollToSection(subsection.id)}
                    className={cn(
                      "block text-left text-xs transition-colors py-0.5 hover:text-foreground",
                      activeSection === subsection.id 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground"
                    )}
                  >
                    {section.order}.{subsection.order} {subsection.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}