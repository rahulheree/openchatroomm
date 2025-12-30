# Release Notes - Stabilization Patch

## 🛠 Critical Fixes
- **WebSocket Connectivity**: Fixed "Connecting..." loops and "Connection Lost" errors by implementing dynamic environment detection.
- **Cross-Origin (CORS)**: Solved blocked connections between Frontend (Vercel/Localhost) and Backend (Render) using valid Regex patterns (wildcards are blocked when credentials are used).
- **Session Security**: 
  - **Localhost**: Uses `Lax` cookies (HTTP-friendly).
  - **Production**: Uses `Secure` cookies (HTTPS-required).
- **User Experience**: Removed all aggressive `alert()` popups and page reloads. Replaced with non-intrusive notifications.

## 🚀 Deployment Updates
- **Render**: Added `RENDER=true` environment variable requirement to trigger Secure cookies.
- **Supabase/MinIO**: Verified configuration for file uploads.

## 🧪 How to Test
1. **Local**: Run `npm run dev` and `python main.py`. Login should work without "Secure Cookie" warnings.
2. **Production**: Deploy to Render/Vercel. Cross-site WebSockets should now connect instantly.
