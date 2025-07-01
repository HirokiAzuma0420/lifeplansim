import pandas as pd
import json
import tkinter as tk
from tkinter import filedialog, messagebox
import unicodedata
import re

def to_half_width(s):
    return unicodedata.normalize("NFKC", s)

def parse_income_range(text):
    """収入階級文字列から下限・上限・中央値を数値で抽出"""
    if "以上" in text:
        low = int(re.search(r"\d+", text).group())
        high = None
    elif "未満" in text:
        low = 0
        high = int(re.search(r"\d+", text).group())
    else:
        nums = re.findall(r"\d+", text)
        if len(nums) == 2:
            low, high = map(int, nums)
        else:
            low = high = None
    mid = (low + high) // 2 if high else low
    return low, high, mid

def convert_csv_to_json():
    # ファイル選択
    csv_path = filedialog.askopenfilename(title="CSVファイルを選択", filetypes=[("CSV Files", "*.csv")])
    if not csv_path:
        return

    json_path = filedialog.asksaveasfilename(title="保存先を選択", defaultextension=".json", filetypes=[("JSON Files", "*.json")])
    if not json_path:
        return

    try:
        df_raw = pd.read_csv(csv_path, encoding="shift_jis", skiprows=6, header=None)

        columns = [
            "収入階級",
            "総数",
            "29歳以下", "30〜34歳", "35〜39歳",
            "40〜44歳", "45〜49歳", "50〜54歳", "55〜59歳",
            "60〜64歳", "65歳以上"
        ]
        df_raw.columns = columns
        df = df_raw.drop(columns=["総数"])

        # 前処理：全角→半角・空白除去
        df["収入階級"] = df["収入階級"].astype(str).str.strip().map(to_half_width)

        # 階級→下限・上限・中央値
        df[["low", "high", "mid"]] = df["収入階級"].apply(lambda x: pd.Series(parse_income_range(x)))

        # 数値変換
        for col in df.columns[1:11]:  # 年齢層列のみ
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

        # 出力形式の辞書構造
        result = {
            age_group: [
                {
                    "収入階級": row["収入階級"],
                    "low": row["low"],
                    "high": row["high"],
                    "mid": row["mid"],
                    "count": row[age_group]
                }
                for _, row in df.iterrows()
            ]
            for age_group in columns[2:]  # 年齢層列のみ
        }

        # 保存
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        messagebox.showinfo("完了", "JSONファイルを正常に出力しました。")

    except Exception as e:
        messagebox.showerror("エラー", f"変換中にエラーが発生しました：\n{str(e)}")

# GUI起動
if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()
    convert_csv_to_json()
