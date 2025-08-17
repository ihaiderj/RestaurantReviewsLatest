# Amenity API Documentation

## Base URL
All amenity endpoints are prefixed with: `/api/restaurants/`

## Amenity Hierarchy
The amenity system has a 3-level hierarchy:
1. **AmenitySuperCategory** (e.g., "Kids Amenities", "Parking Amenities")
2. **AmenityCategory** (e.g., "Highchairs", "Private Parking") 
3. **Amenity** (e.g., "Highchairs Available", "Free Parking")

---

## 1. Amenity Super Categories

### List Amenity Super Categories
- **URL**: `/api/restaurants/amenity-super-categories/`
- **Method**: GET
- **Authentication**: Optional
- **Success Response**: 200 OK
```json
[
  {
    "id": 1,
    "name": "Kids Amenities",
    "code": "kids",
    "description": "Amenities for children",
    "image": "url|null"
  },
  {
    "id": 2,
    "name": "Parking Amenities", 
    "code": "parking",
    "description": "Parking related amenities",
    "image": "url|null"
  }
]
```

### Create Amenity Super Category (Admin Only)
- **URL**: `/api/restaurants/amenity-super-categories/`
- **Method**: POST
- **Authentication**: Admin required
- **Content-Type**: multipart/form-data
- **Request Body**:
```json
{
  "name": "Special Amenities",
  "code": "special",
  "description": "Special features and offers",
  "image": "file (optional)"
}
```
- **Success Response**: 201 Created

---

## 2. Amenity Categories

### List Amenity Categories
- **URL**: `/api/restaurants/amenity-categories/`
- **Method**: GET
- **Authentication**: Optional
- **Success Response**: 200 OK
```json
[
  {
    "id": 1,
    "name": "Highchairs",
    "code": "highchairs",
    "description": "Highchairs for kids",
    "super_category": {
      "id": 1,
      "name": "Kids Amenities",
      "code": "kids",
      "description": "Amenities for children",
      "image": "url|null"
    },
    "super_category_id": 1,
    "image": "url|null"
  }
]
```

### Create Amenity Category (Admin Only)
- **URL**: `/api/restaurants/amenity-categories/`
- **Method**: POST
- **Authentication**: Admin required
- **Content-Type**: multipart/form-data
- **Request Body**:
```json
{
  "name": "Private Parking",
  "code": "private-parking",
  "description": "Private parking available",
  "super_category_id": 2,
  "image": "file (optional)"
}
```
- **Success Response**: 201 Created

---

## 3. Individual Amenities

### List Amenities (Utility Endpoint)
- **URL**: `/api/restaurants/amenities/`
- **Method**: GET
- **Authentication**: Optional
- **Query Parameters**:
  - `category_id`: Filter by category ID
  - `super_category_id`: Filter by super category ID
  - `category_code`: Filter by category code
  - `super_category_code`: Filter by super category code
- **Success Response**: 200 OK
```json
[
  {
    "id": 1,
    "category": 1,
    "category_name": "Highchairs",
    "super_category": {
      "id": 1,
      "name": "Kids Amenities",
      "code": "kids",
      "description": "Amenities for children",
      "image": "url|null"
    },
    "name": "Highchairs Available",
    "code": "highchairs-available",
    "description": "Highchairs are available for children",
    "is_active": true,
    "image": "url|null"
  }
]
```

### List Amenities (Full CRUD Endpoint)
- **URL**: `/api/restaurants/amenities/`
- **Method**: GET
- **Authentication**: Optional
- **Query Parameters** (same as utility endpoint):
  - `category_id`: Filter by category ID
  - `super_category_id`: Filter by super category ID
  - `category_code`: Filter by category code
  - `super_category_code`: Filter by super category code
- **Success Response**: 200 OK (same as utility endpoint)

### Create Amenity (Admin Only)
- **URL**: `/api/restaurants/amenities/`
- **Method**: POST
- **Authentication**: Admin required
- **Content-Type**: multipart/form-data
- **Request Body**:
```json
{
  "category": 1,
  "name": "Free WiFi",
  "code": "free-wifi",
  "description": "Free wireless internet available",
  "related_names": "wifi, wireless, internet",
  "is_active": true,
  "image": "file (optional)"
}
```
- **Success Response**: 201 Created

