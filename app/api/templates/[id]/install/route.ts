import { NextRequest, NextResponse } from 'next/server';
import { TemplateService } from '@/lib/services/template-service';
import { InstallationConfig } from '@/types/template';

const templateService = new TemplateService();

/**
 * POST /api/templates/:id/install - Install template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config: InstallationConfig = await request.json();
    
    const result = await templateService.installTemplate(params.id, config);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error installing template:', error);
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'Failed to install template',
          details: error.details || {},
          suggestions: error.suggestions || [],
          timestamp: new Date().toISOString()
        }
      },
      { status: error.statusCode || 500 }
    );
  }
}
