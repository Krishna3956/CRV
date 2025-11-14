'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, Upload, X, ZoomIn, ZoomOut } from 'lucide-react'
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
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImage, setCropImage] = useState<string>('')
  const [cropImageFile, setCropImageFile] = useState<File | null>(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)

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

  const handleCropSave = () => {
    if (!canvasRef.current || !cropImageFile || !cropImage) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      const size = 200
      const sourceSize = size / cropZoom
      const sourceX = (img.width - sourceSize) / 2 + cropPosition.x
      const sourceY = (img.height - sourceSize) / 2 + cropPosition.y

      canvas.width = size
      canvas.height = size
      ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)

      // Only save the preview, not the actual file
      const croppedPreview = canvas.toDataURL('image/jpeg', 0.9)
      setFormData(prev => ({
        ...prev,
        authorImage: cropImageFile,
        authorImagePreview: croppedPreview,
        // Keep the original file unchanged for upload
      }))
      setShowCropModal(false)
    }
    // Use the data URL directly
    img.src = cropImage
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

    if (type === 'hero') {
      // For hero image, create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          heroImage: file,
          heroImagePreview: reader.result as string,
        }))
        setErrors(prev => ({
          ...prev,
          heroImage: '',
        }))
      }
      reader.readAsDataURL(file)
    } else {
      // For author image, show crop modal with original file
      // Read as data URL but with high quality
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCropImage(result)
        setCropImageFile(file)
        setCropZoom(1)
        setCropPosition({ x: 0, y: 0 })
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
      setErrors(prev => ({
        ...prev,
        authorImage: '',
      }))
    }
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
      {/* Success State - Show Thank You Message Only */}
      {submitStatus === 'success' ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-2">Thank You!</h2>
          <p className="text-lg text-green-700 mb-4">{submitMessage}</p>
          <p className="text-muted-foreground mb-6">
            We&apos;ll review your submission and add it to our featured blogs soon!
          </p>
          <button
            onClick={() => {
              setSubmitStatus('idle')
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
            }}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Submit Another Blog
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
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
          </label>
          {formData.authorImagePreview ? (
            <div className="space-y-3">
              <label className="relative w-32 h-32 rounded-full overflow-hidden bg-muted border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-colors group block">
                <Image
                  src={formData.authorImagePreview}
                  alt="Author preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                  <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Click to change</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'author')}
                  className="hidden"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => removeImage('author')}
                  className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
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
      )}

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Adjust Author Photo</h3>
            
            {/* Crop Preview - Draggable */}
            <div 
              ref={cropContainerRef} 
              className="relative w-48 h-48 mx-auto rounded-full overflow-hidden bg-gray-100 border-2 border-primary/20 cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                const startX = e.clientX
                const startY = e.clientY
                const startPosX = cropPosition.x
                const startPosY = cropPosition.y

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = (moveEvent.clientX - startX) / 2
                  const deltaY = (moveEvent.clientY - startY) / 2
                  setCropPosition({
                    x: Math.max(-100, Math.min(100, startPosX + deltaX)),
                    y: Math.max(-100, Math.min(100, startPosY + deltaY)),
                  })
                }

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }

                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
            >
              <img
                key={cropImage}
                src={cropImage}
                alt="Crop preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${cropZoom}) translate(${cropPosition.x}px, ${cropPosition.y}px)`,
                  transition: 'transform 0.2s',
                  userSelect: 'none',
                }}
                draggable={false}
                onError={(e) => {
                  console.error('Image failed to load:', cropImage)
                  console.error('Error:', e)
                }}
              />
            </div>

            {/* Zoom Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Zoom</label>
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Position Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Horizontal</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={cropPosition.x}
                    onChange={(e) => setCropPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Vertical</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={cropPosition.y}
                    onChange={(e) => setCropPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
