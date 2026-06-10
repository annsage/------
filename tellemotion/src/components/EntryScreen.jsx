import React, { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const PRE_MATCHED_PAIRS = [
  { teamId: 'team_1', teamName: '1모둠 (기쁨조)', studentName: '상민', helperName: '세진' },
  { teamId: 'team_2', teamName: '2모둠 (사랑조)', studentName: '지숙', helperName: '철우' },
  { teamId: 'team_3', teamName: '3모둠 (우정조)', studentName: '재웅', helperName: '시혜' },
  { teamId: 'team_4', teamName: '4모둠 (행복조)', studentName: '연수', helperName: '은지' },
  { teamId: 'team_5', teamName: '5모둠 (평온조)', studentName: '지민', helperName: '태일' },
  { teamId: 'team_6', teamName: '6모둠 (미소조)', studentName: '미나', helperName: '수현' },
  { teamId: 'team_7', teamName: '7모둠 (희망조)', studentName: '현구', helperName: '성희' },
  { teamId: 'team_8', teamName: '8모둠 (도전조)', studentName: '수현', helperName: '재혁' },
  { teamId: 'team_9', teamName: '9모둠 (용기조)', studentName: '상현', helperName: '서희' },
  { teamId: 'team_10', teamName: '10모둠 (협동조)', studentName: '세빈', helperName: '민경' },
  { teamId: 'team_11', teamName: '11모둠 (배려조)', studentName: '소연', helperName: '소윤' },
  { teamId: 'team_12', teamName: '12모둠 (성실조)', studentName: '영진', helperName: '동현' },
  { teamId: 'team_13', teamName: '13모둠 (열정조)', studentName: '강인', helperName: '제민' },
];

function EntryScreen() {
  const [name, setName] = useState('');
  const login = useAppStore((state) => state.login);

  const handleRoleSelect = (role) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    
    // Find pre-matched pair
    const matchedPair = PRE_MATCHED_PAIRS.find(
      p => p.studentName === trimmedName || p.helperName === trimmedName
    );

    let resolvedRole = role;
    let resolvedTeamId = 'team_1';

    if (matchedPair) {
      resolvedRole = matchedPair.studentName === trimmedName ? 'STUDENT' : 'HELPER';
      resolvedTeamId = matchedPair.teamId;
    }

    // 1. 화면 전환을 먼저 즉시 실행하여 사용자가 멈춤 현상을 겪지 않도록 합니다.
    login(trimmedName, resolvedRole, resolvedTeamId);

    // 2. 백그라운드에서 사용자 정보를 Firebase에 저장합니다.
    try {
      setDoc(doc(db, 'Users', trimmedName), {
        name: trimmedName,
        role: resolvedRole,
        teamId: resolvedTeamId,
        lastLogin: serverTimestamp()
      }, { merge: true }).catch(error => {
        console.error("사용자 정보 저장 실패:", error);
      });
    } catch (error) {
      console.error("사용자 정보 저장 에러:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-melon-base)] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 md:p-16 rounded-3xl shadow-soft flex flex-col items-center max-w-2xl w-full border-4 border-[var(--color-melon-point)] animate-in fade-in duration-500">
        <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-8 text-center break-keep">
          말하지 않아도 통하는, 텔레모션 🌿
        </h1>

        <div className="w-full mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 적어주세요"
            className="w-full text-center text-2xl md:text-3xl p-5 bg-gray-50 border-4 border-gray-200 rounded-3xl focus:border-green-400 focus:ring-4 focus:ring-green-100 outline-none transition-all font-bold text-gray-700"
          />
        </div>

        {/* 미리 매칭된 짝꿍 리스트 */}
        <div className="w-full mb-8 bg-green-50/50 p-5 rounded-3xl border-4 border-green-100/50 max-h-60 overflow-y-auto">
          <h2 className="text-lg font-black text-gray-700 mb-3 text-center">
            📍 짝꿍 매칭 리스트 (이름을 클릭해 보세요!)
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {PRE_MATCHED_PAIRS.map((pair) => (
              <div 
                key={pair.teamId} 
                className="bg-white p-3 rounded-2xl border-2 border-gray-100 flex justify-between items-center text-sm"
              >
                <span className="font-black text-green-600">{pair.teamName}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setName(pair.studentName)}
                    className="px-3 py-1.5 bg-[var(--color-melon-base)] hover:bg-[var(--color-melon-point)] text-gray-900 font-bold rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    🎨 {pair.studentName} (학생)
                  </button>
                  <span className="text-gray-400 self-center">🤝</span>
                  <button
                    onClick={() => setName(pair.helperName)}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-gray-900 font-bold rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    🤝 {pair.helperName} (도우미)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row w-full gap-6 mb-6">
          <button
            onClick={() => handleRoleSelect('STUDENT')}
            disabled={!name.trim()}
            className="flex-1 bg-[var(--color-melon-base)] hover:bg-[var(--color-melon-point)] text-gray-800 font-black text-2xl py-8 rounded-3xl border-4 border-[var(--color-melon-point)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl">🎨</span>
            <span>나는 학생이에요</span>
          </button>

          <button
            onClick={() => handleRoleSelect('HELPER')}
            disabled={!name.trim()}
            className="flex-1 bg-orange-50 hover:bg-orange-100 text-gray-800 font-black text-2xl py-8 rounded-3xl border-4 border-orange-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl">🤝</span>
            <span>나는 도우미 친구예요</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-gray-100 w-full flex justify-center">
          <button
            onClick={() => useAppStore.getState().setScreen('TEACHER_DASHBOARD')}
            className="text-gray-500 hover:text-gray-800 font-bold text-lg px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>🔑</span>
            <span>선생님용 대시보드 바로가기</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EntryScreen;
