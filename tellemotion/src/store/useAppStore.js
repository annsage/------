import { create } from 'zustand';

const useAppStore = create((set) => ({
  user: { name: "", role: "", teamId: "team_1" }, // role: 'STUDENT' | 'HELPER'
  currentScreen: 'ENTRY', // 'ENTRY' | 'STUDENT_DASHBOARD' | 'HELPER_DASHBOARD' | 'TEACHER_DASHBOARD'
  selectedEmotion: "", // '행복', '평온', '불안', '슬픔', '화남', '피곤'
  avatarEmotion: "평온",
  avatarColor: "파랑",

  login: (name, role, teamId = "team_1") => set({
    user: { name, role, teamId },
    currentScreen: role === 'STUDENT' ? 'STUDENT_DASHBOARD' : 'HELPER_DASHBOARD'
  }),

  setScreen: (screen) => set({
    currentScreen: screen
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
