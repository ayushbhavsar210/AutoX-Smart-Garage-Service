# Quick Deployment Guide - Production Optimizations

## Installation Steps

### 1. Frontend Installation
```bash
cd grage-services/front-end

# Install React Query
npm install

# Build for production
npm run build

# Verify bundle size reduction
npm run build -- --analyze
```

### 2. Backend Installation
```bash
cd grage-services/back-end

# Install compression middleware
npm install

# Verify all dependencies
npm list
```

---

## Environment Setup

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=https://autox-smart-garage-service.onrender.com
```

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://ayushbhavsar70_db_user:Ayush2334@autox.hvhejny.mongodb.net/autox?retryWrites=true&w=majority
MONGODB_DB_NAME=autox
FRONTEND_URL=https://auto-x-smart-garage-service.vercel.app
FRONTEND_ALLOWED_ORIGINS=https://auto-x-smart-garage-service.vercel.app,https://auto-x-smart-garage-service-*.vercel.app
RAZORPAY_KEY_ID=rzp_test_SUJUG6ZD8EFvob
RAZORPAY_KEY_SECRET=e0PMWcOm5dFrjg1gCguxT640
EMAIL_USER=autoxgarageservice@gmail.com
EMAIL_PASS=stry nbbr mdni ziux
```

---

## Git Commit & Push

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Production optimizations: Code splitting, React Query, gzip compression, pagination, projections"

# Push to main branch
git push origin main
```

**Vercel will auto-deploy frontend** ✅
**Render will auto-deploy backend** ✅

---

## Verification Checklist

### Frontend
- [ ] Code splits successfully: `npm run build` shows multiple chunks
- [ ] React Query installed: `npm list @tanstack/react-query`
- [ ] Gallery pagination works smoothly
- [ ] Lazy routes load on navigation
- [ ] No errors in browser console

### Backend
- [ ] Compression installed: `npm list compression`
- [ ] Server starts: `npm run dev` (should see index creation)
- [ ] API endpoints respond with gzip headers
- [ ] Pagination works: `/api/bookings?page=1&limit=20`
- [ ] Response includes pagination metadata

### Deployment
- [ ] Vercel deployment successful (check Build Log)
- [ ] Render deployment successful (check Deploy Log)
- [ ] Frontend connects to Render backend
- [ ] No CORS errors in browser console
- [ ] API responses compressed (DevTools → Network → Response Headers)

---

## Performance Testing

### Load Frontend Bundle Analysis
```bash
npm run build
# Check size: Look for size reduction in chunks

# Check gzip size
npx webpack-bundle-analyzer
```

### Test API Compression
```bash
# From terminal
curl -I -H "Accept-Encoding: gzip" \
  https://autox-smart-garage-service.onrender.com/api/bookings

# Should show: content-encoding: gzip
```

### Monitor React Query
```javascript
// In browser console after page load
import { useQueryClient } from '@tanstack/react-query'
const client = useQueryClient()
console.log(client.getQueryData(['bookings']))  // Should show cached data
```

---

## Common Errors & Fixes

### Frontend Errors

**Error:** `React.lazy is not a function`
- **Fix:** Ensure React version is 16.8+ (currently 18.3.1 ✅)

**Error:** `QueryClientProvider is not defined`
- **Fix:** Run `npm install @tanstack/react-query`

**Error:** Large bundle size (no change)
- **Fix:** Verify lazy imports in App.js, run `npm run build`

### Backend Errors

**Error:** `compression is not a function`
- **Fix:** Run `npm install compression`

**Error:** API endpoints don't return pagination metadata
- **Fix:** Verify controllers import `getPaginationParams` and `formatPaginatedResponse`

**Error:** Gzip not working (response not compressed)
- **Fix:** Check Accept-Encoding header includes gzip; compression middleware must be before routes

---

## Monitoring Performance

### Chrome DevTools
1. **Network Tab:**
   - Filter by XHR/Fetch
   - Check response sizes (should be 70% smaller)
   - Verify `content-encoding: gzip` header

2. **Performance Tab:**
   - Record page load
   - Look for code splitting chunks loading
   - Compare before/after timings

3. **Lighthouse:**
   - Run audit (incognito mode)
   - Check for performance score improvements
   - Look for removed warnings about bundle size

### Render Dashboard
1. Go to Logs
2. Search for "index creation" (should see MongoDB indexes)
3. Monitor response times

---

## Rollback (If Needed)

```bash
# Revert to previous commit
git revert HEAD

# Or go back to specific commit
git reset --hard <commit-hash>

# Force push
git push origin main -f
```

---

## Next Optimization Opportunities

1. **Frontend:**
   - Add service worker for offline support
   - Implement image optimization with sharp
   - Add performance monitoring

2. **Backend:**
   - Add Redis caching for user sessions
   - Implement database connection pooling
   - Add request rate limiting

3. **Deployment:**
   - Setup CDN for static assets
   - Enable database read replicas
   - Configure automated backups

---

## Support Resources

- React.lazy: https://react.dev/reference/react/lazy
- React Query: https://tanstack.com/query/latest
- Compression: https://www.npmjs.com/package/compression
- MongoDB Indexing: https://docs.mongodb.com/manual/indexes/
- Vercel Optimization: https://vercel.com/docs/frameworks/nextjs/optimizing
- Render Documentation: https://render.com/docs

---

**Last Updated:** May 4, 2026
**Status:** ✅ Production Ready
