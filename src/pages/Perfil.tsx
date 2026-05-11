import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Camera } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

export default function Perfil() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) throw new Error('Usuário não encontrado')

      await pb.collection('users').update(user.id, {
        name,
      })

      toast({ title: 'Perfil atualizado com sucesso!' })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: err?.message || 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const file = event.target.files?.[0]
      if (!file || !user) return

      setUploading(true)
      const formData = new FormData()
      formData.append('avatar', file)

      await pb.collection('users').update(user.id, formData)

      toast({
        title: 'Foto atualizada',
      })
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: 'Falha ao atualizar foto. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border">
                <AvatarImage
                  src={
                    (user?.avatar ? pb.files.getURL(user, user.avatar) : '') ||
                    `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${user?.id}`
                  }
                />
                <AvatarFallback>
                  {user?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </Avatar>
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
              />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg">
                {user?.name || user?.email?.split('@')[0]}
              </h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado por aqui.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome de Exibição</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
