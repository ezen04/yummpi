import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ocrAnalysisSchema, type OcrAnalysis } from '@yummpi/schemas';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

export interface OcrFixture {
  name: string;
  tokens: OcrAnalysis;
  expected: unknown;
}

export function loadOcrFixtures(): OcrFixture[] {
  const entries = readdirSync(FIXTURES_DIR);
  const tokenFiles = entries.filter((f) => f.endsWith('.tokens.json'));

  return tokenFiles.map((tokenFile) => {
    const name = tokenFile.replace(/\.tokens\.json$/, '');
    const tokensRaw = JSON.parse(
      readFileSync(join(FIXTURES_DIR, tokenFile), 'utf-8')
    ) as unknown;
    const expectedRaw = JSON.parse(
      readFileSync(join(FIXTURES_DIR, `${name}.expected.json`), 'utf-8')
    ) as unknown;

    return {
      name,
      tokens: ocrAnalysisSchema.parse(tokensRaw),
      expected: expectedRaw,
    };
  });
}
