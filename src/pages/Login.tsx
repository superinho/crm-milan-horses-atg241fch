import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import logoImg from '@/assets/editedimage_1769630541473-88067.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) throw error
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu email para confirmar o cadastro.',
        })
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/')
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao CRM Milan Horses.',
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro na autenticação',
        description: error.message || 'Ocorreu um erro ao tentar entrar.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <img
            src={logoImg}
            alt="Milan Horses"
            className="h-24 w-auto object-contain mb-4"
          />
          <h2 className="text-3xl font-bold tracking-tight text-primary font-display">
            CRM Milan Horses
          </h2>
          <p className="text-muted-foreground mt-2">
            Entre para gerenciar seus contatos e negócios
          </p>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>{isSignUp ? 'Criar Conta' : 'Login'}</CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Preencha os dados abaixo para criar sua conta.'
                : 'Digite seu email e senha para acessar.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@milanhorses.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? 'Criando...' : 'Entrando...'}
                  </>
                ) : isSignUp ? (
                  'Criar Conta'
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground"
            >
              {isSignUp
                ? 'Já tem uma conta? Faça login'
                : 'Não tem uma conta? Cadastre-se'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
