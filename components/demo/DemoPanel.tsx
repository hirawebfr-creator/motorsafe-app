"use client";

/**
 * DEMO-SCENARIO-01: Demo Panel Component
 * 
 * Sticky side panel for guided demo walkthrough.
 * Shows steps, scripts, and navigation.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle2,
  Circle,
  X,
  RotateCcw,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { DEMO_STEPS } from "@/lib/demo";
import { requestJson } from "@/lib/fetcher";

interface DemoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  garageId: number;
  initialStep?: number;
}

export default function DemoPanel({
  isOpen,
  onClose,
  garageId,
  initialStep = 0,
}: DemoPanelProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isResetting, setIsResetting] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`demo_state_${garageId}`);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setCurrentStep(state.currentStep || 0);
        setCompletedSteps(new Set(state.completedSteps || []));
      } catch {
        // Ignore parse errors
      }
    }
  }, [garageId]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(
      `demo_state_${garageId}`,
      JSON.stringify({
        currentStep,
        completedSteps: Array.from(completedSteps),
      })
    );
  }, [garageId, currentStep, completedSteps]);

  const step = DEMO_STEPS[currentStep] || DEMO_STEPS[0];

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < DEMO_STEPS.length) {
      setCurrentStep(stepIndex);
    }
  };

  const markComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < DEMO_STEPS.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const navigateToStep = () => {
    router.push(step.path);
  };

  const handleReset = async () => {
    if (!confirm("Réinitialiser la démo ? Toutes les données seront remises à l'état initial.")) {
      return;
    }

    setIsResetting(true);
    try {
      await requestJson("/api/admin/demo/reset", {
        method: "POST",
        body: {},
      });
      
      // Reset local state
      setCurrentStep(0);
      setCompletedSteps(new Set());
      localStorage.removeItem(`demo_state_${garageId}`);
      
      // Navigate to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Demo reset failed:", error);
      alert("Erreur lors de la réinitialisation");
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-96 bg-white shadow-2xl dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-primary-600 text-white">
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          <span className="font-bold">Mode Démo</span>
        </div>
        <button onClick={onClose} className="hover:bg-primary-700 rounded p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Progression</span>
          <span className="font-medium">
            {completedSteps.size} / {DEMO_STEPS.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedSteps.size / DEMO_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToStep(idx)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                idx === currentStep
                  ? "bg-primary-50 border-2 border-primary-500 dark:bg-primary-900/30"
                  : completedSteps.has(idx)
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="shrink-0">
                {completedSteps.has(idx) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : idx === currentStep ? (
                  <div className="h-5 w-5 rounded-full border-2 border-primary-500 bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${idx === currentStep ? "text-primary-700 dark:text-primary-300" : ""}`}>
                  {s.title}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Details */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ce que tu dois dire :</span>
          </div>
          <blockquote className="text-sm text-gray-600 dark:text-gray-400 italic bg-white dark:bg-gray-900 p-3 rounded-lg border-l-4 border-primary-500">
            {step.script}
          </blockquote>
        </div>

        {step.cta && (
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            💡 {step.cta}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>
          <button
            onClick={navigateToStep}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir
          </button>
          <button
            onClick={markComplete}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            OK
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
          {isResetting ? "Réinitialisation..." : "Reset démo"}
        </button>
      </div>
    </div>
  );
}
