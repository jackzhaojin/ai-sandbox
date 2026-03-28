# API Documentation

This document describes the core API endpoints and server actions for the chat application.

## Table of Contents

- [API Routes](#api-routes)
  - [Chat API](#chat-api)
  - [Conversations API](#conversations-api)
- [Server Actions](#server-actions)
  - [Conversation Actions](#conversation-actions)
  - [Message Actions](#message-actions)
- [Error Handling](#error-handling)
- [Validation](#validation)

---

## API Routes

### Chat API

#### POST `/api/chat`

Stream chat responses from Claude AI.

**Authentication**: Required

**Request Body**:
```json
{
  "message": "string (1-10000 characters, required)",
  "conversationId": "string (UUID, optional)"
}
```

**Response**:
- **Success**: Server-Sent Events stream with text chunks
- **Headers**:
  - `X-Conversation-Id`: UUID of the conversation
  - `X-Message-Id`: UUID of the user message

**Status Codes**:
- `200 OK`: Stream initiated successfully
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Conversation not found (if conversationId provided)
- `400 Bad Request`: Validation error
- `500 Internal Server Error`: API key missing or server error

**Example**:
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello, Claude!',
    conversationId: 'optional-conversation-id'
  })
});

// Handle streaming response
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

**Behavior**:
- If `conversationId` is not provided, creates a new conversation
- Saves user message to database immediately
- Streams assistant response in real-time
- Saves complete assistant response after streaming completes

---

### Conversations API

#### GET `/api/conversations`

List all conversations for the authenticated user.

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string | null",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp",
      "messageCount": 0,
      "latestMessage": {
        "id": "uuid",
        "content": "string",
        "role": "user | assistant",
        "createdAt": "ISO 8601 timestamp"
      } | null
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: User not authenticated
- `500 Internal Server Error`: Server error

---

#### POST `/api/conversations`

Create a new conversation.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "string (1-200 characters, optional)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp",
    "messageCount": 0,
    "latestMessage": null
  }
}
```

**Status Codes**:
- `201 Created`: Success
- `401 Unauthorized`: User not authenticated
- `400 Bad Request`: Validation error
- `500 Internal Server Error`: Server error

---

#### GET `/api/conversations/[id]`

Get a specific conversation with all messages.

**Authentication**: Required

**URL Parameters**:
- `id`: UUID of the conversation

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string | null",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp",
    "messages": [
      {
        "id": "uuid",
        "content": "string",
        "role": "user | assistant | system",
        "createdAt": "ISO 8601 timestamp",
        "metadata": "string | null"
      }
    ]
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Conversation not found
- `500 Internal Server Error`: Server error

---

#### PATCH `/api/conversations/[id]`

Update conversation title.

**Authentication**: Required

**URL Parameters**:
- `id`: UUID of the conversation

**Request Body**:
```json
{
  "title": "string (1-200 characters, required)"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Conversation not found
- `400 Bad Request`: Validation error
- `500 Internal Server Error`: Server error

---

#### DELETE `/api/conversations/[id]`

Delete a conversation and all its messages (cascade delete).

**Authentication**: Required

**URL Parameters**:
- `id`: UUID of the conversation

**Response**:
```json
{
  "success": true,
  "data": { "id": "uuid" },
  "message": "Conversation deleted successfully"
}
```

**Status Codes**:
- `200 OK`: Success
- `401 Unauthorized`: User not authenticated
- `404 Not Found`: Conversation not found
- `500 Internal Server Error`: Server error

---

## Server Actions

Server Actions are server-side functions that can be called directly from React components without explicit API routes.

### Conversation Actions

Located in: `app/actions/conversations.ts`

#### `createConversation(data)`

Create a new conversation.

**Parameters**:
```typescript
{
  title?: string // Optional, 1-200 characters
}
```

**Returns**:
```typescript
{
  success: true,
  data: Conversation
} | {
  success: false,
  error: string,
  details?: unknown
}
```

**Example**:
```typescript
import { createConversation } from '@/app/actions/conversations';

const result = await createConversation({ title: 'My Chat' });
if (result.success) {
  console.log('Created conversation:', result.data);
}
```

---

#### `updateConversationTitle(data)`

Update conversation title.

**Parameters**:
```typescript
{
  id: string, // UUID
  title: string // 1-200 characters
}
```

---

#### `deleteConversation(conversationId)`

Delete a conversation.

**Parameters**:
- `conversationId`: string (UUID)

---

#### `leaveConversation(conversationId)`

Leave a conversation (soft delete via `leftAt` timestamp).

**Parameters**:
- `conversationId`: string (UUID)

---

#### `getUserConversations(options?)`

Get user's conversations with pagination.

**Parameters**:
```typescript
{
  limit?: number, // Default: 20, Max: 100
  offset?: number // Default: 0
}
```

---

### Message Actions

Located in: `app/actions/messages.ts`

#### `getConversationMessages(conversationId, options?)`

Get messages for a specific conversation.

**Parameters**:
- `conversationId`: string (UUID)
- `options`: (optional)
  ```typescript
  {
    limit?: number, // Default: 50
    offset?: number // Default: 0
  }
  ```

**Returns**:
```typescript
{
  success: true,
  data: Message[]
} | {
  success: false,
  error: string
}
```

---

#### `markMessagesAsRead(data)`

Mark messages as read.

**Parameters**:
```typescript
{
  conversationId: string, // UUID
  messageIds?: string[] // Optional, marks all if not provided
}
```

**Returns**:
```typescript
{
  success: true,
  count: number,
  message: string
}
```

---

#### `getUnreadCount(conversationId)`

Get unread message count for a conversation.

**Parameters**:
- `conversationId`: string (UUID)

**Returns**:
```typescript
{
  success: true,
  count: number
}
```

---

#### `deleteMessage(messageId)`

Soft delete a message.

**Parameters**:
- `messageId`: string (UUID)

**Note**: This performs a soft delete by updating the content to "[Message deleted]" and adding metadata.

---

#### `getUnreadConversations()`

Get all conversations with unread messages.

**Returns**:
```typescript
{
  success: true,
  data: Array<{
    id: string,
    title: string | null,
    unreadCount: number
  }>
}
```

---

## Error Handling

All API responses follow a standardized format for errors:

```typescript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  details?: unknown // Optional validation details
}
```

### Error Codes

- `UNAUTHORIZED`: User not authenticated (401)
- `FORBIDDEN`: User lacks permission (403)
- `NOT_FOUND`: Resource not found (404)
- `VALIDATION_ERROR`: Input validation failed (400)
- `INTERNAL_ERROR`: Server error (500)
- `API_KEY_MISSING`: Anthropic API key not configured (500)
- `RATE_LIMIT`: Rate limit exceeded (429)
- `BAD_REQUEST`: Malformed request (400)

### Error Utilities

Located in: `lib/errors.ts`

```typescript
import {
  handleApiError,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  // ... other helpers
} from '@/lib/errors';
```

---

## Validation

All input validation is centralized in `lib/validations.ts` using Zod schemas.

### Available Schemas

```typescript
import {
  chatRequestSchema,
  createConversationSchema,
  updateConversationSchema,
  markMessagesReadSchema,
  paginationSchema,
  // ... other schemas
} from '@/lib/validations';
```

### Example Usage

```typescript
import { chatRequestSchema } from '@/lib/validations';

const body = await req.json();
const validated = chatRequestSchema.parse(body); // Throws ZodError if invalid
```

### Validation Rules

#### Conversations
- **Title**: 1-200 characters (optional)
- **ID**: UUID format

#### Messages
- **Content**: 1-10,000 characters
- **Role**: "user" | "assistant" | "system"

#### Pagination
- **Limit**: 1-100 (default: 20)
- **Offset**: ≥0 (default: 0)

---

## Security

### Authentication

All API routes and server actions check for authentication using NextAuth.js:

```typescript
const session = await auth();
if (!session?.user?.id) {
  return unauthorizedResponse();
}
```

### Authorization

Endpoints verify user has access to requested resources:
- Conversations: User must be a participant
- Messages: User must be in the conversation

### Data Validation

All inputs are validated using Zod schemas before processing.

### SQL Injection Prevention

Prisma ORM is used for all database queries, providing automatic SQL injection prevention.

---

## Rate Limiting

⚠️ **TODO**: Rate limiting is not yet implemented. Consider adding:
- Rate limiting middleware for API routes
- Per-user limits on conversation/message creation
- Anthropic API usage tracking

---

## Testing

### Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test endpoints using curl or Postman:
   ```bash
   # Create conversation
   curl -X POST http://localhost:3000/api/conversations \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Chat"}' \
     --cookie "next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

### Integration Testing

⚠️ **TODO**: Add integration tests for API routes:
- Use `@testing-library/react` for component tests
- Use `supertest` for API endpoint tests
- Mock Prisma and Anthropic SDK calls

---

## Environment Variables

Required environment variables for API functionality:

```env
# Database
DATABASE_URL="postgresql://..."

# Anthropic API
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Authentication
AUTH_SECRET="your-secret-key"
AUTH_TRUST_HOST="true"
```

---

## Next Steps

Based on the research plan (RESEARCH.md), the following steps remain:

- **Step 6**: Create UI components and pages
- **Step 7**: Integration and feature completion
- **Step 8**: Testing and quality assurance

This API documentation will be referenced during UI development to ensure proper integration.
