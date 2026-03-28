'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface Card {
  id: string
  title: string
  description: string
  image?: string
  link?: string
  linkText?: string
  imageAlt?: string
}

export interface CardGridProps {
  cards: Card[]
  columns?: 2 | 3 | 4
  variant?: 'default' | 'horizontal' | 'minimal' | 'overlay'
  aspectRatio?: '1/1' | '4/3' | '16/9' | '3/2'
  showHoverEffect?: boolean
}

export default function CardGrid({
  cards,
  columns = 3,
  variant = 'default',
  aspectRatio = '4/3',
  showHoverEffect = true
}: CardGridProps) {
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    // Intersection Observer for fade-in animation on scroll
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardId = entry.target.getAttribute('data-card-id')
            if (cardId) {
              setVisibleCards((prev) => new Set(prev).add(cardId))
              observerRef.current?.unobserve(entry.target)
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    // Observe all cards
    cardRefs.current.forEach((element) => {
      if (element) {
        observerRef.current?.observe(element)
      }
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [cards])

  const setCardRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(id, element)
    } else {
      cardRefs.current.delete(id)
    }
  }

  const getGridClasses = () => {
    const baseClasses = 'grid gap-6'

    // Responsive grid columns
    const columnClasses = {
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    }

    return `${baseClasses} ${columnClasses[columns]}`
  }

  const getAspectRatioClass = () => {
    const ratioMap = {
      '1/1': 'aspect-square',
      '4/3': 'aspect-[4/3]',
      '16/9': 'aspect-video',
      '3/2': 'aspect-[3/2]'
    }
    return ratioMap[aspectRatio]
  }

  const renderCard = (card: Card) => {
    const isVisible = visibleCards.has(card.id)

    const cardClasses = {
      default: `bg-white rounded-lg overflow-hidden shadow-md ${showHoverEffect ? 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1' : ''}`,
      horizontal: `bg-white rounded-lg overflow-hidden shadow-md flex flex-col sm:flex-row ${showHoverEffect ? 'transition-all duration-300 hover:shadow-xl' : ''}`,
      minimal: `${showHoverEffect ? 'transition-all duration-300 hover:opacity-80' : ''}`,
      overlay: `relative rounded-lg overflow-hidden ${getAspectRatioClass()} ${showHoverEffect ? 'group' : ''}`
    }

    const cardContent = (
      <>
        {variant === 'default' && (
          <>
            {card.image && (
              <div className={`relative ${getAspectRatioClass()} w-full bg-gray-200`}>
                <Image
                  src={card.image}
                  alt={card.imageAlt || card.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-gray-600 mb-4">{card.description}</p>
              {card.link && card.linkText && (
                <span className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700">
                  {card.linkText}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              )}
            </div>
          </>
        )}

        {variant === 'horizontal' && (
          <>
            {card.image && (
              <div className={`relative sm:w-1/3 ${getAspectRatioClass()} sm:aspect-auto sm:min-h-[200px] bg-gray-200`}>
                <Image
                  src={card.image}
                  alt={card.imageAlt || card.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6 flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-gray-600 mb-4">{card.description}</p>
              {card.link && card.linkText && (
                <span className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700">
                  {card.linkText}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              )}
            </div>
          </>
        )}

        {variant === 'minimal' && (
          <>
            {card.image && (
              <div className={`relative ${getAspectRatioClass()} w-full bg-gray-200 rounded-lg mb-4`}>
                <Image
                  src={card.image}
                  alt={card.imageAlt || card.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
            <p className="text-gray-600 text-sm">{card.description}</p>
            {card.link && card.linkText && (
              <span className="inline-flex items-center text-blue-600 text-sm font-medium mt-2 hover:text-blue-700">
                {card.linkText}
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            )}
          </>
        )}

        {variant === 'overlay' && (
          <>
            {card.image && (
              <Image
                src={card.image}
                alt={card.imageAlt || card.title}
                fill
                className="object-cover"
              />
            )}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6 ${showHoverEffect ? 'transition-all duration-300 group-hover:from-black/80 group-hover:via-black/40' : ''}`}>
              <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
              <p className="text-white/90 mb-3">{card.description}</p>
              {card.link && card.linkText && (
                <span className={`inline-flex items-center text-white font-medium ${showHoverEffect ? 'transform translate-y-0 group-hover:-translate-y-1 transition-transform' : ''}`}>
                  {card.linkText}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              )}
            </div>
          </>
        )}
      </>
    )

    return (
      <div
        key={card.id}
        ref={(el) => setCardRef(card.id, el)}
        data-card-id={card.id}
        className={`opacity-0 transition-opacity duration-700 ${isVisible ? 'opacity-100' : ''}`}
        style={{
          transitionDelay: isVisible ? '0ms' : '0ms'
        }}
      >
        {card.link ? (
          <Link href={card.link} className={cardClasses[variant]}>
            {cardContent}
          </Link>
        ) : (
          <div className={cardClasses[variant]}>
            {cardContent}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={getGridClasses()}>
      {cards.map((card) => renderCard(card))}

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
