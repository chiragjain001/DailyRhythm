"use client"

import React, { useEffect, useState } from 'react';
import { useCompletionTracker } from '@/hooks/useCompletionTracker';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';

interface CompletionProgressBarProps {
  className?: string;
  showBreakdown?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  showExpandButton?: boolean;
}

export function CompletionProgressBar({ 
  className = '',
  showBreakdown = true,
  showPercentage = true,
  animated = true,
  showExpandButton = true
}: CompletionProgressBarProps) {
  const {
    totalItems,
    completedItems,
    completionPercentage,
    breakdown,
    isLoading,
    hasItems,
    isFullyCompleted
  } = useCompletionTracker();
  
  // Animation state for smooth updates
  const [displayPercentage, setDisplayPercentage] = useState(0);
  
  // Modal state for expanded view
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);
  
  // Animate percentage changes
  useEffect(() => {
    if (!animated) {
      setDisplayPercentage(completionPercentage);
      return;
    }
    
    const duration = 500; // 500ms animation
    const steps = 20;
    const stepDuration = duration / steps;
    const stepSize = (completionPercentage - displayPercentage) / steps;
    
    if (Math.abs(stepSize) < 0.1) {
      setDisplayPercentage(completionPercentage);
      return;
    }
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setDisplayPercentage(prev => {
        const newValue = prev + stepSize;
        if (currentStep >= steps) {
          clearInterval(interval);
          return completionPercentage;
        }
        return newValue;
      });
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [completionPercentage, animated, displayPercentage]);
  
  // Get progress bar color based on completion level
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-yellow-500'; // Best level
    if (percentage >= 41) return 'bg-teal-500'; // Good level
    return 'bg-red-500'; // Bad level
  };
  
  // Get achievement level
  const getAchievementLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Best', emoji: '🏆', color: 'text-yellow-600' };
    if (percentage >= 41) return { level: 'Good', emoji: '😊', color: 'text-teal-600' };
    return { level: 'Bad', emoji: '😞', color: 'text-red-600' };
  };
  
  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }
  
  if (!hasItems) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <p>No items to track yet</p>
          <p className="text-sm">Add tasks, habits, or wellness activities to see progress</p>
        </div>
      </Card>
    );
  }
  
  const achievement = getAchievementLevel(displayPercentage);
  
  return (
    <Card className={`p-4 ${className} ${isFullyCompleted ? 'ring-2 ring-yellow-400' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${achievement.color}`}>{achievement.emoji}</span>
          <h3 className="font-semibold text-gray-800">
            Overall Progress
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {showPercentage && (
            <>
              <span className={`text-2xl font-bold ${achievement.color}`}>
                {Math.round(displayPercentage)}%
              </span>
              <span className={`text-sm ${achievement.color}`}>
                {achievement.level}
              </span>
            </>
          )}
          {showExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Expand Progress View"
            >
              <Maximize2 className="h-4 w-4 text-gray-500" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{completedItems} completed</span>
          <span>{totalItems} total</span>
        </div>
        <div className="relative">
          <Progress 
            value={displayPercentage} 
            className="h-3"
          />
          {/* Custom colored progress bar */}
          <div 
            className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-500 ${getProgressColor(displayPercentage)}`}
            style={{ width: `${Math.min(displayPercentage, 100)}%` }}
          />
          {/* Sparkle effect for full completion */}
          {isFullyCompleted && (
            <div className="absolute -top-1 -right-1 text-yellow-400 animate-pulse">
              ✨
            </div>
          )}
        </div>
      </div>
      
      {/* Breakdown */}
      {showBreakdown && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Breakdown:</h4>
          
          {/* Tasks */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Tasks
            </span>
            <span className="text-gray-600">
              {breakdown.tasks.completed}/{breakdown.tasks.total} ({breakdown.tasks.percentage}%)
            </span>
          </div>
          
          {/* Habits */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Habits
            </span>
            <span className="text-gray-600">
              {breakdown.habits.completed}/{breakdown.habits.total} ({breakdown.habits.percentage}%)
            </span>
          </div>
          
          {/* Wellness */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Wellness
            </span>
            <span className="text-gray-600">
              {breakdown.wellness.completed}/{breakdown.wellness.total} ({breakdown.wellness.percentage}%)
            </span>
          </div>
        </div>
      )}
      
      {/* Achievement message */}
      {isFullyCompleted && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
          <span className="text-yellow-800 font-medium">
            🎉 Perfect! All items completed!
          </span>
        </div>
      )}
      
      {/* Expanded Progress Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background Overlay */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content - 70% of screen */}
          <div className="relative w-[90%] max-w-4xl h-[70vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${achievement.color}`}>{achievement.emoji}</span>
                <h2 className="text-2xl font-bold text-gray-800">
                  Overall Progress Details
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 hover:bg-white/50"
              >
                <span className="text-xl text-gray-500">×</span>
              </Button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto" style={{ height: 'calc(70vh - 80px)' }}>
              {/* Large Progress Display */}
              <div className="text-center mb-8">
                <div className={`text-6xl font-bold mb-2 ${achievement.color}`}>
                  {Math.round(displayPercentage)}%
                </div>
                <div className={`text-xl ${achievement.color} mb-4`}>
                  {achievement.level} Progress
                </div>
                <div className="text-gray-600 mb-6">
                  {completedItems} of {totalItems} items completed
                </div>
                
                {/* Large Progress Bar */}
                <div className="relative max-w-md mx-auto">
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getProgressColor(displayPercentage)} rounded-full`}
                      style={{ width: `${Math.min(displayPercentage, 100)}%` }}
                    />
                  </div>
                  {isFullyCompleted && (
                    <div className="absolute -top-2 -right-2 text-yellow-400 text-2xl animate-bounce">
                      ✨
                    </div>
                  )}
                </div>
              </div>
              
              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tasks Card */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h3 className="font-semibold text-blue-800">Tasks</h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {breakdown.tasks.percentage}%
                  </div>
                  <div className="text-sm text-blue-700">
                    {breakdown.tasks.completed} of {breakdown.tasks.total} completed
                  </div>
                  <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${breakdown.tasks.percentage}%` }}
                    />
                  </div>
                </div>
                
                {/* Habits Card */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h3 className="font-semibold text-green-800">Habits</h3>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {breakdown.habits.percentage}%
                  </div>
                  <div className="text-sm text-green-700">
                    {breakdown.habits.completed} of {breakdown.habits.total} completed
                  </div>
                  <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${breakdown.habits.percentage}%` }}
                    />
                  </div>
                </div>
                
                {/* Wellness Card */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h3 className="font-semibold text-purple-800">Wellness</h3>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {breakdown.wellness.percentage}%
                  </div>
                  <div className="text-sm text-purple-700">
                    {breakdown.wellness.completed} of {breakdown.wellness.total} target completed
                  </div>
                  <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${breakdown.wellness.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Achievement Section */}
              {isFullyCompleted && (
                <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">
                    Congratulations!
                  </h3>
                  <p className="text-yellow-700">
                    You've completed all your tasks, habits, and wellness activities for today!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
