# Employee Management API

## Architecture Note: Asynchronous Image Upload
When an employee updates their profile image:
1.  **API Layer**: The image is temporarily saved to the local server.
2.  **Service Layer**: `EmployeeService` sends a message to the Kafka topic `employee-image-upload`.
3.  **Worker Layer**: `ImageUploadWorker` consumes the message, uploads the image to Cloudinary, and updates the database with the secure Cloudinary URL.
4.  **Cleanup**: The local temporary file is deleted after successful upload.
5.  **Old Image Deletion**: If the employee had a previous image, it is deleted from Cloudinary to free up space.

## Endpoints Employee List
Retrieves a list of employees based on the authenticated user's role. Supports sorting and filtering.

- **URL**: `/api/employees`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HR`, `ROLE_HM`

### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sortBy` | string | `id` | Field to sort by. Options: `salary`, `firstname`, `hiredate`, `status`, `position`, `phone`, `email`, `role`. |
| `order` | string | `asc` | Sort order: `asc` or `desc`. |
| `id` | integer | `null` | Filter by Employee ID. |
| `name` | string | `null` | Filter by First Name or Last Name (contains). |
| `phone` | string | `null` | Filter by Phone Number (contains). |
| `email` | string | `null` | Filter by Email (contains). |
| `role` | string | `null` | Filter by Role Name (contains). |
| `status` | string | `null` | Filter by Status (Exact match: `Active`, `Resigned`, etc.). |

### Logic
- **ROLE_ADMIN**: Can see all employees.
- **ROLE_HR` / `ROLE_HM**: Can only see employees with `ROLE_WS` (Warehouse Staff) or `ROLE_SS` (Sales Staff).
- **Others**: Access Denied (403).

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Employee list retrieved successfully",
    "data": [
        {
            "id": 1,
            "lastName": "Nguyen Van",
            "firstName": "An",
            "email": "admin@pharmacy.com",
            "phone": "0901111111",
            "imageUrl": "https://...",
            "positionName": "System Admin",
            "currentSalary": 30000000.00,
            "status": "Active",
            "hireDate": "2024-01-01",
            "roles": [
                "ROLE_ADMIN"
            ]
        },
        ...
    ]
}
```

### Error Responses

#### 401 Unauthorized
```json
{
    "success": false,
    "message": "Full authentication is required to access this resource",
    "data": null
}
```

#### 403 Forbidden
```json
{
    "success": false,
    "message": "Access denied",
    "data": null
}
```

## 2. Get My Career History
Retrieves the career history for the currently authenticated employee.

- **URL**: `/api/employees/me/career-history`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: Any authenticated user linked to an employee record.

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Career history retrieved successfully",
    "data": [
        {
            "id": 10,
            "changeType": "Promotion",
            "oldSalary": 15000000.00,
            "newSalary": 20000000.00,
            "oldPositionName": "Junior Dev",
            "newPositionName": "Senior Dev",
            "effectiveDate": "2025-01-01",
            "status": "Approved",
            "reason": "Outstanding performance",
            "proposedByName": "manager",
            "approvedByName": "admin"
        }
    ]
}
```

## 3. Get Employee Detail
Retrieves detailed information for a specific employee.

- **URL**: `/api/employees/{id}`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HM`

### Logic
- **ROLE_ADMIN**: Can view details of **any** employee.
- **ROLE_HM**: Can **ONLY** view details of employees with `ROLE_WS` or `ROLE_SS`. Use valid roles to view details.
- **Others**: Access Denied (403).

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | integer | Yes | ID of the employee to retrieve. |

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Employee details retrieved successfully",
    "data": {
        "id": 2,
        "lastName": "Tran Thi",
        "firstName": "Binh",
        "email": "staff@pharmacy.com",
        "phone": "0902222222",
        "imageUrl": "https://...",
        "positionName": "Pharmacist",
        "currentSalary": 15000000.00,
        "status": "Active",
        "hireDate": "2024-02-01",
        "roles": [
            "ROLE_WS"
        ]
    }
}
```

### Error Responses

#### 404 Not Found
```json
{
    "success": false,
    "message": "Employee not found",
    "data": null
}
```

