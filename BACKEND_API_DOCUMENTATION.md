# Loggerise Mobile Backend API - Complete Documentation

## Overview

Complete production-grade backend for loggerise_v2 mobile app with 100% compatibility to web project's vehicle show page.

## Base URL

```
https://api.loggerise.com/api/v1/mobile
```

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer {token}
```

## Vehicle Management Endpoints

### 1. Get Vehicle List

**GET** `/vehicles`

**Query Parameters:**
- `search` - Search by plate, brand, or model
- `plate` - Filter by exact plate
- `vehicle_type` - Filter by vehicle type
- `status` - Filter by status
- `ownership_type` - Filter by ownership type
- `brand` - Filter by brand
- `model` - Filter by model
- `is_active` - Filter by active status
- `per_page` - Items per page (default: 15, max: 100)
- `sort_by` - Sort field (default: created_at)
- `sort_order` - Sort direction (default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicles": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total": 100,
      "last_page": 7,
      "from": 1,
      "to": 15
    }
  }
}
```

**Status Codes:**
- 200 - Success
- 403 - Unauthorized
- 500 - Server error

---

### 2. Get Single Vehicle (Full Details)

**GET** `/vehicles/{vehicle}`

**Includes Relations:**
- insurances
- maintenances
- inspections
- faultReports (with employee, user relations, and files)

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicle": {
      "id": 1,
      "brand": "Mercedes-Benz",
      "plate": "34 ABC 123",
      "model": "Actros",
      "model_year": 2023,
      "color": "Beyaz",
      "vehicle_type": "truck",
      "gear_type": "manual",
      "document_type": "C",
      "ownership_type": "owned",
      "status": "available",
      "total_km": 150000,
      "notary_name": "1. Noter",
      "notary_sale_date": "2023-01-15",
      "license_info": "123456789",
      "full_name": "Ahmet Yılmaz",
      "company_name": "Lojistik A.Ş.",
      "id_or_tax_no": "12345678901",
      "address": "İstanbul",
      "engine_number": "ENG123456",
      "chassis_number": "CHS123456",
      "created_at": "2024-01-01T00:00:00.000000Z",
      "updated_at": "2024-01-01T00:00:00.000000Z",
      "insurances": [...],
      "maintenances": [...],
      "inspections": [...],
      "fault_reports": [...]
    }
  }
}
```

**Status Codes:**
- 200 - Success
- 403 - Unauthorized
- 404 - Not found
- 500 - Server error

---

### 3. Create Vehicle

**POST** `/vehicles`

**Request Body:**
All fields from StoreVehicleRequest validation rules

**Response:**
```json
{
  "success": true,
  "message": "Araç başarıyla oluşturuldu.",
  "data": {
    "vehicle": {...}
  }
}
```

**Status Codes:**
- 201 - Created
- 403 - Unauthorized
- 422 - Validation error
- 500 - Server error

---

### 4. Update Vehicle

**PUT** `/vehicles/{vehicle}`

**Request Body:**
Partial vehicle data (any valid fields)

**Response:**
```json
{
  "success": true,
  "message": "Araç başarıyla güncellendi.",
  "data": {
    "vehicle": {...}
  }
}
```

**Status Codes:**
- 200 - Success
- 403 - Unauthorized
- 422 - Validation error
- 500 - Server error

---

### 5. Delete Vehicle

**DELETE** `/vehicles/{vehicle}`

**Response:**
```json
{
  "success": true,
  "message": "Araç başarıyla silindi."
}
```

**Status Codes:**
- 200 - Success
- 403 - Unauthorized
- 500 - Server error

---

## Vehicle Insurance Management

### 6. Create Insurance Record

**POST** `/vehicles/{vehicle}/insurances`

**Request Body:**
```json
{
  "insurance_type": "comprehensive",
  "policy_number": "POL123456",
  "insurance_company": "Allianz",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "insurance_amount": 5000.00,
  "currency_type": "TRY",
  "exchange_rate": 1,
  "description": "Kasko sigortası",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sigorta kaydı başarıyla oluşturuldu.",
  "data": {
    "insurance": {...}
  }
}
```

---

### 7. Update Insurance Record

**PUT** `/vehicles/{vehicle}/insurances/{insurance}`

**Request Body:**
Same as create (all fields)

**Response:**
```json
{
  "success": true,
  "message": "Sigorta kaydı başarıyla güncellendi."
}
```

---

### 8. Delete Insurance Record

**DELETE** `/vehicles/{vehicle}/insurances/{insurance}`

**Response:**
```json
{
  "success": true,
  "message": "Sigorta kaydı başarıyla silindi."
}
```

---

## Vehicle Maintenance Management

### 9. Create Maintenance Record

**POST** `/vehicles/{vehicle}/maintenances`

**Request Body:**
```json
{
  "maintenance_date": "2024-01-15",
  "maintenance_km": 50000,
  "next_maintenance_km": 60000,
  "oil_change": true,
  "oil_filter_change": true,
  "cost": 1500.00,
  "service_provider": "Otosan Servis",
  "other": "Yapılan işlemler...",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bakım kaydı başarıyla oluşturuldu.",
  "data": {
    "maintenance": {...}
  }
}
```

---

### 10. Update Maintenance Record

**PUT** `/vehicles/{vehicle}/maintenances/{maintenance}`

**Request Body:**
Same fields as create

**Response:**
```json
{
  "success": true,
  "message": "Bakım kaydı başarıyla güncellendi."
}
```

---

### 11. Delete Maintenance Record

**DELETE** `/vehicles/{vehicle}/maintenances/{maintenance}`

**Response:**
```json
{
  "success": true,
  "message": "Bakım kaydı başarıyla silindi."
}
```

---

## Vehicle Inspection Management

### 12. Create Inspection Record

**POST** `/vehicles/{vehicle}/inspections`

**Request Body:**
```json
{
  "inspection_date": "2024-01-20",
  "next_inspection_date": "2025-01-20",
  "inspection_type": "periodic",
  "status": "active",
  "result": "passed",
  "fee": 300.00,
  "station": "TÜV Türk",
  "inspector": "Ahmet Yılmaz",
  "odometer": 55000,
  "faults": "Yok",
  "recommendations": "Genel bakım yapılmalı",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muayene kaydı başarıyla oluşturuldu.",
  "data": {
    "inspection": {...}
  }
}
```

---

### 13. Update Inspection Record

**PUT** `/vehicles/{vehicle}/inspections/{inspection}`

**Request Body:**
Same fields as create

**Response:**
```json
{
  "success": true,
  "message": "Muayene kaydı başarıyla güncellendi."
}
```

---

### 14. Delete Inspection Record

**DELETE** `/vehicles/{vehicle}/inspections/{inspection}`

**Response:**
```json
{
  "success": true,
  "message": "Muayene kaydı başarıyla silindi."
}
```

---

## Vehicle Fault Report Management

### 15. Create Fault Report

**POST** `/vehicles/{vehicle}/fault-reports`

**Request Body:**
```json
{
  "title": "Fren sesi",
  "description": "Arka sol tekerlekten gelen vızıltı sesi",
  "status": "pending",
  "priority": "medium",
  "category": "brakes",
  "reported_by_employee_id": 1,
  "estimated_cost": 500.00,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Arıza bildirimi başarıyla oluşturuldu.",
  "data": {
    "fault_report": {...}
  }
}
```

---

### 16. Update Fault Report

**PUT** `/vehicles/{vehicle}/fault-reports/{faultReport}`

**Request Body:**
All fault report fields

**Response:**
```json
{
  "success": true,
  "message": "Arıza bildirimi başarıyla güncellendi."
}
```

---

### 17. Delete Fault Report

**DELETE** `/vehicles/{vehicle}/fault-reports/{faultReport}`

**Response:**
```json
{
  "success": true,
  "message": "Arıza bildirimi başarıyla silindi."
}
```

---

## Error Responses

All endpoints return consistent error formats:

### Validation Error (422)
```json
{
  "success": false,
  "message": "Girilen bilgiler geçersiz.",
  "errors": {
    "field_name": ["Hata mesajı"]
  }
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Bu işlem için yetkiniz bulunmuyor."
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Kaynak bulunamadı."
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
}
```

---

## Validation Rules

### Vehicle Creation/Update
- All fields match `StoreVehicleRequest.php` validation rules
- Required: brand, plate, color, gear_type, vehicle_type, document_type, model, model_year, ownership_type, status
- Model year: 1900 to current_year + 1
- Wheel formula: regex `/^\d+x\d+$/`
- Plate: unique in vehicles table

### Insurance
- Required: insurance_type, policy_number, insurance_company, start_date, end_date, insurance_amount
- Dates: end_date must be after start_date
- Amount: numeric, max 13 digits with 2 decimals

### Maintenance
- Required: maintenance_date, maintenance_km, next_maintenance_km
- All boolean fields nullable
- Cost: numeric, max 13 digits with 2 decimals

### Inspection
- Required: inspection_date, next_inspection_date, inspection_type, status, result, fee
- Result: in [passed, failed, pending]

### Fault Report
- Required: title, description, status, priority, category
- Status: in [pending, in_progress, resolved, cancelled]
- Priority: in [low, medium, high, critical]

---

## Feature Parity with Web

| Feature | Web | Mobile API | Status |
|---------|-----|------------|--------|
| View vehicle list | ✅ | ✅ | Complete |
| View vehicle details | ✅ | ✅ | Complete |
| Create vehicle | ✅ | ✅ | Complete |
| Update vehicle | ✅ | ✅ | Complete |
| Delete vehicle | ✅ | ✅ | Complete |
| Add insurance | ✅ | ✅ | Complete |
| Edit insurance | ✅ | ✅ | Complete |
| Delete insurance | ✅ | ✅ | Complete |
| Add maintenance | ✅ | ✅ | Complete |
| Edit maintenance | ✅ | ✅ | Complete |
| Delete maintenance | ✅ | ✅ | Complete |
| Add inspection | ✅ | ✅ | Complete |
| Edit inspection | ✅ | ✅ | Complete |
| Delete inspection | ✅ | ✅ | Complete |
| Add fault report | ✅ | ✅ | Complete |
| Edit fault report | ✅ | ✅ | Complete |
| Delete fault report | ✅ | ✅ | Complete |
| View fault reports with relations | ✅ | ✅ | Complete |

---

## Testing

Run the following test to verify all endpoints:

```bash
# Test vehicle list
GET /api/v1/mobile/vehicles

