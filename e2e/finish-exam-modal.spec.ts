import { test, expect } from '@playwright/test';
import translations from '../client/i18n/locales/english/translations.json';

test.use({ storageState: 'playwright/.auth/certified-user.json' });

const examUrl =
  '/learn/foundational-c-sharp-with-microsoft/foundational-c-sharp-with-microsoft-certification-exam/foundational-c-sharp-with-microsoft-certification-exam';

test.beforeEach(async ({ page }) => {
  await page.goto(examUrl);
  await page
    .getByRole('button', {
      name: translations.buttons['click-start-exam']
    })
    .click();
  for (let i = 0; i < 4; i++) {
    await page.getByTestId('exam-answer-label-0').check();
    await page
      .getByRole('button', {
        name: translations.buttons['next-question']
      })
      .click();
  }
  await page.getByTestId('exam-answer-label-0').check();
  await page
    .getByRole('button', {
      name: translations.buttons['finish-exam']
    })
    .click();
});

test.describe('Finish Exit exam Modal E2E Test Suite', () => {
  test('Verifies the Correct Rendering of the Finish Exit exam Modal', async ({
    page
  }) => {
    await expect(
      page.getByText(translations.learn.exam['finish-header'])
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: translations.buttons.close
      })
    ).toBeVisible();
    await expect(page.getByText(translations.learn.exam.finish)).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: translations.learn.exam['finish-yes']
      })
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: translations.learn.exam['finish-no']
      })
    ).toBeVisible();
  });

  test('Closes the Finish Exit exam Modal When the User clicks on finish-no button', async ({
    page
  }) => {
    await page
      .getByRole('button', { name: translations.learn.exam['exit-no'] })
      .click();
    await expect(
      page.getByText(translations.learn.exam['exit-header'])
    ).not.toBeVisible();
  });

  test('Closes the Modal when the User clicks on finish-yes button', async ({
    page
  }) => {
    await page
      .getByRole('button', { name: translations.learn.exam['finish-yes'] })
      .click();
    await expect(
      page.getByText(translations.learn.exam['finish-header'])
    ).not.toBeVisible();
  });

  test('Closes the Modal when the User clicks on X button', async ({
    page
  }) => {
    await page
      .getByRole('button', { name: translations.buttons.close })
      .click();
    await expect(
      page.getByText(translations.learn.exam['finish-header'])
    ).not.toBeVisible();
  });
});
