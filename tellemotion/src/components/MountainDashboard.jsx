import React, { useState, useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import AwardCeremony from './AwardCeremony';

// 오늘 날짜 구하기 YYYY-MM-DD
const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// 1~10단계 등산로 고도 및 수평 위치 설계 (산 배경 이미지 라인에 매핑)
const STEPS_COORDINATES = {
  1: { bottom: '15%', left: '18%' },   // 산 밑동 초입 (왼쪽)
  2: { bottom: '22%', left: '40%' },   // 약간 등반 (중앙 왼쪽)
  3: { bottom: '30%', left: '72%' },   // 1차 지그재그 전환점 (오른쪽)
  4: { bottom: '39%', left: '50%' },   // 완만한 경사 (중앙)
  5: { bottom: '48%', left: '22%' },   // 2차 지그재그 전환점 (왼쪽)
  6: { bottom: '57%', left: '38%' },   // 중고도 등반 (중앙 왼쪽)
  7: { bottom: '66%', left: '68%' },   // 3차 지그재그 전환점 (오른쪽)
  8: { bottom: '75%', left: '48%' },   // 정상 가기 전 경사 (중앙)
  9: { bottom: '83%', left: '32%' },   // 정상 직전 쉼터 (왼쪽)
  10: { bottom: '91%', left: '50%' }   // 🏆 대망의 산 정상 깃발!
};

// 짝꿍 아바타 SVG 렌더링 컴포넌트
function PartnerAvatar({ studentColor, studentEmotion, helperColor, helperEmotion, teamName, isBouncing }) {
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
    <div className={`flex flex-col items-center select-none relative transition-transform duration-300
      ${isBouncing ? 'animate-bounce-climb' : 'animate-float-slow'}
    `}>
      {/* 아바타 2명 나란히 + 손잡기 */}
      <div className="flex items-end justify-center relative -space-x-2 w-28 h-20">
        
        {/* 학생 아바타 */}
        <div 
          className="w-12 h-14 bg-[#FFF0F0] rounded-t-2xl border-2 border-gray-800 flex flex-col items-center justify-center relative shadow-md" 
          style={{ borderBottom: `8px solid ${sColor}` }}
        >
          <span className="text-2xl mb-1">{getEmotionEmoji(studentEmotion)}</span>
          <span className="text-[8px] font-black text-gray-500 bg-white/80 px-1 rounded absolute -bottom-2 border border-gray-200">
            학생
          </span>
        </div>

        {/* 손잡는 커넥터 */}
        <div className="w-6 h-1 border-b-4 border-dashed border-amber-400 mb-4 z-10 opacity-80"></div>

        {/* 도우미 아바타 */}
        <div 
          className="w-12 h-14 bg-[#FFF0F0] rounded-t-2xl border-2 border-gray-800 flex flex-col items-center justify-center relative shadow-md" 
          style={{ borderBottom: `8px solid ${hColor}` }}
        >
          <span className="text-2xl mb-1">{getEmotionEmoji(helperEmotion)}</span>
          <span className="text-[8px] font-black text-white bg-orange-500 px-1 rounded absolute -bottom-2 shadow-sm">
            도우미
          </span>
        </div>

      </div>

      {/* 팀 네임 태그 */}
      <div className="mt-3 bg-white/95 px-3 py-1 rounded-full text-xs font-black text-gray-800 shadow-md border-2 border-green-400 whitespace-nowrap tracking-tight hover:scale-105 transition-transform">
        {teamName}
      </div>
    </div>
  );
}

