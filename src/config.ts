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
    sourceFiles: config.get<string[]>('sourceFiles') || ['.env', '.env.local'],
    destinationFiles: config.get<string[]>('destinationFiles') || [
      '.env.template',
      '.env.example',
    ],
    placeholderFormat: config.get<string>('placeholderFormat') || 'your_${key}',
    showNotifications: config.get<boolean>('showNotifications') || true,
  };
}
