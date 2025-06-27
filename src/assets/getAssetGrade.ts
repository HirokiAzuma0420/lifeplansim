export const getAssetGrade = (amount: number) => {
  if (amount >= 30000000)
    return {
      rank: 'S',
      color: '#8e24aa',
      commenttitle: '圧倒的な安定資産です！',
      comment: '完全な富裕層クラスの資産形成レベルです。FIREを計画しているとしたら、現実になること間違いなし！',
      image: '../public/ranks/s.png',
    };
  if (amount >= 20000000)
    return {
      rank: 'A',
      color: '#1976d2',
      commenttitle: '非常に優れた積立状況です！',
      comment: 'このままいけば老後は安泰。年金との取崩しを考えても安定した資産を持ち続けられます！',
      image: '{`${import.meta.env.BASE_URL}ranks/a.png`}',
    };
  if (amount >= 10000000)
    return {
      rank: 'B',
      color: '#43a047',
      comment: 'この調子で継続を！',
      image: '../public/ranks/b.png',
    };
  if (amount >= 5000000)
    return {
      rank: 'C',
      color: '#f9a825',
      comment: '今後の積立強化が推奨されます。',
      image: '../public/ranks/c.png',
    };
  return {
    rank: 'D',
    color: '#e53935',
    comment: '積立資産の改善が急務です。',
    image: '../public/ranks/d.png',
  };
};