function MountainDashboard() {
  const setScreen = useAppStore((state) => state.setScreen);
  const [teams, setTeams] = useState([]);
  const [missionsMap, setMissionsMap] = useState({});
  const [bouncingTeams, setBouncingTeams] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  
  // 시상식 모달 제어 상태
  const [awardTeam, setAwardTeam] = useState(null);
  const [awardedTeams, setAwardedTeams] = useState(new Set());

  // 이전 미션 개수 저장을 위한 Ref (등반 바운스 감지용)
  const prevMissionsRef = useRef({});

  // 1. 기본 테스트 팀 생성 함수
  const createDefaultTeamsInDB = async () => {
    const defaultTeams = [
      { id: 'team_1', teamName: '1모둠 (기쁨조)', studentName: '상민', helperName: '세진', studentColor: '파랑', studentEmotion: '평온', helperColor: '노랑', helperEmotion: '행복' },
      { id: 'team_2', teamName: '2모둠 (사랑조)', studentName: '지숙', helperName: '철우', studentColor: '초록', studentEmotion: '행복', helperColor: '빨강', helperEmotion: '평온' },
      { id: 'team_3', teamName: '3모둠 (우정조)', studentName: '재웅', helperName: '시혜', studentColor: '보라', studentEmotion: '피곤', helperColor: '초록', helperEmotion: '행복' },
      { id: 'team_4', teamName: '4모둠 (행복조)', studentName: '연수', helperName: '은지', studentColor: '빨강', studentEmotion: '행복', helperColor: '보라', helperEmotion: '평온' },
      { id: 'team_5', teamName: '5모둠 (평온조)', studentName: '지민', helperName: '태일', studentColor: '노랑', studentEmotion: '평온', helperColor: '초록', helperEmotion: '피곤' },
      { id: 'team_6', teamName: '6모둠 (미소조)', studentName: '미나', helperName: '수현', studentColor: '파랑', studentEmotion: '피곤', helperColor: '빨강', helperEmotion: '행복' },
      { id: 'team_7', teamName: '7모둠 (희망조)', studentName: '현구', helperName: '성희', studentColor: '보라', studentEmotion: '행복', helperColor: '노랑', helperEmotion: '평온' },
      { id: 'team_8', teamName: '8모둠 (도전조)', studentName: '수현', helperName: '재혁', studentColor: '빨강', studentEmotion: '평온', helperColor: '보라', helperEmotion: '행복' },
      { id: 'team_9', teamName: '9모둠 (용기조)', studentName: '상현', helperName: '서희', studentColor: '초록', studentEmotion: '행복', helperColor: '파랑', helperEmotion: '피곤' },
      { id: 'team_10', teamName: '10모둠 (협동조)', studentName: '세빈', helperName: '민경', studentColor: '노랑', studentEmotion: '평온', helperColor: '초록', helperEmotion: '행복' },
      { id: 'team_11', teamName: '11모둠 (배려조)', studentName: '소연', helperName: '소윤', studentColor: '보라', studentEmotion: '피곤', helperColor: '빨강', helperEmotion: '평온' },
      { id: 'team_12', teamName: '12모둠 (성실조)', studentName: '영진', helperName: '동현', studentColor: '파랑', studentEmotion: '행복', helperColor: '노랑', helperEmotion: '피곤' },
      { id: 'team_13', teamName: '13모둠 (열정조)', studentName: '강인', helperName: '제민', studentColor: '초록', studentEmotion: '평온', helperColor: '빨강', helperEmotion: '행복' }
    ];

    const defaultMissions = [
      "아침에 등교한 친구들에게 먼저 밝은 목소리로 '안녕!' 인사하며 웃어주세요.",
      "쉬는 시간에 물건을 떨어뜨렸거나 자리를 찾는 친구에게 다가가 먼저 친절하게 도와주세요.",
      "혼자 조용히 앉아 있는 친구가 있다면 곁에 가서 좋아하는 관심사나 기분에 대해 이야기 나눠봐요.",
      "점심시간 급식실로 이동할 때 함께 짝이 없는 친구의 손을 잡고 따뜻하게 동행해주세요.",
      "수업 시간이나 활동 중에 멋진 모습을 보여준 친구에게 '오늘 정말 잘했어!'라고 칭찬해주세요.",
      "하루가 끝날 때 교실 뒷정리를 하는 친구의 청소를 돕고, 오늘 수고했다며 함께 하이파이브를 해요."
    ];

    const defaultStudentMissions = [
      { id: 1, text: "내 기분과 생각을 그림으로 차분하게 정리하기", completed: false },
      { id: 2, text: "오늘 하루 공부 계획과 목표를 세우고 실천하기", completed: false },
      { id: 3, text: "힘들거나 고민이 있을 때 친구 또는 선생님께 말하기", completed: false }
    ];

    const formattedMissions = defaultMissions.map((text, idx) => ({
      period: idx + 1,
      periodName: `${idx + 1}교시 쉬는 시간`,
      text: text,
      completed: false
    }));

    for (const t of defaultTeams) {
      await setDoc(doc(db, 'teams', t.id), {
        teamName: t.teamName,
        studentName: t.studentName,
        helperName: t.helperName,
        studentAvatar: { color: t.studentColor, emotion: t.studentEmotion },
        helperAvatar: { color: t.helperColor, emotion: t.helperEmotion }
      }, { merge: true });

      // 일일 미션 빈 문서 세팅
      const todayDate = getTodayDateString();
      const missionRef = doc(db, 'teams', t.id, 'dailyMissions', todayDate);
      const missionSnap = await getDoc(missionRef);
      if (!missionSnap.exists() || !missionSnap.data()?.missions || !missionSnap.data()?.studentMissions) {
        await setDoc(missionRef, {
          teamId: t.id,
          date: todayDate,
          missions: formattedMissions,
          completedMissions: [],
          studentMissions: defaultStudentMissions,
          studentCompletedCount: 0,
          helperCompletedCount: 0,
          completedCount: 0,
          updatedAt: new Date()
        });
      }
    }
  };

  // 2. 전체 팀 목록 실시간 구독
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'teams'), async (snapshot) => {
      if (snapshot.empty || snapshot.docs.length < 13) {
        await createDefaultTeamsInDB();
        return;
      }
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeams(list);
    });

    return () => unsubscribe();
  }, []);

  // 3. 각 팀의 오늘자 미션 완료도 실시간 구독
  useEffect(() => {
    if (teams.length === 0) return;

    const todayDate = getTodayDateString();
    const unsubscribes = [];

    teams.forEach((team) => {
      const missionDocRef = doc(db, 'teams', team.id, 'dailyMissions', todayDate);
      const unsub = onSnapshot(missionDocRef, (snap) => {
        let completedCount = 0;
        if (snap.exists()) {
          completedCount = snap.data().completedCount || 0;
        }

        // 이전 점수와 비교하여 등반(상승) 감지
        const prevVal = prevMissionsRef.current[team.id];
        
        // 중요: 초기 마운트 시의 이미 완료된 상태(예: 처음 열었는데 이미 9점인 상태)는 팝업하지 않고,
        // 화면이 열린 뒤 "실시간으로 점수가 0~8에서 9로 상승했을 때" 팡파르를 터뜨리기 위해 분기처리합니다.
        if (prevVal !== undefined && completedCount > prevVal) {
          // 등반 완료 시 통통 튀는 애니메이션 트리거 활성화
          setBouncingTeams(prev => ({ ...prev, [team.id]: true }));
          setTimeout(() => {
            setBouncingTeams(prev => ({ ...prev, [team.id]: false }));
          }, 1500); // 1.5초 후 원상복구

          // 10단계(미션 9개 클리어) 도달 감지 -> 시상식 띄우기
          if (completedCount === 9 && !awardedTeams.has(team.id)) {
            setAwardTeam({
              ...team,
              completedCount
            });
            setAwardedTeams(prev => {
              const next = new Set(prev);
              next.add(team.id);
              return next;
            });
          }
        } else if (prevVal === undefined) {
          // 첫 로딩 시 이미 9점인 팀은 awardedTeams에 미리 등록해 두어, 진입하자마자 시상식이 뜨는 중복 팝업 방지
          if (completedCount === 9) {
            setAwardedTeams(prev => {
              const next = new Set(prev);
              next.add(team.id);
              return next;
            });
          }
        }
        
        // Ref 업데이트
        prevMissionsRef.current[team.id] = completedCount;

        setMissionsMap(prev => ({
          ...prev,
          [team.id]: completedCount
        }));
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [teams, awardedTeams]);

  // 4. 모둠 추가 시뮬레이션
  const handleAddSimulatedTeam = async () => {
    const newId = `team_${Date.now()}`;
    const num = teams.length + 1;
    const emotions = ['행복', '평온', '피곤'];
    const colors = ['빨강', '노랑', '파랑', '초록', '보라'];
    const randomVal = (arr) => arr[Math.floor(Math.random() * arr.length)];

    await setDoc(doc(doc(db, 'teams', newId).path === '' ? db : db, 'teams', newId), {
      teamName: `${num}모둠 (도전조)`,
      studentName: `학생${num}`,
      helperName: `도우미${num}`,
      studentAvatar: { color: randomVal(colors), emotion: randomVal(emotions) },
      helperAvatar: { color: randomVal(colors), emotion: randomVal(emotions) }
    });

    const defaultMissions = [
      "아침에 등교한 친구들에게 먼저 밝은 목소리로 '안녕!' 인사하며 웃어주세요.",
      "쉬는 시간에 물건을 떨어뜨렸거나 자리를 찾는 친구에게 다가가 먼저 친절하게 도와주세요.",
      "혼자 조용히 앉아 있는 친구가 있다면 곁에 가서 좋아하는 관심사나 기분에 대해 이야기 나눠봐요.",
      "점심시간 급식실로 이동할 때 함께 짝이 없는 친구의 손을 잡고 따뜻하게 동행해주세요.",
      "수업 시간이나 활동 중에 멋진 모습을 보여준 친구에게 '오늘 정말 잘했어!'라고 칭찬해주세요.",
      "하루가 끝날 때 교실 뒷정리를 하는 친구의 청소를 돕고, 오늘 수고했다며 함께 하이파이브를 해요."
    ];

    const defaultStudentMissions = [
      { id: 1, text: "내 기분과 생각을 그림으로 차분하게 정리하기", completed: false },
      { id: 2, text: "오늘 하루 공부 계획과 목표를 세우고 실천하기", completed: false },
      { id: 3, text: "힘들거나 고민이 있을 때 친구 또는 선생님께 말하기", completed: false }
    ];

    const formattedMissions = defaultMissions.map((text, idx) => ({
      period: idx + 1,
      periodName: `${idx + 1}교시 쉬는 시간`,
      text: text,
      completed: false
    }));

    const todayDate = getTodayDateString();
    await setDoc(doc(db, 'teams', newId, 'dailyMissions', todayDate), {
      teamId: newId,
      date: todayDate,
      missions: formattedMissions,
      completedMissions: [],
      studentMissions: defaultStudentMissions,
      studentCompletedCount: 0,
      helperCompletedCount: 0,
      completedCount: 0,
      updatedAt: new Date()
    });
  };

  // 5. 미션 카운트 시뮬레이션 변경
  const handleScoreChange = async (teamId, delta) => {
    const currentScore = missionsMap[teamId] || 0;
    const newScore = Math.min(9, Math.max(0, currentScore + delta));
    const todayDate = getTodayDateString();

    const missionDocRef = doc(db, 'teams', teamId, 'dailyMissions', todayDate);
    try {
      await updateDoc(missionDocRef, {
        completedCount: newScore,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      // 문서가 없는 경우 덮어쓰기 생성
      await setDoc(missionDocRef, {
        teamId: teamId,
        date: todayDate,
        completedCount: newScore,
        completedMissions: Array.from({ length: newScore }, (_, i) => i + 1),
        updatedAt: new Date()
      });
    }
  };

  // 6. 팀들의 고도 단계 산출 및 중첩 방지 계산
  const teamPositions = teams.map((team) => {
    const score = missionsMap[team.id] || 0;
    // 완료 개수(0~9)를 10단계로 매핑
    const step = Math.min(10, Math.max(1, score + 1));
    return { ...team, step };
  });

  // 고도(step)별 그룹화
  const stepGroups = {};
  teamPositions.forEach((tp) => {
    if (!stepGroups[tp.step]) {
      stepGroups[tp.step] = [];
    }
    stepGroups[tp.step].push(tp);
  });

  // 특정 고도 단계 내에서의 개별 X 오프셋 구하기
  const getXOffset = (step, teamId) => {
    const group = stepGroups[step] || [];
    if (group.length <= 1) return '0px';
    const idx = group.findIndex((t) => t.id === teamId);
    const spacing = 50; // 캐릭터 간 좌우 간격 (px)
    const totalWidth = (group.length - 1) * spacing;
    const offset = idx * spacing - totalWidth / 2;
    return `${offset}px`;
  };

  return (
    <div className="w-full min-h-screen bg-[#E2F0D9] flex flex-col font-sans relative overflow-hidden select-none pb-12">
      {/* 바운스/동동 애니메이션용 CSS 주입 */}
      <style>{`
        @keyframes bounce-climb {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-35px) scale(1.1); }
          60% { transform: translateY(5px) scale(0.95); }
          80% { transform: translateY(-10px) scale(1.02); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-climb {
          animation: bounce-climb 1.2s ease-in-out 1;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-float-slow:nth-child(even) {
          animation-delay: 1.5s;
        }
      `}</style>

      {/* 최고의 팀워크 상 시상식 팝업 모달 */}
      {awardTeam && (
        <AwardCeremony 
          team={awardTeam} 
          onClose={() => setAwardTeam(null)} 
        />
      )}

      {/* 헤더 */}
      <header className="w-full max-w-7xl mx-auto mt-4 px-6 py-4 bg-white/90 backdrop-blur rounded-2xl shadow-soft border-4 border-white flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏔️</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight leading-none">
              우리가 함께 오르는 텔레모션 등산로
            </h1>
            <p className="text-xs font-bold text-gray-500 mt-1.5">
              도우미와 친구가 힘을 합쳐 미션을 해결하면 캐릭터가 산 위로 높이 올라갑니다! 🌿
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-orange-600 hover:text-white font-black px-4 py-2 bg-orange-50 hover:bg-orange-500 border-2 border-orange-200 rounded-xl transition-all cursor-pointer text-sm"
          >
            {showDebug ? "제어판 닫기 ⚙️" : "제어판 열기 🛠️"}
          </button>
          <button 
            onClick={() => setScreen('ENTRY')}
            className="text-gray-500 hover:text-gray-800 font-bold px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
          >
            처음으로
          </button>
        </div>
      </header>

      {/* 메인 등산로 영역 */}
      <main className="flex-1 w-full max-w-7xl mx-auto mt-6 relative rounded-3xl overflow-hidden border-[8px] border-white shadow-soft min-h-[720px] bg-sky-100">
        
        {/* 산 배경 이미지 */}
        <img 
          src="/mountain_bg.png" 
          alt="등산로 배경 산" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* 10단계 깃발 및 고도 라인 */}
        {Object.entries(STEPS_COORDINATES).map(([stepNum, coord]) => {
          const isTop = stepNum === '10';
          return (
            <div 
              key={stepNum} 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
              style={{ bottom: coord.bottom, left: coord.left }}
            >
              {/* 깃발 아이콘 */}
              <div className="relative group">
                <span className={`text-3xl drop-shadow-md select-none block transform group-hover:scale-125 transition-transform duration-200 cursor-help
                  ${isTop ? 'animate-bounce text-4xl' : ''}
                `}>
                  {isTop ? '🏆' : '🚩'}
                </span>
                {/* 툴팁 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-900/90 text-white font-black text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 mb-1">
                  {stepNum}단계 {isTop ? '(정상!)' : ''}
                </div>
              </div>
            </div>
          );
        })}

        {/* 팀 캐릭터들 렌더링 */}
        {teamPositions.map((tp) => {
          const coord = STEPS_COORDINATES[tp.step] || STEPS_COORDINATES[1];
          const xOffset = getXOffset(tp.step, tp.id);
          const isBouncing = bouncingTeams[tp.id];

          return (
            <div
              key={tp.id}
              className="absolute -translate-x-1/2 -translate-y-full transition-all duration-1000 ease-out z-20"
              style={{ 
                bottom: coord.bottom, 
                left: coord.left,
                transform: `translate(-50%, -70%) translateX(${xOffset})`
              }}
            >
              <PartnerAvatar
                studentColor={tp.studentAvatar?.color || '파랑'}
                studentEmotion={tp.studentAvatar?.emotion || '평온'}
                helperColor={tp.helperAvatar?.color || '노랑'}
                helperEmotion={tp.helperAvatar?.emotion || '행복'}
                teamName={tp.teamName}
                isBouncing={isBouncing}
              />
            </div>
          );
        })}
      </main>

      {/* 선생님 시뮬레이터 / 디버그 패널 */}
      {showDebug && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xl border-4 border-orange-300 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b-2 border-gray-100 pb-3">
              <h3 className="text-xl font-black text-orange-600 flex items-center gap-2">
                <span>🛠️</span> 학급 등산 제어판 (선생님 전용 시뮬레이터)
              </h3>
              <button 
                onClick={handleAddSimulatedTeam}
                className="bg-green-500 hover:bg-green-600 text-white font-black text-sm py-2 px-4 rounded-xl shadow transition-all active:scale-95 cursor-pointer"
              >
                ➕ 테스트 모둠(팀) 추가
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-48 overflow-y-auto pr-2">
              {teams.map((t) => {
                const score = missionsMap[t.id] || 0;
                return (
                  <div key={t.id} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-200 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-gray-800 text-sm">{t.teamName}</span>
                      <span className="text-[11px] text-gray-500 font-bold">
                        {t.studentName} 🤝 {t.helperName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* 미션 깎기 */}
                      <button
                        onClick={() => handleScoreChange(t.id, -1)}
                        disabled={score <= 0}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-black text-lg flex items-center justify-center cursor-pointer select-none active:scale-90 transition-transform"
                      >
                        -
                      </button>

                      {/* 점수 표시 */}
                      <span className="font-black text-lg text-green-600 min-w-[32px] text-center">
                        {score}/9
                      </span>

                      {/* 미션 더하기 */}
                      <button
                        onClick={() => handleScoreChange(t.id, 1)}
                        disabled={score >= 9}
                        className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-black text-lg flex items-center justify-center cursor-pointer select-none active:scale-90 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-[11px] text-gray-400 font-bold text-center">
              * 조절 버튼을 누르면 실시간으로 DB가 갱신되어 아바타가 등반 애니메이션(bounce)을 하며 산을 오릅니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MountainDashboard;
