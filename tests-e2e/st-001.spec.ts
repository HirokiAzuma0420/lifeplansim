import { test, expect } from '@playwright/test';

test.describe('ST-001: 標準ファミリーケース', () => {
  test('フォーム入力から結果表示までの一連の流れを検証する', async ({ page }) => {
    // 1) 直接フォームページへ遷移（トップのテキスト依存を避ける）
    await page.goto('/form');

    // 2) 家族構成（既婚を選択）
    //    値ラベルの文字化け混入に強くするため name と index を利用
    await page.getByRole('radio', { name: '既婚' }).check();
    await page.getByRole('button', { name: '次へ' }).click();

    // 3) 現在の収入（30代夫婦・世帯年収800相当）
    await page.getByLabel('あなたの年齢').fill('35');
    await page.getByLabel('あなたの本業年間収入').fill('500');
    await page.getByLabel('配偶者の年齢').fill('33');
    await page.getByLabel('配偶者の本業年間収入').fill('300');
    await page.getByRole('button', { name: '次へ' }).click();

    // 4) 現在の支出（簡易入力 + 月25万円相当）
    await page.getByRole('radio', { name: '簡単入力' }).check();
    await page.getByLabel('毎月の生活費（住居、車、貯蓄・投資除く）').fill('250000');
    await page.getByRole('button', { name: '次へ' }).click();

    // 5) 車（デフォルトのまま通過）
    await page.getByRole('button', { name: '次へ' }).click();

    // 6) 住まい（持ち家ローン返済中 + 月10万円・残存30年）
    await page.getByRole('radio', { name: '持ち家（ローン返済中）' }).check();
    await page.getByLabel('月額返済（円/月）').fill('100000');
    await page.getByLabel('残存年数（年）').fill('30');
    await page.getByRole('button', { name: '次へ' }).click();

    // 7) 結婚（デフォルトで通過）
    await page.getByRole('button', { name: '次へ' }).click();

    // 8) 子供（1人・第一子は36歳時・公立系）
    await page.getByRole('radiogroup', { name: /子供はいますか？/ }).getByText('はい').click();
    await page.getByLabel('子供の人数').fill('1');
    await page.getByLabel('第一子が生まれるあなたの年齢').fill('36');
    // セレクトは index で選択（ラベル文字化け対策）
    await page.getByLabel('教育費の想定パターン').selectOption({ label: '公立中心' });
    await page.getByRole('button', { name: '次へ' }).click();

    // 9) 生活（家電などはデフォルトで通過）
    await page.getByRole('button', { name: '次へ' }).click();

    // 10) 親の介護（未定などデフォルトで通過）
    await page.getByRole('button', { name: '次へ' }).click();

    // 11) 退職・年金（デフォルトで通過）
    await page.getByRole('button', { name: '次へ' }).click();

    // 12) 老後（デフォルトで通過）
    await page.getByRole('button', { name: '次へ' }).click();

    // 13) 貯蓄（現在500万円・毎月0）
    await page.getByLabel('現在の預貯金').fill('500');
    await page.getByLabel('毎月の貯蓄額').fill('0');
    await page.getByRole('button', { name: '次へ' }).click();

    // 14) 投資（投資信託はNISA、iDeCoは月2万円程度）
    // アコーディオンを開く（テキストは極力安定のものを利用）
    await page.getByRole('button', { name: '投資信託' }).click();
    await page.getByRole('radio', { name: 'NISA口座' }).first().check();
    await page.getByLabel('現在の資産[万円]').nth(1).fill('200');
    await page.getByLabel('月額積立[円]').nth(1).fill('50000');
    await page.getByRole('button', { name: 'iDeCo' }).click();
    await page.getByLabel('現在の資産[万円]').nth(3).fill('100');
    await page.getByLabel('月額積立[円]').nth(3).fill('20000');
    await page.getByRole('button', { name: '次へ' }).click();

    // 15) シミュレーション設定（終了95歳・生活防衛資金300・配偶者NISA合算）
    await page.getByLabel('シミュレーションの対象期間（現在から何歳まで）[歳]').fill('95');
    await page.getByLabel('生活防衛資金（常に確保したい現金額）[万円]').fill('300');
    const spouseNisa = page.locator('input[name="useSpouseNisa"]');
    if (await spouseNisa.isVisible()) {
      await spouseNisa.check();
    }

    // 確認画面へ（最後の「完了」相当）
    await page.getByRole('button', { name: '次へ' }).click();

    // 16) 確認画面で実行
    await page.getByRole('button', { name: /この内容でシミュレーションを実行/ }).click();

    // 17) 結果ページ検証（URL とグラフ存在の最小確認）
    await expect(page).toHaveURL(/.*\/result/);
    await expect(page.getByText('総資産推移')).toBeVisible();
  });
});
