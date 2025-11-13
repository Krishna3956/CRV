/**
 * FAQ Extraction Utilities
 * Extracts FAQ sections from markdown content
 */

export interface FAQItem {
  question: string
  answer: string
}

/**
 * Extract FAQ section from markdown content
 * Looks for "## FAQ" or "## Frequently Asked Questions" sections
 */
export function extractFAQsFromMarkdown(content: string): FAQItem[] {
  if (!content) return []

  const lines = content.split('\n')
  let faqStartIndex = -1
  let faqEndIndex = -1

  // Find FAQ section start (## FAQ or ## Frequently Asked Questions)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase()
    if (
      line.startsWith('## faq') ||
      line.startsWith('## frequently asked questions') ||
      line.startsWith('## q&a') ||
      line.startsWith('## questions and answers')
    ) {
      faqStartIndex = i + 1
      break
    }
  }

  // If no FAQ section found, return empty
  if (faqStartIndex === -1) return []

  // Find FAQ section end (next ## heading or end of content)
  for (let i = faqStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('##') && !line.toLowerCase().includes('faq')) {
      faqEndIndex = i
      break
    }
  }

  // If no end found, use rest of content
  if (faqEndIndex === -1) {
    faqEndIndex = lines.length
  }

  // Extract FAQ lines
  const faqLines = lines.slice(faqStartIndex, faqEndIndex)

  // Parse Q&A pairs
  const faqs: FAQItem[] = []
  let currentQuestion = ''
  let currentAnswer: string[] = []

  for (const line of faqLines) {
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) {
      if (currentAnswer.length > 0) {
        currentAnswer.push('')
      }
      continue
    }

    // Question patterns: "Q:", "Q.", "**Q:**", "### Q:", "- Q:", etc.
    if (
      trimmed.match(/^(Q[:\.]|###|[-*]\s*Q[:\.]|\*\*Q\*\*)/i) ||
      trimmed.match(/^\d+\.\s*\*\*?[Qq]uestion\*\*?:/i)
    ) {
      // Save previous Q&A if exists
      if (currentQuestion && currentAnswer.length > 0) {
        faqs.push({
          question: cleanQuestion(currentQuestion),
          answer: cleanAnswer(currentAnswer.join('\n')),
        })
      }

      // Extract question text
      currentQuestion = trimmed
        .replace(/^(Q[:\.]|###|[-*]\s*Q[:\.]|\*\*Q\*\*)/i, '')
        .replace(/^\d+\.\s*\*\*?[Qq]uestion\*\*?:/i, '')
        .trim()

      currentAnswer = []
    }
    // Answer patterns: "A:", "A.", "**A:**", "- A:", etc.
    else if (
      trimmed.match(/^(A[:\.]|[-*]\s*A[:\.]|\*\*A\*\*)/i) ||
      trimmed.match(/^\d+\.\s*\*\*?[Aa]nswer\*\*?:/i)
    ) {
      const answerText = trimmed
        .replace(/^(A[:\.]|[-*]\s*A[:\.]|\*\*A\*\*)/i, '')
        .replace(/^\d+\.\s*\*\*?[Aa]nswer\*\*?:/i, '')
        .trim()

      if (currentQuestion) {
        currentAnswer.push(answerText)
      }
    }
    // Continuation of answer
    else if (currentQuestion && trimmed) {
      currentAnswer.push(trimmed)
    }
  }

  // Save last Q&A
  if (currentQuestion && currentAnswer.length > 0) {
    faqs.push({
      question: cleanQuestion(currentQuestion),
      answer: cleanAnswer(currentAnswer.join('\n')),
    })
  }

  // Return only valid FAQs (max 10 to avoid clutter)
  return faqs.slice(0, 10)
}

/**
 * Clean question text
 * Remove markdown formatting, extra spaces, etc.
 */
function cleanQuestion(question: string): string {
  return question
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

/**
 * Clean answer text
 * Remove markdown formatting but keep structure
 */
function cleanAnswer(answer: string): string {
  return answer
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/\n\n+/g, '\n') // Remove multiple newlines
    .trim()
}

/**
 * Check if content has FAQ section
 */
export function hasFAQ(content: string): boolean {
  if (!content) return false
  const lower = content.toLowerCase()
  return (
    lower.includes('## faq') ||
    lower.includes('## frequently asked questions') ||
    lower.includes('## q&a') ||
    lower.includes('## questions and answers')
  )
}

/**
 * Generate schema markup for FAQs
 */
export function generateFAQSchema(faqs: FAQItem[], pageUrl: string) {
  if (faqs.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
