import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFeature } from '../src/lib/gherkin';

test('parses a feature and its scenarios', () => {
  const feature = parseFeature(`Feature: Checkout
  Scenario: Approved payment
    Given a valid card
    When I pay
    Then the payment is approved
`);

  assert.ok(feature);
  assert.equal(feature.name, 'Checkout');
  assert.equal(feature.children[0]?.scenario?.name, 'Approved payment');
  assert.equal(feature.children[0]?.scenario?.steps.length, 3);
});

test('honours a language directive', () => {
  const feature = parseFeature(`# language: pt
Funcionalidade: Login
  Cenário: Acesso válido
    Dado que tenho uma conta
    Quando informo as credenciais
    Então acesso o sistema
`);

  assert.ok(feature);
  assert.equal(feature.language, 'pt');
  assert.equal(feature.name, 'Login');
});

test('returns null for a document without a feature', () => {
  assert.equal(parseFeature('# just a comment\n'), null);
});

test('reads a background, a rule and an examples table', () => {
  const feature = parseFeature(`Feature: Pricing
  Background:
    Given the catalogue is loaded

  Rule: Discounts apply to members
    Scenario Outline: Member discount
      Given a <tier> member
      Then the discount is <discount>

      Examples:
        | tier   | discount |
        | silver | 5%       |
        | gold   | 10%      |
`);

  assert.ok(feature);
  assert.ok(feature.children[0]?.background);
  const rule = feature.children[1]?.rule;
  assert.ok(rule);
  assert.equal(rule.children[0]?.scenario?.examples[0]?.tableBody.length, 2);
});

test('throws on a document the parser rejects', () => {
  assert.throws(() => parseFeature('Scenario: orphan step\n  Given nothing\n'));
});
