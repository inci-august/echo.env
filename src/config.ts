import * as vscode from 'vscode';

export interface EnvSyncConfig {
  sourceFiles: string[];
  destinationFiles: string[];
  placeholderFormat: string;
  showNotifications: boolean;
}

export function getConfig(): EnvSyncConfig {
  const config = vscode.workspace.getConfiguration('echoEnv');
  return {
    sourceFiles: config.get<string[]>('sourceFiles') || [
      '.env.local',
      '.env.development',
      '.env.dev',
      '.env.test',
      '.env.staging',
      '.env',
    ],
    destinationFiles: config.get<string[]>('destinationFiles') || [
      '.env.template',
      '.env.example',
      '.env.sample',
      '.env.defaults',
      '.env.dist',
    ],
    placeholderFormat: config.get<string>('placeholderFormat') || '${key}',
    showNotifications: config.get<boolean>('showNotifications') || true,
  };
}
