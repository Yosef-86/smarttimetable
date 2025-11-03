import { CourseTile } from "@/types/schedule";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, Plus, X, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMemo } from "react";
interface TileSidebarProps {
  tiles: CourseTile[];
  onDragStart: (tile: CourseTile) => void;
  onDeleteTile: (tileId: string) => void;
  onDeleteAllTiles: () => void;
  selectedTeacher: string;
  onTeacherChange: (teacher: string) => void;
  selectedSection: string;
  onSectionChange: (section: string) => void;
  isAddTileOpen: boolean;
  setIsAddTileOpen: (open: boolean) => void;
  newTile: {
    courseName: string;
    section: string;
    teacher: string;
    durationHours: number;
    durationMinutes: number;
    color: string;
  };
  setNewTile: (tile: any) => void;
  onAddTile: () => void;
}
export const TileSidebar = ({
  tiles,
  onDragStart,
  onDeleteTile,
  onDeleteAllTiles,
  selectedTeacher,
  onTeacherChange,
  selectedSection,
  onSectionChange,
  isAddTileOpen,
  setIsAddTileOpen,
  newTile,
  setNewTile,
  onAddTile
}: TileSidebarProps) => {
  const teachers = useMemo(() => {
    const uniqueTeachers = Array.from(new Set(tiles.map(t => t.teacher).filter(Boolean)));
    return uniqueTeachers.sort();
  }, [tiles]);
  const sections = useMemo(() => {
    const uniqueSections = Array.from(new Set(tiles.map(t => t.section).filter(Boolean)));
    return uniqueSections.sort();
  }, [tiles]);
  const filteredTiles = useMemo(() => {
    return tiles.filter(tile => {
      const teacherMatch = selectedTeacher === "all" || tile.teacher === selectedTeacher;
      const sectionMatch = selectedSection === "all" || tile.section === selectedSection;
      return teacherMatch && sectionMatch;
    });
  }, [tiles, selectedTeacher, selectedSection]);
  return <div className="w-80 border-r border-border bg-muted/30 flex flex-col h-screen">
      <div className="p-4 border-b border-border bg-card space-y-3 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold">Subject Tiles</h2>
          <p className="text-sm text-muted-foreground">
            Drag tiles to the timetable
          </p>
        </div>

        <Dialog open={isAddTileOpen} onOpenChange={setIsAddTileOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Tile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Course Tile</DialogTitle>
              <DialogDescription>
                Create a new course tile to add to your timetable.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Name</label>
                <Input value={newTile.courseName} onChange={e => setNewTile((prev: any) => ({
                ...prev,
                courseName: e.target.value
              }))} placeholder="e.g., CYBER SECURITY" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Section</label>
                <Input value={newTile.section} onChange={e => setNewTile((prev: any) => ({
                ...prev,
                section: e.target.value
              }))} placeholder="e.g., CS 201" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teacher</label>
                <Input value={newTile.teacher} onChange={e => setNewTile((prev: any) => ({
                ...prev,
                teacher: e.target.value
              }))} placeholder="e.g., J. DE GUZMAN" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Hours</label>
                    <Select value={newTile.durationHours.toString()} onValueChange={val => setNewTile((prev: any) => ({
                      ...prev,
                      durationHours: parseInt(val)
                    }))}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {[0, 1, 2, 3, 4, 5, 6].map(h => (
                          <SelectItem key={h} value={h.toString()}>
                            {h} {h === 1 ? 'hour' : 'hours'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Minutes</label>
                    <Select value={newTile.durationMinutes.toString()} onValueChange={val => setNewTile((prev: any) => ({
                      ...prev,
                      durationMinutes: parseInt(val)
                    }))}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        {[0, 30].map(m => (
                          <SelectItem key={m} value={m.toString()}>
                            {m} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'].map(color => <button key={color} className="w-8 h-8 rounded-full border-2 transition-all" style={{
                  backgroundColor: color,
                  borderColor: newTile.color === color ? '#000' : 'transparent'
                }} onClick={() => setNewTile((prev: any) => ({
                  ...prev,
                  color
                }))} />)}
                </div>
              </div>
              <Button onClick={onAddTile} className="w-full">
                Add Tile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <div className="space-y-2">
          <Select value={selectedTeacher} onValueChange={onTeacherChange}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Filter by Teacher" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map(teacher => <SelectItem key={teacher} value={teacher}>
                  {teacher}
                </SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedSection} onValueChange={onSectionChange}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Filter by Section" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map(section => <SelectItem key={section} value={section}>
                  {section}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2" disabled={tiles.length === 0}>
              <Trash2 className="w-4 h-4" />
              Delete All Tiles
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Tiles?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {tiles.length} tile{tiles.length !== 1 ? 's' : ''} from the sidebar. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDeleteAllTiles} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredTiles.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">
              No courses match the selected filters
            </p> : filteredTiles.map(tile => <div key={tile.id} draggable onDragStart={e => {
          e.dataTransfer.setData("tileId", tile.id);
          onDragStart(tile);
        }} className="relative p-4 rounded-lg cursor-move hover:scale-105 transition-all shadow-md hover:shadow-lg border-2 border-transparent hover:border-primary/50" style={{
          backgroundColor: tile.color
        }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTile(tile.id);
                  }}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-white/70 flex-shrink-0 mt-1 ml-8" />
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-white font-semibold text-sm mb-1 truncate">
                      {tile.courseName}
                    </div>
                    <div className="text-white/90 text-xs truncate">
                      {tile.section}
                    </div>
                    <div className="text-white/80 text-xs truncate">
                      {tile.teacher}
                    </div>
                    <div className="text-white/70 text-xs mt-2">
                      {formatDuration(tile.duration)}
                    </div>
                  </div>
                </div>
              </div>)}
        </div>
      </ScrollArea>
    </div>;
};