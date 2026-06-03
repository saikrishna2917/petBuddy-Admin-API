# Screen Permissions Module Documentation

The **Screen Permissions Module** provides Role-Based Access Control (RBAC) configurations at the screen level for the admin platform. It defines whether admin roles (e.g., `SUPER_ADMIN`, `SUPPORT_ADMIN`, etc.) have access to specific screens.

---

## 1. Database Schema

The configuration is saved in the `screenPermissions` collection under the following structure:

```javascript
{
  role: {
    type: String,
    enum: ["SUPER_ADMIN", "OPERATIONS_ADMIN", "SUPPORT_ADMIN", "FINANCE_ADMIN"],
    required: true,
    unique: true
  },
  dashboardScreen: { type: Boolean, default: false },
  bookingScreen: { type: Boolean, default: false },
  usersScreen: { type: Boolean, default: false },
  supportScreen: { type: Boolean, default: false }
}
```

---

## 2. API Endpoints Reference

All endpoints are protected under the global admin authorization middleware and require a valid `Authorization: Bearer <JWT_TOKEN>` header.

### Get Permissions
Retrieve configurations for all roles, or filter by a specific role.

*   **URL:** `/api/permissions`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `role` (Optional): Filter configurations by a specific role (e.g. `SUPPORT_ADMIN`).
*   **Success Response (All Roles):**
    ```json
    {
      "success": true,
      "data": [
        {
          "_id": "64f3a21bc9e36b801a24d5ff",
          "role": "SUPPORT_ADMIN",
          "dashboardScreen": true,
          "bookingScreen": false,
          "usersScreen": false,
          "supportScreen": true,
          "createdAt": "2026-06-02T11:00:00.000Z",
          "updatedAt": "2026-06-02T11:00:00.000Z"
        }
      ]
    }
    ```

---

### Add or Update (Upsert) Permissions
Creates a configuration for a role or updates the screen toggles if it already exists.

*   **URL:** `/api/permissions`
*   **Method:** `POST`
*   **Request Headers:** `Content-Type: application/json`
*   **Request Body Payload:**
    ```json
    {
      "role": "SUPPORT_ADMIN",
      "dashboardScreen": true,
      "bookingScreen": false,
      "usersScreen": false,
      "supportScreen": true
    }
    ```
*   **Success Response:**
    ```json
    {
      "success": true,
      "message": "Screen permissions updated successfully",
      "data": { ... }
    }
    ```

---

### Delete Configuration for a Role
Removes the entire configuration document for a specific role.

*   **URL:** `/api/permissions/:role`
*   **Method:** `DELETE`
*   **Success Response:**
    ```json
    {
      "success": true,
      "message": "Permissions configurations deleted successfully for role: SUPPORT_ADMIN"
    }
    ```

---

## 3. Integration & Usage

### Frontend Enforcement Example
To enforce these permissions on the React admin dashboard:
1. Fetch the user's role permissions upon login:
   ```javascript
   const response = await axiosInstance.get(`/api/permissions?role=${user.role}`);
   const permissions = response.data.data; // Object of screen configs
   ```
2. Save permissions to your state management context.
3. Show/hide nav items or components based on flags:
   ```javascript
   if (permissions.bookingScreen) {
     renderBookingsTab();
   }
   ```
