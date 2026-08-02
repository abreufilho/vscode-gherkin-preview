import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { parseFeature } from './lib/gherkin';
import type { Theme, WebviewMessage } from './types';

const panels = new Map<string, vscode.WebviewPanel>();

function getNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

function getTheme(): Theme {
  // HighContrast is the dark high-contrast theme; the light one is
  // HighContrastLight. There is no HighContrastDark member.
  const kind = vscode.window.activeColorTheme.kind;
  const dark =
    kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
  return dark ? 'dark' : 'light';
}

function getWebviewContent(
  webview: vscode.Webview,
  nonce: string,
  scriptUri: vscode.Uri,
  styleUri: vscode.Uri
): string {
  // Scripts run by nonce only, and no origin is reachable.
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    `style-src ${webview.cspSource}`,
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri.toString()}">
  <title>Gherkin Preview</title>
</head>
<body class="theme-${getTheme()}">
  <main id="root"></main>
  <div id="empty">No feature found in this document.</div>
  <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
</body>
</html>`;
}

async function resolveDocument(
  uri: vscode.Uri | undefined
): Promise<vscode.TextDocument | null> {
  if (uri) return vscode.workspace.openTextDocument(uri);
  return vscode.window.activeTextEditor?.document ?? null;
}

async function openPreview(
  context: vscode.ExtensionContext,
  uri: vscode.Uri | undefined
): Promise<void> {
  const document = await resolveDocument(uri);
  if (!document) {
    void vscode.window.showWarningMessage('Open a Gherkin file to preview it.');
    return;
  }

  const key = document.uri.toString();
  const existing = panels.get(key);
  if (existing) {
    existing.reveal();
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    'gherkinPreview',
    // uri.path always uses forward slashes, unlike a filesystem path.
    `Gherkin: ${path.posix.basename(document.uri.path)}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
      retainContextWhenHidden: true,
    }
  );

  panels.set(key, panel);

  const distUri = (...segments: string[]): vscode.Uri =>
    panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', ...segments));

  panel.webview.html = getWebviewContent(
    panel.webview,
    getNonce(),
    distUri('webview', 'preview.js'),
    distUri('webview', 'styles.css')
  );

  const render = (): void => {
    try {
      void panel.webview.postMessage({
        type: 'render',
        theme: getTheme(),
        feature: parseFeature(document.getText()),
        error: null,
      });
    } catch (error) {
      void panel.webview.postMessage({
        type: 'render',
        theme: getTheme(),
        feature: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const subscriptions: vscode.Disposable[] = [
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() === key) render();
    }),
    vscode.window.onDidChangeActiveColorTheme(() => render()),
    panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
      if (message.type === 'ready') render();
    }),
  ];

  panel.onDidDispose(() => {
    panels.delete(key);
    subscriptions.forEach((subscription) => subscription.dispose());
  });
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('gherkin.preview', (uri?: vscode.Uri) =>
      openPreview(context, uri)
    )
  );
}

export function deactivate(): void {
  panels.forEach((panel) => panel.dispose());
  panels.clear();
}
