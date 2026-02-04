import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Tag as TagIcon, Loader2 } from 'lucide-react'
import { tagsService, type Tag } from '@/services/tags'
import { TagDialog } from '@/components/tags/TagDialog'
import { useToast } from '@/hooks/use-toast'

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null)
  const { toast } = useToast()

  const fetchTags = async () => {
    setLoading(true)
    try {
      const data = await tagsService.getTags()
      setTags(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tags.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await tagsService.deleteTag(id)
      toast({
        title: 'Tag excluída',
        description: 'A tag foi removida com sucesso.',
      })
      fetchTags()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tag.',
        variant: 'destructive',
      })
    }
  }

  const openCreateDialog = () => {
    setTagToEdit(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (tag: Tag) => {
    setTagToEdit(tag)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary flex items-center gap-2">
            <TagIcon className="h-8 w-8" /> Gerenciamento de Tags
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie as etiquetas usadas para categorizar contatos.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tags</CardTitle>
          <CardDescription>
            Todas as tags disponíveis no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Cor</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhuma tag cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div
                          className="h-6 w-12 rounded-md border shadow-sm"
                          style={{ backgroundColor: tag.color }}
                          title={tag.color}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(tag)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Tem certeza?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso excluirá
                                  permanentemente a tag "{tag.name}" e a
                                  removerá de todos os contatos associados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleDelete(tag.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TagDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        tagToEdit={tagToEdit}
        onSuccess={fetchTags}
      />
    </div>
  )
}
