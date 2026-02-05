import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, FileText, MessageSquare, Mail } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TemplateForm } from '@/components/templates/TemplateForm'
import {
  templatesService,
  MessageTemplate,
  TemplateCategory,
} from '@/services/templates'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function Modelos() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] =
    useState<MessageTemplate | null>(null)
  const { toast } = useToast()

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const data = await templatesService.getTemplates()
      setTemplates(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await templatesService.deleteTemplate(id)
      toast({
        title: 'Sucesso',
        description: 'Template excluído.',
      })
      fetchTemplates()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao excluir template.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (template: MessageTemplate) => {
    setSelectedTemplate(template)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedTemplate(null)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    fetchTemplates()
  }

  // Group templates by category
  const groupedTemplates = templates.reduce(
    (acc, t) => {
      const cat = t.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(t)
      return acc
    },
    {} as Record<string, MessageTemplate[]>,
  )

  const categories = Object.keys(groupedTemplates) as TemplateCategory[]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary flex items-center gap-2">
            <FileText className="h-8 w-8" /> Modelos de Mensagem
          </h1>
          <p className="text-muted-foreground">
            Gerencie templates para padronizar sua comunicação via WhatsApp e
            E-mail.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Template
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure o conteúdo da mensagem e suas variáveis dinâmicas.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            initialData={selectedTemplate}
            onSuccess={handleSuccess}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
              Crie seu primeiro modelo de mensagem para agilizar o contato com
              seus clientes.
            </p>
            <Button onClick={handleCreate}>Criar Agora</Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={categories} className="w-full">
          {categories.map((category) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {category}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({groupedTemplates[category].length} modelos)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {groupedTemplates[category].map((template) => (
                    <Card
                      key={template.id}
                      className="group hover:shadow-md transition-shadow relative"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <Badge
                            variant={
                              template.type === 'WhatsApp'
                                ? 'default'
                                : 'secondary'
                            }
                            className={
                              template.type === 'WhatsApp'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }
                          >
                            {template.type === 'WhatsApp' ? (
                              <MessageSquare className="mr-1 h-3 w-3" />
                            ) : (
                              <Mail className="mr-1 h-3 w-3" />
                            )}
                            {template.type}
                          </Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Excluir Template?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(template.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <CardTitle className="text-base mt-2 line-clamp-1">
                          {template.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        {template.subject && (
                          <p className="text-xs font-semibold text-muted-foreground mb-1 truncate">
                            Assunto: {template.subject}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/30 p-2 rounded">
                          {template.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
