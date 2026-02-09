import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import logoImg from '@/assets/editedimage_1769630541473-88067.png'

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <div className="flex justify-center mb-8">
          <img
            src={logoImg}
            alt="Milan Horses"
            className="h-24 w-auto object-contain animate-fade-in"
          />
        </div>

        <h1 className="text-9xl font-bold font-display text-primary/10 select-none">
          404
        </h1>

        <div className="space-y-2 -mt-16 relative z-10">
          <h2 className="text-3xl font-bold text-foreground">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground">
            A página que você está procurando pode ter sido removida, renomeada
            ou está temporariamente indisponível.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Ir para o Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to={-1 as any}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
