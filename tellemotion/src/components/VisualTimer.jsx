import React, { useEffect, useState } from 'react';
import useEnergyStore from '../store/useEnergyStore';

const VisualTimer = () => {
  const { isSafeZoneActive, timerSeconds, tickTimer } = useEnergyStore();
  const [maxTime, setMaxTime] = useState(0);

  // 안전지대 진입 시 초기 목표 시간을 저장
  useEffect(() => {
    if (isSafeZoneActive && timerSeconds > 0 && maxTime === 0) {
      setMaxTime(timerSeconds);
    } else if (!isSafeZoneActive) {
      setMaxTime(0);
    }
  }, [isSafeZoneActive, timerSeconds, maxTime]);

  // 1초마다 tickTimer 실행
  useEffect(() => {
    let interval = null;
    if (isSafeZoneActive) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSafeZoneActive, tickTimer]);

  // 활성화되지 않았으면 렌더링하지 않음
  if (!isSafeZoneActive) return null;

  // 원형 프로그레스 바 계산
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  // 남은 시간에 따른 stroke-dashoffset 계산 (시간이 줄어들수록 원이 비워짐)
  const strokeDashoffset = maxTime > 0 
    ? circumference - (timerSeconds / maxTime) * circumference 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md">
      <div className="bg-white p-12 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in duration-300">
        <h2 className="text-3xl font-black text-gray-800 mb-8 tracking-tight">
          편안하게 쉬는 시간
        </h2>
        
        {/* 원형 시각적 타이머 */}
        <div className="relative flex items-center justify-center w-80 h-80">
          <svg className="transform -rotate-90 w-full h-full drop-shadow-md" viewBox="0 0 300 300">
            {/* 배경 원 */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="currentColor"
              strokeWidth="28"
              fill="transparent"
              className="text-gray-100"
            />
            {/* 진행률 원 */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="currentColor"
              strokeWidth="28"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-teal-400 transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* 중앙 아이콘 */}
          <div className="absolute flex flex-col items-center justify-center animate-pulse">
            <span className="text-7xl mb-2 drop-shadow-sm">🌿</span>
          </div>
        </div>

        <p className="mt-10 text-xl font-bold text-teal-700 text-center bg-teal-50 px-6 py-3 rounded-full">
          원이 작아지는 동안 천천히 숨을 쉬어요
        </p>
      </div>
    </div>
  );
};

export default VisualTimer;
