/**
 * RetroInput Component Tests
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RetroInput } from '@/components/ui/RetroInput'

describe('RetroInput', () => {
  it('should render input without label', () => {
    render(<RetroInput placeholder="Enter text" />)

    const input = screen.getByPlaceholderText(/enter text/i)
    expect(input).toBeInTheDocument()
  })

  it('should render input with label', () => {
    render(<RetroInput label="Username" />)

    const label = screen.getByText(/username/i)
    expect(label).toBeInTheDocument()

    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('should show required indicator', () => {
    render(<RetroInput label="Email" required />)

    const required = screen.getByText('*')
    expect(required).toBeInTheDocument()
    expect(required).toHaveClass('text-red-500')
  })

  it('should call onChange when input changes', () => {
    const handleChange = jest.fn()
    render(<RetroInput onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: 'test value' }),
      })
    )
  })

  it('should render with controlled value', () => {
    render(<RetroInput value="initial value" onChange={jest.fn()} />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('initial value')
  })

  it('should support different input types', () => {
    const { rerender, container } = render(<RetroInput type="email" />)

    let input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')

    // Password inputs don't have a textbox role
    rerender(<RetroInput type="password" />)
    input = container.querySelector('input[type="password"]') as HTMLInputElement
    expect(input).toHaveAttribute('type', 'password')

    rerender(<RetroInput type="number" />)
    input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('should apply custom className', () => {
    const { container } = render(<RetroInput className="custom-class" />)

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })

  it('should set name attribute', () => {
    render(<RetroInput name="email" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('name', 'email')
  })

  it('should set required attribute', () => {
    render(<RetroInput required />)

    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('should render with placeholder', () => {
    render(<RetroInput placeholder="Enter your name" />)

    const input = screen.getByPlaceholderText(/enter your name/i)
    expect(input).toBeInTheDocument()
  })

  it('should have default type as text', () => {
    render(<RetroInput />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('should apply retro styling classes', () => {
    render(<RetroInput />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('bg-black')
    expect(input).toHaveClass('border-green-500')
    expect(input).toHaveClass('text-green-400')
    expect(input).toHaveClass('font-mono')
  })
})
