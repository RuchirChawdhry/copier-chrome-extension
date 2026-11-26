import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

export default class DiagnosticsReporter implements Reporter {
  private tests: unknown[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const events = result.attachments.filter((item) => item.name === 'browser-events' && item.path).flatMap((item) => JSON.parse(readFileSync(item.path as string, 'utf8')));
    this.tests.push({
      title: test.titlePath().join(' / '),
      status: result.status,
      durationMs: result.duration,
      errors: result.errors.map((error) => ({ message: error.message, location: error.location })),
      events,
      artifacts: result.attachments.filter((item) => item.path).map((item) => ({ name: item.name, path: relative(process.cwd(), item.path as string) })),
    });
  }

  onEnd(result: FullResult) {
    mkdirSync('reports', { recursive: true });
    writeFileSync('reports/diagnostics.json', JSON.stringify({ schema: 1, status: result.status, tests: this.tests }, null, 2) + '\n');
  }
}
