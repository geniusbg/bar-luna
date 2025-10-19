# Luna Bar - API Documentation

## Overview

This API provides endpoints for managing the Luna Bar menu system and integrating with POS (Point of Sale) systems.

**Base URL:** `https://your-domain.com/api`

## Authentication

For POS integration and admin operations, use API key authentication:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Products

#### Get All Products

```http
GET /api/products
```

**Query Parameters:**
- `category_id` (optional) - Filter by category ID

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "category_id": "uuid",
      "name_bg": "Капучино",
      "name_en": "Cappuccino",
      "name_de": "Cappuccino",
      "description_bg": "Класическо италианско кафе",
      "description_en": "Classic Italian coffee",
      "description_de": "Klassischer italienischer Kaffee",
      "price_bgn": 5.00,
      "price_eur": 2.56,
      "image_url": "https://...",
      "is_available": true,
      "is_featured": false,
      "order": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Single Product

```http
GET /api/products/:id
```

**Response:**
```json
{
  "product": { /* product object */ }
}
```

#### Create Product (Admin)

```http
POST /api/products
```

**Request Body:**
```json
{
  "category_id": "uuid",
  "name_bg": "Продукт",
  "name_en": "Product",
  "name_de": "Produkt",
  "price_bgn": 10.00,
  "price_eur": 5.11,
  "is_available": true
}
```

#### Update Product (Admin)

```http
PUT /api/products/:id
```

**Request Body:**
```json
{
  "price_bgn": 12.00,
  "is_available": false
}
```

#### Delete Product (Admin)

```http
DELETE /api/products/:id
```

### Categories

#### Get All Categories

```http
GET /api/categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name_bg": "Алкохол",
      "name_en": "Alcohol",
      "name_de": "Alkohol",
      "slug": "alcohol",
      "order": 1
    }
  ]
}
```

### Events

#### Get Events

```http
GET /api/events?published=true
```

**Query Parameters:**
- `published` (optional) - Filter by published status

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title_bg": "Джаз вечер",
      "title_en": "Jazz Night",
      "title_de": "Jazz Abend",
      "description_bg": "Специална джаз вечер",
      "event_date": "2024-12-31T20:00:00Z",
      "location": "LUNA Bar, Русе",
      "is_external": false,
      "is_published": true
    }
  ]
}
```

## POS Integration Endpoints

### Sync Products

Get all products with availability status for POS sync:

```http
GET /api/pos/products/sync
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Капучино",
      "category": "Coffee",
      "price_bgn": 5.00,
      "price_eur": 2.56,
      "available": true,
      "sku": "COFFEE-CAP-001"
    }
  ],
  "sync_time": "2024-01-01T12:00:00Z"
}
```

### Update Product Availability (POS)

Update product availability from POS:

```http
PATCH /api/pos/products/:id/availability
```

**Request Body:**
```json
{
  "is_available": false
}
```

### Batch Update Prices (Admin)

Update multiple product prices at once:

```http
POST /api/pos/products/batch-update
```

**Request Body:**
```json
{
  "updates": [
    {
      "id": "uuid",
      "price_bgn": 6.00
    },
    {
      "id": "uuid",
      "price_bgn": 8.50
    }
  ]
}
```

**Response:**
```json
{
  "updated": 2,
  "products": [/* updated products */]
}
```

### Get Sales Report (Future)

```http
GET /api/pos/reports/sales?from=2024-01-01&to=2024-01-31
```

## Webhooks

### Product Update Webhook

When a product is updated, a webhook can be sent to your POS system:

**Webhook URL:** Configure in admin panel

**Payload:**
```json
{
  "event": "product.updated",
  "product_id": "uuid",
  "changes": {
    "price_bgn": 6.00,
    "is_available": false
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

## Rate Limiting

- **Public endpoints:** 100 requests/minute
- **Authenticated endpoints:** 1000 requests/minute
- **POS sync endpoints:** 10000 requests/minute

## Currency Conversion

The system automatically calculates EUR prices from BGN using the fixed rate:

```
1 EUR = 1.95583 BGN
```

Both prices are always returned in API responses.

## Best Practices for POS Integration

1. **Sync Schedule:** Sync product data every 5-15 minutes
2. **Availability Updates:** Update availability in real-time when items sell out
3. **Error Handling:** Implement retry logic with exponential backoff
4. **Caching:** Cache product data locally, refresh on changes
5. **Webhooks:** Use webhooks for instant updates instead of polling

## Support

For POS integration support, contact: admin@lunabar.bg


