# Security Policy

## Supported Versions

The latest release receives fixes. Older versions do not.

## Reporting a Vulnerability

Report privately through
[GitHub Security Advisories](https://github.com/abreufilho/vscode-gherkin-preview/security/advisories/new).
Please do not open a public issue for a vulnerability.

This is a personal project maintained on a best-effort basis. There is no
response time commitment. If a report needs a fix that I cannot make, I will say
so rather than leave it open.

## Scope

The extension parses `.feature` files the user opens. That content is untrusted,
so the preview:

- builds every node with `createElement` and `textContent`, so no document text
  is ever parsed as markup;
- serves the webview under a Content Security Policy where scripts run by nonce
  only and no origin is reachable;
- makes no network request and bundles its parser.

A report showing that a `.feature` file can escape any of these is in scope.

## Dismissed Code Scanning Alerts

**`js/missing-origin-check` on the webview `message` listener.** The rule asks
that a handler compare `event.origin` before trusting a message. It is dismissed
here rather than fixed, for two reasons.

Nothing else can post to this page. A VS Code webview runs in an iframe the
editor creates, under a `vscode-webview://` origin generated per webview, and
the Content Security Policy admits no remote content and no inline script, so
the page loads nothing that could message itself. The extension host is the only
sender.

There is also nothing sound to compare against. The origin is generated at
runtime and differs between the desktop editor, the browser and Codespaces; VS
Code publishes no constant for it and its own webview samples do not check it.
Any comparison written here would be a guess, and a wrong guess silently stops
the preview from ever rendering.

The message is still validated: the handler reads `type` and ignores anything it
does not recognise, so an unexpected message is discarded rather than acted on.
