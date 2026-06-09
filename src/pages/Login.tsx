import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, LockKeyhole, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import logoImg from '@/assets/editedimage_1769630541473-88067.png'

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || '/'

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true })
  }, [navigate, redirectTo, user])

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    const { error } = await signIn(email.trim(), password)

    if (error) {
      toast({
        title: 'Login não autorizado',
        description: 'Confira e-mail e senha e tente novamente.',
        variant: 'destructive',
      })
      setSubmitting(false)
      return
    }

    toast({
      title: 'Bem-vinda ao CRM Milan',
      description: 'Sessão iniciada com segurança.',
      variant: 'success',
    })
    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden border-r bg-white px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <img
              src={logoImg}
              alt="Milan Horses Leilões"
              className="h-24 w-auto"
            />
            <div className="mt-16 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <LockKeyhole className="h-4 w-4" />
                Acesso interno
              </div>
              <h1 className="mt-5 text-4xl font-bold font-display leading-tight text-primary">
                CRM Milan Horses
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Copilot de relacionamento para contatos, Radar VIP, leilões,
                mensagens e campanhas.
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Protegido por Supabase Auth.
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md shadow-sm">
            <CardHeader className="space-y-4">
              <div className="lg:hidden">
                <img
                  src={logoImg}
                  alt="Milan Horses Leilões"
                  className="mx-auto h-20 w-auto"
                />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-primary">
                  Entrar no CRM
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use seu e-mail e senha de acesso interno.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  type="submit"
                  disabled={submitting || loading}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Entrar
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
