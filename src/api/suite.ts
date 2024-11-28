import { Browser, chromium, Page } from 'playwright';
import { Context } from 'vm';

export interface SuiteProps {
  browser: Browser;
  context: Context;
  page: Page;
}

export interface SuiteFn {
  (props: SuiteProps): Promise<void>;
}

export interface DescribeFn {
  (): Promise<void>;
}

export interface Suite {
  (name: string, fn: SuiteFn): void;
  describe(name: string, fn: DescribeFn): void;
}

export const suite: Suite = async (name, fn) => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await fn({
    browser,
    context,
    page,
  });
};

suite.describe = async (name, fn) => {
  await fn();
};
