# Page object model conventions

All code lives in `src/eventhub/`. Specs only talk to page objects through the `app` fixture (`PageFactory`).

## Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Page object | `pages/<Name>Page.ts` | Locators and actions for one page. Extends `BasePage`. |
| Component | `components/<Name>.ts` | A reusable UI piece used by several pages (form, nav bar, dialog). |
| Factory | `PageFactory.ts` | One lazily created, cached instance of each page per Playwright `page`. |
| Types | `types.ts` | Shared interfaces / unions (`EventDetails`, `Category`). |
| Test data | `test-data.ts` | Static data and builders. |
| Config | `config.ts` | `BASE_URL` (env-overridable), `USER` (required `EVENTHUB_EMAIL`/`EVENTHUB_PASSWORD` from `.env` or secrets). |

Do not mix these: no test data in page objects, no locators in `test-data.ts`.

## BasePage

Every page extends `BasePage`, which provides:

- `path` (abstract, relative to `baseURL`) and `goto()`
- `nav` (`NavBar`) and `dialog` (`ConfirmDialog`), so every page already has them
- `message(text)` for toasts and inline messages

Do not re-create nav or dialog locators in a page; use `this.nav` / `this.dialog`.

## Adding elements to a page object

1. Declare each element as `readonly <name>: Locator;` on the class and assign it in the constructor.
2. Name it for what it is (`signInButton`, `eventRows`, `addEventButton`).
3. Locator preference order: `getByRole` -> `getByLabel` -> `getByPlaceholder` -> `getByText` -> `getByTestId` -> CSS/ID (last resort).
   Use `getByTestId('...')` where the app provides stable test ids.
4. Dynamic elements (depend on an argument) are **methods that return a `Locator`**, not properties:
   `eventRow(title: string): Locator`.
5. Actions are `async` methods that do one user-level thing (`login`, `createEvent`, `deleteEvent`) and return `Promise<void>`
   (or a value only when the caller truly needs it).
6. **No assertions** in page objects. Return locators; the spec asserts.
7. No hard waits and no `page.waitForTimeout`. Rely on auto-waiting.
8. If a field cannot be reached through a shared component (e.g. label not associated with its input),
   keep a dedicated locator on the page and leave a one-line comment explaining why
   (see `descriptionInput` in `AdminEventsPage`).

Example:

```ts
export class LoginPage extends BasePage {
  readonly path = '/login';
  readonly heading: Locator;
  readonly form: Form;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Sign in to EventHub' });
    this.form = new Form(page.locator('form'));
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async login(email: string, password: string): Promise<void> {
    await this.form.fill('Email', email);
    await this.form.fill('Password', password);
    await this.signInButton.click();
  }
}
```

## Components (`components/`)

A component wraps a **root `Locator`** (or the `Page` for global UI) and exposes locators/actions scoped under it.

- Create a component when the same UI piece appears on **more than one page**, or is a self-contained widget
  (forms, nav bar, confirm dialog, tables, modals).
- One class per file, file named after the class (`Form.ts`, `NavBar.ts`).
- Constructor takes a `Locator` root (e.g. `new Form(page.locator('#admin-event-form'))`) or a `Page` for global pieces like `NavBar`.
- Scope every locator under `root` so the component works wherever it is placed.
- Keep them generic: `Form` addresses fields by visible label (`form.fill('Title', value)`) so one method serves all fields.
- A page composes components as `readonly` members and builds them in its constructor.
- A component never extends `BasePage`, and never imports a page.

## Creating a new page object

1. Create `pages/<Name>Page.ts`, class `<Name>Page extends BasePage` (PascalCase, ends in `Page`).
2. Set `readonly path = '/route';` and declare locators/components in the constructor after `super(page)`.
3. Add actions as methods.
4. **Register it in `PageFactory.ts`**:
   - import the class,
   - add a getter in the same style as the others:

   ```ts
   get checkoutPage() { return this.get(CheckoutPage); }
   ```

   Getter name = class name in camelCase (`CheckoutPage` -> `checkoutPage`). One page = one getter; never instantiate a page elsewhere.
5. Use it in specs as `app.checkoutPage`.
6. Add any new shared types to `types.ts` and any new data/builders to `test-data.ts`.
7. Update this folder's docs if you introduced a new pattern.

## Reusability: preferred, not forced

- **Prefer reuse.** Before writing a new locator or helper, check `BasePage` and `components/`. If an existing component does the job, use it.
- If the same logic is needed by a second page, extract it into a component (or `BasePage` if every page needs it).
- **Do not force reuse.** If a page has a one-off element or behaviour that does not fit a component cleanly,
  keep it local to that page rather than bending a component with flags and special cases.
- Do not create a component for something used once "just in case". Extract when the second use appears.
- Do not edit a shared component in a way that changes behaviour for other pages without checking all users.
