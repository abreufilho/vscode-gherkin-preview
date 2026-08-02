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
