import type {
  Background,
  Examples,
  Feature,
  FeatureChild,
  Rule,
  RuleChild,
  Scenario,
  Step,
  TableRow,
  Tag,
} from '@cucumber/messages';
import type { HostMessage, WebviewMessage } from '../types';

interface VsCodeApi {
  postMessage(message: WebviewMessage): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string | null,
  text?: string | null
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // textContent throughout: every string below comes from the previewed
  // document, so nothing is ever parsed as markup.
  if (text !== null && text !== undefined) node.textContent = text;
  return node;
}

function requireElement(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`missing element: ${id}`);
  }
  return found;
}

const root = requireElement('root');
const empty = requireElement('empty');

const GIVEN = /^(given|dado|dada|dados|dadas)$/;
const WHEN = /^(when|quando)$/;
const THEN = /^(then|então|entao)$/;

function stepClass(keyword: string | undefined): string {
  const normalised = (keyword ?? '').trim().toLowerCase();
  if (GIVEN.test(normalised)) return 'given';
  if (WHEN.test(normalised)) return 'when';
  if (THEN.test(normalised)) return 'then';
  return 'conj';
}

function renderTags(tags: readonly Tag[] | undefined): HTMLElement | null {
  if (!tags || tags.length === 0) return null;
  const wrap = element('div', 'tags');
  tags.forEach((tag) => wrap.append(element('span', 'tag', tag.name)));
  return wrap;
}

function renderTable(rows: readonly TableRow[]): HTMLElement | null {
  if (rows.length === 0) return null;
  const table = element('table', 'data-table');
  rows.forEach((row, index) => {
    const tr = element('tr', index === 0 ? 'header-row' : null);
    row.cells.forEach((cell) =>
      tr.append(element(index === 0 ? 'th' : 'td', null, cell.value))
    );
    table.append(tr);
  });
  return table;
}

function renderStep(step: Step): HTMLElement {
  const wrap = element('div', `step ${stepClass(step.keyword)}`);
  wrap.append(element('span', 'kw', step.keyword.trim()));
  wrap.append(element('span', 'txt', ` ${step.text}`));

  if (step.docString) {
    wrap.append(element('pre', 'docstring', step.docString.content));
  }
  if (step.dataTable) {
    const table = renderTable(step.dataTable.rows);
    if (table) wrap.append(table);
  }
  return wrap;
}

function renderExamples(examples: Examples): HTMLElement {
  const wrap = element('div', 'examples');
  const title = examples.name ? `${examples.keyword}: ${examples.name}` : examples.keyword;
  wrap.append(element('div', 'examples-head', title));

  const rows: TableRow[] = [];
  if (examples.tableHeader) rows.push(examples.tableHeader);
  rows.push(...examples.tableBody);

  const table = renderTable(rows);
  if (table) wrap.append(table);
  return wrap;
}

function renderScenario(scenario: Scenario): HTMLElement {
  const card = element('div', 'card scenario');
  const tags = renderTags(scenario.tags);
  if (tags) card.append(tags);

  card.append(element('div', 'card-title', `${scenario.keyword}: ${scenario.name}`));
  if (scenario.description.trim()) {
    card.append(element('div', 'description', scenario.description.trim()));
  }

  const steps = element('div', 'steps');
  scenario.steps.forEach((step) => steps.append(renderStep(step)));
  card.append(steps);

  scenario.examples.forEach((examples) => card.append(renderExamples(examples)));
  return card;
}

function renderBackground(background: Background): HTMLElement {
  const card = element('div', 'card background');
  const title = background.name
    ? `${background.keyword}: ${background.name}`
    : background.keyword;
  card.append(element('div', 'card-title', title));

  const steps = element('div', 'steps');
  background.steps.forEach((step) => steps.append(renderStep(step)));
  card.append(steps);
  return card;
}

function renderRule(rule: Rule): HTMLElement {
  const wrap = element('div', 'rule');
  wrap.append(element('div', 'rule-title', `${rule.keyword}: ${rule.name}`));
  rule.children.forEach((child) => renderChild(child, wrap));
  return wrap;
}

function renderChild(child: FeatureChild | RuleChild, container: HTMLElement): void {
  if (child.background) {
    container.append(renderBackground(child.background));
    return;
  }
  if (child.scenario) {
    container.append(renderScenario(child.scenario));
    return;
  }
  if ('rule' in child && child.rule) {
    container.append(renderRule(child.rule));
  }
}

function renderFeature(feature: Feature): void {
  root.replaceChildren();

  const header = element('div', 'feature-header');
  const tags = renderTags(feature.tags);
  if (tags) header.append(tags);

  header.append(element('h1', 'feature-title', `${feature.keyword}: ${feature.name}`));
  if (feature.description.trim()) {
    header.append(element('div', 'feature-description', feature.description.trim()));
  }

  root.append(header);
  feature.children.forEach((child) => renderChild(child, root));
}

function renderError(message: string): void {
  root.replaceChildren();
  const box = element('div', 'parse-error');
  box.append(element('strong', null, 'Parse error'));
  box.append(element('pre', null, message));
  root.append(box);
}

window.addEventListener('message', (event: MessageEvent<HostMessage>) => {
  const message = event.data;
  if (!message || message.type !== 'render') return;

  document.body.className = `theme-${message.theme}`;

  if (message.error) {
    empty.style.display = 'none';
    renderError(message.error);
    return;
  }

  if (!message.feature) {
    root.replaceChildren();
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  renderFeature(message.feature);
});

vscode.postMessage({ type: 'ready' });
