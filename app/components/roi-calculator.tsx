'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const AGENCY_COST = 4200
const ZINTAS_COST = 499

/** Props for an individual slider field */
interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}

/** Props for the ROI calculator component */
interface ROICalculatorProps {
  className?: string
}

/**
 * Animates a number value with eased transitions.
 */
function useAnimatedNumber(target: number, duration: number = 300): number {
  const [displayed, setDisplayed] = useState<number>(target)
  const previousRef = useRef<number>(target)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const startValue = previousRef.current
    const startTime = performance.now()

    const step = (currentTime: number): void => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (target - startValue) * eased)
      setDisplayed(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step)
      } else {
        previousRef.current = target
      }
    }

    animationRef.current = requestAnimationFrame(step)

    return (): void => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [target, duration])

  return displayed
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderFieldProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-gray-900">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values: number[]) => onChange(values[0])}
        className="w-full"
      />
    </div>
  )
}

/**
 * Interactive ROI calculator with three sliders for dental practices
 * to estimate additional monthly revenue with Zintas AI.
 */
export function ROICalculator({ className }: ROICalculatorProps): React.JSX.Element {
  const [patientValue, setPatientValue] = useState<number>(3000)
  const [currentPatients, setCurrentPatients] = useState<number>(10)
  const [growthTarget, setGrowthTarget] = useState<number>(30)

  const additionalPatients = Math.round(currentPatients * (growthTarget / 100))
  const monthlyRevenue = additionalPatients * patientValue
  const animatedRevenue = useAnimatedNumber(monthlyRevenue)

  return (
    <div className={cn('space-y-8', className)}>
      <SliderField
        label="Average patient lifetime value"
        value={patientValue}
        min={1000}
        max={10000}
        step={500}
        format={(v: number) => `$${v.toLocaleString()}`}
        onChange={setPatientValue}
      />

      <SliderField
        label="Current monthly new patients"
        value={currentPatients}
        min={1}
        max={50}
        step={1}
        format={(v: number) => String(v)}
        onChange={setCurrentPatients}
      />

      <SliderField
        label="Target monthly growth"
        value={growthTarget}
        min={10}
        max={100}
        step={5}
        format={(v: number) => `${v}%`}
        onChange={setGrowthTarget}
      />

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Estimated additional monthly revenue
          </p>
          <p className="text-4xl font-bold text-green-700 transition-all">
            ${animatedRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            vs. Average agency cost: ${AGENCY_COST.toLocaleString()}/month
          </p>
          <p className="text-sm font-semibold text-green-600">
            Zintas Pro saves you: $3,701/month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
