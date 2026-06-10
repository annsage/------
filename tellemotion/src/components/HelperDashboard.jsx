import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import Confetti from 'react-confetti';
import AvatarCreator from './AvatarCreator';

// 오늘 날짜 문자열 YYYY-MM-DD 형식 반환
const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Web Audio API를 이용한 경쾌한 효과음 (도-미-솔-도)
const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(523.25, now, 0.12);
    playNote(659.25, now + 0.08, 0.12);
    playNote(784.00, now + 0.16, 0.12);
    playNote(1046.50, now + 0.24, 0.25);
  } catch (e) {
    console.error("효과음 재생 실패:", e);
  }
};

// 기본 미션 템플릿
const DEFAULT_MISSIONS = [
  "아침에 등교한 친구들에게 먼저 밝은 목소리로 '안녕!' 인사하며 웃어주세요.",
  "쉬는 시간에 물건을 떨어뜨렸거나 자리를 찾는 친구에게 다가가 먼저 친절하게 도와주세요.",
  "혼자 조용히 앉아 있는 친구가 있다면 곁에 가서 좋아하는 관심사나 기분에 대해 이야기 나눠봐요.",
  "점심시간 급식실로 이동할 때 함께 짝이 없는 친구의 손을 잡고 따뜻하게 동행해주세요.",
  "수업 시간이나 활동 중에 멋진 모습을 보여준 친구에게 '오늘 정말 잘했어!'라고 칭찬해주세요.",
  "하루가 끝날 때 교실 뒷정리를 하는 친구의 청소를 돕고, 오늘 수고했다며 함께 하이파이브를 해요."
];

// GPT 미션 생성 함수
const generateMissionsWithGPT = async () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API Key is missing in client env");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 초등학교 교실에서 또래 도우미 활동을 지도하는 다정한 초등 교사입니다. 초등학생 또래 도우미가 1교시부터 6교시 쉬는 시간 동안 학급 평화를 위해 할 수 있는 소소하고 따뜻한 미션 6개를 만듭니다."
        },
        {
          role: "user",
          content: "초등학교 또래 도우미 학생이 1교시~6교시 쉬는 시간에 각각 실천할 수 있는 미션 6개를 친근하고 다정한 존댓말로 만들어 주세요.\n" +
                   "반드시 다음 조건들을 지키세요:\n" +
                   "1. 1교시 쉬는 시간, 2교시 쉬는 시간, 3교시 쉬는 시간, 4교시 쉬는 시간, 5교시 쉬는 시간, 6교시 쉬는 시간별로 구체적으로 한 문장씩 작성하세요.\n" +
                   "2. 초등학생 아이가 부담 없이 일상에서 바로 할 수 있는 착한 말이나 행동이어야 합니다.\n" +
                   "3. 마크다운이나 잡담 없이, 무조건 아래 예시 형태의 순수 JSON Array string 형식으로만 출력해 주세요:\n" +
                   "[\n" +
                   "  \"1교시 미션 텍스트\",\n" +
                   "  \"2교시 미션 텍스트\",\n" +
                   "  \"3교시 미션 텍스트\",\n" +
                   "  \"4교시 미션 텍스트\",\n" +
                   "  \"5교시 미션 텍스트\",\n" +
                   "  \"6교시 미션 텍스트\"\n" +
                   "]"
        }
      ],
      temperature: 0.8
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API responded with status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.choices[0].message.content.trim();
  const cleanedJson = rawText.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleanedJson);
  if (Array.isArray(parsed) && parsed.length === 6) {
    return parsed;
  }
  throw new Error("Invalid format returned by OpenAI");
};

