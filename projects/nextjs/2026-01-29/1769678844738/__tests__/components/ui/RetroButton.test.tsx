/**
 * RetroButton Component Tests
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RetroButton } from '@/components/ui/RetroButton'

describe('RetroButton', () => {
  it('should render button with children', () => {
    render(<RetroButton>Click Me</RetroButton>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<RetroButton onClick={handleClick}>Click Me</RetroButton>)

    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn()
    render(
      <RetroButton onClick={handleClick} disabled>
        Click Me
      </RetroButton>
    )

    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  it('should render with primary variant by default', () => {
    render(<RetroButton>Primary</RetroButton>)

    const button = screen.getByRole('button', { name: /primary/i })
    expect(button).toHaveClass('border-green-500')
    expect(button).toHaveClass('text-green-500')
  })

  it('should render with secondary variant', () => {
    render(<RetroButton variant="secondary">Secondary</RetroButton>)

    const button = screen.getByRole('button', { name: /secondary/i })
    expect(button).toHaveClass('border-cyan-500')
    expect(button).toHaveClass('text-cyan-500')
  })

  it('should render with danger variant', () => {
    render(<RetroButton variant="danger">Delete</RetroButton>)

    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('border-red-500')
    expect(button).toHaveClass('text-red-500')
  })

  it('should render with correct type attribute', () => {
    const { rerender } = render(<RetroButton type="submit">Submit</RetroButton>)

    let button = screen.getByRole('button', { name: /submit/i })
    expect(button).toHaveAttribute('type', 'submit')

    rerender(<RetroButton type="reset">Reset</RetroButton>)
    button = screen.getByRole('button', { name: /reset/i })
    expect(button).toHaveAttribute('type', 'reset')
  })

  it('should apply custom className', () => {
    render(<RetroButton className="custom-class">Button</RetroButton>)

    const button = screen.getByRole('button', { name: /button/i })
    expect(button).toHaveClass('custom-class')
  })

  it('should apply disabled styles', () => {
    render(<RetroButton disabled>Disabled</RetroButton>)

    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toHaveClass('disabled:opacity-50')
    expect(button).toHaveClass('disabled:cursor-not-allowed')
  })

  it('should render as button type by default', () => {
    render(<RetroButton>Default</RetroButton>)

    const button = screen.getByRole('button', { name: /default/i })
    expect(button).toHaveAttribute('type', 'button')
  })
})
