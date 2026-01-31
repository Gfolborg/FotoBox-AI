# Builder Mode Setup

Builder mode allows developers/builders to test the FotoBox AI app without consuming credits or seeing watermarks on generated images. This feature is **only available in test/development environments** and is completely disabled in production.

## Environment Setup

Builder mode is controlled by two environment variables:

### 1. `BUILDER_MODE_ENABLED`
Set to `"true"` to enable builder mode in your test environment.

**Example (test/dev environment):**
```bash
BUILDER_MODE_ENABLED=true
```

**Production:** This should NOT be set or should be set to `"false"`. When not enabled, builder mode is completely disabled.

### 2. `BUILDER_USER_ID`
The UUID of the user account that should have builder privileges.

**Example:**
```bash
BUILDER_USER_ID=550e8400-e29b-41d4-a716-446655440000
```

## How to Set Up

### Step 1: Find Your User ID
1. Sign in to the app with the account you want to use for testing
2. Call the `/api/auth/me` endpoint to get your user details
3. Copy the `user.id` value

### Step 2: Configure Environment Variables
Add these to your `.env` (or equivalent configuration):

```
BUILDER_MODE_ENABLED=true
BUILDER_USER_ID=<your-uuid-here>
```

### Step 3: Restart Your Server
Restart the backend server so it picks up the new environment variables.

## What Builder Mode Does

When enabled for a user:

### 1. **Unlimited Credits**
- Image generation requests do NOT consume credits
- Credit deduction is completely skipped
- Usage is still tracked in the `usageHistory` table (with `creditsUsed: 0`)

### 2. **No Watermarks**
- Generated images are returned WITHOUT watermarks
- Even if the client requests watermarks, they are not applied
- This applies to all image generation endpoints:
  - `/api/main-image` (background removal)
  - `/api/lifestyle-scene` (scene generation)
  - `/api/mockup` (mockup generation)

### 3. **API Responses**
The `/api/auth/me` endpoint returns:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "isBuilder": true
  },
  "subscription": { ... }
}
```

The client can use `isBuilder` to show builder-specific UI/features if needed.

## Security Notes

### Production Safety
- Builder mode ONLY works when `BUILDER_MODE_ENABLED === "true"`
- In production, this environment variable should NOT be set
- The code will safely return `false` for `isBuilder()` checks if the env var is not set
- No builder-specific code paths execute if the env var is not enabled

### Database Safety
- The `isBuilder` column in the database is never directly checked
- Instead, the code uses the `isBuilder()` function which verifies `BUILDER_MODE_ENABLED` first
- Even if a user has `isBuilder='true'` in the database, they won't get builder privileges unless the env var is enabled

## Testing

### To Test Builder Mode:

1. Set `BUILDER_MODE_ENABLED=true` and `BUILDER_USER_ID=<your-uuid>` in your dev environment
2. Sign in as that user
3. Generate images - they should not consume credits
4. Images should not have watermarks applied

### To Test Normal Mode (disable builder):

1. Remove or set `BUILDER_MODE_ENABLED=false`
2. Restart the server
3. Generate images - credits should be consumed as normal

## Code References

- **Builder mode helpers:** `/home/runner/workspace/server/builder-mode.ts`
- **Credit deduction logic:** `/home/runner/workspace/server/storage.ts` - `useCredit()` method
- **Auth endpoints:** `/home/runner/workspace/server/auth.ts` - includes `isBuilder` in responses
- **Image generation endpoints:** `/home/runner/workspace/server/routes.ts` - skips watermarks for builders
- **Database schema:** `/home/runner/workspace/shared/schema.ts` - includes `isBuilder` column