function HelperDashboard() {
  const { user } = useAppStore();
  const [studentStatus, setStudentStatus] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // 돌발 미션 상태 (로컬)
  const [emergencyMissionComplete, setEmergencyMissionComplete] = useState(false);
  
  // 6교시 미션 상태 (Firestore 연동)
  const [dailyMissionsDoc, setDailyMissionsDoc] = useState(null);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [isCreatingMissions, setIsCreatingMissions] = useState(false);

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

  // 1. 학생 감정 상태 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, 'Emotions'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setStudentStatus({ id: docSnap.id, ...docSnap.data() });
        // 새로운 마음 전송이 오면 긴급 미션 완료 상태 리셋
        setEmergencyMissionComplete(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. 6교시 일일 미션 보드 실시간 구독 및 초기화
  const teamId = user.teamId || 'team_1';
  const todayDate = getTodayDateString();

  useEffect(() => {
    const docRef = doc(db, 'teams', teamId, 'dailyMissions', todayDate);

    const DEFAULT_STUDENT_MISSIONS = [
      { id: 1, text: "내 기분과 생각을 그림으로 차분하게 정리하기", completed: false },
      { id: 2, text: "오늘 하루 공부 계획과 목표를 세우고 실천하기", completed: false },
      { id: 3, text: "힘들거나 고민이 있을 때 친구 또는 선생님께 말하기", completed: false }
    ];

    const initializeMissions = async () => {
      if (isCreatingMissions) return;
      setIsCreatingMissions(true);
      
      let missionTexts = DEFAULT_MISSIONS;
      try {
        const gptMissions = await generateMissionsWithGPT();
        missionTexts = gptMissions;
      } catch (error) {
        console.warn("GPT 미션 생성 실패, 기본 학급 미션으로 대체합니다:", error);
      }

      const formattedMissions = missionTexts.map((text, idx) => ({
        period: idx + 1,
        periodName: `${idx + 1}교시 쉬는 시간`,
        text: text,
        completed: false
      }));

      const initialDoc = {
        teamId: teamId,
        date: todayDate,
        missions: formattedMissions,
        completedMissions: [],
        studentMissions: DEFAULT_STUDENT_MISSIONS,
        studentCompletedCount: 0,
        helperCompletedCount: 0,
        completedCount: 0,
        updatedAt: new Date()
      };

      try {
        await setDoc(docRef, initialDoc);
      } catch (error) {
        console.error("Firestore 일일 미션 초기 설정 에러:", error);
      } finally {
        setIsCreatingMissions(false);
      }
    };

    let active = true;
    let unsubscribe = null;

    const initAndSubscribe = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (!active) return;
        if (!docSnap.exists() || !docSnap.data()?.missions) {
          await initializeMissions();
        }
      } catch (error) {
        console.error("미션 문서 존재 여부 체크 에러:", error);
      }

      if (!active) return;

      // 실시간 구독 활성화
      unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          setDailyMissionsDoc(snapshot.data());
        }
        setLoadingMissions(false);
      }, (error) => {
        console.error("미션 실시간 연동 에러:", error);
        setLoadingMissions(false);
      });
    };

    initAndSubscribe();

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [teamId, todayDate]);

  // 미션 체크/해제 처리
  const handleToggleMission = async (periodIndex) => {
    if (!dailyMissionsDoc) return;

    const updatedMissions = [...dailyMissionsDoc.missions];
    const targetMission = updatedMissions[periodIndex];
    const newCompleted = !targetMission.completed;

    targetMission.completed = newCompleted;

    // 완료 체크할 때 경쾌한 소리 & 폭죽(confetti) 발사
    if (newCompleted) {
      playSuccessSound();
      
      // 일일 미션 하나를 클리어할 때도 가볍게 꽃가루 날려주기
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }

    const completedMissions = updatedMissions
      .filter(m => m.completed)
      .map(m => m.period);
    const helperCompletedCount = completedMissions.length;
    const studentCompletedCount = dailyMissionsDoc.studentCompletedCount || 0;
    const totalCompletedCount = helperCompletedCount + studentCompletedCount;

    const docRef = doc(db, 'teams', teamId, 'dailyMissions', todayDate);
    try {
      await updateDoc(docRef, {
        missions: updatedMissions,
        completedMissions: completedMissions,
        helperCompletedCount: helperCompletedCount,
        completedCount: totalCompletedCount,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("미션 완료 상태 업데이트 실패:", error);
    }
  };

  // 돌발(긴급) 미션 완료 핸들러
  const handleEmergencyComplete = () => {
    setEmergencyMissionComplete(true);
    playSuccessSound();
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  };

  const needsEmergencyMission = studentStatus && ['불안', '화남'].includes(studentStatus.emotion);
  const completedMissionsCount = dailyMissionsDoc ? dailyMissionsDoc.completedCount : 0;
  const progressPercentage = Math.round((completedMissionsCount / 9) * 100);

  return (
    <div className="w-full min-h-screen bg-[var(--color-melon-base)] p-4 md:p-8 flex flex-col lg:flex-row gap-8 font-sans">
      {showConfetti && (
        <Confetti
          width={windowDimension.width}
          height={windowDimension.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.2}
        />
      )}

      {/* 좌측: 실시간 학생 상태 모니터링 */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-soft border-4 border-[#A2E3A2] flex-1 flex flex-col">
          <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3 break-keep">
            <span className="text-4xl animate-pulse">👀</span> 
            <span>지금 우리 반 친구는?</span>
          </h2>
          
          {studentStatus ? (
            <div className="flex flex-col gap-6 flex-1">
              <div className="bg-gray-50 p-6 rounded-3xl border-4 border-gray-100 flex flex-col items-center">
                <p className="text-2xl font-bold text-gray-600 mb-4 text-center break-keep">
                  <span className="text-green-600 font-black text-3xl">{studentStatus.name}</span> 친구의 기분
                </p>
                <div className="text-5xl font-black text-gray-800 bg-white px-8 py-6 rounded-2xl shadow-soft text-center border-4 border-gray-200">
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
        <AvatarCreator />
      </div>

      {/* 우측: 일일 미션 보드 및 긴급 미션 */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        
        {/* 긴급 비밀 미션 카드 (친구 기분이 불안/화남일 때만 활성화) */}
        {needsEmergencyMission && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-4 border-orange-400 rounded-3xl p-6 shadow-soft relative overflow-hidden animate-[bounce_1.5s_infinite_alternate] transition-all">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-orange-400 rotate-45 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs -rotate-45 mt-1">EMG</span>
            </div>
            <h3 className="text-2xl font-black text-orange-600 flex items-center gap-2 mb-3">
              <span>🚨</span> 긴급 비밀 미션 발생!
            </h3>
            <p className="text-lg font-bold text-gray-700 mb-4 break-keep">
              <span className="text-green-600">{studentStatus.name}</span> 친구가 지금 마음이 불편해요. {user.name} 지킴이 출동!
            </p>
            
            <div className="bg-white/80 p-5 rounded-2xl border-2 border-orange-200 mb-4">
              <p className="text-2xl font-black text-gray-800 text-center leading-relaxed break-keep">
                {studentStatus.emotion === '불안' ? (
                  `"${studentStatus.name} 친구에게 조용히 다가가서 괜찮아, 내가 같이 있어줄게 하고 손을 잡아주세요."`
                ) : (
                  `"${studentStatus.name} 친구가 화가 났어요. 부드러운 목소리로 기분이 풀리도록 좋아하는 사탕이나 따뜻한 응원의 말을 건네보세요."`
                )}
              </p>
            </div>

            <div className="flex justify-center">
              {!emergencyMissionComplete ? (
                <button
                  onClick={handleEmergencyComplete}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black text-2xl py-4 px-10 rounded-full shadow-soft transition-transform active:scale-95 border-4 border-orange-700 cursor-pointer"
                >
                  해결 완료! 🌟
                </button>
              ) : (
                <div className="bg-green-100 border-4 border-green-400 text-green-800 font-black text-xl py-3 px-8 rounded-full flex items-center gap-3 animate-bounce">
                  <span>🎉</span> 친구에게 큰 도움이 되었어요! 멋져요! <span>🎉</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6교시 일일 미션 보드 */}
        <div className="bg-white p-8 rounded-3xl shadow-soft border-4 border-yellow-300 flex flex-col flex-1 min-h-[500px]">
          <h2 className="text-3xl font-black text-gray-800 mb-4 flex items-center gap-3 break-keep border-b-4 border-gray-100 pb-4">
            <span className="text-4xl">🌿</span> 
            <span>또래 도우미 일일 미션 보드</span>
          </h2>

          {/* 수행률 게이지바 */}
          <div className="mb-8 bg-gray-50 p-5 rounded-2xl border-2 border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-gray-600">오늘의 미션 달성률</span>
              <span className="text-2xl font-black text-green-600">{progressPercentage}% ({completedMissionsCount}/9)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden border-2 border-gray-300 p-0.5">
              <div 
                className="bg-gradient-to-r from-green-400 to-[#A2E3A2] h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {loadingMissions ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xl font-bold">오늘의 미션을 불러오는 중이에요...</p>
            </div>
          ) : dailyMissionsDoc ? (
            <div className="flex flex-col gap-4 flex-1">
              {dailyMissionsDoc.missions.map((mission, idx) => {
                const isCompleted = mission.completed;
                return (
                  <div 
                    key={mission.period}
                    onClick={() => handleToggleMission(idx)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-4 transition-all duration-300 cursor-pointer select-none
                      ${isCompleted 
                        ? 'bg-green-50 border-green-300 shadow-sm opacity-80' 
                        : 'bg-white border-gray-100 hover:border-green-100 hover:-translate-y-0.5 hover:shadow-soft'
                      }
                    `}
                  >
                    {/* 동글 체크박스 */}
                    <div 
                      className={`w-10 h-10 rounded-full border-4 flex items-center justify-center shrink-0 transition-colors duration-300
                        ${isCompleted 
                          ? 'bg-green-500 border-green-700 text-white' 
                          : 'bg-white border-gray-300'
                        }
                      `}
                    >
                      {isCompleted && (
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-black text-white
                          ${isCompleted ? 'bg-green-500' : 'bg-yellow-400'}
                        `}>
                          {mission.periodName}
                        </span>
                      </div>
                      <p className={`text-xl font-bold text-gray-800 leading-relaxed break-keep
                        ${isCompleted ? 'line-through text-gray-400 font-medium' : ''}
                      `}>
                        {mission.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <span className="text-6xl">❓</span>
              <p className="text-xl font-bold text-gray-500">미션을 설정하지 못했습니다.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default HelperDashboard;
