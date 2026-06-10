import React, { useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const EMOTION_OPTIONS = [
  { id: '행복', emoji: '🥰', text: '행복해' },
  { id: '평온', emoji: '😌', text: '평온해' },
  { id: '불안', emoji: '😰', text: '불안해' },
  { id: '슬픔', emoji: '😢', text: '슬퍼요' },
  { id: '화남', emoji: '😡', text: '화나요' },
  { id: '피곤', emoji: '🥱', text: '피곤해' },
];

const COLOR_OPTIONS = [
  { id: '빨강', name: '빨간색', hex: '#FF8787', bgClass: 'bg-red-400' },
  { id: '노랑', name: '노란색', hex: '#FFE066', bgClass: 'bg-yellow-300' },
  { id: '파랑', name: '파란색', hex: '#74C0FC', bgClass: 'bg-blue-400' },
  { id: '초록', name: '초록색', hex: '#8CE99A', bgClass: 'bg-green-400' },
  { id: '보라', name: '보라색', hex: '#D0BFFF', bgClass: 'bg-purple-300' },
  { id: '무채색', name: '회색빛', hex: '#ADB5BD', bgClass: 'bg-gray-400' },
];

function AvatarCreator() {
  const { avatarEmotion, avatarColor, setAvatarEmotion, setAvatarColor, user } = useAppStore();
  const teamId = user.teamId || 'team_1';
  const role = user.role; // 'STUDENT' or 'HELPER'

  // Firestore 실시간 동기화 (구독)
  useEffect(() => {
    if (!teamId || !role) return;
    const docRef = doc(db, 'teams', teamId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const avatar = role === 'STUDENT' ? data.studentAvatar : data.helperAvatar;
        if (avatar) {
          if (avatar.color && avatar.color !== avatarColor) setAvatarColor(avatar.color);
          if (avatar.emotion && avatar.emotion !== avatarEmotion) setAvatarEmotion(avatar.emotion);
        }
      }
    }, (error) => {
      console.error("Firestore 아바타 구독 에러:", error);
    });
    return () => unsubscribe();
  }, [teamId, role, avatarColor, avatarEmotion, setAvatarColor, setAvatarEmotion]);

  // Firestore 아바타 저장 함수
  const saveAvatarToFirestore = async (newColor, newEmotion) => {
    if (!teamId || !role) return;
    const docRef = doc(db, 'teams', teamId);
    const avatarKey = role === 'STUDENT' ? 'studentAvatar' : 'helperAvatar';
    const targetColor = newColor !== undefined ? newColor : avatarColor;
    const targetEmotion = newEmotion !== undefined ? newEmotion : avatarEmotion;

    try {
      await setDoc(docRef, {
        [avatarKey]: {
          color: targetColor,
          emotion: targetEmotion
        }
      }, { merge: true });
    } catch (error) {
      console.error("아바타 Firestore 저장 에러:", error);
    }
  };

  const colorMap = {
    '빨강': '#FF8787',
    '노랑': '#FFE066',
    '파랑': '#74C0FC',
    '초록': '#8CE99A',
    '보라': '#D0BFFF',
    '무채색': '#ADB5BD'
  };

  const bodyColor = colorMap[avatarColor] || colorMap['파랑'];

  // Define SVG parts based on emotion
  let eyebrowL = "M 65 78 Q 75 73 85 78";
  let eyebrowR = "M 115 78 Q 125 73 135 78";
  let eyeL = <circle cx="75" cy="92" r="6" fill="#333" />;
  let eyeR = <circle cx="125" cy="92" r="6" fill="#333" />;
  let mouth = "M 85 120 Q 100 132 115 120"; // standard soft smile
  let isMouthPath = true;
  let customMouthNode = null;
  let blushing = true;
  let extraElements = null;

  switch (avatarEmotion) {
    case '행복':
      eyebrowL = "M 63 74 Q 75 66 85 74";
      eyebrowR = "M 115 74 Q 125 66 137 74";
      eyeL = <path d="M 68 95 Q 77 82 86 95" stroke="#333" strokeWidth="4.5" strokeLinecap="round" fill="none" />;
      eyeR = <path d="M 114 95 Q 123 82 132 95" stroke="#333" strokeWidth="4.5" strokeLinecap="round" fill="none" />;
      mouth = "M 85 115 Q 100 135 115 115 Z"; // open smile
      break;
    case '평온':
      eyebrowL = "M 65 77 Q 75 74 85 77";
      eyebrowR = "M 115 77 Q 125 74 135 77";
      eyeL = <path d="M 68 91 Q 77 98 86 91" stroke="#333" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      eyeR = <path d="M 114 91 Q 123 98 132 91" stroke="#333" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      mouth = "M 90 118 Q 100 124 110 118";
      isMouthPath = false;
      customMouthNode = <path d={mouth} stroke="#333" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      break;
    case '불안':
      eyebrowL = "M 63 78 Q 75 80 85 71";
      eyebrowR = "M 115 71 Q 125 80 137 78";
      eyeL = (
        <>
          <circle cx="75" cy="92" r="8" fill="#FFF" stroke="#333" strokeWidth="3" />
          <circle cx="75" cy="92" r="3" fill="#333" />
        </>
      );
      eyeR = (
        <>
          <circle cx="125" cy="92" r="8" fill="#FFF" stroke="#333" strokeWidth="3" />
          <circle cx="125" cy="92" r="3" fill="#333" />
        </>
      );
      mouth = "M 85 120 Q 90 115 95 120 T 105 120 T 115 120";
      isMouthPath = false;
      customMouthNode = <path d={mouth} stroke="#333" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      blushing = false;
      extraElements = (
        <path d="M 148 75 Q 142 85 145 92 Q 150 96 153 90 Z" fill="#74C0FC" className="animate-bounce" />
      );
      break;
    case '슬픔':
      eyebrowL = "M 65 72 Q 75 79 85 83";
      eyebrowR = "M 115 83 Q 125 79 135 72";
      eyeL = (
        <>
          <path d="M 68 94 Q 77 86 86 94" stroke="#333" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="77" cy="91" r="2.5" fill="#333" />
        </>
      );
      eyeR = (
        <>
          <path d="M 114 94 Q 123 86 132 94" stroke="#333" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="123" cy="91" r="2.5" fill="#333" />
        </>
      );
      mouth = "M 86 125 Q 100 114 114 125";
      isMouthPath = false;
      customMouthNode = <path d={mouth} stroke="#333" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      blushing = false;
      extraElements = (
        <>
          <path d="M 72 98 C 70 106 66 112 66 116 C 66 119 69 121 72 121 C 75 121 78 119 78 116 C 78 112 74 106 72 98 Z" fill="#339AF0" />
          <path d="M 128 98 C 126 106 122 112 122 116 C 122 119 125 121 128 121 C 131 121 134 119 134 116 C 134 112 130 106 128 98 Z" fill="#339AF0" />
        </>
      );
      break;
    case '화남':
      eyebrowL = "M 65 79 L 85 86";
      eyebrowR = "M 115 86 L 135 79";
      eyeL = (
        <>
          <circle cx="75" cy="94" r="7.5" fill="#FFF" stroke="#333" strokeWidth="3" />
          <path d="M 67 89 L 83 91" stroke="#333" strokeWidth="3.5" />
          <circle cx="77" cy="96" r="3" fill="#333" />
        </>
      );
      eyeR = (
        <>
          <circle cx="125" cy="94" r="7.5" fill="#FFF" stroke="#333" strokeWidth="3" />
          <path d="M 117 91 L 133 89" stroke="#333" strokeWidth="3.5" />
          <circle cx="123" cy="96" r="3" fill="#333" />
        </>
      );
      mouth = "M 88 125 Q 100 115 112 125";
      isMouthPath = false;
      customMouthNode = <path d={mouth} stroke="#333" strokeWidth="4" strokeLinecap="round" fill="none" />;
      blushing = false;
      extraElements = (
        <>
          <path d="M 50 50 L 40 40 M 150 50 L 160 40 M 45 95 L 35 95 M 155 95 L 165 95" stroke="#E03131" strokeWidth="3" strokeLinecap="round" />
          <path d="M 142 55 L 152 65 M 152 55 L 142 65" stroke="#E03131" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
      break;
    case '피곤':
      eyebrowL = "M 65 78 L 85 78";
      eyebrowR = "M 115 78 L 135 78";
      eyeL = <path d="M 68 93 L 82 93" stroke="#555" strokeWidth="4" strokeLinecap="round" />;
      eyeR = <path d="M 118 93 L 132 93" stroke="#555" strokeWidth="4" strokeLinecap="round" />;
      mouth = "M 100 120 A 7 10 0 1 0 100 140 A 7 10 0 1 0 100 120 Z";
      isMouthPath = false;
      customMouthNode = <path d={mouth} fill="#333" />;
      blushing = false;
      extraElements = (
        <g className="animate-pulse">
          <text x="145" y="60" fontSize="16" fontWeight="bold" fill="#74C0FC" fontFamily="sans-serif">Z</text>
          <text x="155" y="48" fontSize="22" fontWeight="bold" fill="#74C0FC" fontFamily="sans-serif">z</text>
        </g>
      );
      break;
    default:
      break;
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-soft border-4 border-[var(--color-melon-base)] flex flex-col items-center gap-6 w-full">
      <h2 className="text-3xl font-black text-gray-800 text-center break-keep flex items-center gap-2">
        <span>🧸</span> 나만의 감정 아바타 만들기
      </h2>

      {/* Avatar Container */}
      <div className="w-56 h-56 md:w-64 md:h-64 flex items-center justify-center bg-green-50 rounded-full border-4 border-[#A2E3A2] overflow-hidden relative shadow-inner">
        <svg
          viewBox="0 0 200 220"
          className="w-full h-full drop-shadow-sm transition-all duration-500 animate-float"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background soft aura circle */}
          <circle cx="100" cy="110" r="80" fill="#FFF" opacity="0.6" />
          
          {/* Ears */}
          <circle cx="45" cy="100" r="14" fill="#FFE3E3" stroke="#333" strokeWidth="4" />
          <circle cx="155" cy="100" r="14" fill="#FFE3E3" stroke="#333" strokeWidth="4" />
          
          {/* Body / Clothes */}
          <path
            d="M 50 175 C 50 140, 150 140, 150 175 C 150 190, 150 215, 150 215 L 50 215 Z"
            fill={bodyColor}
            stroke="#333"
            strokeWidth="4"
            strokeLinejoin="round"
            className="transition-colors duration-500"
          />
          {/* Neck line or collar */}
          <path d="M 85 146 Q 100 155 115 146" fill="none" stroke="#333" strokeWidth="4" />

          {/* Head / Face skin */}
          <rect
            x="48"
            y="50"
            width="104"
            height="100"
            rx="40"
            fill="#FFF0F0"
            stroke="#333"
            strokeWidth="4"
          />

          {/* Hair (Cute curved bangs) */}
          <path
            d="M 48 90 C 48 40, 152 40, 152 90 C 140 75, 120 85, 100 75 C 80 85, 60 75, 48 90 Z"
            fill="#4A3728"
            stroke="#333"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Eyebrows */}
          <path d={eyebrowL} stroke="#333" strokeWidth="3.5" strokeLinecap="round" fill="none" className="transition-all duration-300" />
          <path d={eyebrowR} stroke="#333" strokeWidth="3.5" strokeLinecap="round" fill="none" className="transition-all duration-300" />

          {/* Eyes */}
          <g className="transition-all duration-300">
            {eyeL}
            {eyeR}
          </g>

          {/* Blushing cheeks */}
          {blushing && (
            <>
              <ellipse cx="66" cy="106" rx="8" ry="5" fill="#FFA8A8" opacity="0.7" />
              <ellipse cx="134" cy="106" rx="8" ry="5" fill="#FFA8A8" opacity="0.7" />
            </>
          )}

          {/* Mouth */}
          {isMouthPath ? (
            <path d={mouth} fill={avatarEmotion === '행복' ? '#FF6B6B' : 'none'} stroke="#333" strokeWidth="4" strokeLinecap="round" className="transition-all duration-300" />
          ) : (
            customMouthNode
          )}

          {/* Extra effects */}
          {extraElements}
        </svg>
      </div>

      {/* Customization Options */}
      <div className="w-full flex flex-col gap-4">
        {/* Emotion Section */}
        <div>
          <span className="text-lg font-black text-gray-700 block mb-2">🥰 오늘의 아바타 표정</span>
          <div className="grid grid-cols-3 gap-2">
            {EMOTION_OPTIONS.map((emo) => {
              const isSelected = avatarEmotion === emo.id;
              return (
                <button
                  key={emo.id}
                  onClick={() => {
                    setAvatarEmotion(emo.id);
                    saveAvatarToFirestore(undefined, emo.id);
                  }}
                  className={`py-2 px-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-1.5 font-bold text-sm hover:scale-105 active:scale-95 cursor-pointer
                    ${isSelected 
                      ? 'bg-[var(--color-melon-base)] border-[var(--color-melon-point)] text-gray-900 ring-2 ring-[var(--color-melon-point)]/30 font-black' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-xl">{emo.emoji}</span>
                  <span>{emo.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Section */}
        <div>
          <span className="text-lg font-black text-gray-700 block mb-2">👕 옷 색깔 고르기</span>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_OPTIONS.map((color) => {
              const isSelected = avatarColor === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => {
                    setAvatarColor(color.id);
                    saveAvatarToFirestore(color.id, undefined);
                  }}
                  className={`py-2 px-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm hover:scale-105 active:scale-95 cursor-pointer
                    ${isSelected 
                      ? 'bg-gray-100 border-gray-400 text-gray-950 ring-2 ring-gray-400/30 font-black' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className={`w-4 h-4 rounded-full ${color.bgClass} border border-gray-400/30 shadow-sm`} />
                  <span>{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarCreator;
