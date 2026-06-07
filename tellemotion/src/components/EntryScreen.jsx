import React, { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

function EntryScreen() {
  const [name, setName] = useState('');
  const login = useAppStore((state) => state.login);

  const handleRoleSelect = (role) => {
    if (!name.trim()) return;
    
    // 1. 화면 전환을 먼저 즉시 실행하여 사용자가 멈춤 현상을 겪지 않도록 합니다.
    login(name.trim(), role);

    // 2. 백그라운드에서 사용자 정보를 Firebase에 저장합니다.
    try {
      setDoc(doc(db, 'Users', name.trim()), {
        name: name.trim(),
        role: role,
        lastLogin: serverTimestamp()
      }, { merge: true }).catch(error => {
        console.error("사용자 정보 저장 실패:", error);
      });
    } catch (error) {
      console.error("사용자 정보 저장 에러:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 md:p-16 rounded-3xl shadow-lg flex flex-col items-center max-w-2xl w-full border-4 border-[var(--color-melon-point)] animate-in fade-in duration-500">
        <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-8 text-center break-keep">
          우리반 소통 고치 🌿
        </h1>

        <div className="w-full mb-10">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 적어주세요"
            className="w-full text-center text-2xl md:text-3xl p-6 bg-gray-50 border-4 border-gray-200 rounded-3xl focus:border-green-400 focus:ring-4 focus:ring-green-100 outline-none transition-all font-bold text-gray-700"
          />
        </div>

        <div className="flex flex-col md:flex-row w-full gap-6">
          <button
            onClick={() => handleRoleSelect('STUDENT')}
            disabled={!name.trim()}
            className="flex-1 bg-[var(--color-melon-base)] hover:bg-[var(--color-melon-point)] text-gray-800 font-black text-2xl py-8 rounded-3xl border-4 border-[var(--color-melon-point)] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl">🎨</span>
            <span>나는 학생이에요</span>
          </button>

          <button
            onClick={() => handleRoleSelect('HELPER')}
            disabled={!name.trim()}
            className="flex-1 bg-orange-50 hover:bg-orange-100 text-gray-800 font-black text-2xl py-8 rounded-3xl border-4 border-orange-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl">🤝</span>
            <span>나는 도우미 친구예요</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EntryScreen;
