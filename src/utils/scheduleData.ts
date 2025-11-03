import { CourseTile } from "@/types/schedule";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const ROOMS = ["101", "102", "103", "104", "105", "201", "CHEM", "PHYSICS", "KITCHEN", "CL1", "CL2"];

export const TIME_SLOTS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM"
];

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", 
  "#6366f1", "#14b8a6", "#f43f5e", "#8b5cf6", "#06b6d4"
];

export const SAMPLE_TILES: CourseTile[] = [];
