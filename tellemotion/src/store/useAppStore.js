import { create } from 'zustand';

const useAppStore = create((set) => ({
  user: { name: "", role: "" }, // role: 'STUDENT' | 'HELPER'
  currentScreen: 'ENTRY', // 'ENTRY' | 'STUDENT_DASHBOARD' | 'HELPER_DASHBOARD'
  selectedEmotion: "", // '행복', '평온', '불안', '슬픔', '화남', '피곤'

  login: (name, role) => set({
    user: { name, role },
    currentScreen: role === 'STUDENT' ? 'STUDENT_DASHBOARD' : 'HELPER_DASHBOARD'
  }),

  setEmotion: (emotion) => set({
    selectedEmotion: emotion
  }),
}));

export default useAppStore;
