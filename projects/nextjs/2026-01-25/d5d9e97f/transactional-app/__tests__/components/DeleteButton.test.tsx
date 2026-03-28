import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteButton from '@/app/transactions/[id]/DeleteButton'
import { deleteTransaction } from '@/app/actions/transactions'
import { useRouter } from 'next/navigation'

// Mock the server action
jest.mock('@/app/actions/transactions', () => ({
  deleteTransaction: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock window.confirm
const mockConfirm = jest.fn()
global.confirm = mockConfirm

describe('DeleteButton', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('renders delete button', () => {
    render(<DeleteButton id="test-id" />)
    expect(screen.getByRole('button', { name: /delete transaction/i })).toBeInTheDocument()
  })

  it('shows confirmation dialog when clicked', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(false)

    render(<DeleteButton id="test-id" />)

    const button = screen.getByRole('button', { name: /delete transaction/i })
    await user.click(button)

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this transaction?')
  })

  it('does not delete if confirmation is cancelled', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(false)

    render(<DeleteButton id="test-id" />)

    const button = screen.getByRole('button', { name: /delete transaction/i })
    await user.click(button)

    expect(deleteTransaction).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('deletes transaction and redirects on successful confirmation', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)
    ;(deleteTransaction as jest.Mock).mockResolvedValue({ success: true })

    render(<DeleteButton id="test-id" />)

    const button = screen.getByRole('button', { name: /delete transaction/i })
    await user.click(button)

    expect(mockConfirm).toHaveBeenCalled()

    await waitFor(() => {
      expect(deleteTransaction).toHaveBeenCalledWith('test-id')
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/transactions')
    })
  })

  it('does not redirect if deletion fails', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)
    ;(deleteTransaction as jest.Mock).mockResolvedValue({ success: false, error: 'Database error' })

    render(<DeleteButton id="test-id" />)

    const button = screen.getByRole('button', { name: /delete transaction/i })
    await user.click(button)

    await waitFor(() => {
      expect(deleteTransaction).toHaveBeenCalledWith('test-id')
    })

    // Should not redirect on failure
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('has correct styling classes', () => {
    render(<DeleteButton id="test-id" />)

    const button = screen.getByRole('button', { name: /delete transaction/i })
    expect(button).toHaveClass('bg-red-600')
    expect(button).toHaveClass('text-white')
    expect(button).toHaveClass('hover:bg-red-700')
  })
})
