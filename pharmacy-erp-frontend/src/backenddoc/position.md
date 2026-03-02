# Position Management API

This document describes the API endpoints for managing positions (chức vụ) within the system.

## 1. Get Approved Positions (For dropdowns)
Retrieves a list of **only approved** job positions in the system. Useful for populating frontend dropdowns during employee creation or editing.

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
            "positionName": "System Admin",
            "status": "Approved",
            "reason": "Khởi tạo hệ thống",
            "proposedById": 1,
            "proposedByName": "admin",
            "approvedById": 1,
            "approvedByName": "admin"
        }
    ]
}
```

---

## 2. Get All Positions (Management View)
Retrieves a list of **ALL** job positions (Approved, Pending, Rejected) for management purposes.

- **URL**: `/api/positions/all`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HM`

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "All positions retrieved successfully",
    "data": [
        {
            "id": 1,
            "positionName": "System Admin",
            "status": "Approved",
            "reason": "Khởi tạo hệ thống",
            "proposedById": 1,
            "proposedByName": "admin",
            "approvedById": 1,
            "approvedByName": "admin"
        },
        {
            "id": 2,
            "positionName": "Thực tập sinh",
            "status": "Pending",
            "reason": null,
            "proposedById": 3,
            "proposedByName": "manager",
            "approvedById": null,
            "approvedByName": null
        }
    ]
}
```

---

## 3. Create Position
Propose the creation of a new position. 
- If called by **ADMIN**, the position is automatically created with status `Approved`.
- If called by **HM**, the position is created with status `Pending` and needs Admin approval.

- **URL**: `/api/positions`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HM`

### Request Body
```json
{
    "positionName": "Thực tập sinh Marketing"
}
```

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Position created successfully",
    "data": "Position created successfully"
}
```

### Error Responses
- **409 Conflict**: Tên chức vụ đã tồn tại.

---

## 4. Approve / Reject Position
Review a pending position request and set its status to Approved or Rejected along with a reason.

- **URL**: `/api/positions/{id}/status`
- **Method**: `PUT`
- **Content-Type**: `application/json`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`

### Path Parameters
- `id`: The ID of the position to review.

### Request Body
```json
{
    "status": "Approved", 
    "reason": "Đồng ý mở rộng team Marketing"
}
```
*(Available statuses: `Approved`, `Rejected`)*

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Position status updated successfully",
    "data": "Position status updated successfully"
}
```

### Error Responses
- **409 Conflict**: Chỉ có thể duyệt chức vụ đang ở trạng thái Pending.
- **404 Not Found**: Chức vụ không tồn tại.

---

## 5. Delete Position
Deletes a position. This is only possible if the position is **not** linked to any active/past employees and is **not** present in any career change records.

- **URL**: `/api/positions/{id}`
- **Method**: `DELETE`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HM`

### Path Parameters
- `id`: The ID of the position to delete.

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Position deleted successfully",
    "data": "Position deleted successfully"
}
```

### Error Responses
- **409 Conflict**: Không thể xóa chức vụ này vì đang có nhân viên giữ chức vụ này.
- **409 Conflict**: Không thể xóa chức vụ này vì có liên kết với lịch sử công tác của nhân viên.
- **404 Not Found**: Chức vụ không tồn tại.

---

## 6. Update Position Name
Updates the name of an existing position.

- **URL**: `/api/positions/{id}`
- **Method**: `PUT`
- **Content-Type**: `application/json`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`

### Path Parameters
- `id`: The ID of the position to update.

### Request Body
```json
{
    "positionName": "Chuyên viên Marketing"
}
```

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Position updated successfully",
    "data": "Position updated successfully"
}
```

### Error Responses
- **409 Conflict**: Tên chức vụ đã tồn tại.
- **404 Not Found**: Chức vụ không tồn tại.
