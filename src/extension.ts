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
    const pattern = new vscode.RelativePattern(workspaceFolders[0], `**/.env*`);

    fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    fileWatcher.onDidChange((uri) => {
      if (config.sourceFiles.some((file) => uri.fsPath.endsWith(file))) {
        syncEnvFiles();
      }
    });
    fileWatcher.onDidCreate((uri) => {
      if (config.sourceFiles.some((file) => uri.fsPath.endsWith(file))) {
        syncEnvFiles();
      }
    });
    fileWatcher.onDidDelete((uri) => {
      if (config.sourceFiles.some((file) => uri.fsPath.endsWith(file))) {
        syncEnvFiles();
      }
    });

    context.subscriptions.push(fileWatcher);
  }
}

async function syncEnvFiles() {
  const config = getConfig();

  try {
    updateStatusBar('echo.env: syncing...', true);
    const sourceEnvs = await readSourceEnvFiles();
    await updateDestinationFiles(sourceEnvs, config);
    updateStatusBar('echo.env: synced', false);

    if (config.showNotifications) {
      vscode.window.showInformationMessage(
        'echo.env: .env files synchronized successfully'
      );
    }
  } catch (error: unknown) {
    updateStatusBar('echo.env: error', false);
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `echo.env: error syncing .env files: ${error.message}`
      );
      console.error('echo.env:', error);
    } else {
      vscode.window.showErrorMessage(
        `echo.env: an unexpected error occurred while syncing .env files`
      );
      console.error('echo.env:', error);
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

async function readSourceEnvFiles(): Promise<Map<string, string>> {
  const envMap = new Map<string, string>();

  const activeFile = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!activeFile) {
    throw new Error('echo.env: no active file found');
  }

  const content = await fs.promises.readFile(activeFile, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        envMap.set(key.trim(), value);
      }
    }
  }

  return envMap;
}

async function updateDestinationFiles(
  sourceEnvs: Map<string, string>,
  config: EnvSyncConfig
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    throw new Error('echo.env: no workspace folder found');
  }

  const activeFile = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!activeFile) {
    throw new Error('echo.env: no active file found');
  }

  const sourceDir = path.dirname(activeFile);

  const existingDestFile = config.destinationFiles.find((file) =>
    fs.existsSync(path.join(sourceDir, file))
  );
  const destFile = existingDestFile || config.destinationFiles[0];

  const filePath = path.join(sourceDir, destFile);

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

  sourceEnvs.forEach((_, key) => {
    if (!updatedLines.some((line) => line.startsWith(`${key}=`))) {
      const placeholder = config.placeholderFormat.replace(
        '${key}',
        key.toLowerCase()
      );
      updatedLines.push(`${key}=${placeholder}`);
    }
  });

  const comment = `# This file is automatically updated by the echo.env extension\n# https://marketplace.visualstudio.com/items?itemName=inci-august.echo-env\n\n`;

  const updatedContent =
    comment + updatedLines.filter((line) => line.trim() !== '').join('\n') + '\n';

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, updatedContent);

  if (!existingDestFile && config.showNotifications) {
    vscode.window.showInformationMessage(`echo.env: created ${destFile}`);
  }
}

export function deactivate() {
  if (fileWatcher) {
    fileWatcher.dispose();
  }
  statusBarItem.dispose();
}
