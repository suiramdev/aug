describe('describe', async () => {
  describe('nested describe', async () => {
    it('should register a describe', async ({ page }) => {
      await page.goto('https://example.com');
      await screenshot(page);
    });
  });
});
