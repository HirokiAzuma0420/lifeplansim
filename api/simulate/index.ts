export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // POSTリクエスト時は、Vercel/Node.jsのAPI Functionではbodyが既にパース済みのこともあるが、そうでない場合に備えて例外保護
  let inputParams;
  try {
    if (req.headers['content-type'] === 'application/json' && typeof req.body === 'string') {
      inputParams = JSON.parse(req.body).inputParams;
    } else if (req.body && typeof req.body === 'object') {
      inputParams = req.body.inputParams;
    } else {
      inputParams = undefined;
    }
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  // ダミー計算
  const result = { total: 999999, inputParams }; // inputParamsをそのまま返してもよい

  res.status(200).json({ result });
}
