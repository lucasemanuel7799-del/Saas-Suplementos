import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Cria a resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Inicializa o cliente do Supabase com o padrão getAll/setAll (Next.js 15+)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Obtém o usuário (Isso também renova a sessão se necessário)
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAuthPage = request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/register'

  // CASO 1: Usuário NÃO logado tentando acessar área restrita
  if (!user && isProtectedRoute && !isAuthPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // CASO 2: Usuário JÁ logado tentando acessar Login ou Register
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

// O Matcher deve focar no que precisa de proteção
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/checkout/:path*', // Adicionei a API de checkout aqui para garantir a sessão
  ],
}