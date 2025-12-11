import { z } from 'zod';
import { TermsMetadata, TermsSection, TermsContent } from '@/types/terms';

// Zod schemas for validation
export const TermsMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  version: z.string().min(1, 'Version is required'),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
});

export const TermsSubsectionSchema = z.object({
  id: z.string().min(1, 'Subsection ID is required'),
  title: z.string().min(1, 'Subsection title is required'),
  content: z.string().min(1, 'Subsection content is required'),
  order: z.number().positive('Order must be positive')
});

export const TermsSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Section title is required'),
  content: z.string().min(1, 'Section content is required'),
  order: z.number().positive('Order must be positive'),
  subsections: z.array(TermsSubsectionSchema).optional()
});

export const TermsContentSchema = z.object({
  metadata: TermsMetadataSchema,
  sections: z.array(TermsSectionSchema).min(1, 'At least one section is required')
});

// Validation functions
export function validateTermsMetadata(metadata: unknown): TermsMetadata {
  try {
    return TermsMetadataSchema.parse(metadata) as TermsMetadata;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new TermsValidationError(`Invalid terms metadata: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export function validateTermsSection(section: unknown): TermsSection {
  try {
    return TermsSectionSchema.parse(section) as TermsSection;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new TermsValidationError(`Invalid terms section: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export function validateTermsContent(content: unknown): TermsContent {
  try {
    return TermsContentSchema.parse(content) as TermsContent;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new TermsValidationError(`Invalid terms content: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Content validation helpers
export function validateRequiredSections(sections: TermsSection[]): void {
  const requiredSectionTitles = [
    'Service Description',
    'User Obligations', 
    'Liability Limitations',
    'Privacy Policy and Data Handling',
    'Contact Information',
    'Governing Law and Jurisdiction',
    'Service Availability and Modifications'
  ];

  const sectionTitles = sections.map(s => s.title);
  const missingSections = requiredSectionTitles.filter(title => 
    !sectionTitles.some(sectionTitle => 
      sectionTitle.toLowerCase().includes(title.toLowerCase())
    )
  );

  if (missingSections.length > 0) {
    throw new Error(`Missing required sections: ${missingSections.join(', ')}`);
  }
}

export function validateContentStructure(content: TermsContent): void {
  // Validate metadata
  validateTermsMetadata(content.metadata);

  // Validate sections
  content.sections.forEach(section => validateTermsSection(section));

  // Validate required legal sections
  validateRequiredSections(content.sections);

  // Validate section ordering
  const orders = content.sections.map(s => s.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    throw new Error('Duplicate section order numbers found');
  }

  // Validate subsection ordering within each section
  content.sections.forEach(section => {
    if (section.subsections && section.subsections.length > 0) {
      const subOrders = section.subsections.map(s => s.order);
      const uniqueSubOrders = new Set(subOrders);
      if (subOrders.length !== uniqueSubOrders.size) {
        throw new Error(`Duplicate subsection order numbers in section: ${section.title}`);
      }
    }
  });
}

// Error classes for better error handling
export class TermsValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'TermsValidationError';
  }
}

export class TermsContentError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TermsContentError';
  }
}