import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

// 1. Inicializa o cliente do Supabase para Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Atualiza os cookies na requisição e na resposta
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Remove os cookies da requisição e da resposta
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 2. Proteção de Rota: Verifica se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAuthPage = request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/register'

  // Se não estiver logado e tentar acessar o admin (exceto login/register)
  if (!user && isProtectedRoute && !isAuthPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 3. Verificação de Assinatura (Apenas para quem já está logado e no dashboard)
  if (user && isProtectedRoute && !isAuthPage) {
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status, subscription_ends_at')
      .eq('id', user.id)
      .single()

    const now = new Date()
    const expiration = userData?.subscription_ends_at ? new Date(userData.subscription_ends_at) : null

    // Se a assinatura não estiver ativa ou o tempo acabou
    if (!userData || userData.subscription_status !== 'active' || (expiration && now > expiration)) {
      // Redireciona para a landing page na seção de planos
      return NextResponse.redirect(new URL('/landing#planos', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}