import { test, expect, Page } from '@playwright/test';

// すべて UTF-8（BOMなし）、LF。コメントは日本語。

// 次へボタンを押下してセクションを進めるユーティリティ
async function clickNext(page: Page) {
  await page.getByRole('button', { name: '次へ' }).click();
}

// 初期オーバーレイ/復元モーダルへの対応
async function waitReadyAndDismissRestore(page: Page) {
  // 復元モーダルが表示されている場合は「破棄/最初から」の左側ボタンを押下
  const restoreOverlay = page.locator('div.fixed.inset-0.bg-black');
  if (await restoreOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await restoreOverlay.locator('button').first().click();
  }
  // スピナーオーバーレイの非表示を待機
  await page.locator('svg.animate-spin').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  // 最初の入力が見えるまで待つ（家族構成）
  await page.locator('input[name="familyComposition"]').first().waitFor({ state: 'visible' });
}

test.describe('ST-001: Smoke Test (Happy Path)', () => {
  // @smoke タグを付けて、これがスモークテストであることを示す
  test('フォーム入力から結果表示までの一連の流れを検証する @smoke', async ({ page }) => {
    // このテストではAPIをスタブしない。
    // 事前にフロントエンドとバックエンドの両方のサーバーが起動している必要がある。

    // 1) 直接フォームページへ遷移
    await page.goto('/form');
    await waitReadyAndDismissRestore(page);

    // 2) 家族構成（既婚を選択）
    await page.locator('input[name="familyComposition"]').nth(1).check();
    await clickNext(page);

    // 3) 現在の収入（30代夫婦・世帯年収800相当）
    await page.locator('#personAge').fill('35');
    await page.locator('#mainIncome').fill('500');
    await page.locator('#spouseAge').fill('33');
    await page.locator('#spouseMainIncome').fill('300');
    await clickNext(page);

    // 4) 現在の支出（簡易入力 + 月25万円相当）
    await page.locator('input[name="expenseMethod"]').first().check();
    await page.locator('#livingCostSimple').fill('25');
    await clickNext(page);

    // 5) 車（デフォルトのまま通過）
    await clickNext(page);

    // 6) 住まい（持ち家ローン返済中 + 月10万円・残存30年）
    await page.locator('input[name="housingType"]').nth(1).check();
    await page.locator('#loanMonthlyPayment').fill('10');
    await page.locator('#loanRemainingYears').fill('30');
    await clickNext(page);

    // 8) 子供（1人・第一子は36歳時・公立系）
    await page.locator('input[name="hasChildren"]').first().check();
    await page.locator('#numberOfChildren').fill('1');
    await page.locator('#firstBornAge').fill('36');
    await page.locator('#educationPattern').selectOption({ index: 1 });
    await clickNext(page);

    // 9) 生活（デフォルトで通過）
    await clickNext(page);

    // 10) 親の介護（デフォルトで通過）
    await clickNext(page);

    // 11) 退職・年金（デフォルトで通過）
    await clickNext(page);

    // 12) 老後（デフォルトで通過）
    await clickNext(page);

    // 13) 貯蓄（現在500万円・毎月0）
    await page.locator('#currentSavings').fill('500');
    await page.locator('#monthlySavings').fill('0');
    await clickNext(page);

    // 14) 投資（投資信託をNISA、iDeCoは月2に設定）
    await page.locator('button[aria-controls="accordion-content-investmentTrust"]').click();
    await page.locator('input[name="investmentTrustAccountType"][value="nisa"]').check();
    await page.locator('input[name="investmentTrustCurrent"]').fill('200');
    await page.locator('#investmentTrustMonthly').fill('50000');
    await page.locator('button[aria-controls="accordion-content-investmentIdeco"]').click();
    await page.locator('input[name="investmentIdecoCurrent"]').fill('100');
    await page.locator('#investmentIdecoMonthly').fill('20000');
    await clickNext(page);

    // 15) シミュレーション設定（終了95歳・生活防衛資金300・配偶者NISA合算）
    await page.locator('#simulationPeriodAge').fill('95');
    await page.locator('#emergencyFund').fill('300');
    const spouseNisa = page.locator('input[name="useSpouseNisa"]');
    if (await spouseNisa.isVisible()) {
      await spouseNisa.check();
    }

    // 最終セクションは「完了」ボタン（緑）を押下して確認画面へ
    await page.locator('div.flex.justify-center.space-x-4.mt-6 button.bg-green-500').click();

    // 16) 確認画面で実行
    await page.getByRole('button', { name: 'この内容でシミュレーションを実行' }).click();

    // 17) 結果ページ検証（URL と「可視な SVG」が存在することを確認）
    await expect(page).toHaveURL(/.*\/result/);
    // 実際のAPIは時間がかかる可能性があるので、タイムアウトを長めに設定
    const visibleSvg = page.locator('svg:visible').first();
    await expect(visibleSvg).toBeVisible({ timeout: 10000 });
  });
});