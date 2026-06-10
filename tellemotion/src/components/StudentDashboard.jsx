import React, { useRef, useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import AvatarCreator from './AvatarCreator';

const EMOTIONS = [
  { id: '행복', emoji: '🥰', text: '행복해요', bg: 'bg-yellow-100' },
  { id: '평온', emoji: '😌', text: '평온해요', bg: 'bg-[var(--color-melon-base)]' },
  { id: '불안', emoji: '😰', text: '불안해요', bg: 'bg-blue-100' },
  { id: '슬픔', emoji: '😢', text: '슬퍼요', bg: 'bg-indigo-100' },
  { id: '화남', emoji: '😡', text: '화나요', bg: 'bg-red-100' },
  { id: '피곤', emoji: '🥱', text: '피곤해요', bg: 'bg-gray-200' },
  { id: '잘 모르겠어요', emoji: '🤔', text: '잘 모르겠어요', bg: 'bg-purple-100' },
];

function StudentDashboard() {
  const { user, selectedEmotion, setEmotion, avatarColor } = useAppStore();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // AI 챗봇 및 셀프체크리스트 관련 상태
  const [showChatbot, setShowChatbot] = useState(false);
  const [dominantColor, setDominantColor] = useState({ name: "하얀색", hex: "#FFFFFF" });
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [studentMissionsDoc, setStudentMissionsDoc] = useState(null);

  // 오늘 날짜 구하기 YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 캔버스 드로잉 색채 분석
  const analyzeCanvasColor = (canvas) => {
    try {
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0;
      let count = 0;
      for (let i = 0; i < imgData.length; i += 80) {
        const currR = imgData[i];
        const currG = imgData[i+1];
        const currB = imgData[i+2];
        if (currR < 240 || currG < 240 || currB < 240) {
          r += currR;
          g += currG;
          b += currB;
          count++;
        }
      }
      if (count === 0) return { name: "하얀색 (순수, 단순)", hex: "#FFFFFF" };
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      if (r > 180 && g < 100 && b < 100) return { name: "빨간색 (열정, 자극, 분노)", hex: "#FF8787" };
      if (r > 180 && g > 160 && b < 100) return { name: "노란색 (희망, 활력, 행복)", hex: "#FFE066" };
      if (r < 100 && g > 150 && b < 100) return { name: "초록색 (안정, 휴식, 조화)", hex: "#8CE99A" };
      if (r < 100 && g < 140 && b > 180) return { name: "파란색 (차분, 고독, 성실)", hex: "#74C0FC" };
      if (r > 120 && g < 90 && b > 150) return { name: "보라색 (신비, 자아성찰, 상상)", hex: "#D0BFFF" };
      return { name: "기타/혼합색 (다양한 감정의 복합)", hex: `rgb(${r},${g},${b})` };
    } catch (e) {
      console.error(e);
      return { name: "하얀색", hex: "#FFFFFF" };
    }
  };

  const getFallbackAdvice = (emotion, colorName) => {
    const adviceMap = {
      '행복': `그림에 따뜻하고 밝은 에너지가 가득 차 있네요! ${colorName}은 마음속의 활력과 긍정적인 힘을 뜻해요. 오늘의 좋은 기분을 기억하며, 친구들과 기쁜 마음을 나누어 보세요.\n\n💡 자기조절 꿀팁: 공부할 때도 즐거운 마음으로 목표를 조금씩 높여 도전해보면 더욱 크게 성장할 수 있어요!`,
      '평온': `마음이 아주 차분하고 평화로운 상태군요! ${colorName}은 편안함과 안정감을 상징합니다. 조급해하지 않고 자신의 페이스를 유지하는 힘이 돋보여요.\n\n💡 자기조절 꿀팁: 공부를 시작하기 전 오늘의 계획을 차분히 정리해보고, 집중할 수 있는 환경을 만들어 실천해보세요.`,
      '불안': `지금 마음 한구석에 걱정이나 두려움이 있는 것 같아요. ${colorName}을 통해 긴장된 마음이 겉으로 표현되었습니다. 불안한 마음을 억누르기보다는 '괜찮아, 다 잘될 거야'라며 나 자신을 토닥여주세요.\n\n💡 자기조절 꿀팁: 한 번에 너무 많은 것을 하려 하지 말고, 오늘 꼭 해야 할 일 딱 하나만 정해서 아주 작게 시작해보세요.`,
      '슬픔': `마음이 여리고 슬픈 상태인가 봐요. ${colorName}의 차분함 속에 조용한 위로가 필요해 보입니다. 내 감정을 그림으로 표현해낸 것만으로도 아주 훌륭한 마음 치유의 첫걸음이에요.\n\n💡 자기조절 꿀팁: 마음이 힘들 때는 억지로 공부하기보다는 10분 정도 좋아하는 노래를 듣거나 편히 쉬면서 에너지를 충전하세요.`,
      '화남': `마음속에 뜨거운 열기나 답답한 감정이 폭발했네요. ${colorName}의 강한 톤이 거친 에너지를 보여줍니다. 화가 날 때는 심호흡을 크~게 세 번 하고 마음의 파도를 가라앉히는 것이 중요해요.\n\n💡 자기조절 꿀팁: 화가 난 상태에서는 집중하기 어렵습니다. 잠깐 자리를 피해서 물을 한 잔 마시고, 감정이 가라앉은 후에 다시 시작해 보세요.`,
      '피곤': `오늘 하루 참 많은 에너지를 써서 지친 상태인 것 같군요. ${colorName}에서 쉼이 필요하다는 신호를 주고 있습니다. 오늘 하루도 열심히 살아낸 나에게 '수고했어'라고 칭찬해주세요.\n\n💡 자기조절 꿀팁: 지친 상태에서는 20분 공부 후 5분 반드시 누워 쉬기 등 규칙적인 휴식 시간을 정해두고 가벼운 학습 위주로 진행하는 것이 좋습니다.`,
      '잘 모르겠어요': `내 마음이 지금 어떤 상태인지 헷갈리거나 말로 표현하기 어려울 수 있어요. 그것도 아주 당연하고 괜찮은 상태랍니다! 🤔\n\n선생님과 챗봇이 마음을 함께 찾아볼 수 있도록 3가지 힌트 질문을 던져볼게요. 편안하게 하나씩 대답해보세요:\n1. 오늘 아침 학교에 올 때 마음속에 가장 먼저 떠오른 생각은 무엇이었나요?\n2. 최근에 나를 조금이라도 미소 짓게 만들었던 작고 좋은 일이 있었나요?\n3. 반대로 지금 내 머릿속을 조금 복잡하게 만들거나 신경 쓰이게 하는 일이 있나요?`
    };
    return adviceMap[emotion] || `내 감정을 솔직하게 돌아보는 모습이 참 아름다워요. 차분하게 하루의 학습을 정리해보세요!`;
  };

  // AI 카운셀러 비동기 호출 (심리 상담 역할 강화)
  const fetchAICounselorAdvice = async (emotion, colorName, avColor) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return getFallbackAdvice(emotion, colorName);
    }

    try {
      const isUnknownEmotion = emotion === '잘 모르겠어요';
      const promptContent = isUnknownEmotion
        ? `당신은 초등학생의 속마음을 공감하고 치유해주는 다정한 '텔레모션 전문 아동 심리상담사'입니다. 학생이 자신의 감정을 '잘 모르겠어요'라고 선택했습니다. 그림의 색채(${colorName}) 및 아바타의 옷 색깔(${avColor})을 가볍게 언급하며 공감해주고, 아이가 스스로의 마음 상태를 차분히 탐색할 수 있도록 돕는 구체적이고 구조화된 열린 질문(예: 오늘 아침의 마음 날씨, 최근 가장 기억에 남는 속상했던 일이나 기뻤던 일 등)을 2-3가지 다정하게 건네며 심리상담 대화를 친절하게 시작해주세요. 한글로 아주 다정하게 작성해주세요.`
        : `당신은 초등학생을 상담해주는 다정하고 전문적인 '텔레모션 아동 심리상담사'입니다. 색채심리학과 자기조절 학습법(Self-Regulated Learning)에 근거하여, 아이가 선택한 감정(${emotion})과 그림 색채(${colorName}), 그리고 아바타 정보(${avColor})를 바탕으로 아이의 감정을 깊이 읽어주고 위로해주는 심리상담 메시지를 작성해주세요. 한글로 아주 다정하고 귀여운 어투(존댓말, 이모티콘 사용)로 3~4문장 내외로 작성해주시면 됩니다.`;

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
              content: "당신은 초등학생을 보듬어주는 다정하고 지혜로운 전문 아동 심리상담사입니다. 아이의 마음 건강을 치료하고 공감해주는 심리상담 역할을 전문적으로 수행해주세요."
            },
            {
              role: "user",
              content: promptContent
            }
          ],
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error("OpenAI API fail");
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      console.warn("OpenAI API 에러, 기본 가이드로 대체합니다:", e);
      return getFallbackAdvice(emotion, colorName);
    }
  };

  // 대화 메시지 전송 처리 (전문 심리상담사 역할 적용)
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    const newMsg = { sender: 'user', text: text };
    setChatMessages(prev => [...prev, newMsg]);
    setInputMessage("");
    setChatbotLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      let botResponseText = "";
      if (apiKey) {
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
                content: "당신은 초등학생의 마음을 보듬고 공감하며 마음의 상처를 치료해주는 다정하고 전문적인 '아동 심리상담사'입니다. 적극적 경청과 공감 기법을 사용하여 아이가 스스로 감정을 치유하고 정서적 조절을 할 수 있도록 유도해 주세요. 귀엽고 따뜻한 이모티콘을 사용하며 다정하게 존댓말로 2-3문장 내외로 답해 주세요."
              },
              ...chatMessages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
              })),
              { role: 'user', content: text }
            ],
            temperature: 0.8
          })
        });
        if (response.ok) {
          const data = await response.json();
          botResponseText = data.choices[0].message.content.trim();
        } else {
          botResponseText = "미안해, 내 마음에 작은 바람이 불어서 대답을 잘 못했어. 다시 한번 말해줄래? 🍃";
        }
      } else {
        botResponseText = `${user.name} 친구님, 정말 마음 깊은 고민을 이야기해주어 고마워요. 짝꿍 도우미 친구와 함께 이야기 나누며 마음의 짐을 하나씩 털어내보아요. 🌿`;
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponseText }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: "네트워크가 잠시 지연되고 있는 것 같아요. 잠시 후에 다시 이야기해줘요! 🧸" }]);
    } finally {
      setChatbotLoading(false);
    }
  };

  // 실시간 셀프체크리스트 Firestore 연동 (미존재 시 자동 초기화하여 목표 노출)
  useEffect(() => {
    if (!showChatbot || !user.teamId) return;

    const todayDate = getTodayDateString();
    const docRef = doc(db, 'teams', user.teamId, 'dailyMissions', todayDate);
    let unsubscribe = null;
    let active = true;

    const init = async () => {
      try {
        const snap = await getDoc(docRef);
        if (!active) return;
        if (!snap.exists() || !snap.data()?.missions) {
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
          await setDoc(docRef, {
            teamId: user.teamId,
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
      } catch (error) {
        console.error("학생 대시보드 미션 초기화 에러:", error);
      }

      if (!active) return;
      unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          setStudentMissionsDoc(snapshot.data());
        }
      });
    };

    init();

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [showChatbot, user.teamId]);

    // 셀프체크리스트 토글 기능
  const handleToggleStudentChecklist = async (idx) => {
    if (!studentMissionsDoc) return;

    const todayDate = getTodayDateString();
    const docRef = doc(db, 'teams', user.teamId, 'dailyMissions', todayDate);

    const updatedMissions = [...(studentMissionsDoc.studentMissions || [])];
    updatedMissions[idx].completed = !updatedMissions[idx].completed;

    const studentCompletedCount = updatedMissions.filter(m => m.completed).length;
    const helperCompletedCount = studentMissionsDoc.helperCompletedCount || 0;
    const totalCount = studentCompletedCount + helperCompletedCount;

    try {
      await updateDoc(docRef, {
        studentMissions: updatedMissions,
        studentCompletedCount: studentCompletedCount,
        completedCount: totalCount,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("체크리스트 업데이트 실패:", e);
    }
  };

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
      const analyzedColor = analyzeCanvasColor(canvas);
      setDominantColor(analyzedColor);

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

        // AI 챗봇 대화 초기 메시지 로드
        setChatbotLoading(true);
        const advice = await fetchAICounselorAdvice(selectedEmotion, analyzedColor.name, avatarColor);
        setChatMessages([
          { sender: 'bot', text: `반가워요, ${user.name} 친구님! 방금 날려보낸 소중한 마음 그림을 받아보고 분석해봤어요. 💌` },
          { sender: 'bot', text: advice }
        ]);
        setChatbotLoading(false);

        // 전송 후 완료 처리
        setIsUploading(false);
        setShowChatbot(true);
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error("업로드 에러:", error);
      setIsUploading(false);
      alert("전송에 실패했어요. 다시 시도해주세요.");
    }
  };

  if (isUploading) {
    return (
      <div className="fixed inset-0 bg-[var(--color-melon-base)] z-50 flex flex-col items-center justify-center">
        <div className="text-8xl animate-bounce mb-8">🎈</div>
        <h2 className="text-4xl font-black text-gray-800 text-center px-4 break-keep">
          선생님께 마음을 날려보내는 중이에요...
        </h2>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[var(--color-melon-base)] p-4 pb-24 flex flex-col gap-6 font-sans">
      
      {/* 상단: 가로 스크롤 감정 카드 */}
      <div className="bg-white p-6 rounded-3xl shadow-soft border-4 border-[var(--color-melon-base)] shrink-0">
        <h2 className="text-3xl font-black text-gray-800 mb-6 text-center break-keep">지금 내 기분은 어떤가요?</h2>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
          {EMOTIONS.map((emo) => {
            const isSelected = selectedEmotion === emo.id;
            return (
              <button
                key={emo.id}
                onClick={() => setEmotion(emo.id)}
                className={`snap-center shrink-0 w-36 h-48 flex flex-col items-center justify-center rounded-3xl transition-all duration-300 ${emo.bg} cursor-pointer
                  ${isSelected ? 'border-[8px] border-[#A2E3A2] scale-105 shadow-soft' : 'border-4 border-transparent hover:scale-105'}
                `}
              >
                <span className="text-6xl mb-4 drop-shadow-md">{emo.emoji}</span>
                <span className="font-black text-gray-800 text-2xl">{emo.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 중앙: 아바타 커스터마이징 및 캔버스 */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-stretch">
        {/* 아바타 영역 */}
        <div className="w-full lg:w-[420px] shrink-0 flex">
          <AvatarCreator />
        </div>

        {/* 캔버스 영역 */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border-4 border-[var(--color-melon-base)] flex flex-col items-center flex-1">
          <div className="flex w-full justify-between items-center mb-4">
            <h2 className="text-3xl font-black text-gray-800 break-keep">여기에 내 마음을 그려보세요 🎨</h2>
            <button
              onClick={handleClear}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg px-6 py-3 rounded-2xl transition-colors border-4 border-gray-200 cursor-pointer"
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
      </div>

      {/* 하단: 제출 버튼 (Fixed at bottom for easy access) */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[var(--color-melon-base)] via-[var(--color-melon-base)]/90 to-transparent flex justify-center pb-8 z-10">
        <button
          onClick={handleSend}
          className="w-full max-w-2xl bg-[#A2E3A2] hover:bg-green-400 text-gray-900 font-black text-4xl py-8 rounded-3xl shadow-soft transition-transform active:scale-95 border-[6px] border-white cursor-pointer"
        >
          다 그렸어요! 🚀
        </button>
      </div>

      {/* AI 챗봇 및 셀프체크리스트 모달 */}
      {showChatbot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#E4F7E4] border-[8px] border-white max-w-5xl w-full rounded-[40px] flex flex-col md:flex-row gap-6 p-6 md:p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto md:overflow-visible">
            
            {/* 왼쪽: 챗봇 창 */}
            <div className="bg-white rounded-3xl p-6 border-4 border-[#A2E3A2] flex flex-col h-[550px] flex-1 min-w-0">
              <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-4 mb-4">
                <span className="text-4xl animate-bounce">🤖</span>
                <div>
                  <h3 className="text-2xl font-black text-gray-800">마음 지킴이 AI 카운셀러</h3>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">색채심리와 자기조절 학습 꿀팁을 전해요 🌿</p>
                </div>
              </div>

              {/* 대화 히스토리 */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 mb-4">
                {chatMessages.map((msg, index) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div 
                      key={index} 
                      className={`flex flex-col gap-1 ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <span className="text-xs font-black text-gray-400 px-1">
                        {isBot ? 'AI 지킴이' : user.name}
                      </span>
                      <div className={`p-4 rounded-3xl text-lg max-w-[85%] leading-relaxed whitespace-pre-line border-2
                        ${isBot 
                          ? 'bg-gray-50 text-gray-800 border-gray-100 rounded-tl-none' 
                          : 'bg-green-100 text-gray-900 border-green-200 rounded-tr-none font-bold'
                        }
                      `}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                {chatbotLoading && (
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-xs font-black text-gray-400 px-1">AI 지킴이</span>
                    <div className="p-4 rounded-3xl text-sm italic bg-gray-50 text-gray-400 border-2 border-gray-100 rounded-tl-none flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      <span>생각하는 중...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 입력란 */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="지킴이에게 더 물어보고 싶은 것이 있나요?"
                  className="flex-1 bg-gray-50 border-4 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-green-300 transition-all font-bold text-gray-700 font-sans"
                />
                <button
                  type="submit"
                  disabled={chatbotLoading || !inputMessage.trim()}
                  className="bg-[#A2E3A2] hover:bg-green-400 disabled:opacity-50 text-gray-900 font-black px-6 py-3 rounded-2xl border-2 border-white cursor-pointer transition-colors"
                >
                  보내기 🚀
                </button>
              </form>
            </div>

            {/* 오른쪽: 스스로 실천하는 셀프체크리스트 */}
            <div className="bg-white rounded-3xl p-6 border-4 border-yellow-300 w-full md:w-[380px] flex flex-col gap-5 shrink-0 min-w-0">
              <div className="border-b-2 border-gray-100 pb-3">
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span>✅</span> 셀프 체크리스트
                </h3>
                <p className="text-xs font-bold text-gray-500 mt-1">이 목표들을 체크하면 모둠 점수가 올라가요! 🏔️</p>
              </div>

              {/* 달성률 게이지 */}
              {studentMissionsDoc && (
                <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-black text-gray-600">오늘의 실천 달성률</span>
                    <span className="text-lg font-black text-yellow-600">
                      {Math.round(((studentMissionsDoc.studentCompletedCount || 0) / 3) * 100)}% ({studentMissionsDoc.studentCompletedCount || 0}/3)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300 p-0.5">
                    <div 
                      className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${((studentMissionsDoc.studentCompletedCount || 0) / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 체크리스트 아이템들 */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                {studentMissionsDoc?.studentMissions?.map((item, idx) => {
                  const isCompleted = item.completed;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleStudentChecklist(idx)}
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none
                        ${isCompleted 
                          ? 'bg-yellow-50/30 border-yellow-200 opacity-80' 
                          : 'bg-white border-gray-100 hover:border-yellow-100'
                        }
                      `}
                    >
                      {/* 동그라미 체크박스 */}
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                        ${isCompleted 
                          ? 'bg-yellow-400 border-yellow-600 text-white' 
                          : 'bg-white border-gray-300'
                        }
                      `}>
                        {isCompleted && (
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                          </svg>
                        )}
                      </div>
                      <p className={`text-base font-bold text-gray-800 leading-normal break-keep
                        ${isCompleted ? 'line-through text-gray-400' : ''}
                      `}>
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 하단 닫기 버튼 */}
              <button
                onClick={() => {
                  setEmotion("");
                  handleClear();
                  setShowChatbot(false);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xl py-4 rounded-2xl border-2 border-gray-200 cursor-pointer transition-colors"
              >
                닫고 다시 그리기 🧹
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;