# Test vehicle details
GET /api/v1/mobile/vehicles/1

# Test insurance create
POST /api/v1/mobile/vehicles/1/insurances

# Test maintenance create
POST /api/v1/mobile/vehicles/1/maintenances

# Test inspection create
POST /api/v1/mobile/vehicles/1/inspections

# Test fault report create
POST /api/v1/mobile/vehicles/1/fault-reports
```

---

## Implementation Notes

1. All endpoints use proper authorization via Laravel policies
2. Request validation uses dedicated FormRequest classes
3. Comprehensive error logging for all operations
4. Database transactions for data integrity
5. Soft deletes for all related records
6. Full relation loading in vehicle show endpoint
7. Consistent response format across all endpoints
8. Rate limiting via `throttle:mobile_api` middleware
9. Tenant isolation via `tenant.api` middleware
10. Sanctum authentication

---

---

## Dashboard Quick Actions API Endpoints

The mobile app's dashboard quick actions system integrates with the following backend API endpoints:

### Domestic Transport Orders (7 endpoints)
- `GET /api/v1/mobile/domestic-orders` - List domestic transport orders
- `POST /api/v1/mobile/domestic-orders` - Create new domestic order
- `GET /api/v1/mobile/domestic-orders/{order}` - Get order details
- `PUT /api/v1/mobile/domestic-orders/{order}` - Update order
- `DELETE /api/v1/mobile/domestic-orders/{order}` - Delete order
- `POST /api/v1/mobile/domestic-orders/{order}/status` - Update order status
- `GET /api/v1/mobile/domestic-orders/summary` - Get summary statistics

### Stock Movements (6 endpoints)
- `GET /api/v1/mobile/stock-movements` - List stock movements
- `POST /api/v1/mobile/stock-movements` - Create new stock movement
- `GET /api/v1/mobile/stock-movements/{movement}` - Get movement details
- `PUT /api/v1/mobile/stock-movements/{movement}` - Update movement
- `DELETE /api/v1/mobile/stock-movements/{movement}` - Delete movement
- `GET /api/v1/mobile/stock-movements/summary` - Get summary statistics

### Invoices (7 endpoints)
- `GET /api/v1/mobile/invoices` - List invoices
- `POST /api/v1/mobile/invoices` - Create new invoice
- `GET /api/v1/mobile/invoices/{invoice}` - Get invoice details
- `PUT /api/v1/mobile/invoices/{invoice}` - Update invoice
- `DELETE /api/v1/mobile/invoices/{invoice}` - Delete invoice
- `POST /api/v1/mobile/invoices/{invoice}/approve` - Approve invoice
- `GET /api/v1/mobile/invoices/summary` - Get summary statistics

### Quick Action Routes Used by Dashboard
All quick actions navigate to existing mobile app screens or trigger API calls:
- Quote creation: `/quote/new` (existing)
- Vehicle management: `/vehicle/new`, `/(tabs)/vehicles` (existing)
- Contact management: `/contact/new` (existing)
- Financial transactions: `/(tabs)/transactions` (existing)
- Logistics: `/(tabs)/loads`, `/(tabs)/positions` (existing)
- CRM: `/crm` (existing)

---

## Summary

✅ **Complete production-grade backend implementation**
✅ **100% feature parity with web vehicle show page**
✅ **37 total mobile API endpoints** (17 vehicles + 20 quick actions)
✅ **Full CRUD for vehicles and all related records**
✅ **Dashboard quick actions with 20 new endpoints**
✅ **Comprehensive validation and error handling**
✅ **Proper authorization and logging**
✅ **Ready for mobile integration**
