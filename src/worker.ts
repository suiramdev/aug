import fs from 'fs/promises';
import { DescribeFn, ItFn, suiteContext, SuiteRunner } from './api/suite';
import { chromium, Page, PageScreenshotOptions } from 'playwright';

export async function runScenario(filePath: string) {
  const runner = new SuiteRunner();

  const sourceCode = await fs.readFile(filePath, 'utf8');

  const it = (name: string, fn: ItFn) => {
    runner.registerIt(name, fn);
  };

  const describe = (name: string, fn: DescribeFn) => {
    runner.registerDescribe(name, fn);
  };

  const screenshot = async (page: Page, options?: PageScreenshotOptions) => {
    const buffer = await page.screenshot(options);

    runner.registerScreenshot(buffer.toString('base64'));

    return buffer;
  };

  const evalFn = new Function('it', 'describe', 'screenshot', sourceCode);
  evalFn(it, describe, screenshot);

  // Register nested describes
  for (const suite of runner.suites) {
    if (suite.type === 'describe') {
      suiteContext.run({ parentId: suite.id }, async () => {
        console.log(`Registering ${suite.name}`);
        await suite.fn();
      });
    }
  }

  for (const suite of runner.suites) {
    if (suite.type === 'it') {
      console.log(`Running ${suite.name}`);

      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();

      await suiteContext.run({ parentId: suite.id }, async () => {
        await suite.fn({ page });
      });

      await browser.close();
    }
  }

  return JSON.stringify(runner.buildTree(), null, 2);
}
