import { Template } from '@/types/template';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Template loader utility for loading and managing application templates
 */

const TEMPLATES_DIR = path.join(process.cwd(), 'data', 'templates');

let cachedTemplates: Template[] | null = null;

/**
 * Load all templates from the templates directory
 */
export async function loadTemplates(): Promise<Template[]> {
  // Return cached templates if available
  if (cachedTemplates) {
    return cachedTemplates;
  }

  try {
    const files = await fs.readdir(TEMPLATES_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    const templates: Template[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(TEMPLATES_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content) as Template;
      templates.push(template);
    }

    // Cache the templates
    cachedTemplates = templates;

    return templates;
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

/**
 * Load a specific template by ID
 */
export async function loadTemplate(templateId: string): Promise<Template | null> {
  const templates = await loadTemplates();
  return templates.find(t => t.id === templateId) || null;
}

/**
 * Clear the template cache (useful for testing or hot reload)
 */
export function clearTemplateCache(): void {
  cachedTemplates = null;
}

/**
 * Validate template structure
 */
export function validateTemplate(template: any): boolean {
  return !!(
    template.id &&
    template.name &&
    template.description &&
    template.category &&
    template.image &&
    Array.isArray(template.defaultPorts) &&
    Array.isArray(template.defaultEnv) &&
    Array.isArray(template.defaultVolumes) &&
    Array.isArray(template.requiredConfig) &&
    typeof template.multiContainer === 'boolean'
  );
}
