import React, { useState } from 'react';
import useEnergyStore from '../store/useEnergyStore';

const BuddySystem = () => {
  const { buddyEnergy, cheerBuddy } = useEnergyStore();
  const [showMessage, setShowMessage] = useState(false);

  // 짝꿍 에너지가 30 이하일 때 위험 상태로 간주
  const isLowEnergy = buddyEnergy <= 30;

  const handleCheer = () => {
    if (cheerBuddy) {
      cheerBuddy();
    }
    
    // 응원 메시지 애니메이션 트리거
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 2500);
  };

  return (
    <div className="w-full max-w-sm mx-auto mt-8 bg-indigo-50 rounded-2xl p-6 shadow-md border-2 border-indigo-100 flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      
      {/* 상단 짝꿍 정보 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm border-2 border-indigo-50">
              👦
            </div>
            {/* 에너지가 낮을 때 깜빡이는 알림 불빛 */}
            {isLowEnergy && (
              <>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white"></span>
              </>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-gray-800 text-lg">통합학급 짝꿍</h3>
            <p className={`text-sm font-bold ${isLowEnergy ? 'text-red-500 animate-pulse' : 'text-indigo-500'}`}>
              에너지: {buddyEnergy}%
            </p>
          </div>
        </div>
        
        {/* 미니 에너지 게이지 */}
        <div className="w-24 h-4 bg-white rounded-full border-2 border-indigo-100 overflow-hidden shadow-inner">
          <div 
            className={`h-full transition-all duration-700 ease-out ${isLowEnergy ? 'bg-red-400' : 'bg-indigo-400'}`}
            style={{ width: `${buddyEnergy}%` }}
          />
        </div>
      </div>

      {/* 응원하기 버튼 */}
      <button 
        onClick={handleCheer}
        className={`
          w-full py-4 font-black rounded-2xl shadow-sm transition-all transform active:scale-95 flex justify-center items-center gap-3 text-lg
          ${isLowEnergy 
            ? 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900 border-b-4 border-yellow-500 hover:border-yellow-400' 
            : 'bg-white hover:bg-gray-50 text-indigo-700 border-2 border-indigo-200'
          }
        `}
      >
        <span className="text-2xl">🎁</span> 
        {isLowEnergy ? '응원 아이템 보내기!' : '인사 건네기'}
      </button>

      {/* 상호작용 피드백 모달/오버레이 */}
      {showMessage && (
        <div className="absolute inset-0 bg-indigo-50/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200 z-10">
          <span className="text-6xl animate-bounce mb-3 drop-shadow-md">💖</span>
          <p className="font-black text-indigo-800 text-center px-4 leading-relaxed text-lg">
            짝꿍에게 힘을 보냈어요!<br/>에너지가 회복되었습니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default BuddySystem;
