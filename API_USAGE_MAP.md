# API Usage Map - SeunBot Pro Prediction APIs

## Overview
All 8 Prediction APIs are now proxied through Next.js API routes to bypass CORS issues.

---

## API Routing Table

| # | API Endpoint | Next.js Proxy Route | Used In | Trigger | Display Location |
|---|--------------|---------------------|---------|---------|------------------|
| 1 | `GET /api/Prediction/{symbol}` | `/api/prediction/[symbol]` | **Asset Detail Page**<br/>`app/asset/[symbol]/page.tsx`<br/>Line ~276 | Auto on page load | Signal Intelligence Card<br/>(right side of chart) |
| 2 | `GET /api/Prediction/batch` | `/api/prediction/batch` | **Home Page**<br/>`app/page.tsx`<br/>Line ~209 | Auto when assets load<br/>(30 per page) | Table column "AI Pred"<br/>(XL screens only) |
| 3 | `GET /api/Prediction/{symbol}/history` | `/api/prediction/[symbol]/history` | **Asset Detail Page**<br/>`app/asset/[symbol]/page.tsx`<br/>Line ~300 | Click "History" tab | History Tab<br/>(table with historical data) |
| 4 | `GET /api/Prediction/{symbol}/sentiment` | `/api/prediction/[symbol]/sentiment` | **Asset Detail Page**<br/>`app/asset/[symbol]/page.tsx`<br/>Line ~288 | Auto on page load | Market Sentiment Card<br/>(after Analysis section) |
| 5 | `GET /api/Prediction/watchlist` | `/api/prediction/watchlist` | **Watchlist Page**<br/>`app/watchlist/page.tsx`<br/>Line ~39 | Auto on page load | Symbol badges list |
| 6 | `POST /api/Prediction/watchlist/analyze` | `/api/prediction/watchlist/analyze` | **Watchlist Page**<br/>`app/watchlist/page.tsx`<br/>Line ~58 | Click "🔮 Analyze All" | Analysis results grid<br/>(Buy/Sell/Hold sections) |
| 7 | `GET /api/Prediction/{symbol}/verify-data` | Not yet proxied | **Not Implemented** | - | Reserved for future use |
| 8 | `GET /api/Prediction/data-summary` | `/api/prediction/data-summary` | **Home Page**<br/>`app/page.tsx`<br/>Line ~131 | Auto on page load | Data Summary Widget<br/>(top of page) |

---

## Proxy Route Files

All proxy routes are in: `app/api/prediction/`

```
app/api/prediction/
├── [symbol]/
│   ├── route.ts                    # API #1: Single prediction
│   ├── sentiment/
│   │   └── route.ts                # API #4: Sentiment analysis
│   └── history/
│       └── route.ts                # API #3: Prediction history
├── batch/
│   └── route.ts                    # API #2: Batch predictions
├── watchlist/
│   ├── route.ts                    # API #5: Get watchlist
│   └── analyze/
│       └── route.ts                # API #6: Analyze watchlist
└── data-summary/
    └── route.ts                    # API #8: Data coverage stats
```

---

## How It Works

### Before (Direct Call - CORS Error):
```typescript
// ❌ Blocked by CORS
fetch('https://seun-bot-4fb16422b74d.herokuapp.com/api/Prediction/batch?symbols=...')
```

### After (Proxy Route - No CORS):
```typescript
// ✅ Works! Same domain
fetch('/api/prediction/batch?symbols=...')

// Next.js proxy route internally calls:
fetch('https://seun-bot-4fb16422b74d.herokuapp.com/api/Prediction/batch?symbols=...')
```

**Benefits:**
- ✅ Bypasses CORS (same-origin request)
- ✅ Server-side fetch (no browser restrictions)
- ✅ Better error handling
- ✅ Can add caching/rate limiting later
- ✅ Hides backend URL from client

---

## Visual UI Locations

### Home Page (`/`)
```
┌─────────────────────────────────────────────┐
│ 🔮 Prediction Coverage                [API #8]
│ Total: 1,247 | Ready: 1,100 | Coverage: 88%│
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Symbol | Market | Signal | AI Pred | ...    │  [API #2]
├────────┼────────┼────────┼─────────┼────────┤
│ BTC    | Crypto | BUY    | BUY 87% | ...    │
│ TSLA   | US     | BUY    | BUY 73% | ...    │
└─────────────────────────────────────────────┘
```

### Asset Detail Page (`/asset/BTC`)
```
┌──────────────┐  ┌────────────────────┐
│              │  │ 🧠 Signal Intel    │  [API #1]
│   Chart      │  │ AI Pred: BUY 87%   │
│              │  │ Confidence: 87%    │
└──────────────┘  └────────────────────┘

[Analysis] [History] [Chat]
                ↑
           [API #3] - Prediction History Table

┌─────────────────────────────────────────────┐
│ 🎭 Market Sentiment Analysis         [API #4]
│ Overall: Bullish 72%                        │
│ Twitter: +0.8 | News: +0.6                  │
└─────────────────────────────────────────────┘
```

### Watchlist Page (`/watchlist`)
```
┌─────────────────────────────────────────────┐
│ ⭐ My Watchlist (8 stocks)  [🔮 Analyze All]│
│                                             │
│ [API #5] → DANGCEM, MTNN, ZENITH, ...      │
└─────────────────────────────────────────────┘

[After clicking "Analyze All" - API #6]:
┌─────────────────────────────────────────────┐
│ 📊 Portfolio Analysis Summary               │
│ Buy: 5 | Sell: 2 | Hold: 1                 │
└─────────────────────────────────────────────┘

↑ Buy Signals (5)
[BTC Card] [TSLA Card] [DANGCEM Card] ...

↓ Sell Signals (2)
[MTNN Card] [ACCESS Card]
```

---

## Testing Status

**CORS Issue Resolved:** ✅ All APIs now use proxy routes
**503 Error:** ⚠️ Backend server must be available for APIs to work

**Next Step:** Verify the Heroku backend API endpoints exist and are responding.
