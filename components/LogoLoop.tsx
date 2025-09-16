"use client"

import { useRef, useEffect } from "react"

interface LogoLoopProps {
  logos: { node: React.ReactNode; title?: string }[]
  speed?: number
  direction?: "left" | "right"
  gap?: number
  pauseOnHover?: boolean
  scaleOnHover?: boolean
  fadeOut?: boolean
  fadeOutColor?: string
  ariaLabel?: string
}

export default function LogoLoop({
  logos,
  speed = 50,
  direction = "left",
  gap = 40,
  pauseOnHover = false,
  scaleOnHover = false,
  fadeOut = false,
  fadeOutColor = "#fff",
  ariaLabel = "scrolling logos",
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationFrame: number
    let offset = 0
    const step = () => {
      offset += direction === "left" ? -1 : 1
      container.style.transform = `translateX(${offset}px)`
      if (Math.abs(offset) >= container.scrollWidth / 2) {
        offset = 0
      }
      animationFrame = requestAnimationFrame(step)
    }
    animationFrame = requestAnimationFrame(step)

    return () => cancelAnimationFrame(animationFrame)
  }, [direction])

  return (
    <div
      className="relative overflow-hidden w-full h-full"
      aria-label={ariaLabel}
    >
      {/* Fading edges */}
      {fadeOut && (
        <>
          <div
            className="absolute top-0 left-0 h-full w-16 z-10"
            style={{
              background: `linear-gradient(to right, ${fadeOutColor}, transparent)`,
            }}
          />
          <div
            className="absolute top-0 right-0 h-full w-16 z-10"
            style={{
              background: `linear-gradient(to left, ${fadeOutColor}, transparent)`,
            }}
          />
        </>
      )}

      {/* Loop content */}
      <div
        ref={containerRef}
        className={`flex absolute top-0 left-0 h-full ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}
        style={{
          gap: `${gap}px`,
          whiteSpace: "nowrap",
        }}
      >
        {[...logos, ...logos].map((logo, i) => (
          <div
            key={i}
            className={`flex-shrink-0 ${
              scaleOnHover ? "hover:scale-105 transition-transform" : ""
            }`}
          >
            {logo.node}
          </div>
        ))}
      </div>
    </div>
  )
}
