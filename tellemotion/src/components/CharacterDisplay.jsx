import React from 'react';
import useEnergyStore from '../store/useEnergyStore';

const CharacterDisplay = () => {
  const { energy, characterStatus } = useEnergyStore();

  // 배터리 색상 결정
  let batteryColor = 'bg-green-500';
  if (energy <= 30) batteryColor = 'bg-red-500';
  else if (energy <= 60) batteryColor = 'bg-yellow-500';

  // 캐릭터 상태에 따른 이모지 및 애니메이션 결정
  let CharacterVisual = null;
  switch (characterStatus) {
    case 'HAPPY':
      CharacterVisual = (
        <div className="text-8xl animate-bounce drop-shadow-lg">
          😊
        </div>
      );
      break;
    case 'TIRED':
      CharacterVisual = (
        <div className="text-8xl animate-pulse drop-shadow-md">
          😮‍💨
        </div>
      );
      break;
    case 'BURNOUT':
      CharacterVisual = (
        <div className="text-8xl grayscale opacity-70 animate-none drop-shadow-sm relative">
          😵
          {/* 땀 흘리는 애니메이션 연출 */}
          <span className="absolute top-0 right-0 text-4xl animate-bounce">💦</span>
        </div>
      );
      break;
    case 'RESTING':
      CharacterVisual = (
        <div className="text-8xl animate-pulse drop-shadow-md">
          😴
        </div>
      );
      break;
    default:
      CharacterVisual = <div className="text-8xl">😊</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl w-full max-w-md mx-auto border-4 border-gray-100 transition-all duration-300 hover:shadow-2xl">
      
      {/* 캐릭터 표시 영역 */}
      <div className="h-40 flex items-center justify-center mb-8">
        {CharacterVisual}
      </div>

      {/* 배터리 게이지 영역 */}
      <div className="w-full mb-2 flex items-center justify-between px-2">
        <span className="font-extrabold text-gray-700 text-lg">에너지</span>
        <span className="font-extrabold text-gray-700 text-lg">{energy}%</span>
      </div>
      
      {/* 배터리 외형 */}
      <div className="relative w-full h-10 bg-gray-200 rounded-full border-4 border-gray-300 overflow-hidden flex items-center shadow-inner">
        {/* 배터리 잔량 */}
        <div 
          className={`h-full ${batteryColor} transition-all duration-500 ease-out`}
          style={{ width: `${energy}%` }}
        />
      </div>
      
      {/* 상태 텍스트 */}
      <div className="mt-6 px-6 py-2 bg-gray-100 rounded-full">
        <span className="text-xl font-black text-gray-600 tracking-widest uppercase">
          {characterStatus}
        </span>
      </div>
    </div>
  );
};

export default CharacterDisplay;
