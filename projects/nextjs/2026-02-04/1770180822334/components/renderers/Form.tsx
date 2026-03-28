'use client'

import React, { useState, FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'date' | 'file'

export interface FormField {
  id: string
  name: string
  label: string
  type: FormFieldType
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[] // For select, radio, checkbox
  pattern?: string // HTML5 pattern validation
  minLength?: number
  maxLength?: number
  min?: number // For number/date
  max?: number // For number/date
  accept?: string // For file input
  helpText?: string
}

export interface FormProps {
  fields: FormField[]
  submitButtonText?: string
  successMessage?: string
  variant?: 'default' | 'card' | 'inline'
  title?: string
  description?: string
  formId?: string
  formName?: string
  siteId?: string
  pageId?: string
}

interface FormErrors {
  [key: string]: string
}

export default function Form({
  fields,
  submitButtonText = 'Submit',
  successMessage = 'Thank you! Your submission has been received.',
  variant = 'default',
  title,
  description,
  formId = 'contact-form',
  formName = 'Contact Form',
  siteId,
  pageId
}: FormProps) {
  const [formData, setFormData] = useState<{ [key: string]: string | string[] }>({})
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Honeypot field for spam detection
  const [honeypot, setHoneypot] = useState('')

  const validateField = (field: FormField, value: string | string[]): string | null => {
    const stringValue = Array.isArray(value) ? value.join(',') : value

    // Required validation
    if (field.required && !stringValue) {
      return `${field.label} is required`
    }

    if (!stringValue) return null // Skip other validations if empty and not required

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(stringValue)) {
          return 'Please enter a valid email address'
        }
        break

      case 'phone':
        const phonePattern = /^[\d\s\-\(\)\+]+$/
        if (!phonePattern.test(stringValue)) {
          return 'Please enter a valid phone number'
        }
        break

      case 'number':
        const numValue = parseFloat(stringValue)
        if (isNaN(numValue)) {
          return 'Please enter a valid number'
        }
        if (field.min !== undefined && numValue < field.min) {
          return `Value must be at least ${field.min}`
        }
        if (field.max !== undefined && numValue > field.max) {
          return `Value must be at most ${field.max}`
        }
        break
    }

    // Pattern validation
    if (field.pattern && !new RegExp(field.pattern).test(stringValue)) {
      return 'Please match the requested format'
    }

    // Length validation
    if (field.minLength && stringValue.length < field.minLength) {
      return `Must be at least ${field.minLength} characters`
    }
    if (field.maxLength && stringValue.length > field.maxLength) {
      return `Must be at most ${field.maxLength} characters`
    }

    return null
  }

  const handleInputChange = (field: FormField, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field.name]: value
    }))

    // Clear error when user starts typing
    if (errors[field.name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field.name]
        return newErrors
      })
    }
  }

  const handleCheckboxChange = (field: FormField, optionValue: string, checked: boolean) => {
    const currentValues = (formData[field.name] as string[]) || []
    let newValues: string[]

    if (checked) {
      newValues = [...currentValues, optionValue]
    } else {
      newValues = currentValues.filter((v) => v !== optionValue)
    }

    handleInputChange(field, newValues)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Check honeypot
    if (honeypot) {
      console.log('Spam detected')
      return
    }

    // Validate all fields
    const newErrors: FormErrors = {}
    fields.forEach((field) => {
      const error = validateField(field, formData[field.name] || '')
      if (error) {
        newErrors[field.name] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit form
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const validations = fields.map(field => ({
        name: field.name,
        required: field.required,
        type: field.type,
        minLength: field.minLength,
        maxLength: field.maxLength,
        min: field.min,
        max: field.max,
        pattern: field.pattern
      }))

      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siteId,
          pageId,
          formId,
          formName,
          data: formData,
          validations,
          honeypot
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors)
        }
        throw new Error(result.error || 'Failed to submit form')
      }

      setIsSuccess(true)
      setFormData({})
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.name]
    const errorId = `${field.name}-error`
    const helpId = `${field.name}-help`
    const value = formData[field.name] || ''

    const commonInputClasses = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`

    const ariaProps = {
      'aria-required': field.required,
      'aria-invalid': hasError,
      'aria-describedby': [
        field.helpText ? helpId : null,
        hasError ? errorId : null
      ].filter(Boolean).join(' ') || undefined
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            minLength={field.minLength}
            maxLength={field.maxLength}
            className={`${commonInputClasses} resize-y min-h-[120px]`}
            {...ariaProps}
          />
        )

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
            className={commonInputClasses}
            {...ariaProps}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div role="radiogroup" aria-label={field.label} className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  required={field.required}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  {...ariaProps}
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const checkboxValues = (value as string[]) || []
              return (
                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`${field.name}[]`}
                    value={option.value}
                    checked={checkboxValues.includes(option.value)}
                    onChange={(e) => handleCheckboxChange(field, option.value, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    {...ariaProps}
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              )
            })}
          </div>
        )

      case 'file':
        return (
          <input
            type="file"
            id={field.name}
            name={field.name}
            onChange={(e) => handleInputChange(field, e.target.value)}
            accept={field.accept}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            {...ariaProps}
          />
        )

      default:
        return (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={value as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            pattern={field.pattern}
            minLength={field.minLength}
            maxLength={field.maxLength}
            min={field.min}
            max={field.max}
            className={commonInputClasses}
            {...ariaProps}
          />
        )
    }
  }

  if (isSuccess) {
    return (
      <div className={`${variant === 'card' ? 'bg-white p-8 rounded-lg shadow-md' : ''}`}>
        <div className="flex items-center space-x-3 text-green-600">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <h3 className="font-semibold text-lg">Success!</h3>
            <p className="text-gray-600">{successMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  const containerClasses = {
    default: '',
    card: 'bg-white p-8 rounded-lg shadow-md',
    inline: 'flex flex-col md:flex-row md:items-end md:space-x-4'
  }

  return (
    <div className={containerClasses[variant]}>
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      )}
      {description && (
        <p className="text-gray-600 mb-6">{description}</p>
      )}

      <form onSubmit={handleSubmit} className={variant === 'inline' ? 'flex-1 flex flex-col md:flex-row md:items-end md:space-x-4' : 'space-y-6'}>
        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {fields.map((field) => (
          <div key={field.id} className={variant === 'inline' ? 'flex-1' : ''}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {renderField(field)}

            {field.helpText && (
              <p id={`${field.name}-help`} className="mt-1 text-sm text-gray-500">
                {field.helpText}
              </p>
            )}

            {errors[field.name] && (
              <div
                id={`${field.name}-error`}
                className="mt-1 flex items-center space-x-1 text-sm text-red-600"
                role="alert"
              >
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.name]}</span>
              </div>
            )}
          </div>
        ))}

        {submitError && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg" role="alert">
            <AlertCircle className="w-5 h-5" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
            variant === 'inline' ? 'md:w-auto w-full' : 'w-full'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
            </span>
          ) : (
            submitButtonText
          )}
        </button>
      </form>
    </div>
  )
}
