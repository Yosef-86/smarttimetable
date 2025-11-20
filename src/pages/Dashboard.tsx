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
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                <LayoutGrid className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {userEmail}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAccountSettings(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Available Courses</CardTitle>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{availableTiles.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Course tiles ready</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-secondary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Classes</CardTitle>
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{scheduledClasses}</div>
                  <p className="text-xs text-muted-foreground mt-1">{totalHours.toFixed(1)} hours total</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{totalTeachers}</div>
                  <p className="text-xs text-muted-foreground mt-1">{totalSections} sections</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Saved Schedules</CardTitle>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{savedSchedules.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Created schedules</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription>Get started with your timetable management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => navigate("/timetable")} 
                    className="h-auto py-6 justify-start gap-4 hover:scale-105 transition-transform"
                    variant="outline"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">Open Timetable</div>
                      <div className="text-sm text-muted-foreground">Build and manage your schedule</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => navigate("/saved-schedules")} 
                    className="h-auto py-6 justify-start gap-4 hover:scale-105 transition-transform"
                    variant="outline"
                  >
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base">Saved Schedules</div>
                      <div className="text-sm text-muted-foreground">View and manage saved schedules</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Schedules */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Recent Schedules</CardTitle>
                <CardDescription>Your latest saved timetables</CardDescription>
              </CardHeader>
              <CardContent>
                {savedSchedules.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No saved schedules yet</p>
                    <Button onClick={() => navigate("/timetable")} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedSchedules.slice(0, 5).map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/5 hover:border-accent/50 transition-all cursor-pointer group"
                        onClick={() => navigate("/saved-schedules")}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {schedule.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {schedule.type} • {new Date(schedule.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                          <Clock className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {showAccountSettings && (
        <AccountSettings
          open={showAccountSettings}
          onOpenChange={setShowAccountSettings}
          userEmail={userEmail}
        />
      )}
    </div>
  );
};

export default Dashboard;
