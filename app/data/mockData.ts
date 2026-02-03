/**
 * Mock Data for Testing and Development
 * 
 * This file contains mock data that can be used for testing when the backend API is not available.
 * 
 * To enable mock data mode, set NEXT_PUBLIC_USE_MOCK_DATA=true in your .env.local file
 * 
 * NOTE: Mock data is kept for testing purposes but is NOT used in production.
 * All views now use real API calls. Mock data can be enabled via environment variable.
 */

// Mock Data for all views

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  position: string;
  isAdmin: boolean;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  category: "turkiye" | "international" | "special" | "visualization";
  description: string;
  createdBy: string;
  updatedBy: string;
  archived: boolean;
  teamMembers?: string[];
}

export interface Target {
  id: string;
  userId: string;
  projectId: string;
  date: string;
  taskContent: string;
  hours: number;
  minutes: number;
  goalStatus: "completed" | "in_progress" | "pending";
}

export interface UserStats {
  totalTargets: number;
  completed: number;
  inProgress: number;
  pending: number;
  totalHours: number;
}

export const mockUsers: User[] = [
  {
    id: "1",
    username: "berk.cam",
    displayName: "Berk Cam",
    email: "berk.cam@example.com",
    position: "BIM Yöneticisi",
    isAdmin: true,
  },
  {
    id: "2",
    username: "melike.catak",
    displayName: "Melike Çatak",
    email: "melike.catak@example.com",
    position: "BIM Mimarı",
    isAdmin: false,
  },
  {
    id: "3",
    username: "cansu.tufekci",
    displayName: "Cansu Tüfekci",
    email: "cansu.tufekci@example.com",
    position: "BIM Uzmanı",
    isAdmin: false,
  },
  {
    id: "4",
    username: "enes.tunc",
    displayName: "Enes Tunç",
    email: "enes.tunc@example.com",
    position: "BIM Koordinatörü",
    isAdmin: false,
  },
  {
    id: "5",
    username: "erman.ayaz",
    displayName: "Erman Ayaz",
    email: "erman.ayaz@example.com",
    position: "Görselleştirme Uzmanı",
    isAdmin: false,
  },
];

export const mockProjects: Project[] = [
  {
    id: "turkcell_adc5",
    name: "TURKCELL ANKARA DATA CENTER 5.MODUL",
    category: "turkiye",
    description: "Ankara Data Center 5. Modül projesi",
    createdBy: "berk.cam",
    updatedBy: "berk.cam",
    archived: false,
    teamMembers: ["berk.cam", "melike.catak", "enes.tunc"],
  },
  {
    id: "hyperscale_dc",
    name: "TURKCELL HYPERSCALE DATA CENTER",
    category: "turkiye",
    description: "Hyperscale Data Center projesi",
    createdBy: "berk.cam",
    updatedBy: "berk.cam",
    archived: false,
    teamMembers: ["berk.cam", "cansu.tufekci"],
  },
  {
    id: "air_base_technology",
    name: "AIR BASE TECHNOLOGY TRAINING MAINTENANCE COMPLEX",
    category: "international",
    description: "Hava Üssü Teknoloji Eğitim ve Bakım Kompleksi",
    createdBy: "berk.cam",
    updatedBy: "melike.catak",
    archived: false,
    teamMembers: ["melike.catak", "berk.cam"],
  },
  {
    id: "al_bayda_hastanesi",
    name: "AL BAYDA ONCOLOGY HOSPITAL",
    category: "international",
    description: "Al Bayda Onkoloji Hastanesi projesi",
    createdBy: "berk.cam",
    updatedBy: "cansu.tufekci",
    archived: false,
    teamMembers: ["cansu.tufekci"],
  },
  {
    id: "kvk_nidakule",
    name: "KVK NIDAKULE OFFICE",
    category: "special",
    description: "KVK Nidakule Ofis projesi",
    createdBy: "berk.cam",
    updatedBy: "berk.cam",
    archived: false,
    teamMembers: ["berk.cam"],
  },
  {
    id: "rlc_evi",
    name: "RLC EVİ",
    category: "visualization",
    description: "RLC Evi görselleştirme projesi",
    createdBy: "erman.ayaz",
    updatedBy: "erman.ayaz",
    archived: false,
    teamMembers: ["erman.ayaz"],
  },
];

