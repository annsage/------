import React, { useState } from 'react';

// 백엔드 AI 연동 시 프롬프트 예시 (Python)
// 주의: f-string 사용 금지, format() 사용 권장
// template = "상황: {situation}\n위 상황에 맞게 일정을 조율하거나 하차하기 위한 정중하고 부드러운 메시지를 작성해줘."
// prompt = template.format(situation=selected_situation)

const TEMPLATES = {
  academic: "안녕하세요. 다름이 아니라 최근 본업(학업) 일정이 생각보다 많이 겹치게 되어, 부득이하게 이번 모임(또는 프로젝트)에 계속 참여하기 어려울 것 같습니다. 끝까지 함께하지 못해 정말 죄송하고, 다들 좋은 결과 있으시길 진심으로 응원하겠습니다.",
  personal: "안녕하세요! 죄송하게도 갑작스러운 개인 사정이 생겨 이번 일정에 참여하기가 어려울 것 같습니다. 미리 말씀드리지 못해 죄송하며, 다음 기회에 꼭 함께하고 싶습니다.",
  health: "안녕하세요. 최근 체력이 많이 떨어져서 당분간 휴식이 필요할 것 같습니다. 정말 아쉽지만 이번 활동은 쉬어가야 할 것 같아요. 너른 양해 부탁드리며, 다들 건강 챙기시면서 즐겁게 활동하시길 바랍니다!",
};

function MessageHelper() {
  const [situation, setSituation] = useState('academic');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(TEMPLATES[situation]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border-4 border-gray-100 flex flex-col">
      <h2 className="text-xl font-bold text-gray-700 mb-2 flex items-center gap-2">
        <span>💬</span> 소통 도우미
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        에너지가 고갈되어 모임 하차나 일정 변경이 필요할 때, 정중하게 마음을 전해보세요.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-600 mb-2">상황 선택</label>
        <select
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 outline-none bg-white text-sm font-medium text-gray-700"
        >
          <option value="academic">본업 / 학업 밸런스 문제</option>
          <option value="personal">갑작스러운 개인 사정</option>
          <option value="health">체력 고갈 및 건강 문제</option>
        </select>
      </div>

      <div className="relative">
        <div className="w-full h-32 p-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-700 leading-relaxed text-sm overflow-y-auto">
          {TEMPLATES[situation]}
        </div>
        <button
          onClick={handleCopy}
          className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-lg font-bold text-sm transition-all shadow-sm ${
            copied
              ? 'bg-green-500 text-white border-2 border-green-500'
              : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-500'
          }`}
        >
          {copied ? '✓ 복사완료' : '복사하기'}
        </button>
      </div>
    </div>
  );
}

export default MessageHelper;
