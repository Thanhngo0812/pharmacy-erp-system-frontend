
## 9. Delete Waiting Employee
Deletes an employee, their associated user account, and career change records. This action is **only** permitted if the employee's current status is `Waiting`.

- **URL**: `/api/employees/{id}`
- **Method**: `DELETE`
- **Auth Required**: Yes (Bearer Token)
- **Permissions**: `ROLE_ADMIN`, `ROLE_HM`

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | integer | Yes | ID of the employee to delete. |

### Logic & Business Rules
- **Status Validation**: The employee must have the `Waiting` status. If not, a `409 Conflict` is returned.
- **Creator Rules**:
  - **ROLE_ADMIN**: Can delete any `Waiting` employee.
  - **ROLE_HM**: Can ONLY delete `Waiting` employees who hold `ROLE_WS` or `ROLE_SS`.
- **Cascade Delete**: Automatically removes associated records in `CareerChanges` and `Users` before deleting the `Employees` record to maintain referential integrity.

### Success Response (200 OK)
```json
{
    "success": true,
    "message": "Employee deleted successfully",
    "data": "Employee deleted successfully"
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

#### 409 Conflict
```json
{
    "success": false,
    "message": "Chỉ có thể xóa nhân viên đang ở trạng thái Waiting",
    "data": null
}
```

#### 403 Forbidden
```json
{
    "success": false,
    "message": "HR Manager chỉ có thể xóa nhân viên có role WS hoặc SS",
    "data": null
}
```