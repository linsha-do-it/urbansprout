import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const TypewriterTestimonial = ({ testimonials }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const audioPlayerRef = useRef(null)
  const [hasBeenHovered, setHasBeenHovered] = useState(
    new Array(testimonials.length).fill(false)
  )
  const [typedText, setTypedText] = useState('')
  const typewriterTimeoutRef = useRef(null)

  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      audioPlayerRef.current.currentTime = 0
      audioPlayerRef.current.src = ''
      audioPlayerRef.current.load()
      audioPlayerRef.current = null
    }
  }, [])

  const startTypewriter = useCallback((text) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current)
    }
    setTypedText('')

    let i = 0
    const type = () => {
      if (i <= text.length) {
        setTypedText(text.slice(0, i))
        i += 1
        typewriterTimeoutRef.current = setTimeout(type, 35)
      }
    }
    type()
  }, [])

  const stopTypewriter = useCallback(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current)
      typewriterTimeoutRef.current = null
    }
    setTypedText('')
  }, [])

  const handleMouseEnter = useCallback(
    (index) => {
      stopAudio()
      setHoveredIndex(index)

      const audioFile = testimonials[index].audio
      if (audioFile) {
        const newAudio = new Audio(`/audio/${audioFile}`)
        audioPlayerRef.current = newAudio
        newAudio.play().catch((e) => {
          console.warn('Audio playback prevented or failed:', e)
        })
      }

      setHasBeenHovered((prev) => {
        const updated = [...prev]
        updated[index] = true
        return updated
      })

      startTypewriter(testimonials[index].text)
    },
    [testimonials, stopAudio, startTypewriter]
  )

  const handleMouseLeave = useCallback(() => {
    stopAudio()
    setHoveredIndex(null)
    stopTypewriter()
  }, [stopAudio, stopTypewriter])

  useEffect(() => {
    return () => {
      stopAudio()
      stopTypewriter()
    }
  }, [stopAudio, stopTypewriter])

  return (
    <div className="flex justify-center items-center gap-4 flex-wrap">
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={index}
          className="relative flex flex-col items-center"
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-16 h-16 rounded-full border-4 hover:animate-pulse border-gray-300 object-cover"
            animate={{
              borderColor:
                hoveredIndex === index || hasBeenHovered[index]
                  ? '#ACA0FB'
                  : '#E5E7EB',
            }}
            transition={{ duration: 0.3 }}
          />
          <AnimatePresence>
            {hoveredIndex === index && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: -20 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.35 }}
                className="absolute bottom-20 bg-white text-black text-sm px-4 py-3 rounded-lg shadow-2xl max-w-xs w-64"
              >
                <div className="min-h-[5rem] max-h-32 overflow-hidden whitespace-pre-wrap">
                  {typedText}
                  <span className="animate-pulse ml-0.5">|</span>
                </div>
                <p className="mt-2 text-right font-semibold">
                  {testimonial.name}
                </p>
                <p className="text-right text-gray-500 text-xs">
                  {testimonial.jobtitle}
                </p>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 flex flex-col items-center gap-1">
                  <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                  <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
                  <div className="w-1 h-1 bg-white rounded-full shadow-lg" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

export default TypewriterTestimonial

