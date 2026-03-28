# API Documentation

**Project:** Full-Stack Retro Analytics Dashboard
**Version:** 1.0
**Date:** January 29, 2026

---

## Overview

This document describes the core API endpoints for the retro analytics dashboard. All endpoints require authentication using Auth.js (NextAuth) session cookies.

---

## Authentication

All API endpoints require authentication. Requests must include a valid session cookie obtained through the `/auth/login` page.

### Authentication Error Response

```json
{
  "error": "Unauthorized"
}
```

**Status Code:** 401

---

## Analytics Events API

### POST /api/analytics/events

Create a new analytics event.

**Request Body:**

```json
{
  "eventType": "page_view",           // Required: page_view, click, form_submit, error, custom, api_call, performance
  "eventName": "Home Page View",      // Required: Specific event name
  "path": "/dashboard",               // Optional: URL path where event occurred
  "metadata": {                       // Optional: Additional event metadata (JSONB)
    "button": "login",
    "source": "header"
  },
  "sessionId": "abc123",              // Optional: Session identifier for grouping
  "timestamp": "2026-01-29T12:00:00Z" // Optional: Event timestamp (defaults to now)
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "event": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "eventType": "page_view",
    "eventName": "Home Page View",
    "path": "/dashboard",
    "metadata": { "button": "login" },
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1",
    "timestamp": "2026-01-29T12:00:00Z",
    "sessionId": "abc123"
  }
}
```

**Error Responses:**

- 400: Invalid eventType or missing required fields
- 401: Not authenticated
- 500: Internal server error

---

### GET /api/analytics/events

Fetch analytics events with optional filters.

**Query Parameters:**

- `eventType` (optional): Filter by event type (page_view, click, etc.)
- `startDate` (optional): Filter events >= this date (ISO 8601 format)
- `endDate` (optional): Filter events <= this date (ISO 8601 format)
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**

```
GET /api/analytics/events?eventType=page_view&startDate=2026-01-01&limit=50
```

**Response (200 OK):**

