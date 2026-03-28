# Known Issues and Limitations

## Build Issues

### 1. Next.js 16 Production Build Failure

**Issue**: Production build fails with error in `/_global-error` page
```
TypeError: Cannot read properties of null (reading 'useContext')
```

**Cause**: This is a known bug in Next.js 16.1.6 with Turbopack when attempting to prerender the global error boundary page. The issue occurs when client components using React Context are included in layouts that are statically generated.

**Impact**: `npm run build` fails, preventing production deployment

**Workaround**:
- Development server (`npm run dev`) works perfectly
- All application features are functional in development mode
- Build can be fixed by either:
  1. Downgrading to Next.js 15.x, or
  2. Waiting for Next.js 16.2+ which should include a fix
  3. Temporarily disabling static optimization (not recommended)

**Related**:
- Next.js issue tracker: https://github.com/vercel/next.js/issues
- Middleware deprecation warning is also present in Next.js 16

## ESLint Warnings

The project has 386 ESLint issues (187 errors, 199 warnings):
- **Most common**: `@typescript-eslint/no-explicit-any` (should replace `any` with proper types)
- **React warnings**: Missing keys in lists, unescaped entities, accessibility issues
- **Unused variables**: Several imported but unused variables across files

**Impact**: Code quality and type safety
**Priority**: Medium - does not affect functionality but should be addressed

**Recommendation**: Address these in a dedicated code quality pass:
1. Replace `any` types with proper TypeScript interfaces
2. Add missing React keys to list items
3. Fix accessibility warnings (labels, keyboard handlers)
4. Remove unused imports and variables

## Database/Environment

### Environment Variables
All required environment variables are documented in `.env.example`

### Database Schema
- Full Supabase schema with RLS policies
- Row Level Security enabled for multi-tenancy
- Triggers for auto-profile creation

## Performance Notes

**Tested Scenarios**:
- Page loads: ~100-300ms (development mode with Supabase)
- Editor with 20+ components: Responsive, no lag
- Media library with 50+ files: Fast loading

**Not Tested**:
- Production build performance (blocked by build issue)
- Load testing with multiple concurrent users
- Large pages (100+ components)

## Browser Compatibility

**Tested**:
- Chrome/Edge (latest) - Fully functional
- Safari (latest) - Expected to work (not comprehensively tested)
- Firefox (latest) - Expected to work (not comprehensively tested)

**Not Tested**:
- Mobile browsers
- IE11 or older browsers (not supported)

## Missing Features / Future Enhancements

1. **Email notifications** - Infrastructure is in place but not implemented
2. **Advanced SEO features** - Basic meta tags work, but could add:
   - Open Graph previews
   - Twitter Cards
   - JSON-LD structured data
3. **Media optimization** - Images uploaded but not automatically optimized
4. **CDN integration** - Media served from Supabase storage, not CDN
5. **Webhook retry logic** - Webhooks fire once, no retry on failure
6. **API rate limiting** - API keys work but no rate limiting
7. **Content versioning UI** - Versions are saved but comparison UI is basic
8. **Multi-language support** - Not implemented
9. **Advanced permissions** - Basic roles (admin/editor/author), no granular permissions

## Accessibility

- Keyboard navigation implemented
- ARIA labels on interactive elements
- Screen reader support (basic)
- Accessibility audit tool integrated (axe-core)

**Needs improvement**:
- Some form labels missing associations (ESLint warnings)
- Color contrast not audited
- Focus management in modals could be better

## Security Notes

1. **RLS Policies**: Comprehensive row-level security for multi-tenancy
2. **API Keys**: Hashed with bcrypt, can be revoked
3. **Authentication**: Supabase Auth with secure sessions
4. **Input Validation**: Zod schemas for forms, but not comprehensive

**Recommendations**:
- Add CSRF protection for forms
- Implement rate limiting on API endpoints
- Add Content Security Policy headers
- Audit for SQL injection (using Drizzle ORM should prevent)

## Testing Status

✅ **Manual Testing Performed**:
- User registration and login
- Site creation
- Page creation and editing (basic)
- Component drag-and-drop
- Media upload

❌ **Not Tested**:
- Automated tests (none written)
- E2E testing
- Integration tests
- Unit tests for utilities

**Test Coverage**: 0% (no test suite exists)

## Documentation

✅ **Available**:
- README with setup instructions
- Database setup guide (DATABASE_SETUP.md)
- Auth setup guide (AUTH_SETUP.md)
- RLS policies documentation (RLS_SETUP.md)
- Accessibility guide (ACCESSIBILITY.md)
- Step completion docs (STEP*_COMPLETION.md)

❌ **Missing**:
- API documentation
- Component library documentation
- Deployment guide
- Troubleshooting guide
- Contributing guidelines

## Deployment Readiness

**Blockers**:
- ❌ Production build fails (Next.js 16 bug)

**Ready for Development/Staging**:
- ✅ Development server works
- ✅ Database schema complete
- ✅ Authentication functional
- ✅ Core features implemented

**Before Production**:
1. Fix or workaround Next.js build issue
2. Address critical ESLint errors
3. Add error monitoring (Sentry, LogRocket, etc.)
4. Set up CI/CD pipeline
5. Add automated tests
6. Security audit
7. Performance testing
8. Load testing

---

Last updated: 2026-02-04
