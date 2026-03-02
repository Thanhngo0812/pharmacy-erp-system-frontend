
## 4. Create New Employee
Creates a new employee and their associated user account. Triggers an asynchronous event to upload the profile image if provided.

- **URL**: `/api/employees`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HM`

### Parameters

| Parameter | Type | In | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `image` | file | formData | No | Profile image (avatar). Will be uploaded asynchronously. |
| `data` | json | formData | Yes | JSON object containing the employee's details. |

**Structure of `data` (JSON):**
```json
{
    "firstName": "Ngọc",
    "lastName": "Nguyễn",
    "email": "ngochm@example.com",
    "phone": "0987123456",
    "positionName": "Quản lý nhân sự",
    "currentSalary": 20000000,
    "hireDate": "2026-01-01",
    "roles": ["ROLE_HM"]
}
```

### Logic & Business Rules
- **Email/Phone Uniqueness**: Validates that neither `email` nor `phone` exists in the system.
- **Position**: `positionName` must be a valid existing position.
- **Role Exclusivity**:
  - `ROLE_ADMIN` cannot be mixed with `ROLE_HM`.
  - `ROLE_WM` cannot be mixed with `ROLE_WS`.
- **Creator Rules**:
  - **ROLE_ADMIN**:
    - Can create users across all roles.
    - Employee status is set to `Active`.
    - User `isActive` is set to `true`.
    - `CareerChanges` row is created with status `Approved`.
  - **ROLE_HM**:
    - Can ONLY create `ROLE_WS` or `ROLE_SS` users.
    - Employee status is set to `Waiting`.
    - User `isActive` is set to `false`.
    - `CareerChanges` row is created with status `Pending`.
- **Default Password**: The generated user will receive a BCrypt hashed password of `"123456"`.

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Employee created successfully",
    "data": "Employee created successfully"
}
```

### Error Responses

#### 400 Bad Request
```json
{
    "success": false,
    "message": "Một nhân viên không thể vừa làm Admin vừa làm HR Manager",
    "data": null
}
```

#### 403 Forbidden
```json
{
    "success": false,
    "message": "HR Manager can only create Employee with WS or SS roles",
    "data": null
}
```

#### 404 Not Found
```json
{
    "success": false,
    "message": "Position not found: InvalidPosition",
    "data": null
}
```

#### 409 Conflict
```json
{
    "success": false,
    "message": "Email is already used",
    "data": null
}
```





## 8. Get All Positions
Retrieves a list of all available job positions in the system. Useful for populating frontend dropdowns during employee creation or editing.

- **URL**: `/api/positions`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HR`, `ROLE_HM`

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Positions retrieved successfully",
    "data": [
        {
            "id": 1,
            "positionName": "System Admin"
        },
        {
            "id": 2,
            "positionName": "HR Manager"
        },
        {
            "id": 3,
            "positionName": "Pharmacist"
        }
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