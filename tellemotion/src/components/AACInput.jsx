import React from 'react';
import useEnergyStore from '../store/useEnergyStore';

const AACInput = () => {
  const { inputAAC, isSafeZoneActive } = useEnergyStore();

  // AAC 버튼 데이터
  const aacButtons = [
    { id: 1, label: '시끄러워요', emoji: '😫', type: 'activity', weight: 20, bgColor: 'bg-red-50 hover:bg-red-100 text-red-800 border-red-300 ring-red-400' },
    { id: 2, label: '힘들어요', emoji: '😓', type: 'activity', weight: 15, bgColor: 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-300 ring-orange-400' },
    { id: 3, label: '화가 나요', emoji: '😠', type: 'activity', weight: 30, bgColor: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 ring-rose-400' },
    { id: 4, label: '간식 먹어요', emoji: '🍪', type: 'support', weight: 20, bgColor: 'bg-green-50 hover:bg-green-100 text-green-800 border-green-300 ring-green-400' },
    { id: 5, label: '도와주세요', emoji: '🫂', type: 'support', weight: 15, bgColor: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300 ring-blue-400' },
    { id: 6, label: '조용히 쉴래요', emoji: '🎧', type: 'support', weight: 25, bgColor: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300 ring-purple-400' },
  ];

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-black text-gray-800 mb-6 text-center tracking-tight">
        나의 마음 표현하기
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {aacButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => inputAAC(btn.type, btn.weight)}
            disabled={isSafeZoneActive} // 휴식 중에는 버튼 비활성화 (기획에 따라 변경 가능)
            className={`
              group flex flex-col items-center justify-center p-6 rounded-3xl border-4 
              transition-all duration-200 transform active:scale-95
              focus:outline-none focus:ring-4 focus:border-transparent
              ${btn.bgColor}
              ${isSafeZoneActive 
                ? 'opacity-40 cursor-not-allowed grayscale' 
                : 'cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1'
              }
            `}
            aria-label={btn.label}
          >
            <span className="text-5xl mb-3 drop-shadow-sm transition-transform duration-200 group-hover:scale-110">
              {btn.emoji}
            </span>
            <span className="text-xl font-bold break-keep text-center leading-tight">
              {btn.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AACInput;
