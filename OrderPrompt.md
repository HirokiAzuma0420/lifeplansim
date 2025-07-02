コードレビューして不要なコードを精査して。あとプロンプトの回答は日本語で行うように。
formatNumber関数はすでにコード上にないです。

私が特に気にしているのが金融資産の位置を示すグラフの描写部分で二重にみえるところがあるところ
 // If userBracket is not found, it means the user's savings fall outside the defined brackets.
  // In this case, we should not display the marker.
  これが書かれた以降の部分です。