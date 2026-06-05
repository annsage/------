import React from 'react';
import useEnergyStore from './store/useEnergyStore';
import CharacterDisplay from './components/CharacterDisplay';
import AACInput from './components/AACInput';
import BuddySystem from './components/BuddySystem';
import VisualTimer from './components/VisualTimer';
import ScheduleList from './components/ScheduleList';
import MessageHelper from './components/MessageHelper';

function App() {
  const { toggleSafeZone, isSafeZoneActive } = useEnergyStore();

  return (
    <div className="min-h-screen bg-indigo-50/50 flex flex-col items-center py-10 px-4 sm:px-8">
      <h1 className="text-4xl font-black text-indigo-900 mb-8 tracking-tighter drop-shadow-sm">
        에너지 고치 🔋
      </h1>
      
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* 왼쪽: 캐릭터, 짝꿍, 일정 */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6 w-full">
          <CharacterDisplay />
          <BuddySystem />
          <ScheduleList />
        </div>

        {/* 오른쪽: AAC, 소통 도우미, 쉬는 시간 */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6 w-full">
          <AACInput />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <MessageHelper />
            
            <div className="bg-white p-6 rounded-2xl shadow-md border-4 border-white-100 flex flex-col items-center justify-center">
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
                <span className="text-2xl">🌿</span> 쉬는 시간 (60초)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 시각적 타이머 모달 (안전지대 활성화 시 등장) */}
      <VisualTimer />
    </div>
  );
}

export default App;
