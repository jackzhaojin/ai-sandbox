import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionForm from '@/app/transactions/TransactionForm'
import { createTransaction } from '@/app/actions/transactions'

// Mock the server action
jest.mock('@/app/actions/transactions', () => ({
  createTransaction: jest.fn(),
}))

describe('TransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<TransactionForm />)

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument()
  })

  it('has correct default values', () => {
    render(<TransactionForm />)

    const typeSelect = screen.getByLabelText(/type/i) as HTMLSelectElement
    const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement

    expect(typeSelect.value).toBe('income')
    expect(categorySelect.value).toBe('salary')
  })

  it('allows user to fill out the form', async () => {
    const user = userEvent.setup()
    render(<TransactionForm />)

    const amountInput = screen.getByLabelText(/amount/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const typeSelect = screen.getByLabelText(/type/i)
    const categorySelect = screen.getByLabelText(/category/i)

    await user.type(amountInput, '100.50')
    await user.type(descriptionInput, 'Test transaction')
    await user.selectOptions(typeSelect, 'expense')
    await user.selectOptions(categorySelect, 'food')

    expect(amountInput).toHaveValue(100.5)
    expect(descriptionInput).toHaveValue('Test transaction')
    expect(typeSelect).toHaveValue('expense')
    expect(categorySelect).toHaveValue('food')
  })

  it('resets form on successful submission', async () => {
    ;(createTransaction as jest.Mock).mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<TransactionForm />)

    const amountInput = screen.getByLabelText(/amount/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const submitButton = screen.getByRole('button', { name: /add transaction/i })

    await user.type(amountInput, '100')
    await user.type(descriptionInput, 'Test')
    await user.click(submitButton)

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalled()
    })

    // Form should be reset
    await waitFor(() => {
      expect(amountInput).toHaveValue(null)
      expect(descriptionInput).toHaveValue('')
    })
  })

  it('handles submission errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(createTransaction as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Validation failed'
    })

    const user = userEvent.setup()
    render(<TransactionForm />)

    const amountInput = screen.getByLabelText(/amount/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const submitButton = screen.getByRole('button', { name: /add transaction/i })

    await user.type(amountInput, '100')
    await user.type(descriptionInput, 'Test')
    await user.click(submitButton)

    await waitFor(() => {
      expect(createTransaction).toHaveBeenCalled()
    })

    // Should log error but not crash
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to create transaction:',
      expect.objectContaining({ success: false })
    )

    consoleSpy.mockRestore()
  })

  it('has all required attributes on inputs', () => {
    render(<TransactionForm />)

    expect(screen.getByLabelText(/amount/i)).toBeRequired()
    expect(screen.getByLabelText(/description/i)).toBeRequired()
    expect(screen.getByLabelText(/type/i)).toBeRequired()
    expect(screen.getByLabelText(/category/i)).toBeRequired()
    // Date is not required
    expect(screen.getByLabelText(/date/i)).not.toBeRequired()
  })

  it('has correct input types and constraints', () => {
    render(<TransactionForm />)

    const amountInput = screen.getByLabelText(/amount/i)
    const dateInput = screen.getByLabelText(/date/i)

    expect(amountInput).toHaveAttribute('type', 'number')
    expect(amountInput).toHaveAttribute('min', '0.01')
    expect(amountInput).toHaveAttribute('step', '0.01')
    expect(dateInput).toHaveAttribute('type', 'date')
  })
})
