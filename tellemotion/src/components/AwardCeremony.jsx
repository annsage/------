import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

// Web Audio API를 활용한 트럼펫 팡파르 연주 (C 메이저 화음 피날레)
const playFanfareSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTrumpetNote = (freq, startTime, duration, volume = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'triangle'; // 금속성 관악기 질감을 위한 삼각파 사용
      osc.frequency.setValueAtTime(freq, startTime);
      
      // 비브라토(LFO) 추가로 웅장함 향상
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 6; 
      lfoGain.gain.value = 3; 
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startTime);
      lfo.stop(startTime + duration);
      
      // 로우패스 필터로 부드럽게 윤기 내기
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.05); // 어택 타임
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    
    // 빰 빰 빰 빰 - 빰빠라밤!
    playTrumpetNote(392.00, now, 0.22);         // 솔
    playTrumpetNote(523.25, now + 0.22, 0.22);   // 도
    playTrumpetNote(659.25, now + 0.44, 0.22);   // 미
    playTrumpetNote(784.00, now + 0.66, 0.3);    // 솔
    
    // 피날레 화음 (C 메이저 코드)
    playTrumpetNote(1046.50, now + 0.98, 1.3, 0.12); // 높은 도
    playTrumpetNote(1318.51, now + 0.98, 1.3, 0.08); // 높은 미
    playTrumpetNote(1567.98, now + 0.98, 1.3, 0.08); // 높은 솔
    playTrumpetNote(523.25, now + 0.98, 1.3, 0.15);  // 중간 도
  } catch (e) {
    console.error("팡파르 연주 실패:", e);
  }
};

// 짝꿍 아바타 수여식용 뷰 컴포넌트
function AwardPartnerAvatar({ studentColor, studentEmotion, helperColor, helperEmotion }) {
  const colorMap = {
    '빨강': '#FF8787',
    '노랑': '#FFE066',
    '파랑': '#74C0FC',
    '초록': '#8CE99A',
    '보라': '#D0BFFF',
    '무채색': '#ADB5BD'
  };

  const getEmotionEmoji = (emo) => {
    switch (emo) {
      case '행복': return '🥰';
      case '평온': return '😌';
      case '불안': return '😰';
      case '슬픔': return '😢';
      case '화남': return '😡';
      case '피곤': return '🥱';
      default: return '😌';
    }
  };

  const sColor = colorMap[studentColor] || colorMap['파랑'];
  const hColor = colorMap[helperColor] || colorMap['노랑'];

  return (
    <div className="flex items-end justify-center relative -space-x-3 w-40 h-28 my-6">
      {/* 학생 아바타 */}
      <div 
        className="w-16 h-20 bg-[#FFF0F0] rounded-t-3xl border-4 border-gray-800 flex flex-col items-center justify-center relative shadow-lg transform -rotate-3 hover:rotate-0 transition-transform" 
        style={{ borderBottom: `12px solid ${sColor}` }}
      >
        <span className="text-4xl mb-2">{getEmotionEmoji(studentEmotion)}</span>
        <span className="text-[10px] font-black text-gray-500 bg-white/90 px-1.5 py-0.5 rounded absolute -bottom-3 border border-gray-200">
          학생
        </span>
      </div>

      {/* 손잡기 골드 링 */}
      <div className="w-8 h-2 bg-gradient-to-r from-amber-400 to-yellow-300 border-2 border-gray-800 rounded-full mb-6 z-10 animate-pulse"></div>

      {/* 도우미 아바타 */}
      <div 
        className="w-16 h-20 bg-[#FFF0F0] rounded-t-3xl border-4 border-gray-800 flex flex-col items-center justify-center relative shadow-lg transform rotate-3 hover:rotate-0 transition-transform" 
        style={{ borderBottom: `12px solid ${hColor}` }}
      >
        <span className="text-4xl mb-2">{getEmotionEmoji(helperEmotion)}</span>
        <span className="text-[10px] font-black text-white bg-orange-500 px-1.5 py-0.5 rounded absolute -bottom-3 shadow">
          도우미
        </span>
      </div>
    </div>
  );
}

