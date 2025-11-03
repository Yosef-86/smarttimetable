import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlacedTile, SavedSchedule } from "@/types/schedule";
import { ArrowLeft, Printer, Download, UserCircle, Users, DoorOpen, Eye, Trash2, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TIME_SLOTS, DAYS } from "@/utils/scheduleData";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const SavedSchedules = () => {
  const navigate = useNavigate();
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [viewingSchedule, setViewingSchedule] = useState<SavedSchedule | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>("room");
  const [allRooms, setAllRooms] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("savedSchedules");
    if (saved) {
      setSavedSchedules(JSON.parse(saved));
    }
    
    // Load all rooms from localStorage
    const savedRooms = localStorage.getItem("customRooms");
    if (savedRooms) {
      try {
        const roomsList = JSON.parse(savedRooms);
        setAllRooms(roomsList);
      } catch (error) {
        console.error("Failed to load rooms:", error);
      }
    }
  }, []);

  // Filter schedules by type
  const teacherSchedules = savedSchedules.filter(s => s.type === 'teacher');
  const sectionSchedules = savedSchedules.filter(s => s.type === 'section');
  const roomSchedules = savedSchedules.filter(s => s.type === 'room');

  // Group schedules by date
  const groupSchedulesByDate = (schedules: SavedSchedule[]) => {
    const groups: Record<string, SavedSchedule[]> = {};
    schedules.forEach(schedule => {
      const date = new Date(schedule.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(schedule);
    });
    return groups;
  };

  const teacherGroups = groupSchedulesByDate(teacherSchedules);
  const sectionGroups = groupSchedulesByDate(sectionSchedules);

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJPEG = () => {
    toast.info("Use browser's print function and save as PDF for export");
    window.print();
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const updated = savedSchedules.filter(s => s.id !== scheduleId);
    setSavedSchedules(updated);
    localStorage.setItem("savedSchedules", JSON.stringify(updated));
    toast.success("Schedule deleted");
    if (viewingSchedule?.id === scheduleId) {
      setViewingSchedule(null);
    }
  };

  const renderDateFolder = (date: string, schedules: SavedSchedule[], Icon: any, iconColor: string) => {
    const folderKey = `date-folder-${date}`;
    const isExpanded = expandedFolders[folderKey];
    const totalClasses = schedules.reduce((sum, s) => sum + s.tiles.length, 0);

    const handleDeleteFolder = (e: React.MouseEvent) => {
      e.stopPropagation();
      const scheduleIds = schedules.map(s => s.id);
      const updated = savedSchedules.filter(s => !scheduleIds.includes(s.id));
      setSavedSchedules(updated);
      localStorage.setItem("savedSchedules", JSON.stringify(updated));
      toast.success(`Deleted ${schedules.length} schedule${schedules.length > 1 ? 's' : ''}`);
      if (viewingSchedule && scheduleIds.includes(viewingSchedule.id)) {
        setViewingSchedule(null);
      }
    };

    return (
      <Card key={folderKey} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => toggleFolder(folderKey)}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <Folder className={`w-8 h-8 ${iconColor}`} />
              <div>
                <CardTitle className="text-lg">Created: {date}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {schedules.length} schedule{schedules.length > 1 ? 's' : ''} • {totalClasses} classes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Icon className={`w-6 h-6 ${iconColor}`} />
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDeleteFolder}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {schedules.map(schedule => (
                <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{schedule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {schedule.tiles.length} classes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingSchedule(schedule);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchedule(schedule.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const renderTeacherSectionGrid = (tiles: PlacedTile[]) => {
    const numTimeSlots = TIME_SLOTS.length - 1;

    return (
      <div className="w-full overflow-x-auto print:overflow-visible">
        <div className="min-w-max border border-border rounded-lg overflow-hidden print:border print:border-black print:rounded-none">
          {/* Header Row */}
          <div className="grid bg-muted/50 border-b border-border print:bg-white print:border-b print:border-black" style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 180px)` }}>
            <div className="p-3 font-semibold text-center border-r border-border print:border print:border-black print:text-black print:text-[8px] print:p-[2px] print:flex print:items-center print:justify-center print:font-bold">Time</div>
            {DAYS.map(day => (
              <div key={day} className="p-3 font-semibold text-center border-r last:border-r-0 border-border print:border print:border-black print:text-black print:text-[8px] print:p-[2px] print:flex print:items-center print:justify-center print:font-bold">
                {day}
              </div>
            ))}
          </div>
          
          {/* Unified Grid: render base cells first, then overlay tiles to avoid distortion */}
          <div 
            className="grid relative"
            style={{ 
              gridTemplateColumns: `120px repeat(${DAYS.length}, 180px)`,
              gridTemplateRows: `repeat(${numTimeSlots}, minmax(70px, auto))`
            }}
          >
            {/* Time Column cells */}
            {TIME_SLOTS.slice(0, -1).map((time, slotIndex) => (
              <div 
                key={`time-${slotIndex}`}
                className="p-3 text-sm font-medium border-r border-b border-border bg-muted/20 flex items-center justify-center whitespace-nowrap print:border print:border-black print:bg-white print:text-black print:text-[7px] print:font-normal print:p-[1px]"
                style={{ gridColumn: 1, gridRow: slotIndex + 1 }}
              >
                {time}
              </div>
            ))}

            {/* Base grid cells for each day/slot to keep structure consistent */}
            {TIME_SLOTS.slice(0, -1).map((_, slotIndex) => (
              DAYS.map((day, dayIndex) => (
                <div
                  key={`base-${day}-${slotIndex}`}
                  className="border-r border-b border-border last:border-r-0 bg-card print:border print:border-black"
                  style={{ gridColumn: dayIndex + 2, gridRow: slotIndex + 1 }}
                />
              ))
            ))}

            {/* Overlay actual tiles */}
            {tiles.map((tile, idx) => {
              const dayIndex = DAYS.indexOf(tile.day);
              if (dayIndex === -1) return null;
              const actualStartTime = TIME_SLOTS[tile.slotIndex];
              const actualEndTime = TIME_SLOTS[tile.slotIndex + tile.duration];

              return (
                <div
                  key={`tile-${idx}-${tile.id ?? ''}`}
                  className="relative z-10 border-r border-b border-border last:border-r-0 print:border print:border-black"
                  style={{ 
                    gridColumn: dayIndex + 2,
                    gridRow: `${tile.slotIndex + 1} / span ${tile.duration}`,
                    backgroundColor: tile.color 
                  }}
                >
                  <div className="p-3 w-full h-full flex flex-col justify-center print:p-[2px] print:justify-start print:bg-white">
                    <div className="text-white font-bold text-sm mb-1 print:text-black print:text-[6.5px] print:mb-0">
                      {tile.courseName}
                    </div>
                    <div className="text-white/95 text-xs mb-0.5 print:text-black print:text-[6px] print:mb-0">
                      {tile.section}
                    </div>
                    <div className="text-white/90 text-xs mb-0.5 print:text-black print:text-[6px] print:mb-0">
                      {tile.teacher}
                    </div>
                    <div className="text-white/95 text-xs font-semibold mt-1 print:text-black print:text-[6px] print:mt-0">
                      Room: {tile.room}
                    </div>
                    <div className="text-white/80 text-xs mt-1 print:text-black print:text-[5.5px] print:mt-0">
                      {actualStartTime} - {actualEndTime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleGrid = (tiles: PlacedTile[]) => {
    // Use all available rooms instead of just those with tiles
    const scheduleRooms = allRooms.length > 0 ? allRooms : Array.from(new Set(tiles.map(t => t.room))).sort();
    
    return (
      <div className="overflow-x-auto print:overflow-visible">
        {DAYS.map((day, dayIndex) => {
          const dayTiles = tiles.filter(t => t.day === day);
          if (dayTiles.length === 0) return null;

          const numTimeSlots = TIME_SLOTS.length - 1;

          return (
            <div key={day} className="mb-8 print:mb-0 print:break-after-page print:h-[100vh] print:flex print:flex-col print:p-0">
              <h3 className="text-xl font-semibold mb-4 text-primary print:text-black print:text-[9px] print:mb-[2px] print:mt-0 print:font-bold print:h-auto">{day}</h3>
              <div className="border border-border rounded-lg overflow-hidden print:border print:border-black print:rounded-none print:h-[calc(100vh-1.5cm)] print:flex print:flex-col print:overflow-hidden">
                {/* Header Row */}
                <div className="grid bg-muted/50 border-b border-border print:bg-white print:border-b print:border-black print:h-6 print:h-[0.7cm] print:min-h-0" style={{ gridTemplateColumns: `70px repeat(${scheduleRooms.length}, minmax(100px, 160px))` }}>
                  <div className="p-2 font-semibold text-center border-r print:border print:border-black print:text-black print:text-[8px] print:p-[2px] print:flex print:items-center print:justify-center print:font-bold print:leading-tight whitespace-nowrap">Time</div>
                  {scheduleRooms.map(room => (
                    <div key={room} className="p-2 font-semibold text-center border-r last:border-r-0 text-sm print:border print:border-black print:text-black print:text-[8px] print:p-[2px] print:flex print:items-center print:justify-center print:font-bold print:leading-tight">
                      {room}
                    </div>
                  ))}
                </div>
                
                {/* Unified Grid for proper row spanning */}
                <div 
                  className="grid print:grid-rows-24"
                  style={{ 
                    gridTemplateColumns: `70px repeat(${scheduleRooms.length}, minmax(100px, 160px))`,
                    gridTemplateRows: `repeat(${numTimeSlots}, minmax(50px, auto))`
                  }}
                >
                  {TIME_SLOTS.slice(0, -1).map((time, slotIndex) => (
                    <>
                      {/* Time Column */}
                      <div 
                        key={`time-${slotIndex}`}
                        className="p-2 text-sm border-r border-b bg-muted/20 flex items-center justify-center whitespace-nowrap print:border print:border-black print:bg-white print:text-black print:text-[7px] print:font-normal print:p-[1px] print:leading-tight"
                      >
                        {time}
                      </div>
                      
                      {/* Room Columns */}
                      {scheduleRooms.map((room, roomIndex) => {
                        const tile = dayTiles.find(
                          t => t.room === room && t.slotIndex === slotIndex
                        );

                        const isOccupied = dayTiles.some(t =>
                          t.room === room &&
                          t.slotIndex < slotIndex &&
                          t.slotIndex + t.duration > slotIndex
                        );

                        if (tile && tile.slotIndex === slotIndex) {
                          // Calculate actual times based on position
                          const actualStartTime = TIME_SLOTS[tile.slotIndex];
                          const actualEndTime = TIME_SLOTS[tile.slotIndex + tile.duration];
                          
                          return (
                            <div
                              key={`${room}-${slotIndex}`}
                              className="relative border-r border-b last:border-r-0 flex items-center justify-center print:border print:border-black print:bg-white print:min-h-0"
                              style={{ 
                                gridRow: `span ${tile.duration}`,
                                backgroundColor: tile.color 
                              }}
                            >
                              <div className="p-2 w-full print:p-[2px] print:flex print:flex-col print:justify-start print:h-full print:bg-white print:overflow-hidden">
                                <div className="text-white font-semibold text-xs print:text-black print:text-[6.5px] print:font-bold print:leading-tight print:mb-0">
                                  {tile.courseName}
                                </div>
                                <div className="text-white/90 text-xs print:text-black print:text-[6px] print:font-semibold print:leading-tight print:mb-0">
                                  {tile.section}
                                </div>
                                <div className="text-white/80 text-xs print:text-black print:text-[6px] print:leading-tight print:mb-0">
                                  {tile.teacher}
                                </div>
                                <div className="text-white/70 text-[10px] mt-1 print:text-black print:text-[5.5px] print:mt-0 print:leading-tight">
                                  {actualStartTime} - {actualEndTime}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (isOccupied) {
                          return null;
                        }

                        return (
                          <div
                            key={`${room}-${slotIndex}`}
                            className="border-r border-b last:border-r-0 print:border print:border-black print:min-h-0"
                          />
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // If viewing a specific schedule, show detail view
  if (viewingSchedule) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card shadow-sm print:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setViewingSchedule(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{viewingSchedule.name}</h1>
                  <p className="text-sm text-muted-foreground capitalize">{viewingSchedule.type} Schedule</p>
                </div>
              </div>
              <div className="flex gap-2">
                <ThemeToggle />
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handleExportJPEG}>
                  <Download className="w-4 h-4 mr-2" />
                  Export JPEG
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 print:px-2 print:py-4">
          {viewingSchedule.type === 'room' 
            ? renderScheduleGrid(viewingSchedule.tiles)
            : renderTeacherSectionGrid(viewingSchedule.tiles)
          }
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/timetable")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Timetable
              </Button>
              <h1 className="text-2xl font-bold">Saved Schedules</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="room">Room Schedule</TabsTrigger>
            <TabsTrigger value="teacher">Teachers Schedule</TabsTrigger>
            <TabsTrigger value="section">Section Schedule</TabsTrigger>
          </TabsList>

          {/* Room Schedule Tab */}
          <TabsContent value="room">
            {roomSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No room schedules saved yet. Save a timetable from the Timetable page!
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomSchedules.map(schedule => (
                  <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <DoorOpen className="w-8 h-8 text-accent" />
                        <div>
                          <CardTitle className="text-lg">{schedule.name}</CardTitle>
                          <CardDescription>Room Schedule</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {schedule.tiles.length} classes scheduled
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(schedule.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={() => setViewingSchedule(schedule)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Teachers Schedule Tab */}
          <TabsContent value="teacher">
            {teacherSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No teacher schedules saved yet. Save a timetable from the Timetable page!
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(teacherGroups).map(([date, schedules]) => 
                  renderDateFolder(date, schedules, UserCircle, "text-primary")
                )}
              </div>
            )}
          </TabsContent>

          {/* Section Schedule Tab */}
          <TabsContent value="section">
            {sectionSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No section schedules saved yet. Save a timetable from the Timetable page!
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(sectionGroups).map(([date, schedules]) => 
                  renderDateFolder(date, schedules, Users, "text-secondary")
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SavedSchedules;