---

## 4. Restaurant Amenities

### Get Restaurant Amenities
- **URL**: `/api/restaurants/{restaurant_id}/`
- **Method**: GET
- **Authentication**: Optional
- **Response includes**:
```json
{
  "id": 1,
  "name": "Restaurant Name",
  // ... other restaurant fields
  "amenities": {
    "selected_amenities": [
      {
        "id": 1,
        "category": 1,
        "category_name": "Highchairs",
        "super_category": {
          "id": 1,
          "name": "Kids Amenities",
          "code": "kids"
        },
        "name": "Highchairs Available",
        "code": "highchairs-available",
        "description": "Highchairs are available for children",
        "is_active": true,
        "image": "url|null"
      }
    ],
    "additional_amenities": "Free parking, Outdoor seating",
    "additional_amenities_list": ["Free parking", "Outdoor seating"],
    "grouped_amenities": [
      {
        "super_category": "Kids Amenities",
        "categories": [
          {
            "category": "Highchairs",
            "amenities": [
              {
                "id": 1,
                "name": "Highchairs Available",
                "code": "highchairs-available",
                // ... other amenity fields
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Set Restaurant Amenities
- **URL**: `/api/restaurants/{restaurant_id}/set_amenities/`
- **Method**: POST
- **Authentication**: Required (Restaurant Owner only)
- **Request Body**:
```json
{
  "selected_amenity_ids": [1, 2, 3],
  "additional_amenities": "Free parking, Outdoor seating"
}
```
- **Success Response**: 200 OK
```json
{
  "selected_amenities": [...],
  "additional_amenities": "Free parking, Outdoor seating",
  "additional_amenities_list": ["Free parking", "Outdoor seating"],
  "grouped_amenities": [...]
}
```

---

## 5. Restaurant Filtering by Amenities

### Filter Restaurants by Amenities
- **URL**: `/api/restaurants/filter/`
- **Method**: GET
- **Authentication**: Optional
- **Query Parameters**:
  - `amenities[]`: Array of amenity codes
  - `amenity_super_categories[]`: Array of amenity super category codes
- **Example**:
```
GET /api/restaurants/filter/?amenities[]=highchairs-available&amenities[]=free-wifi
GET /api/restaurants/filter/?amenity_super_categories[]=kids&amenity_super_categories[]=parking
```
- **Success Response**: 200 OK (filtered restaurant list)

---

## Usage Examples

### 1. Get All Amenities for a Specific Category
```
GET /api/restaurants/amenities/?category_code=highchairs
```

### 2. Get All Amenities for a Super Category
```
GET /api/restaurants/amenities/?super_category_code=kids
```

### 3. Get All Amenities for a Specific Category ID
```
GET /api/restaurants/amenities/?category_id=1
```

### 4. Get Restaurant with Grouped Amenities
```
GET /api/restaurants/1/
```

### 5. Set Restaurant Amenities
```
POST /api/restaurants/1/set_amenities/
Content-Type: application/json

{
  "selected_amenity_ids": [1, 2, 3],
  "additional_amenities": "Free parking, Outdoor seating"
}
```

### 6. Filter Restaurants by Amenities
```
GET /api/restaurants/filter/?amenities[]=highchairs-available&amenity_super_categories[]=parking
```

---

## Notes

- **Authentication**: Admin endpoints require admin privileges
- **Images**: All amenity levels support optional images
- **Active/Inactive**: Only active amenities are returned by default
- **Grouped Amenities**: The `grouped_amenities` field organizes amenities by super category and category for easier frontend consumption
- **Additional Amenities**: Restaurants can have custom text-based amenities
- **Filtering**: Multiple filtering options are available for both amenities and restaurants
- **Pagination**: All list endpoints support standard DRF pagination
- **Error Responses**: Include detailed validation error messages

## Frontend Integration Tips

1. **Load Amenity Hierarchy**: Start by loading super categories, then categories, then individual amenities
2. **Use Grouped Amenities**: The `grouped_amenities` field is perfect for displaying amenities in organized sections
3. **Filter Options**: Use amenity filtering to help users find restaurants with specific features
4. **Additional Amenities**: Allow users to add custom amenities that aren't in the predefined list
5. **Image Handling**: All amenity levels support images for better visual representation 