# Deployment Guide - Flame in Freefall

This guide covers deploying the application to Vercel with and without the AI route.

## Prerequisites

- Vercel account (free tier is sufficient)
- GitHub repository with the code
- Node.js 22+ locally for verification

## Option 1: Deploy Without AI (Immediate)

This option deploys all features **except** the `/ask` page. Users can immediately explore, compare, and export data.

### What Works
✅ Explorer with filters and weights  
✅ All 13 investigation detail pages  
✅ Compare view (2-4 investigations)  
✅ Earth applications page  
✅ Coverage gap map  
✅ About page  
✅ CSV/JSON export  
⏸️ Ask page (requires API keys)

### Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework preset: **Next.js**
   - Root directory: leave as `.` (repository root)
   - Click **Deploy**

3. **Environment Variables (Optional for Phase 1)**
   - Skip this step if deploying without AI
   - The app will work without these variables
   - `/ask` page will show "AI unavailable" message

4. **Verify Deployment**
   - Visit your deployment URL (e.g., `your-project.vercel.app`)
   - Test Explorer: Filter by pillar, adjust weights
   - Test Detail: Click any investigation name
   - Test Compare: Select 2-3 investigations, click Compare
   - Test Export: Click "Export CSV" or "Export JSON"
   - Test Earth: Visit `/earth` route
   - Test Coverage: Visit `/coverage` route

5. **Custom Domain (Optional)**
   - In Vercel project settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

### Expected Build Output

```
Route (app)                              Size
┌ ○ /                                    142 kB
├ ○ /about                               152 kB
├ ● /api/ask                             0 B
├ ○ /ask                                 145 kB
├ ○ /compare                             148 kB
├ ○ /coverage                            146 kB
├ ○ /earth                               145 kB
└ ● /investigations/[id]                 147 kB
    ├ /investigations/bass-ii
    ├ /investigations/saffire-i
    └ [+11 more paths]

○ Static (prerendered at build time)
● Dynamic (server-rendered on demand)
```

---

## Option 2: Deploy With AI (Full Features)

This option includes the `/ask` page with Gemini-powered Q&A.

### Additional Prerequisites

