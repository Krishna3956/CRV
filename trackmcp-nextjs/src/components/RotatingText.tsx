'use client'

import { useState, useEffect } from 'react'

interface RotatingTextProps {
  words: string[]
  interval?: number
}

export function RotatingText({ words, interval = 3000 }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, interval)

    return () => clearInterval(timer)
  }, [words.length, interval])

  // Find the longest word to set fixed width
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '')

  return (
    <>
      <style jsx>{`
        .rotating-container {
          display: inline-block;
          position: relative;
          vertical-align: baseline;
          min-width: fit-content;
        }
        .rotating-word {
          position: absolute;
          top: 2px;
          left: 0;
          right: 0;
          white-space: nowrap;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.6s ease;
        }
        .rotating-word.active {
          transform: translateY(0);
          opacity: 1;
        }
        .rotating-word.next {
          transform: translateY(100%);
          opacity: 0;
        }
        .rotating-word.prev {
          transform: translateY(-100%);
          opacity: 0;
        }
      `}</style>
      
      <span className="rotating-container" style={{ overflow: 'hidden', paddingLeft: '4px', paddingRight: '4px', height: '1em', display: 'inline-flex', alignItems: 'center', minWidth: 'fit-content' }}>
        {/* Invisible text to maintain space - sets the width based on longest word */}
        <span className="invisible font-bold whitespace-nowrap" aria-hidden="true" style={{ paddingLeft: '2px', paddingRight: '2px', height: '1em' }}>
          {longestWord}
        </span>
        
        {/* Screen reader accessible text */}
        <span className="sr-only">
          {words.join(', ')}
        </span>
        
        {/* Rotating words */}
        {words.map((word, index) => {
          let className = 'rotating-word'
          if (index === currentIndex) {
            className += ' active'
          } else if (index === (currentIndex + 1) % words.length) {
            className += ' next'
          } else {
            className += ' prev'
          }
          
          return (
            <span
              key={index}
              className={className}
              aria-hidden="true"
              style={{ paddingLeft: '2px', paddingRight: '2px' }}
            >
              <span className="font-bold">{word}</span>
            </span>
          )
        })}
      </span>
    </>
  )
}
