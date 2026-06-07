import React, { useRef, useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const EMOTIONS = [
  { id: '행복', emoji: '🥰', text: '행복해요', bg: 'bg-yellow-100' },
  { id: '평온', emoji: '😌', text: '평온해요', bg: 'bg-[var(--color-melon-base)]' },
  { id: '불안', emoji: '😰', text: '불안해요', bg: 'bg-blue-100' },
  { id: '슬픔', emoji: '😢', text: '슬퍼요', bg: 'bg-indigo-100' },
  { id: '화남', emoji: '😡', text: '화나요', bg: 'bg-red-100' },
  { id: '피곤', emoji: '🥱', text: '피곤해요', bg: 'bg-gray-200' },
];

function StudentDashboard() {
  const { user, selectedEmotion, setEmotion } = useAppStore();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 12; // 대근육 조절을 위해 두껍게 (요청사항: 8px 이상)
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#333333';
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSend = async () => {
    if (!selectedEmotion) {
      alert("먼저 내 마음(감정)을 선택해주세요!");
      return;
    }

    setIsUploading(true);
    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsUploading(false);
          return;
        }

        const fileName = `drawings/${user.name}_${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);

        // 스토리지에 이미지 업로드
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);

        // Firestore에 데이터 저장 (선택한 감정과 그림)
        await addDoc(collection(db, 'Emotions'), {
          name: user.name,
          emotion: selectedEmotion,
          imageUrl: downloadUrl,
          timestamp: serverTimestamp()
        });

        // 전송 후 초기화
        setEmotion("");
        handleClear();
        setIsUploading(false);
        alert("선생님께 마음을 보냈어요! 💌");
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error("업로드 에러:", error);
      setIsUploading(false);
      alert("전송에 실패했어요. 다시 시도해주세요.");
    }
  };

  if (isUploading) {
    return (
      <div className="fixed inset-0 bg-green-50 z-50 flex flex-col items-center justify-center">
        <div className="text-8xl animate-bounce mb-8">🎈</div>
        <h2 className="text-4xl font-black text-gray-800 text-center px-4 break-keep">
          선생님께 마음을 날려보내는 중이에요...
        </h2>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-green-50 p-4 pb-24 flex flex-col gap-6 font-sans">
      
      {/* 상단: 가로 스크롤 감정 카드 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-[var(--color-melon-base)] shrink-0">
        <h2 className="text-3xl font-black text-gray-800 mb-6 text-center break-keep">지금 내 기분은 어떤가요?</h2>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
          {EMOTIONS.map((emo) => {
            const isSelected = selectedEmotion === emo.id;
            return (
              <button
                key={emo.id}
                onClick={() => setEmotion(emo.id)}
                className={`snap-center shrink-0 w-36 h-48 flex flex-col items-center justify-center rounded-3xl transition-all duration-300 ${emo.bg} 
                  ${isSelected ? 'border-[8px] border-[#A2E3A2] scale-105 shadow-lg' : 'border-4 border-transparent hover:scale-105'}
                `}
              >
                <span className="text-6xl mb-4 drop-shadow-md">{emo.emoji}</span>
                <span className="font-black text-gray-800 text-2xl">{emo.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 중앙: 큼직한 캔버스 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-[var(--color-melon-base)] flex flex-col items-center flex-1">
        <div className="flex w-full justify-between items-center mb-4">
          <h2 className="text-3xl font-black text-gray-800 break-keep">여기에 내 마음을 그려보세요 🎨</h2>
          <button
            onClick={handleClear}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg px-6 py-3 rounded-2xl transition-colors border-4 border-gray-200"
          >
            다시 그리기 🧹
          </button>
        </div>
        
        <div className="w-full flex-1 min-h-[400px] border-[8px] border-[#A2E3A2] rounded-3xl overflow-hidden touch-none relative">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="absolute inset-0 w-full h-full cursor-crosshair bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>

      {/* 하단: 제출 버튼 (Fixed at bottom for easy access) */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-green-50 via-green-50/90 to-transparent flex justify-center pb-8">
        <button
          onClick={handleSend}
          className="w-full max-w-2xl bg-[#A2E3A2] hover:bg-green-400 text-gray-900 font-black text-4xl py-8 rounded-3xl shadow-xl transition-transform active:scale-95 border-[6px] border-white"
        >
          다 그렸어요! 🚀
        </button>
      </div>

    </div>
  );
}

export default StudentDashboard;
