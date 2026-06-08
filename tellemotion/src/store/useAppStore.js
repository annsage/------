import { create } from 'zustand';

const useAppStore = create((set) => ({
  user: { name: "", role: "" }, // role: 'STUDENT' | 'HELPER'
  currentScreen: 'ENTRY', // 'ENTRY' | 'STUDENT_DASHBOARD' | 'HELPER_DASHBOARD'
  selectedEmotion: "", // '행복', '평온', '불안', '슬픔', '화남', '피곤'
  avatarEmotion: "평온",
  avatarColor: "파랑",

  login: (name, role) => set({
    user: { name, role },
    currentScreen: role === 'STUDENT' ? 'STUDENT_DASHBOARD' : 'HELPER_DASHBOARD'
  }),

  setEmotion: (emotion) => set({
    selectedEmotion: emotion
  }),

  setAvatarEmotion: (emotion) => set({
    avatarEmotion: emotion
  }),

  setAvatarColor: (color) => set({
    avatarColor: color
  }),
}));

export default useAppStore;
