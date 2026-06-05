import React from 'react';
import useEnergyStore from './store/useEnergyStore';
import CharacterDisplay from './components/CharacterDisplay';
import AACInput from './components/AACInput';
import BuddySystem from './components/BuddySystem';
import VisualTimer from './components/VisualTimer';

function App() {
  const { toggleSafeZone, isSafeZoneActive } = useEnergyStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-4xl font-black text-indigo-900 mb-8 tracking-tighter drop-shadow-sm">
        에너지 고치 🔋
      </h1>
      
      <div className="flex w-full max-w-6xl gap-8 flex-col lg:flex-row items-start justify-center">
        {/* 왼쪽: 캐릭터 및 짝꿍 정보 */}
        <div className="flex flex-col gap-6 w-full lg:w-1/3">
          <CharacterDisplay />
          <BuddySystem />
        </div>

        {/* 오른쪽: AAC 입력 및 컨트롤 */}
        <div className="flex flex-col w-full lg:w-2/3 max-w-xl mx-auto gap-8">
          <AACInput />
          
          <div className="bg-white p-6 rounded-3xl shadow-md border-4 border-gray-100 flex flex-col items-center">
            <h2 className="text-xl font-bold text-gray-700 mb-4">자기조절 도구</h2>
            <button
              onClick={() => toggleSafeZone(true, 60)}
              disabled={isSafeZoneActive}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-sm transition-all transform active:scale-95 flex justify-center items-center gap-2 ${
                isSafeZoneActive 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-teal-500 hover:bg-teal-400 text-white'
              }`}
            >
              <span className="text-2xl">🌿</span> 편안하게 쉬는 시간 (60초)
            </button>
          </div>
        </div>
      </div>

      {/* 시각적 타이머 모달 (안전지대 활성화 시 등장) */}
      <VisualTimer />
    </div>
  );
}

export default App;
