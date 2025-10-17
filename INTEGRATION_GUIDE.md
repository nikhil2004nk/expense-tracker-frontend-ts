# Transaction API Integration Guide

This document explains how the frontend integrates with the backend transaction API.

## Architecture

### API Client (`src/services/api-client.ts`)

The centralized API client provides:
- **Authenticated requests**: All requests automatically include credentials (cookies) for JWT authentication
- **Error handling**: Unified error handling with custom `ApiError` class
- **JSON requests**: `apiRequest()` function for JSON-based API calls
- **File uploads**: `apiUpload()` function for multipart/form-data uploads

### Transaction Service (`src/services/transactions.ts`)

The transaction service provides type-safe methods for all transaction operations:

#### Types
- `Transaction`: Full transaction object
- `CreateTransactionDto`: Payload for creating transactions
- `UpdateTransactionDto`: Payload for updating transactions (all fields optional)

#### Methods

**`fetchTransactions(options?: { signal?: AbortSignal }): Promise<Transaction[]>`**
- Fetches all transactions for the authenticated user
- Supports request cancellation via AbortSignal

**`fetchTransaction(id: string, options?: { signal?: AbortSignal }): Promise<Transaction>`**
- Fetches a single transaction by ID

**`createTransaction(data: CreateTransactionDto): Promise<Transaction>`**
- Creates a new transaction
- Returns the created transaction

**`updateTransaction(id: string, updates: UpdateTransactionDto): Promise<Transaction>`**
- Updates an existing transaction
- Only sends fields that are provided (partial update)
- Returns the updated transaction

**`deleteTransaction(id: string): Promise<{ id: string }>`**
- Deletes a transaction
- Returns the deleted transaction ID

**`uploadReceipt(file: File): Promise<string>`**
- Uploads a receipt file (image or PDF)
- Returns the receipt URL for use in transaction
- Max file size: 10MB
- Supported formats: JPG, PNG, GIF, WebP, PDF

## Component Integration

### TransactionList Component

The `TransactionList` component now:
- Uses `forwardRef` to expose a `refresh()` method
- Automatically loads transactions on mount
- Supports filtering and sorting
- Handles delete operations with confirmation

#### Exposed Methods
```typescript
type TransactionListRef = {
  refresh: () => Promise<void>
}
```

Usage:
```typescript
const listRef = useRef<TransactionListRef>(null)
// ... after mutation
await listRef.current?.refresh()
```

### TransactionForm Component

The form component:
- Handles both create and edit modes
- Uploads receipts before submitting the transaction
- Shows loading states during submission
- Validates input using Zod schema

### Transactions Page

The main transactions page:
- Coordinates the form and list components
- Refreshes the list after successful create/update
- Manages edit state

## Backend API Endpoints

All endpoints require JWT authentication via cookies.

### Endpoints

**GET /transactions**
- Fetches all transactions for the authenticated user
- Returns: `Transaction[]`

**GET /transactions/:id**
- Fetches a single transaction
- Returns: `Transaction`

**POST /transactions**
- Creates a new transaction
- Body: `CreateTransactionDto`
- Returns: `Transaction`

**PATCH /transactions/:id**
- Updates an existing transaction
- Body: `UpdateTransactionDto`
- Returns: `Transaction`

**DELETE /transactions/:id**
- Deletes a transaction
- Returns: `{ id: string }`

**POST /transactions/upload-receipt**
- Uploads a receipt file
- Body: multipart/form-data with `receipt` field
- Returns: `{ receiptUrl: string }`

## Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
VITE_API_URL=http://localhost:3000
```

For production, set this to your backend API URL.

## Error Handling

All API calls throw `ApiError` with the following properties:
- `message`: Error message
- `status`: HTTP status code (if available)
- `data`: Full error response data (if available)

Components use the toast system to display errors to users.

## Authentication Flow

1. User logs in via `/auth/login`
2. Backend sets an HTTP-only cookie with JWT token
3. All subsequent requests automatically include the cookie
4. If token expires or is invalid, backend returns 401
5. Frontend redirects to login page

## Best Practices

1. **Always refresh lists after mutations**: Use the `refresh()` method on list components
2. **Handle AbortSignal**: Pass `signal` for requests that can be cancelled
3. **Show loading states**: Disable buttons and show loaders during operations
4. **Display errors**: Use toast notifications for user feedback
5. **Type safety**: Use TypeScript types for all API operations

## Development

### Running Locally

1. Start the backend:
   ```bash
   cd expense-tracker-service
   npm run start:dev
   ```

2. Start the frontend:
   ```bash
   cd expense-tracker-frontend-ts
   npm run dev
   ```

3. Navigate to `http://localhost:5173` (or the port shown in terminal)

### Testing the Integration

1. Register a new user
2. Login with the credentials
3. Create a transaction with a receipt
4. Edit the transaction
5. Delete the transaction
6. Verify all operations work correctly

## Troubleshooting

### CORS Errors
- Ensure backend has correct CORS configuration
- Check that `credentials: 'include'` is set in fetch options

### 401 Unauthorized
- Verify user is logged in
- Check that cookies are being sent with requests
- Ensure backend JWT strategy is working

### File Upload Errors
- Check file size (max 10MB)
- Verify file type is supported
- Ensure uploads directory exists on backend

### List Not Refreshing
- Verify `refresh()` is called after mutations
- Check that the ref is properly connected to the list component

