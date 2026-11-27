import { expect, test } from '../../../src/eventhub/ui/ui-fixtures';

test.describe('Accessibility', { tag: '@ui' }, () => {
  test('AC-ACC-001: Color contrast meets WCAG AA', async ({ app }) => {
    await app.homePage.goto();
    await expect(app.homePage.heading).toBeVisible();

    const contrastRatio = await app.homePage.heading.evaluate((el) => {
      const parseRgb = (cssColor: string): [number, number, number, number] => {
        const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!m) return [0, 0, 0, 1];
        return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] !== undefined ? Number(m[4]) : 1];
      };
      const luminance = ([r, g, b]: [number, number, number, number]) => {
        const channel = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };

      const fg = parseRgb(window.getComputedStyle(el).color);
      let bg: [number, number, number, number] = [255, 255, 255, 1];
      let curr: HTMLElement | null = el as HTMLElement;
      while (curr) {
        const parsed = parseRgb(window.getComputedStyle(curr).backgroundColor);
        if (parsed[3] > 0) {
          bg = parsed;
          break;
        }
        curr = curr.parentElement;
      }
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    });
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  test('AC-ACC-002: Form labels are associated', async ({ app }) => {
    await app.adminEventsPage.goto();

    await expect(app.adminEventsPage.form.field('Title')).toBeVisible();
    await expect(app.adminEventsPage.form.field('Category')).toBeVisible();
    await expect(app.adminEventsPage.form.field('City')).toBeVisible();
    await expect(app.adminEventsPage.form.field('Venue')).toBeVisible();
  });

  test('AC-ACC-003: Keyboard navigation works', async ({ app, page }) => {
    await app.homePage.goto();
    await expect(app.homePage.heading).toBeVisible();

    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedTag);
  });

  test('AC-ACC-004: ARIA labels where needed', async ({ app, page }) => {
    await app.eventsPage.goto();

    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(app.eventsPage.searchInput).toHaveAttribute('placeholder', /.+/);
  });
});
