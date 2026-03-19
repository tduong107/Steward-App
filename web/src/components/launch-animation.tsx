'use client'

import { useEffect, useState } from 'react'

interface LaunchAnimationProps {
  onComplete: () => void
}

export function LaunchAnimation({ onComplete }: LaunchAnimationProps) {
  const [phase, setPhase] = useState<'animating' | 'fading'>('animating')

  useEffect(() => {
    // Total animation ~3s, then fade out
    const fadeTimer = setTimeout(() => setPhase('fading'), 2800)
    const doneTimer = setTimeout(() => onComplete(), 3500)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'fading' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: '#0F2018' }}
    >
      {/* Pulsing rings */}
      <div className="relative" style={{ width: 180, height: 180 }}>
        <div className="launch-ring launch-ring-1" />
        <div className="launch-ring launch-ring-2" />
        <div className="launch-ring launch-ring-3" />

        {/* Animated SVG icon */}
        <svg
          className="launch-icon"
          viewBox="0 0 1024 1024"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          style={{ width: 180, height: 180 }}
        >
          {/* Background */}
          <rect width="1024" height="1024" rx="224" fill="#1C3D2E" />
          <rect width="1024" height="1024" rx="224" fill="url(#bgG)" />
          <circle cx="512" cy="512" r="420" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <circle cx="512" cy="512" r="360" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Shield */}
          <g transform="translate(0,42)">
            <path
              d="M512 210 C512 210 640 258 680 310 C720 362 720 430 720 490 C720 590 660 670 512 730 C364 670 304 590 304 490 C304 430 304 362 344 310 C384 258 512 210 512 210Z"
              fill="url(#shieldG)"
              opacity="0.15"
            />
            <path
              d="M512 228 C512 228 632 272 670 320 C708 368 708 432 708 488 C708 582 652 658 512 714 C372 658 316 582 316 488 C316 432 316 368 354 320 C392 272 512 228 512 228Z"
              fill="none"
              stroke="rgba(110,231,183,0.2)"
              strokeWidth="1.5"
            />
            <path
              d="M512 252 C512 252 616 290 650 332 C684 374 684 430 684 482 C684 566 634 634 512 686 C390 634 340 566 340 482 C340 430 340 374 374 332 C408 290 512 252 512 252Z"
              fill="none"
              stroke="rgba(110,231,183,0.08)"
              strokeWidth="1"
            />
          </g>

          {/* S glow */}
          <path
            d="M448 488Q445 536 425.0 579.0Q405 622 367.0 649.0Q329 676 270 676Q208 676 175.0 641.0Q142 606 142 559Q142 517 166.0 488.5Q190 460 228.5 438.5Q267 417 310 397Q348 380 386.0 360.5Q424 341 455.0 316.0Q486 291 504.5 256.5Q523 222 523 174Q523 119 495.5 76.0Q468 33 416.0 8.5Q364 -16 289 -16Q244 -16 196.0 -3.0Q148 10 111 35L116 -8H64L58 205H97Q102 117 158.0 71.5Q214 26 293 26Q332 26 365.0 40.5Q398 55 417.5 83.0Q437 111 437 151Q437 196 413.0 226.0Q389 256 351.0 278.0Q313 300 270 320Q232 337 195.0 356.0Q158 375 127.5 399.5Q97 424 78.5 458.0Q60 492 60 540Q60 566 69.0 596.0Q78 626 100.5 653.5Q123 681 162.5 698.5Q202 716 263 716Q301 716 348.5 705.5Q396 695 437 665L433 708H484V488Z"
            transform="translate(388.55,660.22) scale(0.42350,-0.42350)"
            fill="white"
            opacity="0.13"
            filter="url(#sBlur)"
          />

          {/* S letterform */}
          <path
            d="M448 488Q445 536 425.0 579.0Q405 622 367.0 649.0Q329 676 270 676Q208 676 175.0 641.0Q142 606 142 559Q142 517 166.0 488.5Q190 460 228.5 438.5Q267 417 310 397Q348 380 386.0 360.5Q424 341 455.0 316.0Q486 291 504.5 256.5Q523 222 523 174Q523 119 495.5 76.0Q468 33 416.0 8.5Q364 -16 289 -16Q244 -16 196.0 -3.0Q148 10 111 35L116 -8H64L58 205H97Q102 117 158.0 71.5Q214 26 293 26Q332 26 365.0 40.5Q398 55 417.5 83.0Q437 111 437 151Q437 196 413.0 226.0Q389 256 351.0 278.0Q313 300 270 320Q232 337 195.0 356.0Q158 375 127.5 399.5Q97 424 78.5 458.0Q60 492 60 540Q60 566 69.0 596.0Q78 626 100.5 653.5Q123 681 162.5 698.5Q202 716 263 716Q301 716 348.5 705.5Q396 695 437 665L433 708H484V488Z"
            transform="translate(388.55,660.22) scale(0.42350,-0.42350)"
            fill="url(#sG)"
          />

          {/* Decorative rules */}
          <rect x="447" y="725" width="130" height="2.5" rx="1.25" fill="rgba(110,231,183,0.25)" />
          <rect x="476" y="737" width="72" height="1.5" rx="0.75" fill="rgba(110,231,183,0.12)" />

          {/* Static spark — fades out */}
          <g transform="translate(607,355)">
            <animate
              attributeName="opacity"
              values="1;1;0"
              keyTimes="0;0.88;1"
              dur="1.0s"
              begin="0s"
              fill="freeze"
            />
            <circle cx="0" cy="0" r="22" fill="rgba(110,231,183,0.15)" />
            <path
              d="M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z"
              fill="url(#sparkFill)"
            />
            <circle cx="0" cy="0" r="3.5" fill="white" opacity="0.9" />
          </g>

          {/* Orbiting spark */}
          <g opacity="0">
            <animate
              attributeName="opacity"
              values="0;0;1"
              keyTimes="0;0.9;1"
              dur="1.0s"
              begin="0s"
              fill="freeze"
            />
            <animateMotion
              dur="2.6s"
              begin="1.0s"
              repeatCount="indefinite"
              calcMode="linear"
              rotate="auto-reverse"
            >
              <mpath xlinkHref="#orbitPath" />
            </animateMotion>
            <circle cx="0" cy="0" r="26" fill="rgba(110,231,183,0.18)" />
            <path
              d="M0 -15 L3.8 -3.8 L15 0 L3.8 3.8 L0 15 L-3.8 3.8 L-15 0 L-3.8 -3.8 Z"
              fill="url(#sparkFill)"
            />
            <circle cx="0" cy="0" r="4" fill="white" opacity="0.9" />
            <ellipse cx="-22" cy="0" rx="20" ry="5" fill="url(#tailG)" opacity="0.55" />
          </g>

          <defs>
            <path
              id="orbitPath"
              d="M 582.8 365.2 A 130 175 0 1 1 441.2 658.8 A 130 175 0 1 1 582.8 365.2 Z"
            />
            <filter id="sBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <linearGradient id="bgG" x1="512" y1="0" x2="512" y2="1024" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#243D30" />
              <stop offset="100%" stopColor="#0F2018" />
            </linearGradient>
            <radialGradient id="shieldG" cx="50%" cy="35%" r="55%" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#2A5C45" />
            </radialGradient>
            <linearGradient id="sG" x1="512" y1="357" x2="512" y2="667" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#D1FAE5" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>
            <radialGradient id="sparkFill" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </radialGradient>
            <linearGradient id="tailG" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0" />
              <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark */}
      <div className="launch-wordmark">
        <div
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            letterSpacing: '0.28em',
            color: '#fff',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
          }}
        >
          Steward
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 9.5,
            letterSpacing: '0.32em',
            color: '#6EE7B7',
            textTransform: 'uppercase',
            opacity: 0.75,
            fontFamily: 'Georgia, serif',
          }}
        >
          Your AI Concierge
        </div>
      </div>

      <style jsx>{`
        .launch-ring {
          position: absolute;
          border-radius: 34%;
          border: 1px solid rgba(110, 231, 183, 0.1);
          animation: ringPulse 3.6s ease-out infinite;
          opacity: 0;
        }
        .launch-ring-1 {
          inset: -18px;
          animation-delay: 0s;
        }
        .launch-ring-2 {
          inset: -36px;
          border-radius: 32%;
          animation-delay: 1s;
        }
        .launch-ring-3 {
          inset: -54px;
          border-radius: 30%;
          animation-delay: 2s;
        }
        @keyframes ringPulse {
          0% {
            opacity: 0;
            transform: scale(0.88);
          }
          18% {
            opacity: 0.75;
          }
          100% {
            opacity: 0;
            transform: scale(1.08);
          }
        }
        .launch-icon {
          animation: iconPop 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
          filter: drop-shadow(0 0 44px rgba(42, 92, 69, 0.8))
            drop-shadow(0 0 12px rgba(110, 231, 183, 0.22));
        }
        @keyframes iconPop {
          from {
            transform: scale(0.45);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .launch-wordmark {
          margin-top: 28px;
          text-align: center;
          animation: wordmarkFade 0.6s ease 2.1s both;
        }
        @keyframes wordmarkFade {
          from {
            opacity: 0;
            transform: translateY(7px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
