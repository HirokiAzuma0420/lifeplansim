import { test, expect } from '@playwright/test';

test.describe('ST-001: 標準ファミリーケース', () => {
  test('フォーム入力から結果表示までの一連の流れを検証する', async ({ page }) => {
    // 1. フォームページにアクセス
    await page.goto('/');
    await page.getByRole('button', { name: 'プランを作成' }).click();
    await expect(page).toHaveURL(/.*\/form/);

    // 2. フォームの主要な項目を入力 (30代夫婦、子供1人、世帯年収800万円、住宅ローンあり)
    // 家族構成
    await page.getByLabel('あなたの年齢').fill('35');
    await page.getByLabel('配偶者の年齢').fill('35');
    await page.getByRole('button', { name: '次へ' }).click();

    // 収入
    await page.getByLabel('あなたの本業年間収入').fill('500');
    await page.getByLabel('配偶者の本業年間収入').fill('300');
    await page.getByRole('button', { name: '次へ' }).click();

    // 支出
    await page.getByLabel('毎月の生活費（全体）').fill('250000');
    await page.getByRole('button', { name: '次へ' }).click();

    // 子供
    await page.getByRole('radiogroup', { name: /子供はいますか？/ }).getByText('はい').click();
    await page.getByLabel('子供の人数').fill('1');
    await page.getByLabel('第一子が生まれるあなたの年齢').fill('36');
    await page.getByLabel('教育費の想定パターン').selectOption({ label: '公立中心' });
    await page.getByRole('button', { name: '次へ' }).click();

    // 住居
    await page.getByLabel('現在の住居').selectOption('持ち家（ローン中）');
    await page.getByLabel('毎月の返済額').fill('100000');
    await page.getByLabel('ローンの残り年数').fill('30');
    await page.getByRole('button', { name: '次へ' }).click();

    // 貯蓄・投資 (NISAとiDeCoに積立)
    await page.getByLabel('現在の預貯金').fill('500');
    await page.getByRole('button', { name: '投資信託' }).click(); // アコーディオンを開く
    await page.getByTestId('investment-trust-current').fill('200');
    await page.getByTestId('investment-trust-monthly').fill('50000');
    await page.getByRole('button', { name: 'iDeCo' }).click(); // アコーディオンを開く
    await page.getByTestId('ideco-current').fill('100');
    await page.getByTestId('ideco-monthly').fill('23000');

    // 3. 残りのセクションを「次へ」で進む
    for (let i = 0; i < 7; i++) { // 投資セクションの次へボタンは押さないためループ回数を調整
      await page.getByRole('button', { name: '次へ' }).click();
    }

    // 4. 確認画面でシミュレーションを実行
    await page.getByRole('button', { name: /この内容でシミュレーションを実行/ }).click();

    // 5. 結果ページに遷移し、主要な項目を検証
    await expect(page).toHaveURL(/.*\/result/);
    await expect(page.getByText('総資産推移')).toBeVisible();
    const finalAssetLocator = page.locator('div').filter({ hasText: /^最終年の総資産/ }).locator('p').nth(1);
    await expect(finalAssetLocator).not.toHaveText('¥0'); // 最終資産が0円でないことを確認
  });
});