'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { FAQItem } from '@/utils/faq'

interface FAQSectionProps {
  faqs: FAQItem[]
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!faqs || faqs.length === 0) {
    return null
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <section className="mt-12 pt-8 border-t border-border/50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
        <p className="text-muted-foreground text-sm">
          Common questions about this tool
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-border/50 rounded-lg overflow-hidden hover:border-border/80 transition-colors"
          >
            <button
              onClick={() => toggleExpand(index)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
              aria-expanded={expandedIndex === index}
            >
              <h3 className="font-semibold text-sm text-foreground pr-4">
                {faq.question}
              </h3>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${
                  expandedIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedIndex === index && (
              <div className="px-4 py-3 bg-muted/20 border-t border-border/30">
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SEO Helper: Hidden FAQ schema for search engines */}
      <div className="sr-only">
        <h2>Frequently Asked Questions</h2>
        {faqs.map((faq, index) => (
          <div key={index}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
