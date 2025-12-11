import { supabase } from '../supabase';

interface Repository {
  id?: string;
  provider: 'github' | 'gitlab';
  name: string;
  fullName: string;
  defaultBranch: string;
  dockerfilePath: string;
  repositoryUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RepositoryWithBuilds extends Repository {
  buildCount?: number;
  lastBuildStatus?: string;
  lastBuildDate?: string;
}

export class RepositoryService {
  // CREATE - Add a new repository
  static async create(repository: Omit<Repository, 'id' | 'createdAt' | 'updatedAt'>): Promise<Repository> {
    const { data, error } = await supabase
      .from('Repository')
      .insert(repository)
      .select()
      .single();

    if (error) throw new Error(`Failed to create repository: ${error.message}`);
    return data;
  }

  // READ - Get all repositories
  static async getAll(): Promise<Repository[]> {
    const { data, error } = await supabase
      .from('Repository')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw new Error(`Failed to fetch repositories: ${error.message}`);
    return data || [];
  }

  // READ - Get repositories with build statistics
  static async getAllWithStats(): Promise<RepositoryWithBuilds[]> {
    const { data, error } = await supabase
      .from('Repository')
      .select(`
        *,
        builds:Build(count, status, createdAt)
      `)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(`Failed to fetch repositories with stats: ${error.message}`);
    
    return (data || []).map((repo: any) => {
      const builds = repo.builds || [];
      const lastBuild = builds.length > 0 ? builds[0] : null;
      
      return {
        ...repo,
        buildCount: builds.length,
        lastBuildStatus: lastBuild?.status,
        lastBuildDate: lastBuild?.createdAt,
        builds: undefined, // Remove raw builds data
      };
    });
  }

  // READ - Get a single repository by ID
  static async getById(id: string): Promise<Repository | null> {
    const { data, error } = await supabase
      .from('Repository')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
    
    return data;
  }

  // READ - Get repositories by provider
  static async getByProvider(provider: 'github' | 'gitlab'): Promise<Repository[]> {
    const { data, error } = await supabase
      .from('Repository')
      .select('*')
      .eq('provider', provider)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(`Failed to fetch repositories by provider: ${error.message}`);
    return data || [];
  }

  // READ - Search repositories by name
  static async search(query: string): Promise<Repository[]> {
    const { data, error } = await supabase
      .from('Repository')
      .select('*')
      .or(`name.ilike.%${query}%,fullName.ilike.%${query}%`)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(`Failed to search repositories: ${error.message}`);
    return data || [];
  }

  // UPDATE - Update a repository
  static async update(
    id: string,
    updates: Partial<Omit<Repository, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Repository> {
    const { data, error } = await supabase
      .from('Repository')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update repository: ${error.message}`);
    return data;
  }

  // UPDATE - Update dockerfile path
  static async updateDockerfilePath(id: string, dockerfilePath: string): Promise<Repository> {
    return this.update(id, { dockerfilePath });
  }

  // DELETE - Remove a repository (cascades to builds)
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('Repository')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete repository: ${error.message}`);
  }

  // DELETE - Remove multiple repositories
  static async deleteMany(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('Repository')
      .delete()
      .in('id', ids);

    if (error) throw new Error(`Failed to delete repositories: ${error.message}`);
  }

  // UTILITY - Check if repository exists
  static async exists(fullName: string, provider: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('Repository')
      .select('id')
      .eq('fullName', fullName)
      .eq('provider', provider)
      .single();

    return !error && data !== null;
  }

  // UTILITY - Get repository count by provider
  static async getCountByProvider(): Promise<{ github: number; gitlab: number }> {
    const { data, error } = await supabase
      .from('Repository')
      .select('provider');

    if (error) throw new Error(`Failed to count repositories: ${error.message}`);
    
    const counts = { github: 0, gitlab: 0 };
    (data || []).forEach((repo: any) => {
      if (repo.provider === 'github') counts.github++;
      if (repo.provider === 'gitlab') counts.gitlab++;
    });
    
    return counts;
  }
}
