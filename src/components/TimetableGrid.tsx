import { useState } from "react";
import { PlacedTile, CourseTile } from "@/types/schedule";
import { TIME_SLOTS } from "@/utils/scheduleData";
import { cn, formatDuration } from "@/lib/utils";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TimetableGridProps {
  day: string;
  rooms: string[];
  placedTiles: PlacedTile[];
  onDropTile: (room: string, slotIndex: number) => void;
  onRemoveTile: (tileId: string) => void;
  onAddRoom: (roomName: string) => void;
  onEditRoom: (oldRoom: string, newRoom: string) => void;
  onDeleteRoom: (room: string) => void;
  isDragging: boolean;
  draggingTile?: CourseTile | null;
  onDragStart: (tile: CourseTile) => void;
  onDragEnd: () => void;
  onEditTile: (tile: PlacedTile) => void;
}

export const TimetableGrid = ({ 
  day,
  rooms,
  placedTiles, 
  onDropTile, 
  onRemoveTile,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  isDragging,
  draggingTile,
  onDragStart,
  onDragEnd,
  onEditTile
}: TimetableGridProps) => {
  const [dragOverCell, setDragOverCell] = useState<{ room: string; slotIndex: number } | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomValue, setNewRoomValue] = useState("");

  const handleDragOver = (e: React.DragEvent, room: string, slotIndex: number) => {
    e.preventDefault();
    setDragOverCell({ room, slotIndex });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const canPlaceTile = (room: string, slotIndex: number, duration: number) => {
    const maxSlots = 28;
    if (slotIndex + duration > maxSlots) return false;

    // Check for overlapping tiles
    const overlappingTile = placedTiles.find(t => {
      if (t.room !== room || t.day !== day) return false;
      const newTileEnd = slotIndex + duration;
      const existingTileEnd = t.slotIndex + t.duration;
      
      return (
        (slotIndex >= t.slotIndex && slotIndex < existingTileEnd) ||
        (newTileEnd > t.slotIndex && newTileEnd <= existingTileEnd) ||
        (slotIndex <= t.slotIndex && newTileEnd >= existingTileEnd)
      );
    });

    // If there's an overlap, check if it's mergeable
    if (overlappingTile && draggingTile) {
      // Allow if same course and teacher (mergeable)
      return overlappingTile.courseName === draggingTile.courseName && 
             overlappingTile.teacher === draggingTile.teacher;
    }

    return !overlappingTile;
  };

  const handleDrop = (e: React.DragEvent, room: string, slotIndex: number) => {
    e.preventDefault();
    setDragOverCell(null);
    onDropTile(room, slotIndex);
  };

  const getTileAtPosition = (room: string, slotIndex: number) => {
    return placedTiles.find(
      tile => tile.room === room && tile.slotIndex === slotIndex && tile.day === day
    );
  };

  const handleStartEdit = (room: string) => {
    setEditingRoom(room);
    setEditValue(room);
  };

  const handleSaveEdit = () => {
    if (editingRoom && editValue.trim()) {
      onEditRoom(editingRoom, editValue.trim());
    }
    setEditingRoom(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
    setEditValue("");
  };

  const handleAddNewRoom = () => {
    if (newRoomValue.trim()) {
      onAddRoom(newRoomValue.trim());
      setNewRoomValue("");
      setIsAddingRoom(false);
    }
  };

  return (
    <div className="bg-card border-2 border-border rounded-xl overflow-hidden shadow-lg w-full">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 text-center">
        <h2 className="text-xl font-bold">{day}</h2>
      </div>

      <div className="flex print:block">
        {/* Fixed Time Column */}
        <div className="flex-shrink-0 flex flex-col">
          {/* Time Header */}
          <div className="border-b-2 border-r-2 border-border bg-muted/50 font-semibold text-xs text-center w-20 h-[42px] flex items-center justify-center">
            Time
          </div>
          
          {/* Time Slots */}
          <div className="flex flex-col">
            {TIME_SLOTS.slice(0, -1).map((time, slotIndex) => (
              <div 
                key={`time-${slotIndex}`}
                className="font-medium text-[10px] border-r-2 border-b-2 border-border bg-muted/20 flex items-center justify-center w-20 h-8"
              >
                {time}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Rooms Area */}
        <div className="flex-1 overflow-x-auto print:overflow-visible">
          <div className="min-w-max">
            {/* Rooms Header */}
            <div className="grid border-b-2 border-border bg-muted/50 h-[42px]" style={{ gridTemplateColumns: `repeat(${rooms.length}, 160px) 60px` }}>
              {rooms.map(room => (
                <div 
                  key={room} 
                  className="relative p-2 font-semibold text-xs text-center border-r-2 border-border group"
                  onMouseEnter={() => setHoveredRoom(room)}
                  onMouseLeave={() => setHoveredRoom(null)}
                >
                  {editingRoom === room ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-6 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveEdit}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {room}
                      {hoveredRoom === room && (
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-5 w-5 bg-background/80 hover:bg-background"
                            onClick={() => handleStartEdit(room)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-5 w-5 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => onDeleteRoom(room)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              <div className="p-2 flex items-center justify-center border-r-0">
                {isAddingRoom ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newRoomValue}
                      onChange={(e) => setNewRoomValue(e.target.value)}
                      className="h-6 w-14 text-xs"
                      placeholder="Room"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddNewRoom();
                        if (e.key === "Escape") setIsAddingRoom(false);
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddNewRoom}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsAddingRoom(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={() => setIsAddingRoom(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Time Grid */}
            <div>
              <div 
                className="grid w-full" 
                style={{ 
                  gridTemplateColumns: `repeat(${rooms.length}, 160px) 60px`,
                  gridTemplateRows: `repeat(${TIME_SLOTS.length - 1}, 32px)`,
                  gridAutoFlow: 'dense'
                }}
              >
                {/* Room columns with tiles */}
                {rooms.map((room, roomIndex) => (
                  TIME_SLOTS.slice(0, -1).map((time, slotIndex) => {
                    const tile = getTileAtPosition(room, slotIndex);

                    // Check if this cell is occupied by a tile that starts earlier
                    const isOccupied = placedTiles.some(t => 
                      t.room === room && 
                      t.day === day &&
                      t.slotIndex < slotIndex && 
                      t.slotIndex + t.duration > slotIndex
                    );

                    // Skip rendering occupied cells
                    if (isOccupied) {
                      return null;
                    }

                    const isGhostStart = dragOverCell && 
                      dragOverCell.room === room && 
                      dragOverCell.slotIndex === slotIndex &&
                      draggingTile;

                    // Render the actual tile if it starts at this slot
                    if (tile && tile.slotIndex === slotIndex) {
                      return (
                        <div
                          key={`${room}-${slotIndex}`}
                          className="border-r-2 border-b-2 border-border last:border-r-0 p-0.5 group/tile"
                          style={{ 
                            gridRow: `${slotIndex + 1} / span ${tile.duration}`,
                            gridColumn: roomIndex + 1
                          }}
                        >
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("tileId", tile.id);
                              e.dataTransfer.setData("fromGrid", "true");
                              onDragStart(tile);
                            }}
                            onDragEnd={onDragEnd}
                            onDoubleClick={() => onEditTile(tile)}
                            className="relative w-full h-full p-1.5 rounded cursor-move hover:opacity-95 transition-opacity shadow-sm flex flex-col justify-between"
                            style={{ backgroundColor: tile.color }}
                            title="Double-click to edit"
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover/tile:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTile(tile.id);
                              }}
                              onDragStart={(e) => e.preventDefault()}
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                            <div className="overflow-hidden w-full">
                              <div className="text-white font-semibold text-[10px] mb-0.5 leading-tight break-all flex items-center gap-1">
                                {tile.courseName}
                                {tile.isAsynchronous && (
                                  <span className="text-[7px] bg-white/20 px-1 rounded">ASYNC</span>
                                )}
                              </div>
                              <div className="text-white/90 text-[9px] leading-tight break-all">
                                {tile.section}
                              </div>
                              <div className="text-white/80 text-[9px] leading-tight break-all">
                                {tile.teacher}
                              </div>
                            </div>
                            <div className="text-white/70 text-[9px] mt-0.5">
                              {formatDuration(tile.duration)}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render ghost preview if dragging
                    if (isGhostStart && draggingTile) {
                      const canPlace = canPlaceTile(room, slotIndex, draggingTile.duration);
                      return (
                        <div
                          key={`${room}-${slotIndex}`}
                          className="border-r-2 border-b-2 border-border last:border-r-0 p-0.5"
                          style={{ 
                            gridRow: `${slotIndex + 1} / span ${draggingTile.duration}`,
                            gridColumn: roomIndex + 1
                          }}
                          onDragOver={(e) => handleDragOver(e, room, slotIndex)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, room, slotIndex)}
                        >
                          <div
                            className={cn(
                              "w-full h-full p-1.5 rounded border-2 border-dashed transition-all flex flex-col justify-between",
                              canPlace ? "bg-primary/10 border-primary" : "bg-destructive/10 border-destructive"
                            )}
                          >
                            <div className="overflow-hidden w-full">
                              <div className={cn(
                                "font-semibold text-[10px] mb-0.5 break-all",
                                canPlace ? "text-primary" : "text-destructive"
                              )}>
                                {draggingTile.courseName}
                              </div>
                              <div className={cn(
                                "text-[9px] break-all",
                                canPlace ? "text-primary/80" : "text-destructive/80"
                              )}>
                                {draggingTile.section}
                              </div>
                              <div className={cn(
                                "text-[9px] break-all",
                                canPlace ? "text-primary/70" : "text-destructive/70"
                              )}>
                                {draggingTile.teacher}
                              </div>
                            </div>
                            <div className={cn(
                              "text-[9px] mt-0.5",
                              canPlace ? "text-primary/60" : "text-destructive/60"
                            )}>
                              {formatDuration(draggingTile.duration)}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render empty cell for drag and drop
                    return (
                      <div
                        key={`${room}-${slotIndex}`}
                        className={cn(
                          "border-r-2 border-b-2 border-border last:border-r-0 transition-all",
                          isDragging && "bg-muted/50"
                        )}
                        style={{ 
                          gridRow: slotIndex + 1,
                          gridColumn: roomIndex + 1
                        }}
                        onDragOver={(e) => handleDragOver(e, room, slotIndex)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, room, slotIndex)}
                      />
                    );
                  })
                ))}

                {/* Empty column for the + button */}
                {TIME_SLOTS.slice(0, -1).map((time, slotIndex) => (
                  <div 
                    key={`empty-${slotIndex}`}
                    className="border-b-2 border-border"
                    style={{ gridRow: slotIndex + 1, gridColumn: rooms.length + 1 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};