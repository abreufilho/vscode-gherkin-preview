import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator, type Feature } from '@cucumber/messages';

/**
 * Parses a Gherkin document and returns its feature.
 *
 * A document without a feature is valid Gherkin, so an empty result is not an
 * error. Anything the parser rejects throws, and the caller reports it.
 */
export function parseFeature(source: string): Feature | null {
  const parser = new Parser(
    new AstBuilder(IdGenerator.incrementing()),
    new GherkinClassicTokenMatcher()
  );

  return parser.parse(source).feature ?? null;
}
