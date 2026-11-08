# Confidence rubric (Path A vs Path B)

The 80% threshold is a judgement, not a calculation. Use this to make it honest and quick. Wrongly choosing Path A costs
the user a wrong-looking spec; wrongly choosing Path B costs a few minutes of browsing, so when torn, lean to B.

## Hard gates (any "no" means Path B, regardless of score)

- Both a scenario **and** codegen steps were provided.
- Every page/URL in the codegen is one the codebase already models, or is a single new page whose elements are all visible in the codegen.
- You can name the target spec file (or the new spec + tag) and the target page object(s).

## Factors

Start at 100% and subtract. Below 80% means Path B.

| Signal | Penalty |
| --- | --- |
| Codegen touches a page with no matching page object, and codegen shows only some of its elements | -25 |
| Codegen selectors are positional/CSS (`nth`, `.css-1x2y`, long chains) with no role/label/text to fall back on | -20 |
| Scenario has an expected result that codegen doesn't reveal (e.g. an error message, a total, a redirect) | -15 |
| Placement is ambiguous: scenario could fit two existing specs, or fits none cleanly | -20 |
| Steps depend on state you can't see (specific seeded data, a role other than `USER`, feature flags) | -15 |
| Scenario and codegen disagree (extra/missing steps) | -15 |
| Steps include things the framework has no precedent for (file upload, iframes, new tab, downloads) | -10 |

Add back when true: existing specs already cover a near-identical flow you can mirror (+10, cap 100).

## Worked examples

- *"Verify a logged-in user can search events by title"* + codegen using `getByPlaceholder('Search events')` and `getByRole('link', ...)`;
  `EventsPage` already has a search input and `events.spec.ts` exists. ~95%: Path A.
- *"Test the checkout page"* with no codegen. Gate fails: Path B.
- Codegen on a page that has no page object and uses `locator('div:nth-child(3) > button')`. -25 -20 = 55%: Path B.
