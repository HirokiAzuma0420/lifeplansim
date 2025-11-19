# タスク: NISAフォームUIの変更

## 概要

`InvestmentSection.tsx`のNISA入力フォームを、評価総額と評価損益率を個別に入力できるように変更する。

## 手順

1.  `src/components/form/InvestmentSection.tsx`を修正する。
    -   既存のNISA入力フィールドのラベルを「評価総額」に変更する。
    -   「評価損益率」を入力するための新しいフィールド（プラス/マイナスのトグル付き）を追加する。
2.  `src/hooks/useFormState.ts`を修正する。
    -   評価損益率と符号を管理するための新しいstateを追加する。
3.  `src/types/form-types.ts`を修正する。
    -   フォームのstateに対応する型定義を追加する。
