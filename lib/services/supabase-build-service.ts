import { supabase } from '../supabase';

type BuildStatus = 'pending' | 'building' | 'success' | 'failed';

interface Build {
  id?: string;
  repositoryId: string;
  branch?: string;
  tag?: string;
  commit: string;
  imageName: string;
  imageTag: string;
  status: BuildStatus;
  output: string;
  createdAt?: string;
  completedAt?: string;
  updatedAt?: string;
}

interface BuildWithRepository extends Build {
  repository?: {
    name: string;
    fullName: string;
    provider: string;
  };
}

interface BuildStats {
  total: number;
  pending: number;
  building: number;
  success: number;
  failed: number;
  averageDuration?: number;
}

export class BuildService {
  // CREATE - Start a new build
  static async create(build: Omit<Build, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<Build> {
    const { data, error } = await supabase
      .from('Build')
      .insert(build)
      .select()
      .single();

    if (error) throw new Error(`Failed to create build: ${error.message}`);
    return data;
  }

  // READ - Get all builds
  static async getAll(limit?: number): Promise<BuildWithRepository[]> {
    let query = supabase
      .from('Build')
      .select(`
        *,
        repository:Repository(name, fullName, provider)
      `)
      .order('createdAt', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch builds: ${error.message}`);
    return data || [];
  }

  // READ - Get a single build by ID
  static async getById(id: string): Promise<BuildWithRepository | null> {
    const { data, error } = await supabase
      .from('Build')
      .select(`
        *,
        repository:Repository(name, fullName, provider)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch build: ${error.message}`);
    }
    
    return data;
  }

  // READ - Get builds by repository
  static async getByRepository(repositoryId: string, limit?: number): Promise<Build[]> {
    let query = supabase
      .from('Build')
      .select('*')
      .eq('repositoryId', repositoryId)
      .order('createdAt', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch builds for repository: ${error.message}`);
    return data || [];
  }

  // READ - Get builds by status
  static async getByStatus(status: BuildStatus, limit?: number): Promise<BuildWithRepository[]> {
    let query = supabase
      .from('Build')
      .select(`
        *,
        repository:Repository(name, fullName, provider)
      `)
      .eq('status', status)
      .order('createdAt', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch builds by status: ${error.message}`);
    return data || [];
  }

  // READ - Get recent builds
  static async getRecent(limit: number = 10): Promise<BuildWithRepository[]> {
    return this.getAll(limit);
  }

  // READ - Get active builds (pending or building)
  static async getActive(): Promise<BuildWithRepository[]> {
    const { data, error } = await supabase
      .from('Build')
      .select(`
        *,
        repository:Repository(name, fullName, provider)
      `)
      .in('status', ['pending', 'building'])
      .order('createdAt', { ascending: false });

    if (error) throw new Error(`Failed to fetch active builds: ${error.message}`);
    return data || [];
  }

  // UPDATE - Update build status
  static async updateStatus(id: string, status: BuildStatus, output?: string): Promise<Build> {
    const updates: any = { status };
    
    if (output !== undefined) {
      updates.output = output;
    }
    
    if (status === 'success' || status === 'failed') {
      updates.completedAt = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('Build')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update build status: ${error.message}`);
    return data;
  }

  // UPDATE - Append to build output
  static async appendOutput(id: string, additionalOutput: string): Promise<Build> {
    // First get current output
    const current = await this.getById(id);
    if (!current) throw new Error('Build not found');

    const newOutput = current.output + additionalOutput;

    const { data, error } = await supabase
      .from('Build')
      .update({ output: newOutput })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to append build output: ${error.message}`);
    return data;
  }

  // UPDATE - Update build
  static async update(
    id: string,
    updates: Partial<Omit<Build, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Build> {
    const { data, error } = await supabase
      .from('Build')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update build: ${error.message}`);
    return data;
  }

  // DELETE - Remove a build
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Build')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete build: ${error.message}`);
  }

  // DELETE - Remove old builds (older than specified days)
  static async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('Build')
      .delete()
      .lt('createdAt', cutoffDate.toISOString())
      .select('id');

    if (error) throw new Error(`Failed to delete old builds: ${error.message}`);
    return data?.length || 0;
  }

  // STATISTICS - Get build statistics
  static async getStats(): Promise<BuildStats> {
    const { data, error } = await supabase
      .from('Build')
      .select('status, createdAt, completedAt');

    if (error) throw new Error(`Failed to fetch build stats: ${error.message}`);

    const stats: BuildStats = {
      total: data?.length || 0,
      pending: 0,
      building: 0,
      success: 0,
      failed: 0,
    };

    let totalDuration = 0;
    let completedCount = 0;

    (data || []).forEach((build: any) => {
      stats[build.status as keyof BuildStats] = (stats[build.status as keyof BuildStats] as number) + 1;

      if (build.completedAt && build.createdAt) {
        const duration = new Date(build.completedAt).getTime() - new Date(build.createdAt).getTime();
        totalDuration += duration;
        completedCount++;
      }
    });

    if (completedCount > 0) {
      stats.averageDuration = Math.round(totalDuration / completedCount / 1000); // in seconds
    }

    return stats;
  }

  // STATISTICS - Get stats by repository
  static async getStatsByRepository(repositoryId: string): Promise<BuildStats> {
    const { data, error } = await supabase
      .from('Build')
      .select('status, createdAt, completedAt')
      .eq('repositoryId', repositoryId);

    if (error) throw new Error(`Failed to fetch repository build stats: ${error.message}`);

    const stats: BuildStats = {
      total: data?.length || 0,
      pending: 0,
      building: 0,
      success: 0,
      failed: 0,
    };

    let totalDuration = 0;
    let completedCount = 0;

    (data || []).forEach((build: any) => {
      stats[build.status as keyof BuildStats] = (stats[build.status as keyof BuildStats] as number) + 1;

      if (build.completedAt && build.createdAt) {
        const duration = new Date(build.completedAt).getTime() - new Date(build.createdAt).getTime();
        totalDuration += duration;
        completedCount++;
      }
    });

    if (completedCount > 0) {
      stats.averageDuration = Math.round(totalDuration / completedCount / 1000);
    }

    return stats;
  }

  // UTILITY - Get latest build for repository
  static async getLatestForRepository(repositoryId: string): Promise<Build | null> {
    const { data, error } = await supabase
      .from('Build')
      .select('*')
      .eq('repositoryId', repositoryId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch latest build: ${error.message}`);
    }
    
    return data;
  }

  // UTILITY - Get build duration in seconds
  static getBuildDuration(build: Build): number | null {
    if (!build.completedAt || !build.createdAt) return null;
    return Math.round(
      (new Date(build.completedAt).getTime() - new Date(build.createdAt!).getTime()) / 1000
    );
  }
}