1. **Gemini API Key**
   - Get a key from [Google AI Studio](https://aistudio.google.com/apikey)
   - In Google Cloud Console, restrict the key to:
     - **Generative Language API** only
     - Your production domain (optional but recommended)
   - Copy the API key

2. **Upstash Redis Database**
   - Option A: Via Vercel Marketplace (recommended)
     - In your Vercel project → Integrations → Browse Marketplace
     - Search for "Upstash Redis"
     - Click "Add Integration"
     - Create a new database (free tier: 10,000 commands/day)
     - Environment variables are automatically added to your project
   
   - Option B: Direct from Upstash
     - Go to [console.upstash.com](https://console.upstash.com)
     - Create account (free tier available)
     - Create a new Redis database
     - Copy the connection details

### Steps

1. **Set Environment Variables**

   In Vercel project settings → Environment Variables, add:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   If using Upstash directly (not via Vercel Marketplace), also add:
   ```
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   ```

   Apply to: **Production**, **Preview**, and **Development**

2. **Redeploy**
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy with env vars"
   git push origin main
   ```

   Or click **Redeploy** in Vercel dashboard

3. **Verify AI Route**
   - Visit `/ask` on your deployment
   - Try a golden question: "Which investigation used PMMA fuel?"
   - Verify the response includes:
     - A cited answer
     - Citation chips linking to investigations
     - No system prompt leakage
     - Extrapolation badge if Moon-related

4. **Test Rate Limiting**
   ```bash
   # From your local machine
   curl -X POST https://your-project.vercel.app/api/ask \
     -H "Content-Type: application/json" \
     -d '{"question":"Which investigation tested solid fuels?"}'
   ```

   After 10 requests in 1 minute from the same IP, should return:
   ```json
   {
     "error": "Too many requests",
     "retryAfter": 42
   }
   ```

5. **Run Golden Questions**
   ```bash
   # Locally, against production
   NEXT_PUBLIC_API_URL=https://your-project.vercel.app npm run golden
   ```

   Target: 11 of 12 passing (G5 and G6 should return `no_data`)

### Security Checklist

After deployment with AI:

- [ ] Gemini API key restricted to Generative Language API in Google Console
- [ ] Key not visible in client bundle (check browser DevTools → Sources)
- [ ] No API key in git history (`git log --all -S "AIza" --source --all`)
- [ ] Rate limiter working (10/min, 60/day per IP)
- [ ] `/api/ask` logs show salted IP hashes, not questions or answers
- [ ] No cookies created (DevTools → Application → Cookies should be empty)
- [ ] No localStorage used (DevTools → Application → Local Storage should be empty)
- [ ] Banner present on every page
- [ ] Footer disclaimer present on every page

---

## Performance Targets

After deployment, run these checks:

### Lighthouse (Mobile)

```bash
npx lighthouse https://your-project.vercel.app --preset=perf --view
```

**Targets:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

### Bundle Size

Check the build output:

```bash
npm run build
```

**Targets:**
- Initial JS (gzip): < 200 KB
- First Load JS: < 250 KB
- Each route: < 160 KB

### API Response Time

Test 20 requests:

```bash
for i in {1..20}; do
  curl -w "@curl-format.txt" -o /dev/null -s \
    -X POST https://your-project.vercel.app/api/ask \
    -H "Content-Type: application/json" \
    -d '{"question":"Which investigation tested PMMA?"}'
done
```

Create `curl-format.txt`:
```
time_total: %{time_total}s\n
```

**Targets:**
- p50: ≤ 8 seconds
- p95: ≤ 15 seconds

---

## Troubleshooting

### Build Fails

**Error:** `Module not found: Can't resolve '@/lib/...'`
- **Fix:** Ensure `tsconfig.json` has correct path mappings
- Check `baseUrl` is set to `.`
- Check `paths` includes `"@/*": ["./*"]`

**Error:** `Type error: Property 'X' does not exist`
- **Fix:** Run `npm run typecheck` locally first
- Fix all TypeScript errors before pushing

### `/ask` Returns 500

**Check logs in Vercel:**
- Project → Deployments → Click deployment → Functions → `/api/ask`

**Common causes:**
1. Missing `GEMINI_API_KEY`
   - Fix: Add in Environment Variables
2. Invalid API key
   - Fix: Generate new key in Google AI Studio
3. Quota exceeded
   - Fix: Check quota in Google Cloud Console
4. Upstash connection failed
   - Fix: Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Rate Limiter Not Working

**Symptom:** No 429 errors after >10 requests

**Fix:**
1. Check Upstash Redis is connected
2. Verify environment variables are set for Production
3. Check Vercel deployment logs for Redis connection errors

### CSS Styles Not Applied

**Symptom:** Page looks unstyled

**Fix:**
1. Check Tailwind config is correct
2. Verify `globals.css` is imported in `app/layout.tsx`
3. Clear Vercel cache: Settings → General → Clear Cache & Redeploy

---

## Monitoring

### Vercel Analytics (Recommended)

Enable in Project Settings → Analytics:
- Web Vitals tracking
- Audience insights
- Top pages

Free tier: 100k events/month

### Upstash Metrics

Monitor Redis usage:
- Dashboard → Your Database → Metrics
- Watch daily command count (free tier: 10k/day)
- Set up alerts at 80% usage

### Custom Monitoring

Add to `/api/ask/route.ts` for advanced monitoring:

```typescript
// Example: Log to external service
if (process.env.NODE_ENV === 'production') {
  await fetch('https://your-logging-service.com/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      status: 'success',
      latency: Date.now() - start,
      tokenCount: response.usage?.totalTokens,
    }),
  });
}
```

---

## Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update patch versions (safe)
npm update

# Update major versions (test thoroughly)
npm install next@latest react@latest react-dom@latest

# Run full test suite
npm run lint && npm run typecheck && npm test
```

### Rotate API Keys

If key is compromised:

1. Generate new Gemini API key
2. Update in Vercel Environment Variables
3. Redeploy
4. Delete old key in Google Cloud Console
5. Monitor for unauthorized usage

### Database Maintenance

Upstash Redis (free tier) automatically evicts old keys. No manual maintenance needed.

---

## Rollback Procedure

If deployment has issues:

1. **In Vercel Dashboard:**
   - Go to Deployments
   - Find last working deployment
   - Click ⋯ menu → Promote to Production

2. **Or via Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Verify:**
   - Check deployment completes
   - Test critical paths
   - Monitor error rate

---

## Production Checklist

Before announcing the deployment:

- [ ] All routes load without errors
- [ ] Explorer filters work
- [ ] Detail pages display correctly
- [ ] Compare accepts 2-4 investigations
- [ ] Export downloads CSV and JSON
- [ ] `/ask` returns valid answers (if enabled)
- [ ] Rate limiter blocks after 10 requests
- [ ] Banner shows on all pages
- [ ] Footer disclaimer present
- [ ] No console errors in browser DevTools
- [ ] Lighthouse Performance ≥ 90
- [ ] Mobile responsive (test on actual device)
- [ ] Keyboard navigation works
- [ ] Links open in new tabs have `rel="noopener noreferrer"`

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Upstash Docs:** https://docs.upstash.com
- **Gemini API:** https://ai.google.dev/docs

For issues specific to this project, check:
- `README.md` - Setup and installation
- `docs/checklist.md` - Implementation status
- `docs/export-format.md` - Export specifications
- GitHub Issues (if public repository)
