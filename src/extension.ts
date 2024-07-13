import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { EnvSyncConfig, getConfig } from './config';

let fileWatcher: vscode.FileSystemWatcher | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  context.subscriptions.push(statusBarItem);

  const syncCommand = vscode.commands.registerCommand('echoEnv.syncEnvFiles', () => {
    syncEnvFiles();
  });

  context.subscriptions.push(syncCommand);

  setupFileWatcher(context);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('echoEnv')) {
        setupFileWatcher(context);
      }
    })
  );

  updateStatusBar('echo.env: ready');
}

function setupFileWatcher(context: vscode.ExtensionContext) {
  if (fileWatcher) {
    fileWatcher.dispose();
  }

  const config = getConfig();
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (workspaceFolders) {
    const pattern = new vscode.RelativePattern(
      workspaceFolders[0],
      `**/{${config.sourceFiles.join(',')}}`
    );

    fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    fileWatcher.onDidChange(syncEnvFiles);
    fileWatcher.onDidCreate(syncEnvFiles);
    fileWatcher.onDidDelete(syncEnvFiles);

    context.subscriptions.push(fileWatcher);
  }
}

async function syncEnvFiles() {
  const config = getConfig();
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder found');
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;

  try {
    updateStatusBar('echo.env: syncing...', true);
    const sourceEnvs = await readSourceEnvFiles(rootPath, config);
    await updateDestinationFiles(rootPath, sourceEnvs, config);
    updateStatusBar('echo.env: synced', false);

    if (config.showNotifications) {
      vscode.window.showInformationMessage('.env files synchronized successfully');
    }
  } catch (error: unknown) {
    updateStatusBar('echo.env: error', false);
    if (error instanceof Error) {
      vscode.window.showErrorMessage(`Error syncing .env files: ${error.message}`);
      console.error('echo.env error:', error);
    } else {
      vscode.window.showErrorMessage(
        `An unexpected error occurred while syncing .env files`
      );
      console.error('echo.env unexpected error:', error);
    }
  }
}

function updateStatusBar(text: string, syncing: boolean = false) {
  statusBarItem.text = text;
  if (syncing) {
    statusBarItem.command = undefined;
  } else {
    statusBarItem.command = 'echoEnv.syncEnvFiles';
  }
  statusBarItem.show();
}

async function readSourceEnvFiles(
  rootPath: string,
  config: EnvSyncConfig
): Promise<Map<string, string>> {
  const envMap = new Map<string, string>();

  for (const sourceFile of config.sourceFiles) {
    const filePath = path.join(rootPath, sourceFile);
    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const [key, value] = line.split('=').map((part) => part.trim());
        if (key && value) {
          envMap.set(key, value);
        }
      }
    }
  }

  return envMap;
}

async function updateDestinationFiles(
  rootPath: string,
  sourceEnvs: Map<string, string>,
  config: EnvSyncConfig
) {
  const existingDestFile = config.destinationFiles.find((file) =>
    fs.existsSync(path.join(rootPath, file))
  );
  const destFile = existingDestFile || config.destinationFiles[0];

  const filePath = path.join(rootPath, destFile);
  let content = '';

  if (fs.existsSync(filePath)) {
    content = await fs.promises.readFile(filePath, 'utf8');
  }

  const lines = content.trim().split('\n');

  const updatedLines = lines
    .filter((line) => {
      const [key] = line.split('=').map((part) => part.trim());
      return !key || sourceEnvs.has(key);
    })
    .map((line) => {
      const [key, value] = line.split('=').map((part) => part.trim());
      if (key && sourceEnvs.has(key)) {
        const placeholder = config.placeholderFormat.replace(
          '${key}',
          key.toLowerCase()
        );
        return `${key}=${placeholder}`;
      }
      return line;
    });

  sourceEnvs.forEach((value, key) => {
    if (!updatedLines.some((line) => line.startsWith(`${key}=`))) {
      const placeholder = config.placeholderFormat.replace(
        '${key}',
        key.toLowerCase()
      );
      updatedLines.push(`${key}=${placeholder}`);
    }
  });

  const updatedContent = updatedLines.join('\n');

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, updatedContent);
}

export function deactivate() {
  if (fileWatcher) {
    fileWatcher.dispose();
  }
  statusBarItem.dispose();
}
