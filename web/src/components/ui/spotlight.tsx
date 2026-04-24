'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type SpotlightProps = {
  className?: string
  fill?: string
}

// Aceternity-style spotlight SVG. The keyframe is inlined here so the
// component is self-contained — no need to register an `animate-spotlight`
// utility in globals.css or a tailwind config.
const SPOTLIGHT_KEYFRAMES = `
@keyframes steward-spotlight {
  0% {
    opacity: 0;
    transform: translate(-72%, -62%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -40%) scale(1);
  }
}
`

export const Spotlight = ({ className, fill }: SpotlightProps) => {
  return (
    <>
      <style>{SPOTLIGHT_KEYFRAMES}</style>
      <svg
        className={cn(
          'pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%]',
          className
        )}
        style={{
          opacity: 0,
          animation: 'steward-spotlight 2s ease 0.75s 1 forwards',
        }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 3787 2842"
        fill="none"
      >
        <g filter="url(#filter)">
          <ellipse
            cx="1924.71"
            cy="273.501"
            rx="1924.71"
            ry="273.501"
            transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
            fill={fill || 'white'}
            fillOpacity="0.21"
          />
        </g>
        <defs>
          <filter
            id="filter"
            x="0.860352"
            y="0.838989"
            width="3785.16"
            height="2840.26"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_1065_8" />
          </filter>
        </defs>
      </svg>
    </>
  )
}
