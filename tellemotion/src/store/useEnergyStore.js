import { create } from 'zustand';

const useEnergyStore = create((set) => ({
  // 상태(State)
  energy: 100,
  characterStatus: 'HAPPY', // 'HAPPY' | 'TIRED' | 'BURNOUT' | 'RESTING'
  isSafeZoneActive: false,
  timerSeconds: 0,
  buddyEnergy: 80,

  // 액션(Action)
  
  // AAC 입력에 따른 에너지 가감 및 상태 변경
  inputAAC: (type, weight) => set((state) => {
    if (state.isSafeZoneActive) return state; // 휴식 중에는 에너지가 소모되지 않도록 처리 (기획에 따라 수정 가능)

    let newEnergy = state.energy;
    
    // type에 따라 에너지를 가감 (예: 'activity'는 소모, 'support'는 충전)
    if (type === 'activity') {
      newEnergy -= weight;
    } else if (type === 'support') {
      newEnergy += weight;
    }
    
    // 에너지는 0에서 100 사이로 유지
    newEnergy = Math.max(0, Math.min(100, newEnergy));
    
    // 상태 업데이트 로직
    let newStatus = state.characterStatus;
    if (newEnergy === 0) {
      newStatus = 'BURNOUT';
    } else if (newEnergy <= 30) {
      newStatus = 'TIRED';
    } else {
      newStatus = 'HAPPY';
    }

    return { energy: newEnergy, characterStatus: newStatus };
  }),

  // 타이머 모드 On/Off
  toggleSafeZone: (isActive, duration = 0) => set((state) => {
    // 타이머가 켜지면 RESTING 상태로 진입, 꺼지면 현재 에너지에 따른 상태로 복귀
    if (isActive) {
      return {
        isSafeZoneActive: true,
        timerSeconds: duration,
        characterStatus: 'RESTING'
      };
    } else {
      let newStatus = 'HAPPY';
      if (state.energy === 0) {
        newStatus = 'BURNOUT';
      } else if (state.energy <= 30) {
        newStatus = 'TIRED';
      }
      
      return {
        isSafeZoneActive: false,
        timerSeconds: 0,
        characterStatus: newStatus
      };
    }
  }),

  // 짝꿍 응원하기 (에너지 회복)
  cheerBuddy: () => set((state) => ({
    buddyEnergy: Math.min(100, state.buddyEnergy + 30)
  })),

  // 1초마다 타이머 감소 및 에너지 미세 회복
  tickTimer: () => set((state) => {
    // 자연스러운 상황 연출을 위해 짝꿍 에너지가 가끔씩 소모되도록 시뮬레이션
    let newBuddyEnergy = state.buddyEnergy;
    if (Math.random() < 0.15) { // 15% 확률로 1씩 감소
      newBuddyEnergy = Math.max(0, newBuddyEnergy - 1);
    }

    if (!state.isSafeZoneActive || state.timerSeconds <= 0) {
      // 안전지대가 아닐 때도 짝꿍 에너지는 상태에 반영되어야 함
      return { buddyEnergy: newBuddyEnergy };
    }

    const newTimerSeconds = state.timerSeconds - 1;
    
    // 휴식 중 에너지 미세 회복 (예: 1초당 1씩 회복, 기획에 맞게 수치 조절 가능)
    const newEnergy = Math.min(100, state.energy + 1);

    // 타이머가 종료되었을 때
    if (newTimerSeconds === 0) {
      let newStatus = 'HAPPY';
      if (newEnergy === 0) {
        newStatus = 'BURNOUT';
      } else if (newEnergy <= 30) {
        newStatus = 'TIRED';
      }
      
      return {
        timerSeconds: 0,
        isSafeZoneActive: false,
        energy: newEnergy,
        characterStatus: newStatus,
        buddyEnergy: newBuddyEnergy
      };
    }

    // 타이머 진행 중
    return {
      timerSeconds: newTimerSeconds,
      energy: newEnergy,
      buddyEnergy: newBuddyEnergy
    };
  }),
}));

export default useEnergyStore;
