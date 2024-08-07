import { expect } from '@playwright/test';
import { execSync, exec, ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import waitPort from 'wait-port';
import { debugChildProcess, getFreePort, terminate, test } from './utils.js';
import { rm } from 'node:fs/promises';

const waku = fileURLToPath(
  new URL('../packages/waku/dist/cli.js', import.meta.url),
);

const commands = [
  {
    command: 'dev',
  },
  {
    build: 'build',
    command: 'start',
  },
];

const cwd = fileURLToPath(
  new URL('./fixtures/ssr-catch-error', import.meta.url),
);

for (const { build, command } of commands) {
  test.describe(`ssr-catch-error: ${command}`, () => {
    let cp: ChildProcess;
    let port: number;
    test.beforeAll('remove cache', async () => {
      await rm(`${cwd}/dist`, {
        recursive: true,
        force: true,
      });
    });

    test.beforeAll(async () => {
      if (build) {
        execSync(`node ${waku} ${build}`, { cwd });
      }
      port = await getFreePort();
      cp = exec(`node ${waku} ${command} --port ${port}`, { cwd });
      debugChildProcess(cp, fileURLToPath(import.meta.url), [
        /ExperimentalWarning: Custom ESM Loaders is an experimental feature and might change at any time/,
      ]);
      await waitPort({ port });
    });

    test.afterAll(async () => {
      await terminate(cp.pid!);
    });

    test('access top page', async ({ page }) => {
      await page.goto(`http://localhost:${port}/`);
      await expect(page.getByText('Home Page')).toBeVisible();
    });

    test('access invalid page through client router', async ({ page }) => {
      await page.goto(`http://localhost:${port}/`);
      await page.getByText('Invalid page').click();
      await expect(page.getByText('401')).toBeVisible();
    });

    test('access invalid page directly', async ({ page }) => {
      await page.goto(`http://localhost:${port}/invalid`);
      await expect(page.getByText('Unauthorized')).toBeVisible();
    });
  });
}
