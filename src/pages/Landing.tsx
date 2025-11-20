import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent animate-gradient-shift bg-200" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Side - CTA */}
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                Smart Timetable
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Scheduling
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Create, manage, and organize academic schedules with intuitive drag-and-drop functionality. Perfect for educational institutions.
              </p>
            </div>

            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              Get Started
            </Button>

            <div className="flex gap-6 pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>Easy to use</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>User Friendly
              </span>
              </div>
            </div>
          </div>

          {/* Right Side - Features */}
          <div className="space-y-6 animate-slide-up delay-200">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Drag & Drop Interface</h3>
                  <p className="text-muted-foreground">
                    Easily create schedules by dragging course tiles onto the timetable grid. Intuitive and fast.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Smart Time Management</h3>
                  <p className="text-muted-foreground">Smart conflict time detection.</p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Filter by Teacher or Section</h3>
                  <p className="text-muted-foreground">
                    Save and export schedules filtered by teacher names or class sections. Print or export as JPEG.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Landing;