import type { Feature } from '@cucumber/messages';

export type Theme = 'dark' | 'light';

/**
 * Host to webview: the parsed document, or the reason it could not be parsed.
 * Both fields are always present so the webview never guesses which shape it
 * received.
 */
export interface RenderMessage {
  type: 'render';
  theme: Theme;
  feature: Feature | null;
  error: string | null;
}

/** Webview to host: the page is listening. */
export interface ReadyMessage {
  type: 'ready';
}

export type HostMessage = RenderMessage;
export type WebviewMessage = ReadyMessage;