export const mockTargets: Target[] = [
  {
    id: "1",
    userId: "berk.cam",
    projectId: "turkcell_adc5",
    date: "2025-01-27",
    taskContent: "Data Center modelleme çalışması",
    hours: 6,
    minutes: 30,
    goalStatus: "completed",
  },
  {
    id: "2",
    userId: "berk.cam",
    projectId: "hyperscale_dc",
    date: "2025-01-27",
    taskContent: "Hyperscale DC koordinasyon toplantısı",
    hours: 2,
    minutes: 0,
    goalStatus: "completed",
  },
  {
    id: "3",
    userId: "melike.catak",
    projectId: "air_base_technology",
    date: "2025-01-27",
    taskContent: "Hangar modelleme devam",
    hours: 7,
    minutes: 45,
    goalStatus: "in_progress",
  },
  {
    id: "4",
    userId: "cansu.tufekci",
    projectId: "al_bayda_hastanesi",
    date: "2025-01-27",
    taskContent: "Hastane plan revizyonu",
    hours: 5,
    minutes: 15,
    goalStatus: "completed",
  },
  {
    id: "5",
    userId: "enes.tunc",
    projectId: "turkcell_adc5",
    date: "2025-01-26",
    taskContent: "Koordinasyon çalışması",
    hours: 4,
    minutes: 0,
    goalStatus: "completed",
  },
  {
    id: "6",
    userId: "erman.ayaz",
    projectId: "rlc_evi",
    date: "2025-01-27",
    taskContent: "Render işlemleri",
    hours: 3,
    minutes: 30,
    goalStatus: "pending",
  },
];

export const mockUserStats: Record<string, UserStats> = {
  "berk.cam": {
    totalTargets: 45,
    completed: 38,
    inProgress: 5,
    pending: 2,
    totalHours: 320,
  },
  "melike.catak": {
    totalTargets: 32,
    completed: 28,
    inProgress: 3,
    pending: 1,
    totalHours: 245,
  },
  "cansu.tufekci": {
    totalTargets: 28,
    completed: 25,
    inProgress: 2,
    pending: 1,
    totalHours: 198,
  },
  "enes.tunc": {
    totalTargets: 35,
    completed: 30,
    inProgress: 4,
    pending: 1,
    totalHours: 267,
  },
  "erman.ayaz": {
    totalTargets: 22,
    completed: 18,
    inProgress: 2,
    pending: 2,
    totalHours: 156,
  },
};

// Helper functions
export function getUserStats(userId: string): UserStats {
  return mockUserStats[userId] || {
    totalTargets: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    totalHours: 0,
  };
}

export function getTargetsByUser(userId: string): Target[] {
  return mockTargets.filter((t) => t.userId === userId);
}

export function getTargetsByProject(projectId: string): Target[] {
  return mockTargets.filter((t) => t.projectId === projectId);
}

export function getTargetsByDate(date: string): Target[] {
  return mockTargets.filter((t) => t.date === date);
}

export function getUserById(userId: string): User | undefined {
  return mockUsers.find((u) => u.id === userId || u.username === userId);
}

export function getProjectById(projectId: string): Project | undefined {
  return mockProjects.find((p) => p.id === projectId);
}

export function getProjectsByCategory(category: string): Project[] {
  return mockProjects.filter((p) => p.category === category && !p.archived);
}

export function getAllActiveProjects(): Project[] {
  return mockProjects.filter((p) => !p.archived);
}

// Mutate functions for mock data
const targetsList = [...mockTargets];
const projectsList = [...mockProjects];
const usersList = [...mockUsers];

export function addTarget(targetData: {
  projectId: string;
  date: string;
  taskContent: string;
  hours: number;
  minutes: number;
  goalStatus: string;
  block?: string;
  floors?: string;
  description?: string;
}): Target {
  const newTarget: Target = {
    id: `target_${Date.now()}`,
    userId: "berk.cam", // Mock: current user
    projectId: targetData.projectId,
    date: targetData.date,
    taskContent: targetData.taskContent,
    hours: targetData.hours,
    minutes: targetData.minutes,
    goalStatus:
      targetData.goalStatus === "Hedefime ulaştım"
        ? "completed"
        : targetData.goalStatus === "Hedefime kısmen ulaştım"
        ? "in_progress"
        : "pending",
  };
  targetsList.push(newTarget);
  mockTargets.push(newTarget);
  return newTarget;
}

export function getMockProjects(): Project[] {
  return projectsList;
}

export function getMockUsers(): User[] {
  return usersList;
}

export function getMockTargets(): Target[] {
  return targetsList;
}

