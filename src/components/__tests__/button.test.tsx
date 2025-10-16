import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state correctly', () => {
    render(<Button loading>Loading...</Button>)

    const button = screen.getByRole('button', { name: /loading/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)

    let button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">Outline</Button>)
    button = screen.getByRole('button', { name: /outline/i })
    expect(button).toHaveClass('border', 'border-input')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)

    let button = screen.getByRole('button', { name: /small/i })
    expect(button).toHaveClass('h-9', 'px-3')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button', { name: /large/i })
    expect(button).toHaveClass('h-11', 'px-8')
  })

  it('forwards additional props', () => {
    render(<Button data-testid="custom-button" type="submit">Submit</Button>)

    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('is accessible with keyboard navigation', () => {
    render(<Button>Focusable Button</Button>)

    const button = screen.getByRole('button', { name: /focusable button/i })

    // Focus the button
    button.focus()
    expect(button).toHaveFocus()

    // Simulate Enter key press
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    // Button should remain focused and handle the event
    expect(button).toHaveFocus()
  })

  it('maintains accessibility in disabled state', () => {
    render(<Button disabled>Disabled Button</Button>)

    const button = screen.getByRole('button', { name: /disabled button/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })
})
