import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TimetableGrid } from "@/components/TimetableGrid";
import { TileSidebar } from "@/components/TileSidebar";
import { CourseTile, PlacedTile } from "@/types/schedule";
import { SAMPLE_TILES, DAYS, ROOMS as DEFAULT_ROOMS } from "@/utils/scheduleData";
import { ArrowLeft, Save, Upload, Plus, User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { AccountSettings } from "@/components/AccountSettings";
import { loadUserTiles, saveUserTiles, loadPlacedTiles, savePlacedTiles, loadUserRooms, saveUserRooms, saveSavedSchedules } from "@/utils/databaseHelpers";

const Timetable = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [currentDay, setCurrentDay] = useState(DAYS[0]);
  const [rooms, setRooms] = useState<string[]>(DEFAULT_ROOMS);
  const [availableTiles, setAvailableTiles] = useState<CourseTile[]>([]);
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [draggingTile, setDraggingTile] = useState<CourseTile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [isAddTileOpen, setIsAddTileOpen] = useState(false);
  const [newTile, setNewTile] = useState({
    courseName: "",
    section: "",
    teacher: "",
    durationHours: 1,
    durationMinutes: 30,
    subjectType: "Lec" as 'Lec' | 'Lab',
    labType: "Computer Laboratory" as 'Kitchen Laboratory' | 'Computer Laboratory',
    isAsynchronous: false
  });
  const [isEditTileOpen, setIsEditTileOpen] = useState(false);
  const [editingTile, setEditingTile] = useState<PlacedTile | null>(null);
  const [editTileData, setEditTileData] = useState({
    courseName: "",
    section: "",
    teacher: "",
    startTime: "",
    endTime: "",
    subjectType: "Lec" as 'Lec' | 'Lab',
    labType: "Computer Laboratory" as 'Kitchen Laboratory' | 'Computer Laboratory',
    isAsynchronous: false
  });
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<{
    newTile: CourseTile;
    existingTile: PlacedTile;
    room: string;
    slotIndex: number;
  } | null>(null);

  // Check authentication and load user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        setUserEmail(session.user.email || "");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        setUserEmail(session.user.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  // Load data from database on mount
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const [tiles, placedTiles, rooms] = await Promise.all([
          loadUserTiles(userId),
          loadPlacedTiles(userId),
          loadUserRooms(userId)
        ]);
        
        setAvailableTiles(tiles);
        setPlacedTiles(placedTiles);
        if (rooms.length > 0) {
          setRooms(rooms);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load your data");
      }
    };

    loadData();
  }, [userId]);

  // Save placed tiles whenever they change
  useEffect(() => {
    if (!userId || placedTiles.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      savePlacedTiles(userId, placedTiles).catch(error => {
        console.error("Failed to save placed tiles:", error);
      });
    }, 500); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [placedTiles, userId]);

  // Save rooms whenever they change
  useEffect(() => {
    if (!userId || rooms.length === 0) return;

    const timeoutId = setTimeout(() => {
      saveUserRooms(userId, rooms).catch(error => {
        console.error("Failed to save rooms:", error);
      });
    }, 500); // Debounce saves

    return () => clearTimeout(timeoutId);
  }, [rooms, userId]);
  const handleDragStart = (tile: CourseTile) => {
    setDraggingTile(tile);
    setIsDragging(true);
  };
  const handleDragEnd = () => {
    setDraggingTile(null);
    setIsDragging(false);
  };

  const handleDeleteTile = async (tileId: string) => {
    const updatedTiles = availableTiles.filter(t => t.id !== tileId);
    setAvailableTiles(updatedTiles);
    
    if (userId) {
      try {
        await saveUserTiles(userId, updatedTiles);
        toast.success("Tile deleted");
      } catch (error) {
        toast.error("Failed to delete tile");
      }
    }
  };

  const handleDeleteAllTiles = async () => {
    setAvailableTiles([]);
    
    if (userId) {
      try {
        await saveUserTiles(userId, []);
        toast.success("All tiles deleted");
      } catch (error) {
        toast.error("Failed to delete tiles");
      }
    }
  };

  const handleDropTile = (room: string, slotIndex: number) => {
    if (!draggingTile) return;

    // Check if there's enough space for the tile duration
    const maxSlots = 28; // 8 AM to 10 PM = 14 hours = 28 slots of 30 mins
    if (slotIndex + draggingTile.duration > maxSlots) {
      toast.error("Not enough time slots for this course duration");
      setDraggingTile(null);
      setIsDragging(false);
      return;
    }

    // Check for overlapping tiles in the same room and day
    const overlappingTile = placedTiles.find(t => {
      if (t.id === draggingTile.id) return false; // Allow moving the same tile
      if (t.room !== room || t.day !== currentDay) return false;

      // Check if the new tile would overlap with existing tile
      const newTileEnd = slotIndex + draggingTile.duration;
      const existingTileEnd = t.slotIndex + t.duration;
      return slotIndex >= t.slotIndex && slotIndex < existingTileEnd || newTileEnd > t.slotIndex && newTileEnd <= existingTileEnd || slotIndex <= t.slotIndex && newTileEnd >= existingTileEnd;
    });
    
    if (overlappingTile) {
      // Check if we can merge (same course name and teacher)
      if (overlappingTile.courseName === draggingTile.courseName && 
          overlappingTile.teacher === draggingTile.teacher) {
        // Ask user if they want to merge
        setPendingMerge({
          newTile: draggingTile,
          existingTile: overlappingTile,
          room,
          slotIndex
        });
        setMergeDialogOpen(true);
        setDraggingTile(null);
        setIsDragging(false);
        return;
      } else {
        toast.error("This time slot is already occupied");
        setDraggingTile(null);
        setIsDragging(false);
        return;
      }
    }

    // Check for teacher conflicts across different rooms on the same day (but allow merging same course)
    if (draggingTile.teacher && draggingTile.teacher.trim() !== "") {
      const hasTeacherConflict = placedTiles.some(t => {
        if (t.id === draggingTile.id) return false; // Allow moving the same tile
        if (t.day !== currentDay) return false; // Only check same day
        if (t.room === room) return false; // Skip same room (already handled above)
        if (!t.teacher || t.teacher.trim() === "") return false; // Skip if no teacher assigned
        if (t.teacher !== draggingTile.teacher) return false; // Only check same teacher

        // Check if the new tile would overlap with existing tile's time
        const newTileEnd = slotIndex + draggingTile.duration;
        const existingTileEnd = t.slotIndex + t.duration;
        return slotIndex >= t.slotIndex && slotIndex < existingTileEnd || newTileEnd > t.slotIndex && newTileEnd <= existingTileEnd || slotIndex <= t.slotIndex && newTileEnd >= existingTileEnd;
      });
      if (hasTeacherConflict) {
        toast.error(`Teacher ${draggingTile.teacher} already has a class at this time`);
        setDraggingTile(null);
        setIsDragging(false);
        return;
      }
    }

    // Check for section conflicts across different rooms on the same day (but allow merging same course)
    if (draggingTile.section && draggingTile.section.trim() !== "") {
      const hasSectionConflict = placedTiles.some(t => {
        if (t.id === draggingTile.id) return false; // Allow moving the same tile
        if (t.day !== currentDay) return false; // Only check same day
        if (t.room === room) return false; // Skip same room (already handled above)
        if (!t.section || t.section.trim() === "") return false; // Skip if no section assigned
        if (t.section !== draggingTile.section) return false; // Only check same section

        // Check if the new tile would overlap with existing tile's time
        const newTileEnd = slotIndex + draggingTile.duration;
        const existingTileEnd = t.slotIndex + t.duration;
        return slotIndex >= t.slotIndex && slotIndex < existingTileEnd || newTileEnd > t.slotIndex && newTileEnd <= existingTileEnd || slotIndex <= t.slotIndex && newTileEnd >= existingTileEnd;
      });
      if (hasSectionConflict) {
        toast.error(`Section ${draggingTile.section} already has a class at this time`);
        setDraggingTile(null);
        setIsDragging(false);
        return;
      }
    }

    // Check for room type compatibility based on subject type and lab type
    const isLabCourse = draggingTile.subjectType === 'Lab' || /\(lab\)/i.test(draggingTile.courseName);
    const isComLabRoom = /^CL\d+$|ComLab/i.test(room);
    const isKitchenLabRoom = /^KL\d+$|Kitchen|KitchenLab/i.test(room);
    
    if (isLabCourse) {
      // Lab courses - check specific lab type
      if (draggingTile.labType === 'Computer Laboratory' && !isComLabRoom) {
        toast.error("Computer Laboratory courses can only be placed in ComLab rooms (CL1, CL2, etc.)");
        setDraggingTile(null);
        setIsDragging(false);
        return;
      }
      if (draggingTile.labType === 'Kitchen Laboratory' && !isKitchenLabRoom) {
        toast.error("Kitchen Laboratory courses can only be placed in Kitchen Lab rooms (KL1, KL2, etc.)");
        setDraggingTile(null);
        setIsDragging(false);
        return;
      }
    } else {
      // Non-lab courses cannot be in lab rooms
      if (isComLabRoom || isKitchenLabRoom) {
        toast.error("Laboratory rooms are reserved for Lab courses only");
        setDraggingTile(null);
        setIsDragging(false);
        return;
      }
    }

    const existingTile = placedTiles.find(t => t.id === draggingTile.id);
    if (existingTile) {
      // Move existing tile
      setPlacedTiles(prev => prev.map(t => t.id === draggingTile.id ? {
        ...t,
        room,
        slotIndex,
        day: currentDay
      } : t));
    } else {
      // Place new tile
      const newTile: PlacedTile = {
        ...draggingTile,
        day: currentDay,
        room,
        slotIndex
      };
      setPlacedTiles(prev => [...prev, newTile]);

      // Remove from available tiles
      const updatedAvailableTiles = availableTiles.filter(t => t.id !== draggingTile.id);
      setAvailableTiles(updatedAvailableTiles);

      // Save to database
      if (userId) {
        saveUserTiles(userId, updatedAvailableTiles).catch(error => {
          console.error("Failed to save tiles:", error);
        });
      }
    }
    setDraggingTile(null);
    setIsDragging(false);
    toast.success("Tile placed successfully!");
  };

  const handleMergeConfirm = () => {
    if (!pendingMerge) return;

    const { newTile, existingTile } = pendingMerge;

    // Merge sections
    const sections = [existingTile.section, newTile.section]
      .filter((s, i, arr) => s && arr.indexOf(s) === i) // Remove duplicates and empty
      .join('/');

    // Update the existing tile with merged section
    setPlacedTiles(prev => prev.map(t => 
      t.id === existingTile.id 
        ? { ...t, section: sections }
        : t
    ));

    // Remove the new tile from available tiles if it's not already placed
    const updatedAvailableTiles = availableTiles.filter(t => t.id !== newTile.id);
    setAvailableTiles(updatedAvailableTiles);
    
    // Save to database
    if (userId) {
      saveUserTiles(userId, updatedAvailableTiles).catch(error => {
        console.error("Failed to save tiles:", error);
      });
    }

    toast.success("Tiles merged successfully!");
    setMergeDialogOpen(false);
    setPendingMerge(null);
  };

  const handleMergeCancel = () => {
    toast.error("Schedule conflict - cannot place tile");
    setMergeDialogOpen(false);
    setPendingMerge(null);
  };
  const handleRemoveTile = (tileId: string) => {
    const tile = placedTiles.find(t => t.id === tileId);
    if (!tile) return;
    setPlacedTiles(prev => prev.filter(t => t.id !== tileId));

    // Check if the tile has merged sections (contains '/')
    if (tile.section && tile.section.includes('/')) {
      // Split the merged tile back into individual tiles
      const sections = tile.section.split('/').filter(s => s.trim());
      const splitTiles = sections.map((section, index) => ({
        ...tile,
        id: `${tile.id}-split-${index}-${Date.now()}`,
        section: section.trim(),
      }));
      
      const updatedAvailableTiles = [...availableTiles, ...splitTiles];
      setAvailableTiles(updatedAvailableTiles);
      localStorage.setItem("uploadedTiles", JSON.stringify(updatedAvailableTiles));
      toast.info("Merged tile split back into individual sections");
    } else {
      // Add back to available tiles as is
      const updatedAvailableTiles = [...availableTiles, tile];
      setAvailableTiles(updatedAvailableTiles);
      localStorage.setItem("uploadedTiles", JSON.stringify(updatedAvailableTiles));
      toast.info("Tile removed from timetable");
    }
  };
  const handleAddRoom = (roomName: string) => {
    if (rooms.includes(roomName)) {
      toast.error("Room already exists");
      return;
    }
    setRooms(prev => [...prev, roomName]);
    toast.success(`Room "${roomName}" added`);
  };
  const handleEditRoom = (oldRoom: string, newRoom: string) => {
    if (oldRoom === newRoom) return;
    if (rooms.includes(newRoom)) {
      toast.error("Room name already exists");
      return;
    }
    setRooms(prev => prev.map(r => r === oldRoom ? newRoom : r));
    setPlacedTiles(prev => prev.map(t => t.room === oldRoom ? {
      ...t,
      room: newRoom
    } : t));
    toast.success(`Room renamed to "${newRoom}"`);
  };
  const handleDeleteRoom = (room: string) => {
    const tilesInRoom = placedTiles.filter(t => t.room === room);
    if (tilesInRoom.length > 0) {
      toast.error("Cannot delete room with scheduled courses");
      return;
    }
    setRooms(prev => prev.filter(r => r !== room));
    toast.success(`Room "${room}" deleted`);
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, {
          type: 'binary'
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1
        });
        const coursesMap = new Map<string, CourseTile>();

        // Parse the timetable format
        jsonData.forEach((row: any, rowIndex) => {
          if (rowIndex < 2 || !Array.isArray(row)) return; // Skip header rows

          row.forEach((cell: any, colIndex) => {
            if (!cell || typeof cell !== 'string' || colIndex === 0) return; // Skip time column and empty cells

            // Parse cell format: "TIME RANGE COURSE_NAME SECTION TEACHER"
            // Example: "8:00 - 9:30 CYBER SECURITY CS/ACT 201 J.DE GUZMAN"
            const cellText = cell.toString().trim();
            if (!cellText || cellText.length < 10) return;

            // Extract time range (e.g., "8:00 - 9:30" or "8:00- 9:30")
            const timeMatch = cellText.match(/^(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?/);
            if (!timeMatch) return;
            let startHour = parseInt(timeMatch[1]);
            const startMin = parseInt(timeMatch[2] || '0');
            let endHour = parseInt(timeMatch[3]);
            const endMin = parseInt(timeMatch[4] || '0');

            // Apply AM/PM logic: times >= 12:00 are PM, otherwise AM
            // Convert to 24-hour format for proper calculation
            if (startHour < 12 && startHour < endHour && endHour >= 12) {
              // If start is before 12 and end is 12 or after, keep as is
            } else if (startHour >= 12 && endHour < 12) {
              // If start is 12+ and end is less than 12, end is PM (add 12)
              endHour += 12;
            } else if (startHour < 12 && endHour < 12 && startHour > endHour) {
              // If both are less than 12 but start > end, end is PM
              endHour += 12;
            }

            // Calculate duration in 30-minute blocks
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const durationMinutes = endMinutes - startMinutes;
            const duration = Math.max(1, Math.ceil(durationMinutes / 30)); // Ensure positive duration

            // Remove time from the string to get course info
            const courseInfo = cellText.replace(timeMatch[0], '').trim();

            // Extract course name in quotes (e.g., "CYBER SECURITY")
            const courseNameMatch = courseInfo.match(/"([^"]+)"/);
            let courseName = '';
            let remainingText = courseInfo;
            if (courseNameMatch) {
              courseName = courseNameMatch[1].replace(/\(LAB\)|\(LEC\)/gi, '').trim();
              remainingText = courseInfo.replace(courseNameMatch[0], '').trim();
            }

            // Split remaining text to extract section and teacher
            const parts = remainingText.split(/\s+/).filter(p => p.length > 0);
            let section = '';
            let teacher = '';

            // Find section pattern (e.g., "COE 101", "CS/ACT 201", "IT 101")
            let sectionIndex = -1;
            for (let i = 0; i < parts.length; i++) {
              // Check if current part and next part form a section
              const possibleSection = parts[i] + ' ' + (parts[i + 1] || '');
              if (/^[A-Z\/]+\s+\d+/.test(possibleSection)) {
                sectionIndex = i;
                break;
              }
            }
            if (sectionIndex >= 0 && sectionIndex + 1 < parts.length) {
              // Section is two parts (e.g., "IT 101")
              section = `${parts[sectionIndex]} ${parts[sectionIndex + 1]}`;

              // Teacher is everything after section
              const teacherParts = parts.slice(sectionIndex + 2);
              const teacherRaw = teacherParts.join(' ').replace(/\(LAB\)|\(LEC\)/gi, '').trim();

              // Format as "Initial. LastName"
              const teacherMatch = teacherRaw.match(/([A-Z])\.?\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/);
              teacher = teacherMatch ? `${teacherMatch[1]}. ${teacherMatch[2]}` : teacherRaw;
            }

            // If course name wasn't in quotes, use first parts before section
            if (!courseName && sectionIndex > 0) {
              courseName = parts.slice(0, sectionIndex).join(' ').replace(/\(LAB\)|\(LEC\)/gi, '').trim();
            }
            
            // If still no course name but we have parts, use all parts as course name
            if (!courseName && parts.length > 0) {
              courseName = parts.join(' ').replace(/\(LAB\)|\(LEC\)/gi, '').trim();
            }
            
            if (!courseName) return;

            // Create unique key for each course-section-teacher combination
            const courseKey = `${courseName}_${section}_${teacher}`;
            if (!coursesMap.has(courseKey)) {
              coursesMap.set(courseKey, {
                id: `course-${Date.now()}-${coursesMap.size}`,
                courseName: courseName.replace(/\(LAB\)|\(LEC\)/gi, '').trim(),
                section: section,
                teacher: teacher,
                startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
                endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
                duration: duration || 2,
                color: '#10b981', // Default light green
                isAsynchronous: false
              });
            }
          });
        });
        const tiles = Array.from(coursesMap.values());
        setAvailableTiles(tiles);
        
        // Save to database
        if (userId) {
          await saveUserTiles(userId, tiles);
        }
        
        toast.success(`Loaded ${tiles.length} courses from Excel file`);
      } catch (error) {
        toast.error("Failed to parse Excel file. Please check the format.");
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
  };
  const handleSave = async () => {
    if (placedTiles.length === 0) {
      toast.error("Please add some courses to the timetable first");
      return;
    }

    if (!userId) {
      toast.error("Please log in to save your timetable");
      return;
    }

    try {
      // Auto-save room schedules (one per room)
      const uniqueRooms = Array.from(new Set(placedTiles.map(t => t.room).filter(r => r && r.trim() !== "")));
      const roomSchedules = uniqueRooms.map(room => ({
        id: `room-${room}-${Date.now()}`,
        name: room,
        type: 'room' as const,
        tiles: placedTiles.filter(t => t.room === room),
        createdAt: new Date()
      }));

      // Auto-save teacher schedules
      const uniqueTeachers = Array.from(new Set(placedTiles.map(t => t.teacher).filter(t => t && t.trim() !== "")));
      const teacherSchedules = uniqueTeachers.map(teacher => ({
        id: `teacher-${teacher}-${Date.now()}`,
        name: teacher,
        type: 'teacher' as const,
        tiles: placedTiles.filter(t => t.teacher === teacher),
        createdAt: new Date()
      }));

      // Auto-save section schedules - include merged tiles in each section
      const allSections = new Set<string>();
      placedTiles.forEach(tile => {
        // Handle merged sections (e.g., "CS 101, ACT 101" or "CS 101/ACT 101")
        const sections = tile.section.split(/[\/,]+/).map(s => s.trim()).filter(s => s !== "");
        sections.forEach(s => allSections.add(s));
      });
      
      const sectionSchedules = Array.from(allSections).map(section => ({
        id: `section-${section}-${Date.now()}`,
        name: section,
        type: 'section' as const,
        tiles: placedTiles.filter(t => {
          const sections = t.section.split(/[\/,]+/).map(s => s.trim());
          return sections.includes(section);
        }),
        createdAt: new Date()
      }));

      // Combine all schedules
      const allSchedules = [...roomSchedules, ...teacherSchedules, ...sectionSchedules];
      await saveSavedSchedules(userId, allSchedules);
      
      toast.success(`Timetable saved! ${roomSchedules.length} rooms, ${teacherSchedules.length} teachers, ${sectionSchedules.length} sections`);
    } catch (error) {
      console.error("Failed to save timetable:", error);
      toast.error("Failed to save timetable");
    }
  };
  const handleReset = async () => {
    if (confirm("Are you sure you want to reset everything? This will return all placed tiles to the sidebar.")) {
      // Return placed tiles to available tiles
      setAvailableTiles(prev => [...prev, ...placedTiles]);

      // Clear placed tiles and reset rooms
      setPlacedTiles([]);
      setRooms(DEFAULT_ROOMS);

      // Clear database
      if (userId) {
        try {
          await Promise.all([
            savePlacedTiles(userId, []),
            saveUserRooms(userId, DEFAULT_ROOMS)
          ]);
          toast.success("All tiles returned to sidebar!");
        } catch (error) {
          console.error("Failed to reset:", error);
          toast.error("Failed to reset");
        }
      }
    }
  };
  const handleAddTile = async () => {
    if (!newTile.courseName.trim()) {
      toast.error("Course name is required");
      return;
    }

    // Calculate duration from hours and minutes
    const totalMinutes = (newTile.durationHours * 60) + newTile.durationMinutes;
    if (totalMinutes <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }
    
    const duration = Math.ceil(totalMinutes / 30); // Convert to 30-minute slots
    
    // Determine color based on async status
    const tileColor = newTile.isAsynchronous ? '#f59e0b' : '#10b981'; // Orange for async, light green for normal
    
    // Use placeholder times - actual time will be set when placed on grid
    const tile: CourseTile = {
      id: `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      courseName: newTile.courseName.trim(),
      section: newTile.section.trim(),
      teacher: newTile.teacher.trim(),
      startTime: "08:00", // Placeholder
      endTime: "09:30", // Placeholder
      duration,
      color: tileColor,
      subjectType: newTile.subjectType,
      labType: newTile.labType,
      isAsynchronous: newTile.isAsynchronous
    };
    setAvailableTiles(prev => [...prev, tile]);

    // Save to database
    if (userId) {
      const updatedTiles = [...availableTiles, tile];
      await saveUserTiles(userId, updatedTiles);
    }
    
    toast.success(`Tile "${tile.courseName}" added successfully`);

    // Reset form
    setNewTile({
      courseName: "",
      section: "",
      teacher: "",
      durationHours: 1,
      durationMinutes: 30,
      subjectType: "Lec",
      labType: "Computer Laboratory",
      isAsynchronous: false
    });
    setIsAddTileOpen(false);
  };
  const handleEditTileOpen = (tile: PlacedTile | CourseTile) => {
    // Check if it's a sidebar tile (has no day/room/slotIndex)
    const isSidebarTile = !('day' in tile);
    
    if (isSidebarTile) {
      // For sidebar tiles, use their existing time
      const courseTile = tile as CourseTile;
      setEditingTile(null); // No placed tile, editing sidebar tile directly
      setEditTileData({
        courseName: courseTile.courseName,
        section: courseTile.section,
        teacher: courseTile.teacher,
        startTime: courseTile.startTime,
        endTime: courseTile.endTime,
        subjectType: courseTile.subjectType || 'Lec',
        labType: courseTile.labType || 'Computer Laboratory',
        isAsynchronous: courseTile.isAsynchronous || false
      });
      setIsEditTileOpen(true);
      // Store the ID to update later
      setEditingTile({ ...courseTile, day: '', room: '', slotIndex: 0 } as any);
    } else {
      // For placed tiles
      const placedTile = tile as PlacedTile;
      setEditingTile(placedTile);
      
      // Calculate actual time based on slotIndex (8:00 AM = slot 0, each slot = 30 mins)
      const startMinutes = 480 + (placedTile.slotIndex * 30); // 480 = 8:00 AM in minutes
      const endMinutes = startMinutes + (placedTile.duration * 30);
      
      const startHour = Math.floor(startMinutes / 60);
      const startMin = startMinutes % 60;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      
      const actualStartTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      const actualEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      
      setEditTileData({
        courseName: placedTile.courseName,
        section: placedTile.section,
        teacher: placedTile.teacher,
        startTime: actualStartTime,
        endTime: actualEndTime,
        subjectType: placedTile.subjectType || 'Lec',
        labType: placedTile.labType || 'Computer Laboratory',
        isAsynchronous: placedTile.isAsynchronous || false
      });
      setIsEditTileOpen(true);
    }
  };
  const handleSaveEditTile = async () => {
    if (!editingTile) return;
    if (!editTileData.courseName.trim()) {
      toast.error("Course name is required");
      return;
    }
    
    // Check if editing a sidebar tile (no day property means sidebar tile)
    const isSidebarTile = !editingTile.day;
    
    if (isSidebarTile) {
      // Calculate new duration from time range for sidebar tiles
      const [newStartHour, newStartMin] = editTileData.startTime.split(':').map(Number);
      const [newEndHour, newEndMin] = editTileData.endTime.split(':').map(Number);
      const newStartMinutes = newStartHour * 60 + newStartMin;
      const newEndMinutes = newEndHour * 60 + newEndMin;
      const newDurationMinutes = newEndMinutes - newStartMinutes;
      if (newDurationMinutes <= 0) {
        toast.error("End time must be after start time");
        return;
      }
      const newDuration = Math.ceil(newDurationMinutes / 30);
      
      // Update sidebar tile with new color based on async status
      const tileColor = editTileData.isAsynchronous ? '#f59e0b' : '#10b981';
      const updatedTiles = availableTiles.map(t => 
        t.id === editingTile.id 
          ? {
              ...t,
              courseName: editTileData.courseName.trim(),
              section: editTileData.section.trim(),
              teacher: editTileData.teacher.trim(),
              startTime: editTileData.startTime,
              endTime: editTileData.endTime,
              duration: newDuration,
              color: tileColor,
              subjectType: editTileData.subjectType,
              labType: editTileData.labType,
              isAsynchronous: editTileData.isAsynchronous
            }
          : t
      );
      setAvailableTiles(updatedTiles);
      
      // Save to database
      if (userId) {
        await saveUserTiles(userId, updatedTiles);
      }
      
      setIsEditTileOpen(false);
      setEditingTile(null);
      toast.success("Tile updated successfully");
      return;
    }

    // Calculate new duration from time range
    const [newStartHour, newStartMin] = editTileData.startTime.split(':').map(Number);
    const [newEndHour, newEndMin] = editTileData.endTime.split(':').map(Number);
    const newStartMinutes = newStartHour * 60 + newStartMin;
    const newEndMinutes = newEndHour * 60 + newEndMin;
    const newDurationMinutes = newEndMinutes - newStartMinutes;
    if (newDurationMinutes <= 0) {
      toast.error("End time must be after start time");
      return;
    }
    const newDuration = Math.ceil(newDurationMinutes / 30);
    const oldDuration = editingTile.duration;
    const originalDuration = editingTile.originalDuration || oldDuration;

    // Check if duration was reduced
    if (newDuration < oldDuration) {
      // Calculate remaining time
      const remainingDuration = oldDuration - newDuration;
      const remainingStartMinutes = newEndMinutes;
      const remainingEndMinutes = remainingStartMinutes + remainingDuration * 30;
      const remainingStartHour = Math.floor(remainingStartMinutes / 60);
      const remainingStartMin = remainingStartMinutes % 60;
      const remainingEndHour = Math.floor(remainingEndMinutes / 60);
      const remainingEndMin = remainingEndMinutes % 60;

      // Determine color based on async status
      const tileColor = editTileData.isAsynchronous ? '#f59e0b' : '#10b981';

      // Create new tile with remaining time
      const remainingTile: CourseTile = {
        id: `tile-${Date.now()}-remaining`,
        courseName: editTileData.courseName.trim(),
        section: editTileData.section.trim(),
        teacher: editTileData.teacher.trim(),
        startTime: `${String(remainingStartHour).padStart(2, '0')}:${String(remainingStartMin).padStart(2, '0')}`,
        endTime: `${String(remainingEndHour).padStart(2, '0')}:${String(remainingEndMin).padStart(2, '0')}`,
        duration: remainingDuration,
        color: tileColor,
        splitFromId: editingTile.id, // Track which tile this was split from
        subjectType: editTileData.subjectType,
        labType: editTileData.labType,
        isAsynchronous: editTileData.isAsynchronous
      };

      // Add to available tiles
      const updatedAvailableTiles = [...availableTiles, remainingTile];
      setAvailableTiles(updatedAvailableTiles);
      
      // Save to database
      if (userId) {
        await saveUserTiles(userId, updatedAvailableTiles);
      }
      
      toast.success(`Tile updated! Remaining ${remainingDuration * 30} minutes sent to sidebar`);
    } else if (newDuration >= originalDuration) {
      // Duration restored to original or larger - remove any split tiles
      const updatedAvailableTiles = availableTiles.filter(t => t.splitFromId !== editingTile.id);
      if (updatedAvailableTiles.length < availableTiles.length) {
        setAvailableTiles(updatedAvailableTiles);
        
        // Save to database
        if (userId) {
          await saveUserTiles(userId, updatedAvailableTiles);
        }
        
        toast.success("Tile restored to full duration! Split tiles removed from sidebar");
      }
    }

    // Determine color based on async status
    const tileColor = editTileData.isAsynchronous ? '#f59e0b' : '#10b981';
    
    // Update the placed tile
    setPlacedTiles(prev => prev.map(t => t.id === editingTile.id ? {
      ...t,
      courseName: editTileData.courseName.trim(),
      section: editTileData.section.trim(),
      teacher: editTileData.teacher.trim(),
      startTime: editTileData.startTime,
      endTime: editTileData.endTime,
      duration: newDuration,
      color: tileColor,
      originalDuration: t.originalDuration || oldDuration, // Store original duration
      subjectType: editTileData.subjectType,
      labType: editTileData.labType,
      isAsynchronous: editTileData.isAsynchronous
    } : t));
    setIsEditTileOpen(false);
    setEditingTile(null);
    if (newDuration >= oldDuration && newDuration < originalDuration) {
      toast.success("Tile updated successfully");
    }
  };

  // Get unique teachers and sections from placed tiles
  const uniqueTeachers = Array.from(new Set(placedTiles.map(t => t.teacher))).sort();
  const uniqueSections = Array.from(new Set(placedTiles.map(t => t.section))).sort();
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Timetable Creator</h1>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {userEmail}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAccountSettings(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
              <label htmlFor="excel-upload">
                <Button variant="outline" className="gap-2" asChild>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload Excel
                  </span>
                </Button>
              </label>
              <Input id="excel-upload" type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" className="gap-2" onClick={handleReset}>
                Reset
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => navigate("/saved-schedules")}>
                View Saved Schedules
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Timetable
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Save Complete Timetable</DialogTitle>
                    <DialogDescription>
                      This will save the entire timetable for all teachers and sections.
                    </DialogDescription>
                  </DialogHeader>
                  <Button onClick={handleSave} className="w-full">
                    Save Complete Timetable
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {DAYS.map(day => <Button key={day} variant={currentDay === day ? "default" : "outline"} onClick={() => setCurrentDay(day)} className="whitespace-nowrap">
                {day}
              </Button>)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-160px)]">
        <TileSidebar tiles={availableTiles} onDragStart={handleDragStart} onDeleteTile={handleDeleteTile} onDeleteAllTiles={handleDeleteAllTiles} selectedTeacher={selectedTeacher} onTeacherChange={setSelectedTeacher} selectedSection={selectedSection} onSectionChange={setSelectedSection} isAddTileOpen={isAddTileOpen} setIsAddTileOpen={setIsAddTileOpen} newTile={newTile} setNewTile={setNewTile} onAddTile={handleAddTile} onEditSidebarTile={handleEditTileOpen} />
        <div className="flex-1 p-6 overflow-auto">
          <TimetableGrid day={currentDay} rooms={rooms} placedTiles={placedTiles} onDropTile={handleDropTile} onRemoveTile={handleRemoveTile} onAddRoom={handleAddRoom} onEditRoom={handleEditRoom} onDeleteRoom={handleDeleteRoom} isDragging={isDragging} draggingTile={draggingTile} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onEditTile={handleEditTileOpen} />
        </div>
      </div>

      {/* Edit Tile Dialog */}
      <Dialog open={isEditTileOpen} onOpenChange={setIsEditTileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course Tile</DialogTitle>
            <DialogDescription>
              Modify the course details. Reducing duration will send remaining time to sidebar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Name</label>
              <Input value={editTileData.courseName} onChange={e => setEditTileData(prev => ({
              ...prev,
              courseName: e.target.value
            }))} placeholder="e.g., CYBER SECURITY" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Input value={editTileData.section} onChange={e => setEditTileData(prev => ({
              ...prev,
              section: e.target.value
            }))} placeholder="e.g., CS 201" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teacher</label>
              <Input value={editTileData.teacher} onChange={e => setEditTileData(prev => ({
              ...prev,
              teacher: e.target.value
            }))} placeholder="e.g., J. DE GUZMAN" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input type="time" value={editTileData.startTime} onChange={e => setEditTileData(prev => ({
                ...prev,
                startTime: e.target.value
              }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input type="time" value={editTileData.endTime} onChange={e => setEditTileData(prev => ({
                ...prev,
                endTime: e.target.value
              }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Type</label>
              <Select value={editTileData.subjectType} onValueChange={(val: 'Lec' | 'Lab') => setEditTileData(prev => ({
                ...prev,
                subjectType: val
              }))}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="Lec">Lecture</SelectItem>
                  <SelectItem value="Lab">Laboratory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editTileData.subjectType === 'Lab' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Laboratory Type</label>
                <Select value={editTileData.labType} onValueChange={(val: 'Kitchen Laboratory' | 'Computer Laboratory') => setEditTileData(prev => ({
                  ...prev,
                  labType: val
                }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="Computer Laboratory">Computer Laboratory</SelectItem>
                    <SelectItem value="Kitchen Laboratory">Kitchen Laboratory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="async-edit"
                checked={editTileData.isAsynchronous}
                onChange={(e) => setEditTileData(prev => ({
                  ...prev,
                  isAsynchronous: e.target.checked
                }))}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="async-edit" className="text-sm font-medium">
                Asynchronous Class
              </label>
            </div>
            <Button onClick={handleSaveEditTile} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Confirmation Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Tiles?</DialogTitle>
            <DialogDescription>
              This tile has the same subject and teacher as an existing tile. Do you want to merge them?
            </DialogDescription>
          </DialogHeader>
          {pendingMerge && (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Subject: {pendingMerge.existingTile.courseName}</p>
                <p className="text-sm text-muted-foreground">Teacher: {pendingMerge.existingTile.teacher}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Current Section: <span className="font-medium">{pendingMerge.existingTile.section}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  New Section: <span className="font-medium">{pendingMerge.newTile.section}</span>
                </p>
                <p className="text-sm text-primary mt-2">
                  Merged Section: <span className="font-semibold">
                    {[pendingMerge.existingTile.section, pendingMerge.newTile.section]
                      .filter((s, i, arr) => s && arr.indexOf(s) === i)
                      .join('/')}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleMergeCancel}>
                  No - Show Conflict
                </Button>
                <Button onClick={handleMergeConfirm}>
                  Yes - Merge Tiles
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AccountSettings 
        open={showAccountSettings} 
        onOpenChange={setShowAccountSettings}
        userEmail={userEmail}
      />
    </div>;
};
export default Timetable;