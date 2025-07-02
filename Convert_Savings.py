import pandas as pd
import json
import re
import tkinter as tk
from tkinter import filedialog, messagebox

def normalize(text):
    if pd.isna(text):
        return ""
    return str(text).strip().replace('\u3000', '').replace('\n', '')

def parse_label_components(val1, val2, val3, val4):
    def clean(x):
        return str(x).replace('\n', '').replace('　', '').strip() if pd.notna(x) else ''

    val1 = clean(val1)
    val2 = clean(val2)
    val3 = clean(val3)
    val4 = clean(val4)
    label = val1 + val2 + val3 + val4

    if "無回答" in label:
        return ("無回答", None, None)

    if "非保有" in label:
        return ("非保有", 0, 0)

    if val2 == "～" and "万円" in val4 and "未満" in val4:
        return (label, int(val1), int(val3) - 1)

    if "万円" in val3 and "未満" in val4:
        return (label, 1, int(val1) - 1)

    if "万円" in val3 and "以上" in val4:
        return (label, int(val1), None)

    return (label, None, None)

def normalize_asset_groups(groups):
    valid = []
    total = 0
    for g in groups:
        # min/max が両方 None のもの（≒無回答）を除外
        if g["min"] is None and g["max"] is None:
            continue
        valid.append(g)
        total += g["percent"]

    for g in valid:
        g["percent"] = round(g["percent"] / total * 100, 1)

    return valid

def is_valid_age_range(text):
    return bool(re.match(r"\d+歳代", text))

def convert_excel_to_json():
    root = tk.Tk()
    root.withdraw()

    file_path = filedialog.askopenfilename(
        title="Excelファイルを選択",
        filetypes=[("Excel files", "*.xlsx *.xls")]
    )
    if not file_path:
        messagebox.showwarning("ファイル未選択", "Excelファイルが選択されていません。")
        return

    try:
        df = pd.read_excel(file_path, sheet_name=0, header=None)
        df = df.fillna(method="ffill")

        # ラベル構成は 4〜7行（index=4〜7）
        label_start, label_end = 4, 7
        labels = []
        for col in range(3, df.shape[1]):  # 3列目以降
            val1 = df.iloc[label_start, col]
            val2 = df.iloc[label_start + 1, col]
            val3 = df.iloc[label_start + 2, col]
            val4 = df.iloc[label_start + 3, col]
            label, min_v, max_v = parse_label_components(val1, val2, val3, val4)
            if min_v is not None:
                labels.append({
                    "label": label,
                    "min": min_v,
                    "max": max_v,
                    "col": col
                })

        if not labels:
            raise ValueError("有効なラベルが取得できませんでした")

        # データ本体（インデックス10以降）
        data_df = df.iloc[10:].reset_index(drop=True)
        data_df[[0, 1]] = data_df[[0, 1]].fillna(method="ffill")

        result = []
        for _, row in data_df.iterrows():
            age = normalize(row[0])
            income = normalize(row[1])

            if not is_valid_age_range(age):
                continue

            assetGroups = []
            for lbl in labels:
                val = normalize(row[lbl["col"]])
                val = val.replace('%', '')
                try:
                    percent = float(val)
                    assetGroups.append({
                        "min": lbl["min"],
                        "max": lbl["max"],
                        "percent": percent
                    })
                except ValueError:
                    continue

            if assetGroups:
                assetGroups = normalize_asset_groups(assetGroups)
                result.append({
                    "ageRange": age,
                    "incomeRange": income,
                    "assetGroups": assetGroups
                })

        save_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json")],
            title="保存先を選択"
        )
        if not save_path:
            messagebox.showwarning("警告", "保存先が選択されていません。")
            return

        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        messagebox.showinfo("完了", f"JSONファイルを保存しました：\n{save_path}")

    except Exception as e:
        messagebox.showerror("エラー", f"処理中にエラーが発生しました：\n{e}")

if __name__ == "__main__":
    convert_excel_to_json()
