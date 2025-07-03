export function getAssetGrade(totalAsset: number) {
  if (totalAsset > 100000000) {
    return {
      rank: 'S',
      color: '#FFD700',
      commenttitle: '素晴らしい！',
      comment: 'あなたは資産形成の達人です。この調子で豊かな未来を築きましょう！',
      image: '/public/ranks/s.png',
    };
  } else if (totalAsset > 50000000) {
    return {
      rank: 'A',
      color: '#ADFF2F',
      commenttitle: '非常に良い！',
      comment: '着実に資産を増やしています。更なる飛躍を目指しましょう！',
      image: '/public/ranks/a.png',
    };
  } else if (totalAsset > 30000000) {
    return {
      rank: 'B',
      color: '#87CEEB',
      commenttitle: '良いスタート！',
      comment: '資産形成は順調です。このペースを維持しましょう！',
      image: '/public/ranks/b.png',
    };
  } else if (totalAsset > 10000000) {
    return {
      rank: 'C',
      color: '#FFD700',
      commenttitle: 'まずまずです！',
      comment: '資産形成の基礎はできています。さらに加速させましょう！',
      image: '/public/ranks/c.png',
    };
  } else if (totalAsset > 5000000) {
    return {
      rank: 'D',
      color: '#FFD700',
      commenttitle: 'これからが本番！',
      comment: '資産形成はこれからが重要です。計画的に進めましょう！',
      image: '/public/ranks/d.png',
    };
  } else {
    return {
      rank: 'E',
      color: '#FFD700',
      commenttitle: '頑張りましょう！',
      comment: '資産形成の第一歩を踏み出しましょう。小さなことから始めてみましょう！',
      image: '/public/ranks/e.png',
    };
  }
}