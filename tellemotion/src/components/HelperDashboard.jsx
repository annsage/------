import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import Confetti from 'react-confetti';

function HelperDashboard() {
  const { user } = useAppStore();
  const [studentStatus, setStudentStatus] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [missionComplete, setMissionComplete] = useState(false);

  // 화면 크기 (Confetti용)
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 학생 상태 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, 'Emotions'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setStudentStatus({ id: doc.id, ...doc.data() });
        // 새로운 데이터가 오면 미션 완료 상태 초기화
        setMissionComplete(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleMissionComplete = () => {
    setMissionComplete(true);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000); // 5초 후 폭죽 효과 종료
  };

  const needsMission = studentStatus && ['불안', '화남'].includes(studentStatus.emotion);

  return (
    <div className="w-full min-h-screen bg-green-50 p-4 md:p-8 flex flex-col lg:flex-row gap-8 font-sans">
      {showConfetti && (
        <Confetti
          width={windowDimension.width}
          height={windowDimension.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
        />
      )}

      {/* 좌측: 실시간 학생 상태 모니터링 */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border-4 border-[#A2E3A2] flex-1 flex flex-col">
          <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3 break-keep">
            <span className="text-4xl">👀</span> 
            <span>지금 우리 반 친구는?</span>
          </h2>
          
          {studentStatus ? (
            <div className="flex flex-col gap-6 flex-1">
              <div className="bg-gray-50 p-6 rounded-3xl border-4 border-gray-100 flex flex-col items-center">
                <p className="text-2xl font-bold text-gray-600 mb-4 text-center break-keep">
                  <span className="text-green-600 font-black text-3xl">{studentStatus.name}</span> 친구의 기분
                </p>
                <div className="text-5xl font-black text-gray-800 bg-white px-8 py-6 rounded-2xl shadow-sm text-center border-4 border-gray-200">
                  {studentStatus.emotion}
                </div>
              </div>

              <div className="flex-1 border-[8px] border-[#A2E3A2] rounded-3xl overflow-hidden bg-white flex items-center justify-center min-h-[400px]">
                {studentStatus.imageUrl ? (
                  <img 
                    src={studentStatus.imageUrl} 
                    alt="학생의 마음 그림" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 font-bold text-2xl">그림이 없어요.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-3xl border-4 border-gray-200 border-dashed">
              <span className="text-2xl font-bold text-gray-400 break-keep">아직 도착한 마음이 없어요.</span>
            </div>
          )}
        </div>
      </div>

      {/* 우측: 오늘의 비밀 미션 게시판 */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border-4 border-yellow-300 flex flex-col min-h-[600px]">
          <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3 break-keep border-b-4 border-gray-100 pb-4">
            <span className="text-4xl">💌</span> 
            <span>오늘의 비밀 미션 게시판</span>
          </h2>

          <div className="flex-1 flex flex-col items-center justify-center p-4">
            {needsMission ? (
              <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-700">
                <div className="bg-yellow-50 border-4 border-yellow-400 rounded-3xl p-8 mb-8 w-full shadow-md relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 font-black px-6 py-2 rounded-full text-xl shadow-sm">
                    TOP SECRET
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-4 mt-4 text-center">
                    우리 반 평화 지킴이 {user.name} 출동!
                  </h3>
                  <p className="text-3xl font-black text-gray-800 text-center leading-relaxed break-keep">
                    "{studentStatus.name} 친구가 지금 조금 긴장했어요. 옆에 다가가서 작게 파이팅! 하고 미소 지어주세요."
                  </p>
                </div>

                {!missionComplete ? (
                  <button
                    onClick={handleMissionComplete}
                    className="bg-green-500 hover:bg-green-600 text-white font-black text-4xl py-6 px-12 rounded-full shadow-lg transition-transform active:scale-95 border-4 border-green-700"
                  >
                    미션 완료! 🌟
                  </button>
                ) : (
                  <div className="bg-green-100 border-4 border-green-400 text-green-800 font-black text-3xl py-6 px-12 rounded-full flex items-center gap-4 animate-bounce">
                    <span>🎉</span> 미션 대성공! 참 잘했어요! <span>🎉</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center flex flex-col items-center gap-6 opacity-70">
                <span className="text-8xl">🕊️</span>
                <p className="text-3xl font-bold text-gray-500 break-keep">
                  지금은 평화로운 시간입니다.<br/>친구들이 마음을 보낼 때까지 기다려볼까요?
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelperDashboard;
