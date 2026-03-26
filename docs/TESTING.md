# Frontend Testing Guide — Driver Dashboard

## Running Tests

```bash
# From the frontend directory
cd frontend

# Run all tests once
npx vitest run

# Run just the DriverDashboard tests
npx vitest run src/pages/DriverDashboard.test.tsx

# Watch mode (re-runs on file save)
npx vitest src/pages/DriverDashboard.test.tsx
```

## How the Test File is Structured

**File:** `src/pages/DriverDashboard.test.tsx`

### Mocks (top of file)

The dashboard depends on things that don't exist in a test environment (no browser map, no API server, no auth). We mock them:

| Mock | Why |
|------|-----|
| `LiveMap` | Uses `mapbox-gl` which needs a real browser canvas |
| `trackingAPI` | Avoids real HTTP calls to the backend/tracking service |
| `useAuth` | Provides a fake logged-in driver user |
| `global.fetch` | The component calls `fetch()` directly for shuttle locations |

You generally don't need to touch these unless you add new API calls or dependencies.

### Test Structure

Tests are grouped by feature using `describe` blocks:

```
DriverDashboard
├── renders the dashboard heading  ✓ (implemented)
├── Clock In/Out                   (todo)
├── Status Dropdown                (todo)
├── Shift Report                   (todo)
└── Map                            (todo)
```

## Writing a Test

### 1. Replace `it.todo(...)` with `it(...)`

Before:
```tsx
it.todo('toggles to Clock Out when clicked')
```

After:
```tsx
it('toggles to Clock Out when clicked', () => {
  render(<DriverDashboard />)
  const btn = screen.getByText('Clock In')
  fireEvent.click(btn)
  expect(screen.getByText('Clock Out')).toBeInTheDocument()
})
```

### 2. The Pattern

Every test follows three steps:

```tsx
it('description of what it should do', () => {
  // 1. RENDER the component
  render(<DriverDashboard />)

  // 2. ACT — interact with it (optional)
  fireEvent.click(screen.getByText('Some Button'))

  // 3. ASSERT — check the result
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### 3. Useful Queries

```tsx
screen.getByText('Clock In')           // find by visible text
screen.getByLabelText('Driver Name')   // find input by its <label>
screen.getByTestId('live-map')         // find by data-testid attribute
screen.getByRole('button', { name: 'Clock In' })  // find by ARIA role
```

### 4. Useful Assertions

```tsx
expect(element).toBeInTheDocument()    // exists in the DOM
expect(element).toBeDisabled()         // is disabled
expect(element).not.toBeDisabled()     // is enabled
expect(input.value).toBe('some value') // input has value
```

### 5. Testing Async Behavior (API calls, state updates)

Wrap in `waitFor` when the result depends on a state update or API response:

```tsx
it('shows error when starting report without mileage', async () => {
  render(<DriverDashboard />)
  fireEvent.click(screen.getByText('Start Shift Report'))
  await waitFor(() => {
    expect(screen.getByText('Starting mileage is required.')).toBeInTheDocument()
  })
})
```

### 6. Checking That an API Was Called

```tsx
it('calls startDriverShiftReport with correct data', async () => {
  const { trackingAPI } = await import('../services/apiService')
  render(<DriverDashboard />)

  fireEvent.change(screen.getByLabelText('Starting Mileage'), { target: { value: '50000' } })
  fireEvent.click(screen.getByText('Start Shift Report'))

  await waitFor(() => {
    expect(trackingAPI.startDriverShiftReport).toHaveBeenCalledWith(
      expect.objectContaining({ starting_mileage: 50000 })
    )
  })
})
```

## Adding Tests for a New Component

1. Create `src/pages/YourComponent.test.tsx` (or `src/components/`)
2. Add the same imports from the existing test
3. Mock any dependencies that make network calls or use browser-only APIs
4. Follow the same `render → act → assert` pattern