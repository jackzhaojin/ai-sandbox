# Step 8 Notes: Component Registry and Seed Data

## What Was Completed

✅ **Component Registry Schema** - Updated components schema with comprehensive fields
✅ **16 Component Definitions** - Created full definitions for all component types
✅ **Seed Script** - Created `lib/db/seed.ts` with complete seeding logic
✅ **npm Script** - Added `npm run db:seed` command to package.json
✅ **Component Definitions** - All 16 components defined with:
  - name, display_name, category, description
  - default_props with realistic defaults
  - props_schema with field definitions

## Component Types Defined

1. **hero** - Large hero section with heading, subheading, CTA buttons
2. **text** - Rich text editor for formatted content
3. **image** - Single image with optional caption
4. **two-column** - Two-column layout with customizable content
5. **cta** - Call-to-action section with button
6. **testimonial** - Customer testimonial or quote
7. **spacer** - Vertical spacing between sections
8. **accordion** - Expandable accordion with multiple items
9. **tabs** - Tabbed content sections
10. **carousel** - Image or content carousel
11. **video** - Embedded video player
12. **form** - Contact or submission form
13. **card-grid** - Grid of cards with image, title, description
14. **embed** - Embed external content via HTML/iframe
15. **header** - Site header with logo and navigation
16. **footer** - Site footer with links and info

## Seed Data Includes

- **3 Users**: admin@pageforge.dev, author@pageforge.dev, viewer@pageforge.dev (all with password: password123)
- **1 Demo Site**: "PageForge Demo" with slug "demo"
- **16 Component Definitions**: All component types with schemas
- **5 Page Templates**: Blank, Landing Page, Blog Post, About Page, Contact Page
- **2 Content Fragments**: Global CTA Banner, Company Info Footer
- **3 Sample Pages**: Home (published), About (published), Getting Started (draft)
- **2 Menus**: Header Menu, Footer Menu
- **Theme Config**: Colors, fonts, social links

## Known Limitation

The seed script includes table creation logic, but Supabase's REST API doesn't expose an `exec_sql` RPC function by default.

**Workaround**: Apply schema migrations manually via Supabase SQL Editor first, then run the seed script.

See `MIGRATION_INSTRUCTIONS.md` for complete setup steps.

## Files Created/Modified

- `lib/db/seed.ts` - Complete seeding script
- `lib/db/schema/components.ts` - Updated with new fields (type, label, icon, sortOrder)
- `package.json` - Added `db:seed` script
- `MIGRATION_INSTRUCTIONS.md` - Setup instructions
- `scripts/update-components-schema.ts` - Schema migration helper
- `scripts/migrate-components.ts` - Alternative migration approach
- `scripts/check-schema.ts` - Schema verification tool
- `scripts/list-tables.ts` - Table listing utility

## Next Steps for Implementation

1. Developer applies schema migrations via Supabase SQL Editor
2. Run `npm run db:seed` to populate data
3. Verify component registry is populated
4. Test user login with seeded credentials
5. Confirm all relationships are intact (sites, pages, menus, etc.)

## Testing the Seed

Once tables are created:

```bash
npm run db:seed
```

Expected output:
- Users created (3)
- Site created (1)
- Components seeded (16)
- Templates created (5)
- Fragments created (2)
- Pages created (3)
- Menus created (2)

Test credentials:
- Admin: admin@pageforge.dev / password123
- Author: author@pageforge.dev / password123
- Viewer: viewer@pageforge.dev / password123
