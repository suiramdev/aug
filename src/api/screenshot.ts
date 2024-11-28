import {
  Locator,
  LocatorScreenshotOptions,
  Page,
  PageScreenshotOptions,
} from 'playwright';

export interface Screenshot {
  (prop: Page, options?: PageScreenshotOptions): Promise<void>;
  (prop: Locator, options?: LocatorScreenshotOptions): Promise<void>;
}

export const screenshot: Screenshot = async (prop, options) => {
  await prop.screenshot(options);
};
