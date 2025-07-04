import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';

// react-slickのCSSをインポート
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const slides = [
  {
    img: '/Topview.png',
    caption: '新しいシミュレーション',
  },
  {
    img: '/Topview2.png',
    caption: '簡単な質問に答えて、自分の資産形成をシミュレーション',
  },
  {
    img: '/Topview3.png',
    caption: '貯蓄取崩しや変動利回りのシミュレーションにも対応！',
  },
];

export default function TopPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    afterChange: (index: number) => setCurrentSlide(index),
    arrows: false, // 矢印を非表示にする
    dotsClass: 'slick-dots custom-dots', // カスタムクラスを適用
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <style>{`
        .custom-dots {
          bottom: -40px; /* 下に配置 */
        }
        .custom-dots li button:before {
          font-size: 12px; /* ドットのサイズ */
          color: #9ca3af; /* ドットの色 */
        }
        .custom-dots li.slick-active button:before {
          color: #3b82f6; /* アクティブなドットの色 */
        }
      `}</style>
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <Slider {...settings} className="w-full mb-12">
          {slides.map((slide, index) => (
            <div key={index} className="px-2">
              <div className="h-64 w-full flex items-center justify-center overflow-hidden">
                <img
                  src={slide.img}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ))}
        </Slider>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-10 h-16 flex items-center justify-center">
          {slides[currentSlide].caption}
        </h1>

        {/* 入力欄 */}
        <input
          type="text"
          placeholder="プラン名を入力"
          className="w-full mb-4 rounded-full border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />

        {/* ボタン群 */}
        <div className="flex w-full gap-3">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-semibold shadow transition duration-200"
            onClick={() => navigate('/form')}
          >
            プランを作成
          </button>
          <button
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-full font-semibold shadow transition duration-200"
            onClick={() => navigate('/sample')}
          >
            サンプルを見る
          </button>
        </div>
      </div>
    </div>
  );
}