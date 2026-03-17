import React, { useState } from 'react'

const accordionItems = [
  {
    id: 1,
    title: 'Beginner plant parent',
    imageUrl:
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Vendor or nursery',
    imageUrl:
      'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Plant expert or teacher',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
  },
]

const AccordionItem = ({ item, isActive, onMouseEnter }) => {
  return (
    <div
      className={`relative h-[420px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${
        isActive ? 'w-[260px] md:w-[320px]' : 'w-[56px] md:w-[72px]'
      }`}
      onMouseEnter={onMouseEnter}
    >
      <img
        src={item.imageUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null
          e.target.src =
            'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1200&auto=format&fit=crop'
        }}
      />
      <div className="absolute inset-0 bg-black/45" />
      <span
        className={`absolute text-white text-sm md:text-base font-semibold whitespace-nowrap transition-all duration-300 ease-in-out ${
          isActive
            ? 'bottom-5 left-1/2 -translate-x-1/2 rotate-0'
            : 'bottom-20 left-1/2 -translate-x-1/2 rotate-90'
        }`}
      >
        {item.title}
      </span>
    </div>
  )
}

export function LandingAccordionItem() {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleItemHover = (index) => {
    setActiveIndex(index)
  }

  return (
    <div className="bg-transparent font-sans">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12">
          <div className="w-full md:w-2/5 text-center md:text-left">
            <p className="text-sm text-gray-500 mb-2 font-light uppercase tracking-wide">
              Three types of UrbanSprouters
            </p>
            <h3 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4 leading-tight">
              See where you fit in
            </h3>
            <p className="text-base text-gray-600">
              Hover over each panel to explore how UrbanSprout supports beginners, vendors, and plant experts in their
              own way.
            </p>
          </div>

          <div className="w-full md:w-3/5">
            <div className="flex flex-row items-center justify-center gap-3 overflow-x-auto p-3 rounded-2xl bg-white/70 backdrop-blur">
              {accordionItems.map((item, index) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isActive={index === activeIndex}
                  onMouseEnter={() => handleItemHover(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

