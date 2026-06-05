import React, { useState } from 'react';
import useEnergyStore from '../store/useEnergyStore';

function ScheduleList() {
  const { inputAAC } = useEnergyStore();
  const [schedules, setSchedules] = useState([
    { id: 1, title: '리허설 참석', weight: 30, completed: false },
    { id: 2, title: '팀 회의', weight: 20, completed: false },
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newWeight, setNewWeight] = useState(10);

  const handleAddSchedule = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newSchedule = {
      id: Date.now(),
      title: newTitle,
      weight: newWeight,
      completed: false,
    };

    setSchedules([...schedules, newSchedule]);
    setNewTitle('');
    setNewWeight(10);
    
    // 일정을 추가할 때 계획하는 과정의 에너지가 소모된다고 가정
    inputAAC('activity', 5);
  };

  const handleToggleComplete = (id) => {
    setSchedules((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isCompleted = !item.completed;
          // 활동을 완료할 때 설정된 에너지를 소모
          if (isCompleted) {
            inputAAC('activity', item.weight);
          }
          return { ...item, completed: isCompleted };
        }
        return item;
      })
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border-4 border-gray-100 flex flex-col">
      <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
        <span>📅</span> 오늘의 일정
      </h2>
      
      <form onSubmit={handleAddSchedule} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="새로운 일정..."
          className="flex-1 p-2 border-2 border-gray-200 rounded-xl focus:border-indigo-400 outline-none text-sm"
        />
        <select
          value={newWeight}
          onChange={(e) => setNewWeight(Number(e.target.value))}
          className="p-2 border-2 border-gray-200 rounded-xl focus:border-indigo-400 outline-none bg-white text-sm"
        >
          <option value={10}>가벼움 (10)</option>
          <option value={20}>보통 (20)</option>
          <option value={30}>힘듦 (30)</option>
          <option value={50}>매우 힘듦 (50)</option>
        </select>
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
        >
          추가
        </button>
      </form>

      <ul className="space-y-3">
        {schedules.map((schedule) => (
          <li
            key={schedule.id}
            className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
              schedule.completed
                ? 'bg-gray-50 border-gray-100 opacity-60'
                : 'bg-white border-indigo-50 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleComplete(schedule.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  schedule.completed
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                {schedule.completed && <span className="text-xs">✓</span>}
              </button>
              <span
                className={`font-medium text-sm ${
                  schedule.completed ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
              >
                {schedule.title}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                에너지 -{schedule.weight}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {schedules.length === 0 && (
        <p className="text-center text-gray-400 py-4 text-sm">등록된 일정이 없습니다.</p>
      )}
    </div>
  );
}

export default ScheduleList;
