
## 🧠 GLOBAL OVERVIEW

Your system supports:

* **Multi-tenant** (multiple organizations or clients — each is a `Tenant`)
* **User management** with roles & permissions
* **Session tracking**
* **Unified audit logging**
* **Billing plans & policies**

---

## 🗃️ Detailed Table-by-Table Explanation

### 1. **Tenant**

#### 📌 Purpose

Represents each **organization or workspace** using your platform.
All users, roles, sessions, and audits belong to a tenant.

#### 🧩 Key Fields

| Field                   | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `id`                    | Unique identifier for the tenant                |
| `name`                  | Display name (e.g., "Acme Inc.")                |
| `domain`                | Optional domain (e.g., `mitra.com, or url`)     |
| `plan_type`             | Subscription type (`free`, `pro`, `enterprise`) |
| `status`                | `active`, `suspended`, etc.                     |
| `default_admin_user_id` | Links to the tenant’s default admin user        |
| `storage_limit_mb`      | Maximum storage allocated for the tenant        |

#### 🔗 Relations

* `users` → all users in that tenant
* `roles` → role definitions for that tenant
* `sessions` → active sessions for users in tenant
* `auditLogs` → all actions done within the tenant
* `tenantPolicies` → configuration for usage, storage, etc.

#### 💡 Example Use Case

When an organization “**YiMitra**” signs up, a record is created in `Tenant`.
All their users, audits, and sessions reference this tenant.

---

### 2. **User**

#### 📌 Purpose

Represents a **person (admin, moderator, or end-user)** in the system.
Each user can belong to one tenant and can have multiple sessions and actions.

#### 🧩 Key Fields

| Field           | Description                                        |
| --------------- | -------------------------------------------------- |
| `tenant_id`     | Which organization this user belongs to            |
| `email`         | Unique login credential                            |
| `role`          | Role name (like `admin`, `editor`, `viewer`)       |
| `status`        | Whether active, suspended, or pending verification |
| `auth_provider` | Login provider (`local`, `google`, `github`, etc.) |

#### 🔗 Relations

* Belongs to one `Tenant`
* Has multiple `Session`, `AuditLogs`, and `UserOrgMap`
* Can manage tenant policies if admin

#### 💡 Example Use Case

* “Ravi Sharma” (Admin of `YiMitra`) logs in and edits knowledge articles.
  → The actions are logged under `AuditLogs` and tied to `User.id`.

---

### 3. **UserOrgMap**

#### 📌 Purpose

Links **users to tenants (organizations)**.
Useful if one user is part of multiple tenants/workspaces.

#### 🧩 Key Fields

| Field                  | Description                          |
| ---------------------- | ------------------------------------ |
| `user_id`, `tenant_id` | Composite unique key — no duplicates |
| `role_in_org`          | Role of the user in that tenant      |

#### 💡 Example Use Case

* “Ravi” belongs to both `YiMitra` and `FoodNet`, as:

  * `YiMitra`: `Admin`
  * `FoodNet`: `Contributor`

---

### 4. **Role**

#### 📌 Purpose

Defines **custom roles** per tenant (RBAC system).

#### 🧩 Key Fields

| Field         | Description                       |
| ------------- | --------------------------------- |
| `name`        | e.g., `Admin`, `Editor`, `Viewer` |
| `description` | Purpose of the role               |

#### 🔗 Relations

* Belongs to one `Tenant`
* Has multiple `RolePermission`

#### 💡 Example Use Case

Each tenant can define custom roles like:

> “SupportAgent” → Can view and reply to chats but not delete data.

---

### 5. **RolePermission**

#### 📌 Purpose

Defines **permissions (granular access)** for each role.

#### 🧩 Key Fields

| Field            | Description                                   |
| ---------------- | --------------------------------------------- |
| `role_id`        | Links to Role                                 |
| `permission_key` | e.g., `chat:read`, `user:update`, `kb:create` |

#### 💡 Example Use Case

`Editor` role might have permissions:

```json
["kb:create", "kb:edit", "kb:view"]
```

---

### 6. **Session**

#### 📌 Purpose

Represents a **login session** for a user (web, mobile, etc.).
Helps track where the user logged in and their device info.

#### 🧩 Key Fields

| Field                                     | Description                        |
| ----------------------------------------- | ---------------------------------- |
| `device_id`, `device_type`, `device_name` | Device tracking                    |
| `ip_address`, `user_agent`, `location`    | Context of session                 |
| `is_active`                               | Whether the session is still valid |
| `refresh_token`, `token_version`          | Used for JWT refresh flow          |

