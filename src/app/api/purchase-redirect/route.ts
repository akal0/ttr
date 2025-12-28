import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * This endpoint generates a simple HTML page that sets a localStorage flag
 * and redirects to the thank-you page. It's called when a webhook detects
 * a purchase for a user's anonymousId.
 */
export async function GET(request: NextRequest) {
  // Could use anonymousId for additional tracking if needed
  // const searchParams = request.nextUrl.searchParams;
  // const anonymousId = searchParams.get("anonymousId");

  // Simple HTML that sets flag and redirects
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <style>
    body {
      background: #020513;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .loader {
      text-align: center;
    }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top: 3px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Purchase successful! Redirecting...</p>
  </div>
  <script>
    // Set flag in localStorage
    localStorage.setItem('aurea_just_purchased', 'true');
    
    // Redirect to thank-you page
    setTimeout(() => {
      window.location.href = '/thank-you?from_checkout=true';
    }, 500);
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
