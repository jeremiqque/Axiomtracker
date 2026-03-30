## Task Progress: Dynamic Credential Types & Image Persistence ✅

### Completed:
- ✅ Image upload/edit persistence confirmed working in both CompanyCredentials.tsx & AddCredentials.tsx
  - Supabase storage upload
  - DB image_url persistence
  - Edit mode loads existing images
  - Preview + re-upload support

### Plan Breakdown & Steps:

**1. Create Supabase Table for Credential Types (DB Migration)**
   - Table: `credential_types` (id:uuid, name:string, created_at:timestamptz)
   - RLS policies for user access
   - Migrate existing localStorage types

**2. Update credentialsService.ts**
   - Add: getCredentialTypes(), createCredentialType(name:string)
   - Integrate into existing service

**3. Update CompanyCredentials.tsx**
   - Replace hardcoded + localStorage with dynamic DB fetch
   - Update modal to use createCredentialType()
   - Auto-refresh types after add

**4. Update AddCredentials.tsx**
   - Same as above (shared types now)

**5. Update Credentials.tsx**
   - Add "Type" column to table
   - Add type filter dropdown
   - Include type in search/filtering

**6. Testing & Cleanup**
   - Test new type creation → appears in all dropdowns + list
   - Test edit existing credential
   - Migrate localStorage to DB
   - Remove localStorage code

### Next Step: [4/6] ✅ Added getCredentialTypes() & createCredentialType() to credentialsService.ts + CredentialType.ts interface  
**Next:** [4/6] ✅ CompanyCredentials.tsx → DB types + create (test in app to verify table access)
**Next:** [5/6] ✅ CompanyCredentials.tsx complete. Update AddCredentials.tsx for dynamic types
