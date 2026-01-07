import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // 1. Pega todos os cookies
  const allCookies = req.cookies.getAll()
  
  // 2. Procura qualquer cookie que pareça ser de autenticação
  // Aceita: 'sb-access-token', 'supabase-auth-token', ou qualquer coisa começando com 'sb-'
  const hasAuthCookie = allCookies.some((cookie) => {
    return cookie.name.includes('sb-') || 
           cookie.name.includes('supabase') ||
           cookie.name.includes('auth-token');
  });

  const isLoginPage = req.nextUrl.pathname === '/login';
  
  // Se estamos na Home ('/') ou Carrinho, precisamos verificar login
  const isProtectedPage = req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/carrinho');

  // CASO 1: Tenta entrar na Home/Carrinho SEM login -> Manda pro Login
  if (isProtectedPage && !hasAuthCookie) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // CASO 2: Tenta entrar no Login JÁ TENDO login -> Manda pra Home
  if (isLoginPage && hasAuthCookie) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/carrinho/:path*', '/login'],
}