import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, ChevronLeft, ChevronRight, X } from "lucide-react";

export interface TutorialStep {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface TutorialProps {
  steps: TutorialStep[];
  storageKey: string;
  title: string;
}

export const Tutorial = ({ steps, storageKey, title }: TutorialProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setHasSeenTutorial(false);
      setIsOpen(true);
    }
  }, [storageKey]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(storageKey, "true");
    setHasSeenTutorial(true);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpen = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleOpen}
        className="rounded-full"
        title="Show Tutorial"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>
              Step {currentStep + 1} of {steps.length}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex items-start gap-4">
              {steps[currentStep].icon && (
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {steps[currentStep].icon}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  {steps[currentStep].title}
                </h3>
                <p className="text-muted-foreground">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Skip
              </Button>
              <Button onClick={handleNext} className="gap-1">
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                {currentStep < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
