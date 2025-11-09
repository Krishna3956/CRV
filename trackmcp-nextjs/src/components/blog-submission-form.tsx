'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'

interface FormData {
  title: string
  description: string
  heroImage: File | null
  heroImagePreview: string
  authorName: string
  authorImage: File | null
  authorImagePreview: string
  blogUrl: string
}

interface FormErrors {
  [key: string]: string
}

export function BlogSubmissionForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    heroImage: null,
    heroImagePreview: '',
    authorName: '',
    authorImage: null,
    authorImagePreview: '',
    blogUrl: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingAuthor, setUploadingAuthor] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length > 300) {
      newErrors.description = 'Description must be 300 characters or less'
    }

    if (!formData.heroImage) {
      newErrors.heroImage = 'Hero image is required'
    }

    if (!formData.authorName.trim()) {
      newErrors.authorName = 'Author name is required'
    } else if (formData.authorName.length > 50) {
      newErrors.authorName = 'Author name must be 50 characters or less'
    }

    if (!formData.authorImage) {
      newErrors.authorImage = 'Author image is required'
    }

    if (!formData.blogUrl.trim()) {
      newErrors.blogUrl = 'Blog URL is required'
    } else {
      try {
        new URL(formData.blogUrl)
      } catch {
        newErrors.blogUrl = 'Invalid URL format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (file: File, type: 'hero' | 'author'): Promise<string> => {
    if (type === 'hero') {
      setUploadingHero(true)
    } else {
      setUploadingAuthor(true)
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('type', type)

      const response = await fetch('/api/blogs/upload', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to upload ${type} image`)
      }

      const data = await response.json()
      if (!data.url) {
        throw new Error(`No URL returned from ${type} image upload`)
      }
      return data.url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to upload ${type} image`
      console.error('Upload error:', error)
      throw new Error(errorMessage)
    } finally {
      if (type === 'hero') {
        setUploadingHero(false)
      } else {
        setUploadingAuthor(false)
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'author') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        [type === 'hero' ? 'heroImage' : 'authorImage']: 'Please select a valid image file',
      }))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [type === 'hero' ? 'heroImage' : 'authorImage']: 'Image must be less than 5MB',
      }))
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'hero') {
        setFormData(prev => ({
          ...prev,
          heroImage: file,
          heroImagePreview: reader.result as string,
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          authorImage: file,
          authorImagePreview: reader.result as string,
        }))
      }
      // Clear error
      setErrors(prev => ({
        ...prev,
        [type === 'hero' ? 'heroImage' : 'authorImage']: '',
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (type: 'hero' | 'author') => {
    if (type === 'hero') {
      setFormData(prev => ({
        ...prev,
        heroImage: null,
        heroImagePreview: '',
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        authorImage: null,
        authorImagePreview: '',
      }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Upload images
      let heroImageUrl = ''
      let authorImageUrl = ''

      if (formData.heroImage) {
        heroImageUrl = await handleImageUpload(formData.heroImage, 'hero')
      }

      if (formData.authorImage) {
        authorImageUrl = await handleImageUpload(formData.authorImage, 'author')
      }

      // Submit form with image URLs
      const response = await fetch('/api/blogs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          heroImage: heroImageUrl,
          authorName: formData.authorName,
          authorImage: authorImageUrl,
          blogUrl: formData.blogUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSubmitStatus('error')
        setSubmitMessage(data.error || 'Failed to submit blog')
      } else {
        setSubmitStatus('success')
        setSubmitMessage(data.message || 'Blog submitted successfully!')
        setFormData({
          title: '',
          description: '',
          heroImage: null,
          heroImagePreview: '',
          authorName: '',
          authorImage: null,
          authorImagePreview: '',
          blogUrl: '',
        })
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000)
      }
    } catch (error) {
      setSubmitStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.'
      setSubmitMessage(errorMessage)
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">{submitMessage}</p>
              <p className="text-sm text-green-700 mt-1">
                We&apos;ll review your submission and add it to our featured blogs soon!
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{submitMessage}</p>
            </div>
          </div>
        )}

        {/* Blog Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Blog Title
            <span className="text-red-500 ml-1">*</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({formData.title.length}/100)
            </span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Getting Started with Model Context Protocol"
            maxLength={100}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.title ? 'border-red-500' : 'border-border'
            } bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Blog Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description
            <span className="text-red-500 ml-1">*</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({formData.description.length}/300)
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Write a brief description of your blog post..."
            maxLength={300}
            rows={4}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.description ? 'border-red-500' : 'border-border'
            } bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none`}
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
        </div>

        {/* Hero Image Upload */}
        <div>
          <label htmlFor="heroImageUpload" className="block text-sm font-medium text-foreground mb-2">
            Hero Image
            <span className="text-red-500 ml-1">*</span>
            <span className="text-xs text-muted-foreground ml-2">(Max 5MB)</span>
          </label>
          {formData.heroImagePreview ? (
            <div className="relative">
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={formData.heroImagePreview}
                  alt="Hero preview"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage('hero')}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {uploadingHero && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
              </div>
              <input
                type="file"
                id="heroImageUpload"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'hero')}
                className="hidden"
              />
            </label>
          )}
          {errors.heroImage && <p className="text-sm text-red-500 mt-1">{errors.heroImage}</p>}
        </div>

        {/* Author Name */}
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-foreground mb-2">
            Author Name
            <span className="text-red-500 ml-1">*</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({formData.authorName.length}/50)
            </span>
          </label>
          <input
            type="text"
            id="authorName"
            name="authorName"
            value={formData.authorName}
            onChange={handleChange}
            placeholder="e.g., John Doe"
            maxLength={50}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.authorName ? 'border-red-500' : 'border-border'
            } bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
          />
          {errors.authorName && <p className="text-sm text-red-500 mt-1">{errors.authorName}</p>}
        </div>

        {/* Author Image Upload */}
        <div>
          <label htmlFor="authorImageUpload" className="block text-sm font-medium text-foreground mb-2">
            Author Image
            <span className="text-red-500 ml-1">*</span>
            <span className="text-xs text-muted-foreground ml-2">(Max 5MB)</span>
          </label>
          {formData.authorImagePreview ? (
            <div className="relative w-24">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted">
                <Image
                  src={formData.authorImagePreview}
                  alt="Author preview"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage('author')}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {uploadingAuthor && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-full cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="file"
                id="authorImageUpload"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'author')}
                className="hidden"
              />
            </label>
          )}
          {errors.authorImage && <p className="text-sm text-red-500 mt-1">{errors.authorImage}</p>}
        </div>

        {/* Blog URL */}
        <div>
          <label htmlFor="blogUrl" className="block text-sm font-medium text-foreground mb-2">
            Blog Post URL
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="url"
            id="blogUrl"
            name="blogUrl"
            value={formData.blogUrl}
            onChange={handleChange}
            placeholder="https://example.com/blog/post"
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.blogUrl ? 'border-red-500' : 'border-border'
            } bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
          />
          {errors.blogUrl && <p className="text-sm text-red-500 mt-1">{errors.blogUrl}</p>}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Submit Blog
            </>
          )}
        </Button>

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> All submissions are reviewed by our team before being featured. We typically review submissions within 24-48 hours. Make sure all URLs are valid and images are accessible.
          </p>
        </div>
      </form>
    </div>
  )
}
