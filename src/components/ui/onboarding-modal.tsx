"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Users, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsentPrefs {
  contacts: boolean;
  calendar: boolean;
  location: boolean;
}

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (prefs: ConsentPrefs) => void;
}

export function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const [prefs, setPrefs] = useState<ConsentPrefs>({ 
    contacts: false, 
    calendar: false, 
    location: false 
  });
  const [agreed, setAgreed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggle = (key: keyof ConsentPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleComplete = () => {
    onComplete(prefs);
    onOpenChange(false);
  };

  const handlePrivacyPolicy = () => {
    window.open('https://convocore.site/privacy', '_blank');
  };

  const steps = [
    {
      id: 1,
      title: 'Welcome to Convocore AI',
      description: 'Your intelligent conversation partner',
      icon: Smartphone,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Mobile-Optimized Experience
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Enjoy a seamless chat experience designed specifically for mobile devices with touch-optimized controls and responsive design.
            </p>
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Touch-Friendly Interface</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Optimized for mobile interaction</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Responsive Design</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Works perfectly on all screen sizes</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Voice Input Support</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Speak naturally with your AI assistant</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Privacy & Permissions',
      description: 'We value your privacy and security',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Your Privacy Matters
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              The assistant can optionally access data on your device to provide smarter features. You control what's shared.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Contacts</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">To call people by name</div>
                </div>
              </div>
              <Switch
                checked={prefs.contacts}
                onCheckedChange={() => toggle('contacts')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Calendar</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">To answer schedule queries</div>
                </div>
              </div>
              <Switch
                checked={prefs.calendar}
                onCheckedChange={() => toggle('calendar')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Location</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">To answer "Where am I?" queries</div>
                </div>
              </div>
              <Switch
                checked={prefs.location}
                onCheckedChange={() => toggle('location')}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Switch
              checked={agreed}
              onCheckedChange={setAgreed}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">I agree to the Privacy Policy</div>
              <button
                onClick={handlePrivacyPolicy}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
              >
                View Privacy Policy <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-md bg-white dark:bg-zinc-900",
        isMobile && "w-[95vw] max-w-none mx-2"
      )}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {currentStepData?.icon && <currentStepData.icon className="w-5 h-5" />}
            {currentStepData?.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  step.id === currentStep
                    ? "bg-blue-600"
                    : step.id < currentStep
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[300px]">
            {currentStepData?.content}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            ) : (
              <div />
            )}
            
            {currentStep < steps.length ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="ml-auto"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!agreed}
                className="ml-auto"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 