```json
{
  "success": true,
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-uuid",
      "eventType": "page_view",
      "eventName": "Home Page View",
      "path": "/dashboard",
      "metadata": {},
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "timestamp": "2026-01-29T12:00:00Z",
      "sessionId": "abc123"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

**Error Responses:**

- 400: Invalid query parameters
- 401: Not authenticated
- 500: Internal server error

---

## Analytics Metrics API

### GET /api/analytics/metrics

Fetch aggregated metrics. Can return pre-aggregated metrics from the database or generate real-time aggregations from events.

**Query Parameters:**

- `metricType` (optional): Filter by metric type
- `startDate` (optional): Filter metrics >= this date (ISO 8601 format)
- `endDate` (optional): Filter metrics <= this date (ISO 8601 format)
- `limit` (optional): Number of results (1-1000, default: 100)
- `aggregate` (optional): Set to "true" to generate real-time aggregations from events

**Example Request (Pre-aggregated):**

```
GET /api/analytics/metrics?metricType=daily_views&startDate=2026-01-01&limit=30
```

**Response (200 OK):**

```json
{
  "success": true,
  "metrics": [
    {
      "id": "metric-uuid",
      "metricType": "daily_views",
      "metricName": "Total Page Views",
      "metricValue": "1250.0000",
      "dimensions": { "page": "/dashboard" },
      "startTime": "2026-01-29T00:00:00Z",
      "endTime": "2026-01-30T00:00:00Z",
      "createdAt": "2026-01-29T12:00:00Z",
      "updatedAt": "2026-01-29T12:00:00Z"
    }
  ],
  "count": 1
}
```

**Example Request (Real-time Aggregation):**

```
GET /api/analytics/metrics?aggregate=true&startDate=2026-01-01&endDate=2026-01-31
```

**Response (200 OK):**

```json
{
  "success": true,
  "metrics": {
    "total": 5420,
    "byEventType": [
      { "eventType": "page_view", "count": 3200 },
      { "eventType": "click", "count": 1850 },
      { "eventType": "form_submit", "count": 370 }
    ],
    "byEventName": [
      { "eventType": "page_view", "eventName": "Dashboard View", "count": 1500 },
      { "eventType": "click", "eventName": "Login Button", "count": 850 }
    ],
    "byPath": [
      { "path": "/dashboard", "count": 1500 },
      { "path": "/analytics", "count": 980 }
    ]
  }
}
```

**Error Responses:**

- 400: Invalid query parameters
- 401: Not authenticated
- 500: Internal server error

---

### POST /api/analytics/metrics

Create or update pre-aggregated metrics (typically used by background jobs).

**Request Body:**

```json
{
  "metricType": "daily_views",        // Required: Metric type identifier
  "metricName": "Total Page Views",   // Required: Human-readable metric name
  "metricValue": 1250,                // Required: Numeric metric value
  "dimensions": {                     // Optional: Metric dimensions (JSONB)
    "page": "/dashboard",
    "device": "mobile"
  },
  "startTime": "2026-01-29T00:00:00Z", // Required: Metric time window start
  "endTime": "2026-01-30T00:00:00Z"    // Required: Metric time window end
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "metric": {
    "id": "metric-uuid",
    "metricType": "daily_views",
    "metricName": "Total Page Views",
    "metricValue": "1250.0000",
    "dimensions": { "page": "/dashboard" },
    "startTime": "2026-01-29T00:00:00Z",
    "endTime": "2026-01-30T00:00:00Z",
    "createdAt": "2026-01-29T12:00:00Z",
    "updatedAt": "2026-01-29T12:00:00Z"
  }
}
```

**Error Responses:**

- 400: Missing or invalid required fields
- 401: Not authenticated
- 500: Internal server error

---

## Saved Reports API

### GET /api/reports

List saved reports for the authenticated user.

**Query Parameters:**

- `includePublic` (optional): Set to "true" to include public reports (default: false)
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**

```
GET /api/reports?includePublic=true&limit=20
```

**Response (200 OK):**

```json
{
  "success": true,
  "reports": [
    {
      "id": "report-uuid",
      "userId": "user-uuid",
      "name": "Weekly Dashboard Report",
      "description": "Summary of key metrics from the past week",
      "config": {
        "charts": ["line", "bar"],
        "dateRange": "7d",
        "metrics": ["page_views", "clicks"]
      },
      "isPublic": false,
      "createdAt": "2026-01-22T12:00:00Z",
      "updatedAt": "2026-01-29T12:00:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**

- 400: Invalid query parameters
- 401: Not authenticated
- 500: Internal server error

---

### POST /api/reports

Create a new saved report.

**Request Body:**

```json
{
  "name": "Weekly Dashboard Report",   // Required: Report name (1-255 chars)
  "description": "Summary of metrics", // Optional: Report description
  "config": {                          // Required: Report configuration (JSONB)
    "charts": ["line", "bar"],
    "dateRange": "7d",
    "metrics": ["page_views", "clicks"]
  },
  "isPublic": false                    // Optional: Make report public (default: false)
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "report": {
    "id": "report-uuid",
    "userId": "user-uuid",
    "name": "Weekly Dashboard Report",
    "description": "Summary of metrics",
    "config": {
      "charts": ["line", "bar"],
      "dateRange": "7d",
      "metrics": ["page_views", "clicks"]
    },
    "isPublic": false,
    "createdAt": "2026-01-29T12:00:00Z",
    "updatedAt": "2026-01-29T12:00:00Z"
  }
}
```

**Error Responses:**

- 400: Missing or invalid required fields
- 401: Not authenticated
- 500: Internal server error

---

### GET /api/reports/:id

Get a specific saved report.

**Path Parameters:**

- `id`: Report UUID

**Response (200 OK):**

```json
{
  "success": true,
  "report": {
    "id": "report-uuid",
    "userId": "user-uuid",
    "name": "Weekly Dashboard Report",
    "description": "Summary of metrics",
    "config": { /* ... */ },
    "isPublic": false,
    "createdAt": "2026-01-29T12:00:00Z",
    "updatedAt": "2026-01-29T12:00:00Z"
  }
}
```

**Error Responses:**

- 400: Invalid report ID format
- 401: Not authenticated
- 404: Report not found or access denied
- 500: Internal server error

---

### PUT /api/reports/:id

Update a saved report (user must own the report).

**Path Parameters:**

- `id`: Report UUID

**Request Body (all fields optional):**

```json
{
  "name": "Updated Report Name",       // Optional: New report name
  "description": "Updated description", // Optional: New description
  "config": { /* new config */ },      // Optional: New configuration
  "isPublic": true                     // Optional: Update public status
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "report": {
    "id": "report-uuid",
    "userId": "user-uuid",
    "name": "Updated Report Name",
    "description": "Updated description",
    "config": { /* ... */ },
    "isPublic": true,
    "createdAt": "2026-01-29T12:00:00Z",
    "updatedAt": "2026-01-29T12:15:00Z"
  }
}
```

**Error Responses:**

- 400: Invalid report ID or no fields provided for update
- 401: Not authenticated
- 404: Report not found or user doesn't own it
- 500: Internal server error

---

### DELETE /api/reports/:id

Delete a saved report (user must own the report).

**Path Parameters:**

- `id`: Report UUID

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

**Error Responses:**

- 400: Invalid report ID format
- 401: Not authenticated
- 404: Report not found or user doesn't own it
- 500: Internal server error

---

## Error Handling

All endpoints return standardized error responses:

### Standard Error Response

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- **200 OK**: Successful GET request
- **201 Created**: Successful POST request (resource created)
- **400 Bad Request**: Invalid request parameters or body
- **401 Unauthorized**: Authentication required or invalid session
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

---

## Rate Limiting

Currently, no rate limiting is implemented. This should be added in production:

- Recommended: 100 requests per minute per user
- Use middleware or API gateway for rate limiting
- Return 429 status code when limit exceeded

---

## Validation

All endpoints include comprehensive input validation:

- **Type checking**: Ensures correct data types
- **Length validation**: String fields have min/max length constraints
- **Format validation**: UUIDs, dates, and enums are validated
- **Range validation**: Numeric fields have min/max constraints

---

## Security Features

1. **Authentication Required**: All endpoints require valid session
2. **User Isolation**: Users can only access their own data
3. **Input Validation**: Prevents injection attacks
4. **CSRF Protection**: Provided by Auth.js
5. **IP Address Tracking**: Automatic IP capture for analytics events

---

## Usage Examples

### Example 1: Track a Page View

```javascript
// Client-side code
async function trackPageView(path) {
  const response = await fetch('/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'page_view',
      eventName: `View: ${path}`,
      path: path,
      metadata: {
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      },
    }),
  })

  if (!response.ok) {
    console.error('Failed to track page view')
  }
}
```

### Example 2: Fetch Analytics Dashboard Data

```javascript
// Server-side or client-side code
async function getDashboardMetrics() {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const response = await fetch(
    `/api/analytics/metrics?aggregate=true&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
    {
      credentials: 'include', // Include cookies
    }
  )

  const data = await response.json()

  if (data.success) {
    return data.metrics
  }

  throw new Error(data.error)
}
```

### Example 3: Save a Custom Report

```javascript
// Client-side code
async function saveCustomReport(reportName, config) {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: reportName,
      description: 'Custom analytics report',
      config: config,
      isPublic: false,
    }),
  })

  const data = await response.json()

  if (data.success) {
    console.log('Report saved:', data.report.id)
    return data.report
  }

  throw new Error(data.error)
}
```

---

## Future Enhancements

1. **Bulk Operations**: Add batch event creation endpoint
2. **Export**: Add CSV/JSON export for events and metrics
3. **Real-time Subscriptions**: WebSocket support for live metrics
4. **Advanced Filtering**: Complex query DSL for analytics
5. **Report Scheduling**: Automated report generation and delivery
6. **Webhooks**: Notify external services of events

---

**Version:** 1.0
**Last Updated:** January 29, 2026