function AwardCeremony({ team, onClose }) {
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // 마운트되자마자 빰빠라밤 팡파르 연주!
    playFanfareSound();

    const handleResize = () => {
      setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
      {/* 화려한 꽃가루 폭죽 연출 */}
      <Confetti
        width={windowDimension.width}
        height={windowDimension.height}
        recycle={true}
        numberOfPieces={400}
        gravity={0.12}
        colors={['#FFD700', '#FF8787', '#74C0FC', '#8CE99A', '#D0BFFF', '#FFE066']}
      />

      {/* 애니메이션 스타일 키프레임 주입 */}
      <style>{`
        @keyframes award-appear {
          0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          70% { transform: scale(1.05) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes shine-gold {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-award {
          animation: award-appear 1s cubic-bezier(0.34, 1.56, 0.64, 1) 1;
        }
        .gold-shine-border {
          background: linear-gradient(135deg, #FFD700, #FFA500, #FFE066, #FFD700);
          background-size: 300% 300%;
          animation: shine-gold 4s ease infinite;
        }
      `}</style>

      {/* 상장 전체 컨테이너 */}
      <div className="max-w-2xl w-full bg-amber-50 p-2 rounded-[36px] shadow-[0_20px_50px_rgba(255,215,0,0.3)] animate-award border-4 border-white relative overflow-hidden">
        
        {/* 금빛 번쩍이는 가장자리 테두리 */}
        <div className="gold-shine-border p-3.5 rounded-[30px] w-full h-full">
          
          {/* 안쪽 세련된 동화책 속지 테두리 */}
          <div className="bg-[#FFFDF6] border-[6px] border-amber-300 rounded-[22px] px-8 py-10 flex flex-col items-center text-center relative">
            
            {/* 귀여운 데코레이션 코너 리본 */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></div>

            {/* 골드 크라운 / 메달 엠블럼 */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 flex items-center justify-center border-4 border-white shadow-md mb-6 animate-pulse">
              <span className="text-4xl">👑</span>
            </div>

            {/* 상장 타이틀 */}
            <h2 className="text-4xl md:text-5xl font-black text-amber-800 tracking-wider mb-2 break-keep">
              최고의 팀워크 상
            </h2>
            <p className="text-sm font-black text-amber-600 tracking-widest mb-6">
              TELLEMOTION HONOR AWARD
            </p>

            {/* 팀 이름 */}
            <div className="bg-amber-100/70 border-y-2 border-amber-200 px-6 py-2 mb-6">
              <span className="text-2xl font-black text-amber-900">{team.teamName}</span>
            </div>

            {/* 상장 내용 본문 */}
            <div className="max-w-md mb-6 px-4">
              <p className="text-xl md:text-2xl font-bold text-gray-700 leading-loose break-keep">
                "위 팀은 <span className="text-green-600 font-black">‘말하지 않아도 통하는, 텔레모션’</span>을 훌륭히 실천하여 학급에 따뜻한 감동을 주었기에 이 상을 수여합니다."
              </p>
            </div>

            {/* 수상자 아바타 일러스트 */}
            <AwardPartnerAvatar
              studentColor={team.studentAvatar?.color || '파랑'}
              studentEmotion={team.studentAvatar?.emotion || '평온'}
              helperColor={team.helperAvatar?.color || '노랑'}
              helperEmotion={team.helperAvatar?.emotion || '행복'}
            />

            {/* 수상자 정보 */}
            <div className="flex gap-4 text-lg font-black text-gray-700 mb-6">
              <span>학생: <span className="text-amber-800 font-extrabold">{team.studentName}</span></span>
              <span>•</span>
              <span>도우미: <span className="text-amber-800 font-extrabold">{team.helperName}</span></span>
            </div>

            {/* 수여 날짜 및 기관 */}
            <div className="text-gray-500 font-bold flex flex-col gap-1 text-sm mt-2">
              <span>{dateStr}</span>
              <span className="text-amber-700 font-extrabold text-base tracking-widest mt-1">
                텔레모션 학급 평화 지킴이 일동 🌿
              </span>
            </div>

            {/* 닫기 및 축하 버튼 */}
            <button
              onClick={onClose}
              className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-2xl py-4 px-12 rounded-full shadow-lg border-4 border-white transition-transform active:scale-95 cursor-pointer z-30 animate-bounce"
            >
              축하해주기 👏
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

export default AwardCeremony;
