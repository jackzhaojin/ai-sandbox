'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type StepStatus = 'pending' | 'current' | 'completed' | 'error'

export interface Step {
  id: number
  label: string
  path: string
  status: StepStatus
}

interface StepContextType {
  steps: Step[]
  currentStep: number
  setCurrentStep: (step: number) => void
  completeStep: (step: number) => void
  setStepError: (step: number) => void
  resetSteps: () => void
  canNavigateToStep: (step: number) => boolean
  getStepPath: (step: number) => string
}

const STEPS: Omit<Step, 'status'>[] = [
  { id: 1, label: 'Details', path: '/shipments/new' },
  { id: 2, label: 'Rates', path: '/shipments/{id}/rates' },
  { id: 3, label: 'Payment', path: '/shipments/{id}/payment' },
  { id: 4, label: 'Pickup', path: '/shipments/{id}/pickup' },
  { id: 5, label: 'Review', path: '/shipments/{id}/review' },
  { id: 6, label: 'Confirm', path: '/shipments/{id}/confirm' },
]

const StepContext = createContext<StepContextType | undefined>(undefined)

export function StepProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<Step[]>(
    STEPS.map((step, index) => ({
      ...step,
      status: index === 0 ? 'current' : 'pending',
    }))
  )
  const [currentStep, setCurrentStepState] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const setCurrentStep = useCallback((stepNumber: number) => {
    setCurrentStepState(stepNumber)
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepNumber) {
          return { ...step, status: 'current' }
        }
        if (completedSteps.has(step.id)) {
          return { ...step, status: 'completed' }
        }
        return { ...step, status: 'pending' }
      })
    )
  }, [completedSteps])

  const completeStep = useCallback((stepNumber: number) => {
    setCompletedSteps((prev) => new Set(prev).add(stepNumber))
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepNumber ? { ...step, status: 'completed' } : step
      )
    )
  }, [])

  const setStepError = useCallback((stepNumber: number) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepNumber ? { ...step, status: 'error' } : step
      )
    )
  }, [])

  const resetSteps = useCallback(() => {
    setCompletedSteps(new Set())
    setCurrentStepState(1)
    setSteps(
      STEPS.map((step, index) => ({
        ...step,
        status: index === 0 ? 'current' : 'pending',
      }))
    )
  }, [])

  const canNavigateToStep = useCallback(
    (stepNumber: number) => {
      // Can always go to current or previous completed steps
      return stepNumber <= currentStep || completedSteps.has(stepNumber - 1)
    },
    [currentStep, completedSteps]
  )

  const getStepPath = useCallback((stepNumber: number, shipmentId?: string) => {
    const step = STEPS.find((s) => s.id === stepNumber)
    if (!step) return '/shipments/new'
    if (stepNumber === 1) return step.path
    return shipmentId
      ? step.path.replace('{id}', shipmentId)
      : step.path
  }, [])

  return (
    <StepContext.Provider
      value={{
        steps,
        currentStep,
        setCurrentStep,
        completeStep,
        setStepError,
        resetSteps,
        canNavigateToStep,
        getStepPath,
      }}
    >
      {children}
    </StepContext.Provider>
  )
}

export function useStepContext() {
  const context = useContext(StepContext)
  if (context === undefined) {
    throw new Error('useStepContext must be used within a StepProvider')
  }
  return context
}
