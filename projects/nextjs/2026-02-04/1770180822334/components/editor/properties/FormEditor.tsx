'use client'

import React, { useState } from 'react'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import PropertyLabel from './PropertyLabel'
import type { FormProps, FormField, FormFieldType } from '@/components/renderers/Form'

interface FormEditorProps {
  props: FormProps
  onChange: (props: Partial<FormProps>) => void
}

export default function FormEditor({ props, onChange }: FormEditorProps) {
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false)
  const [selectedFieldType, setSelectedFieldType] = useState<FormFieldType>('text')

  const fields = props.fields || []

  const handleAddField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: 'New Field',
      type: selectedFieldType,
      required: false
    }
    onChange({ fields: [...fields, newField] })
    setIsAddFieldModalOpen(false)
  }

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    )
    onChange({ fields: updatedFields })
  }

  const handleDeleteField = (fieldId: string) => {
    onChange({ fields: fields.filter(field => field.id !== fieldId) })
  }

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newFields.length) return

    ;[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
    onChange({ fields: newFields })
  }

  const handleAddOption = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field) return

    const newOption = { value: `option_${(field.options?.length || 0) + 1}`, label: 'New Option' }
    handleUpdateField(fieldId, {
      options: [...(field.options || []), newOption]
    })
  }

  const handleUpdateOption = (fieldId: string, optionIndex: number, updates: { value?: string; label?: string }) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field || !field.options) return

    const newOptions = [...field.options]
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates }
    handleUpdateField(fieldId, { options: newOptions })
  }

  const handleDeleteOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field || !field.options) return

    handleUpdateField(fieldId, {
      options: field.options.filter((_, i) => i !== optionIndex)
    })
  }

  const needsOptions = (type: FormFieldType) =>
    ['select', 'radio', 'checkbox'].includes(type)

  return (
    <div className="space-y-4">
      {/* Fields List */}
      <div>
        <PropertyLabel>Form Fields</PropertyLabel>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg bg-white"
            >
              {/* Drag Handle */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => handleMoveField(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Field Content */}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={field.label}
                    onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                    placeholder="Field label"
                    className="flex-1"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => handleUpdateField(field.id, { type: e.target.value as FormFieldType })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                    <option value="radio">Radio</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="file">File</option>
                  </select>
                </div>

                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                  placeholder="Placeholder text"
                  className="text-sm"
                />

                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    Required
                  </label>
                </div>

                {/* Options for select/radio/checkbox */}
                {needsOptions(field.type) && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">Options</span>
                      <button
                        onClick={() => handleAddOption(field.id)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + Add Option
                      </button>
                    </div>
                    <div className="space-y-1">
                      {field.options?.map((option, optIdx) => (
                        <div key={optIdx} className="flex gap-1">
                          <Input
                            value={option.label}
                            onChange={(e) => handleUpdateOption(field.id, optIdx, { label: e.target.value })}
                            placeholder="Label"
                            className="text-xs"
                          />
                          <Input
                            value={option.value}
                            onChange={(e) => handleUpdateOption(field.id, optIdx, { value: e.target.value })}
                            placeholder="Value"
                            className="text-xs"
                          />
                          <button
                            onClick={() => handleDeleteOption(field.id, optIdx)}
                            className="text-red-500 hover:text-red-700 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rotate-180"
                  title="Move down"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteField(field.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setIsAddFieldModalOpen(true)}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>
      </div>

      {/* Form Settings */}
      <div className="border-t pt-4 space-y-3">
        <div>
          <PropertyLabel htmlFor="title">Form Title</PropertyLabel>
          <Input
            id="title"
            value={props.title || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Contact Us"
          />
        </div>

        <div>
          <PropertyLabel htmlFor="description">Form Description</PropertyLabel>
          <Input
            id="description"
            value={props.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Fill out the form below"
          />
        </div>

        <div>
          <PropertyLabel htmlFor="submitButtonText">Submit Button Text</PropertyLabel>
          <Input
            id="submitButtonText"
            value={props.submitButtonText || 'Submit'}
            onChange={(e) => onChange({ submitButtonText: e.target.value })}
            placeholder="Submit"
          />
        </div>

        <div>
          <PropertyLabel htmlFor="successMessage">Success Message</PropertyLabel>
          <Input
            id="successMessage"
            value={props.successMessage || ''}
            onChange={(e) => onChange({ successMessage: e.target.value })}
            placeholder="Thank you! Your submission has been received."
          />
        </div>

        <div>
          <PropertyLabel htmlFor="variant">Variant</PropertyLabel>
          <select
            id="variant"
            value={props.variant || 'default'}
            onChange={(e) => onChange({ variant: e.target.value as FormProps['variant'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">Default</option>
            <option value="card">Card</option>
            <option value="inline">Inline</option>
          </select>
        </div>
      </div>

      {/* Add Field Modal */}
      <Modal
        isOpen={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        title="Add Form Field"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <PropertyLabel htmlFor="fieldType">Select Field Type</PropertyLabel>
            <select
              id="fieldType"
              value={selectedFieldType}
              onChange={(e) => setSelectedFieldType(e.target.value as FormFieldType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text Input</option>
              <option value="email">Email Input</option>
              <option value="phone">Phone Input</option>
              <option value="textarea">Text Area</option>
              <option value="select">Dropdown Select</option>
              <option value="radio">Radio Buttons</option>
              <option value="checkbox">Checkboxes</option>
              <option value="number">Number Input</option>
              <option value="date">Date Picker</option>
              <option value="file">File Upload</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddFieldModalOpen(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddField}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Field
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
