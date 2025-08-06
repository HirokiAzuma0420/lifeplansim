import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  const { inputParams } = req.body || {};
  // 本来ここで計算ロジックを記述。今はダミー返却。
  const result = { total: 999999 }; // 仮の計算結果
  res.status(200).json({ result });
}