#### 403 Forbidden
```json
{
    "success": false,
    "message": "You do not have permission to view this employee's details",
    "data": null
}
```
## 4. Update Employee
Update an employee's information.

- **URL**: `/api/employees/{id}`
- **Method**: `PUT`
- **Content-Type**: `multipart/form-data`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HM`

### Parameters

| Parameter | Type | In | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | integer | path | Yes | ID of the employee to update. |
| `image` | file | formData | No | New profile image (avatar). |
| `data` | json | formData | Yes | JSON object containing update fields. |

**Structure of `data` (JSON):**
```json
{
    "firstName": "New First Name",
    "lastName": "New Last Name",
    "email": "new.email@example.com",
    "phone": "0909999999",
    "roles": ["ROLE_WS", "ROLE_SS"]
}
```

### Logic
- **ROLE_ADMIN**: Can update **any** employee's information.
- **ROLE_HM**: Can **ONLY** update employees who currently hold `ROLE_WS` or `ROLE_SS`.
    - HM can only assign/remove `ROLE_WS` and `ROLE_SS`.
- **Email Update**: If the email is changed, the associated `username` is also updated.
- **Image**: If provided, it replaces the current image.

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Employee updated successfully",
    "data": "Employee updated successfully"
}
```

### Error Responses

#### 400 Bad Request
```json
{
    "success": false,
    "message": "Email already in use",
    "data": null
}
```

#### 403 Forbidden
```json
{
    "success": false,
    "message": "You can only update employees with WS or SS roles",
    "data": null
}
```

#### 404 Not Found
```json
{
    "success": false,
    "message": "Employee not found",
    "data": null
}
```

## 5. Update My Profile
Allows authenticated employees to update their own profile information.

- **URL**: `/api/employees/me`
- **Method**: `PUT`
- **Content-Type**: `multipart/form-data`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: Any authenticated employee.

### Parameters

| Parameter | Type | In | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `image` | file | formData | No | New profile image. Updates trigger async upload. |
| `data` | json | formData | Yes | JSON object containing update fields. |

**Structure of `data` (JSON):**
```json
{
    "firstName": "New First Name",
    "lastName": "New Last Name",
    "email": "new.email@example.com",
    "phone": "0909999999"
}
```

### Logic
- **Email/Phone Uniqueness**: Checks if the new email or phone is already used by another user/employee. Throws `409 Conflict` if duplicate.
- **Email Update**: Updating email also updates the user's `username`.
- **Image**: If provided, triggers an asynchronous upload event (Kafka) and replaces the old image.

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "data": "Profile updated successfully"
}
```

### Error Responses

#### 400 Bad Request
```json
{
    "success": false,
    "message": "Validation Error (e.g. Invalid email format)",
    "data": null
}
```

#### 409 Conflict
```json
{
    "success": false,
    "message": "Email đã được sử dụng / Số điện thoại đã được sử dụng",
    "data": null
}
```

## 6. Resign Employee (Nghỉ việc)
Sets an employee's status to `Resigned`, deactivates their user account, and records the event in employment history.

- **URL**: `/api/employees/{id}/resign`
- **Method**: `POST`
- **Auth Required**: Yes (ROLE_ADMIN, ROLE_HM)

### Request Body
```json
{
    "date": "2024-02-20",
    "reason": "Personal reasons"
}
```

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Employee resigned successfully",
    "data": "Employee resigned successfully"
}
```

### Error Responses
- **404 Not Found**: Employee not found.
- **409 Conflict**: Employee is already resigned.

## 7. Re-hire Employee (Đi làm lại)
Sets an employee's status to `Active`, reactivates their user account, and restores their salary (either provided or from history).

- **URL**: `/api/employees/{id}/rehire`
- **Method**: `POST`
- **Auth Required**: Yes (ROLE_ADMIN, ROLE_HM)

### Request Body
```json
{
    "date": "2024-03-01",
    "reason": "Re-hiring after break",
    "newSalary": 15000000 
}
```
*`newSalary` is optional. If omitted, the system tries to restore the previous salary.*

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Employee re-hired successfully",
    "data": "Employee re-hired successfully"
}
```

### Error Responses
- **404 Not Found**: Employee not found.
- **409 Conflict**: Employee is already active.
- **400 Bad Request**: Cannot determine valid salary for re-hire.
