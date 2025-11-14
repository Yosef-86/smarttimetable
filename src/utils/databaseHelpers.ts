import { supabase } from "@/integrations/supabase/client";
import { CourseTile, PlacedTile, SavedSchedule } from "@/types/schedule";

// User Tiles (Available Tiles in Sidebar)
export const loadUserTiles = async (userId: string): Promise<CourseTile[]> => {
  const { data, error } = await supabase
    .from("user_tiles")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error loading user tiles:", error);
    return [];
  }

  return data.map(row => ({
    id: row.tile_id,
    courseName: row.course_name,
    section: row.section,
    teacher: row.teacher,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    color: row.color,
    splitFromId: row.split_from_id,
    originalDuration: row.original_duration,
    subjectType: (row.subject_type || 'Lec') as 'Lec' | 'Lab',
    labType: (row.lab_type || 'Computer Laboratory') as 'Kitchen Laboratory' | 'Computer Laboratory',
    isAsynchronous: row.is_asynchronous || false
  }));
};

export const saveUserTiles = async (userId: string, tiles: CourseTile[]): Promise<void> => {
  // Delete all existing tiles for this user
  await supabase
    .from("user_tiles")
    .delete()
    .eq("user_id", userId);

  if (tiles.length === 0) return;

  // Insert new tiles
  const rows = tiles.map(tile => ({
    user_id: userId,
    tile_id: tile.id,
    course_name: tile.courseName,
    section: tile.section,
    teacher: tile.teacher,
    start_time: tile.startTime,
    end_time: tile.endTime,
    duration: tile.duration,
    color: tile.color,
    split_from_id: tile.splitFromId,
    original_duration: tile.originalDuration,
    subject_type: tile.subjectType,
    lab_type: tile.labType,
    is_asynchronous: tile.isAsynchronous
  }));

  const { error } = await supabase
    .from("user_tiles")
    .insert(rows);

  if (error) {
    console.error("Error saving user tiles:", error);
    throw error;
  }
};

// Placed Tiles (On Timetable Grid)
export const loadPlacedTiles = async (userId: string): Promise<PlacedTile[]> => {
  const { data, error } = await supabase
    .from("placed_tiles")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error loading placed tiles:", error);
    return [];
  }

  return data.map(row => ({
    id: row.tile_id,
    courseName: row.course_name,
    section: row.section,
    teacher: row.teacher,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    color: row.color,
    day: row.day,
    room: row.room,
    slotIndex: row.slot_index,
    splitFromId: row.split_from_id,
    originalDuration: row.original_duration,
    subjectType: (row.subject_type || 'Lec') as 'Lec' | 'Lab',
    labType: (row.lab_type || 'Computer Laboratory') as 'Kitchen Laboratory' | 'Computer Laboratory',
    isAsynchronous: row.is_asynchronous || false
  }));
};

export const savePlacedTiles = async (userId: string, tiles: PlacedTile[]): Promise<void> => {
  // Delete all existing placed tiles for this user
  await supabase
    .from("placed_tiles")
    .delete()
    .eq("user_id", userId);

  if (tiles.length === 0) return;

  // Insert new placed tiles
  const rows = tiles.map(tile => ({
    user_id: userId,
    tile_id: tile.id,
    course_name: tile.courseName,
    section: tile.section,
    teacher: tile.teacher,
    start_time: tile.startTime,
    end_time: tile.endTime,
    duration: tile.duration,
    color: tile.color,
    day: tile.day,
    room: tile.room,
    slot_index: tile.slotIndex,
    split_from_id: tile.splitFromId,
    original_duration: tile.originalDuration,
    subject_type: tile.subjectType,
    lab_type: tile.labType,
    is_asynchronous: tile.isAsynchronous
  }));

  const { error } = await supabase
    .from("placed_tiles")
    .insert(rows);

  if (error) {
    console.error("Error saving placed tiles:", error);
    throw error;
  }
};

// User Rooms
export const loadUserRooms = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("user_rooms")
    .select("rooms")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error loading user rooms:", error);
    return [];
  }

  return (data?.rooms as string[]) || [];
};

export const saveUserRooms = async (userId: string, rooms: string[]): Promise<void> => {
  const { error } = await supabase
    .from("user_rooms")
    .upsert({
      user_id: userId,
      rooms: rooms
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error("Error saving user rooms:", error);
    throw error;
  }
};

// Saved Schedules
export const loadSavedSchedules = async (userId: string): Promise<SavedSchedule[]> => {
  const { data, error } = await supabase
    .from("saved_schedules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading saved schedules:", error);
    return [];
  }

  return data.map(row => ({
    id: row.schedule_id,
    name: row.name,
    type: row.type as 'teacher' | 'section' | 'room',
    tiles: row.tiles as unknown as PlacedTile[],
    createdAt: new Date(row.created_at)
  }));
};

export const saveSavedSchedules = async (userId: string, schedules: SavedSchedule[]): Promise<void> => {
  // Delete all existing schedules for this user
  await supabase
    .from("saved_schedules")
    .delete()
    .eq("user_id", userId);

  if (schedules.length === 0) return;

  // Insert new schedules
  const rows = schedules.map(schedule => ({
    user_id: userId,
    schedule_id: schedule.id,
    name: schedule.name,
    type: schedule.type,
    tiles: schedule.tiles as unknown as any
  }));

  const { error } = await supabase
    .from("saved_schedules")
    .insert(rows);

  if (error) {
    console.error("Error saving schedules:", error);
    throw error;
  }
};

export const deleteSavedSchedule = async (userId: string, scheduleId: string): Promise<void> => {
  const { error } = await supabase
    .from("saved_schedules")
    .delete()
    .eq("user_id", userId)
    .eq("schedule_id", scheduleId);

  if (error) {
    console.error("Error deleting schedule:", error);
    throw error;
  }
};
