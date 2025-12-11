import { NextRequest, NextResponse } from 'next/server';
import { TemplateService } from '@/lib/services/template-service';

const templateService = new TemplateService();

/**
 * GET /api/templates - List all templates
 */
export async function GET() {
  try {
    const templates = await templateService.getTemplates();
    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch templates',
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