#### 🔗 Relations

* Belongs to one `User` and `Tenant`
* Has multiple `SessionLog`

#### 💡 Example Use Case

When a user logs in from Chrome on desktop → creates a `Session` entry.
When they log in from their mobile app → another `Session` entry.

---

### 7. **SessionLog**

#### 📌 Purpose

Records events that happen **within a session** (e.g., login, logout, refresh).

#### 🧩 Key Fields

| Field        | Description                              |
| ------------ | ---------------------------------------- |
| `session_id` | Parent session                           |
| `event`      | `"LOGIN"`, `"LOGOUT"`, `"TOKEN_REFRESH"` |
| `details`    | JSON for event metadata                  |

#### 💡 Example Use Case

When a user logs out → a `SessionLog` entry is created with `event="LOGOUT"`.

---

### 8. **AuditLogs**

#### 📌 Purpose

**Unified audit trail** for tracking *who did what, when, and where*.
Used across modules like chat, KB, user management, etc.

#### 🧩 Key Fields

| Field                      | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `module`                   | App module (chat, kb, admin, etc.)                     |
| `action`                   | Operation type (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`) |
| `target_type`              | Entity acted upon (`User`, `Message`, `Article`)       |
| `target_id`                | ID of affected record                                  |
| `status`                   | `"SUCCESS"` or `"FAILED"`                              |
| `metadata`                 | JSON with before/after snapshots                       |
| `ip_address`, `user_agent` | Context for audit event                                |

#### 💡 Example Use Cases

* User deletes a message →
  `action="DELETE"`, `module="chat"`, `target_type="Message"`
* Admin updates KB article →
  `action="UPDATE"`, `module="knowledge_base"`, `metadata={old:"x",new:"y"}`

---

### 9. **TenantPolicy**

#### 📌 Purpose

Defines **per-tenant configuration and usage limits**.

#### 🧩 Key Fields

| Field              | Description                     |
| ------------------ | ------------------------------- |
| `storage_limit_mb` | Max storage allowed             |
| `allow_auto_sync`  | Toggle for automated operations |
| `created_by`       | Which user created the policy   |

#### 💡 Example Use Case

Tenant “YiMitra” has:

```json
{
  "storage_limit_mb": 2048,
  "allow_auto_sync": true
}
```

---

### 10. **BillingPlan**

#### 📌 Purpose

Represents **subscription or billing plans** that tenants can choose from.

#### 🧩 Key Fields

| Field                         | Description                                                |
| ----------------------------- | ---------------------------------------------------------- |
| `name`                        | Plan name (`Free`, `Pro`, `Enterprise`)                    |
| `monthly_fee`, `x_per_charge` | Billing rates                                              |
| `limits`                      | JSON defining feature caps (e.g., users:100, messages:10k) |

#### 💡 Example Use Case

Pro plan might look like:

```json
{
  "name": "Pro",
  "monthly_fee": 999.00,
  "limits": { "max_users": 100, "storage_mb": 2048 }
}
```

---

## 🔐 RELATION SUMMARY

| Model     | Connected To                                 | Relationship Type |
| --------- | -------------------------------------------- | ----------------- |
| Tenant    | User, Role, Session, AuditLogs, TenantPolicy | One-to-Many       |
| User      | Tenant, Session, AuditLogs                   | Many-to-One       |
| Role      | Tenant, RolePermission                       | One-to-Many       |
| Session   | User, Tenant, SessionLog                     | Many-to-One       |
| AuditLogs | Tenant, User                                 | Many-to-One       |

---

## 🧩 REAL FLOW EXAMPLES

### Example 1: Admin edits a Knowledge Base Article

1. Admin (User) sends PUT `/kb/123`.
2. Backend updates the `Article` record.
3. Logs an entry in `AuditLogs`:

   ```json
   {
     "tenant_id": "tnt_001",
     "user_id": "usr_001",
     "actor_role": "admin",
     "module": "knowledge_base",
     "action": "UPDATE",
     "target_type": "Article",
     "target_id": "kb_123",
     "metadata": {"old_title": "Intro", "new_title": "Intro to AI"},
     "status": "SUCCESS"
   }
   ```

### Example 2: User Login

1. User logs in from Chrome → `Session` created.
2. `SessionLog` records `"LOGIN"`.
3. `AuditLogs` records `"LOGIN"` with `module="auth"`.

