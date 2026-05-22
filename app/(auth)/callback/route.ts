// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '../../utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 1. If we got a secure auth code back from Google/Supabase
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 🟢 SUCCESS: Force an absolute redirect straight onto the dashboard
      return NextResponse.redirect(new URL('/diagnostic', request.url))
    } else {
      console.error("Supabase Session Exchange Error:", error.message)
    }
  }

  // 2. Fallback: If code is missing or session exchange fails, kick back to login portal screen
  return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
}