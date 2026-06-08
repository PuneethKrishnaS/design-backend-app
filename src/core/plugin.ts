import { ProjectConfig } from '../cli/prompts';

export interface PluginContext {
  targetDir: string;
  config: ProjectConfig;
}

export interface Plugin {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  execute(context: PluginContext): Promise<void>;
  uninstall?(context: PluginContext): Promise<void>;
}
