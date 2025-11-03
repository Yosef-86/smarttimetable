export interface CourseTile {
  id: string;
  courseName: string;
  section: string;
  teacher: string;
  startTime: string;
  endTime: string;
  duration: number; // in 30-minute blocks
  color: string;
  splitFromId?: string; // ID of the tile this was split from
  originalDuration?: number; // Original duration before splitting
  subjectType?: 'Lec' | 'Lab'; // Lecture or Laboratory
  labType?: 'Kitchen Laboratory' | 'Computer Laboratory'; // Type of lab if subjectType is Lab
  isAsynchronous?: boolean; // Whether this is an asynchronous class
}

export interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
}

export interface PlacedTile extends CourseTile {
  day: string;
  room: string;
  slotIndex: number;
}

export interface SavedSchedule {
  id: string;
  name: string;
  type: 'teacher' | 'section' | 'room';
  tiles: PlacedTile[];
  createdAt: Date;
}
