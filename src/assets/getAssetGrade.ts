export function getAssetGrade(totalAsset: number) {
  if (totalAsset >= 50000000) {
    return {
      rank: 'S',
      color: '#FFD700',
      commenttitle: '完全な経済的自立',
      comment: 'あなたは非常に高い資産を築いています。働き方・暮らし方を自ら選べるフェーズです。',
      image: '/ranks/s.png',
    };
  } else if (totalAsset >= 30000000) {
    return {
      rank: 'A',
      color: '#ADFF2F',
      commenttitle: '資産基盤は万全',
      comment: '将来にわたり安定した生活が見込まれます。リスク資産の活用も検討できる水準です。',
      image: '/ranks/a.png',
    };
  } else if (totalAsset >= 15000000) {
    return {
      rank: 'B',
      color: '#87CEEB',
      commenttitle: '順調な資産形成',
      comment: '平均以上の水準にあります。今後もこのペースで積み上げていきましょう。',
      image: '/ranks/b.png',
    };
  } else if (totalAsset >= 1000000) {
    return {
      rank: 'C',
      color: '#FFA500',
      commenttitle: '基盤はこれから',
      comment: '生活の安定と老後資金に向けて、さらに積立や資産運用を意識していきましょう。',
      image: '/ranks/c.png',
    };
  } else {
    return {
      rank: 'D',
      color: '#FF6347',
      commenttitle: 'スタート地点',
      comment: 'まだ道半ばですが、ここからの積み上げが大きな差になります。まずは毎月の黒字化から始めましょう。',
      image: '/ranks/d.png',
    };
  }
}
