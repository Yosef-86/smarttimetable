import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  LayoutGrid,
  Plus,
  FileText,
  LogOut,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { loadUserTiles, loadPlacedTiles, loadSavedSchedules, loadUserRooms } from "@/utils/databaseHelpers";
import { CourseTile, PlacedTile, SavedSchedule } from "@/types/schedule";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AccountSettings } from "@/components/AccountSettings";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  
  const [availableTiles, setAvailableTiles] = useState<CourseTile[]>([]);
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Check authentication
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

  // Load dashboard data
  useEffect(() => {
    if (!userId) return;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [tilesData, placedData, schedulesData, roomsData] = await Promise.all([
          loadUserTiles(userId),
          loadPlacedTiles(userId),
          loadSavedSchedules(userId),
          loadUserRooms(userId)
        ]);

        setAvailableTiles(tilesData);
        setPlacedTiles(placedData);
        setSavedSchedules(schedulesData);
        setRooms(roomsData);
      } catch (error) {
        toast.error("Error loading dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userId]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  // Calculate statistics
  const totalTeachers = new Set(availableTiles.map(t => t.teacher)).size;
  const totalSections = new Set(availableTiles.map(t => t.section)).size;
  const scheduledClasses = placedTiles.length;
  const totalHours = placedTiles.reduce((sum, tile) => sum + (tile.duration * 0.5), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {userEmail}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Users className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAccountSettings(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Tiles</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableTiles.length}</div>
              <p className="text-xs text-muted-foreground">Course tiles in sidebar</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledClasses}</div>
              <p className="text-xs text-muted-foreground">{totalHours.toFixed(1)} hours total</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeachers}</div>
              <p className="text-xs text-muted-foreground">{totalSections} sections</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Schedules</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedSchedules.length}</div>
              <p className="text-xs text-muted-foreground">{rooms.length} rooms configured</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate("/timetable")} 
                className="h-20 flex-col gap-2"
                variant="outline"
              >
                <LayoutGrid className="h-6 w-6" />
                <span>Open Timetable</span>
              </Button>
              
              <Button 
                onClick={() => navigate("/saved-schedules")} 
                className="h-20 flex-col gap-2"
                variant="outline"
              >
                <FileText className="h-6 w-6" />
                <span>View Saved Schedules</span>
              </Button>
              
              <Button 
                onClick={() => navigate("/timetable")} 
                className="h-20 flex-col gap-2"
                variant="outline"
              >
                <Plus className="h-6 w-6" />
                <span>Add New Tile</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Schedules */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Schedules</CardTitle>
            <CardDescription>Your most recently saved schedules</CardDescription>
          </CardHeader>
          <CardContent>
            {savedSchedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved schedules yet</p>
                <Button 
                  onClick={() => navigate("/timetable")} 
                  className="mt-4"
                  variant="outline"
                >
                  Create Your First Schedule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedSchedules.slice(0, 5).map((schedule) => (
                  <div 
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/saved-schedules")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {schedule.type === 'teacher' && <Users className="h-5 w-5 text-primary" />}
                        {schedule.type === 'section' && <BookOpen className="h-5 w-5 text-primary" />}
                        {schedule.type === 'room' && <LayoutGrid className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{schedule.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {schedule.tiles.length} classes • {schedule.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(schedule.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AccountSettings
        open={showAccountSettings}
        onOpenChange={setShowAccountSettings}
        userEmail={userEmail}
      />
    </div>
  );
};

export default Dashboard;
