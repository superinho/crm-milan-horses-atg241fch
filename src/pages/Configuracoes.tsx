import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Save,
  Building,
  Mail,
  Bell,
  Target,
  Gavel,
  Loader2,
} from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { settingsService, defaultSettings } from '@/services/settings'

const formSchema = z.object({
  company_name: z.string().min(2, 'Nome da empresa é obrigatório'),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  primary_color: z.string(),
  secondary_color: z.string(),
  contact_email: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  contact_phone: z.string().optional(),
  contact_whatsapp: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address: z.string().optional(),
  email_signature: z.string().optional(),
  alerts_overdue_tasks: z.boolean(),
  alerts_new_leads: z.boolean(),
  alerts_birthdays: z.boolean(),
  monthly_sales_goal: z.coerce.number().min(0),
  monthly_new_contacts_goal: z.coerce.number().min(0),
  conversion_rate_goal: z.coerce.number().min(0).max(100),
  auction_default_location: z.string().optional(),
  auction_default_time: z.string().optional(),
  auction_default_fees: z.string().optional(),
})

export default function Configuracoes() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultSettings as any,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await settingsService.getSettings()
      form.reset({
        ...defaultSettings,
        ...data,
        logo_url: data.logo_url || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        contact_whatsapp: data.contact_whatsapp || '',
        website: data.website || '',
        address: data.address || '',
        email_signature: data.email_signature || '',
        auction_default_location: data.auction_default_location || '',
        auction_default_time: data.auction_default_time || '',
        auction_default_fees: data.auction_default_fees || '',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true)
    try {
      await settingsService.updateSettings(values)
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Falha ao salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie a identidade da empresa, preferências e metas.
          </p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configurações
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="company" className="py-3">
                <Building className="mr-2 h-4 w-4" /> Perfil
              </TabsTrigger>
              <TabsTrigger value="signature" className="py-3">
                <Mail className="mr-2 h-4 w-4" /> Assinatura
              </TabsTrigger>
              <TabsTrigger value="notifications" className="py-3">
                <Bell className="mr-2 h-4 w-4" /> Notificações
              </TabsTrigger>
              <TabsTrigger value="goals" className="py-3">
                <Target className="mr-2 h-4 w-4" /> Metas
              </TabsTrigger>
              <TabsTrigger value="auctions" className="py-3">
                <Gavel className="mr-2 h-4 w-4" /> Leilões
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="company" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Identidade Visual</CardTitle>
                    <CardDescription>
                      Configure o nome, logo e cores da marca.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Empresa</FormLabel>
                            <FormControl>
                              <Input placeholder="Milan Horses" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="logo_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Logo</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="https://exemplo.com/logo.png"
                                  {...field}
                                />
                              </FormControl>
                              {field.value && (
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border p-1">
                                  <img
                                    src={field.value}
                                    alt="Logo preview"
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="primary_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor Primária</FormLabel>
                            <div className="flex gap-2 items-center">
                              <FormControl>
                                <Input
                                  type="color"
                                  className="w-12 h-10 p-1 cursor-pointer"
                                  {...field}
                                />
                              </FormControl>
                              <Input {...field} className="font-mono" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secondary_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cor Secundária</FormLabel>
                            <div className="flex gap-2 items-center">
                              <FormControl>
                                <Input
                                  type="color"
                                  className="w-12 h-10 p-1 cursor-pointer"
                                  {...field}
                                />
                              </FormControl>
                              <Input {...field} className="font-mono" />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Informações de Contato</CardTitle>
                    <CardDescription>
                      Dados públicos da empresa para comunicação.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contact_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail de Contato</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contato@milanhorses.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://milanhorses.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 9999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contact_whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço Físico</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Rua Exemplo, 123 - São Paulo, SP"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signature">
                <Card>
                  <CardHeader>
                    <CardTitle>Assinatura de E-mail</CardTitle>
                    <CardDescription>
                      Configure a assinatura padrão para os e-mails enviados
                      pelo sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email_signature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo da Assinatura (HTML)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="<div>Atenciosamente,<br/><strong>Equipe Milan</strong></div>"
                              className="min-h-[150px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Você pode usar tags HTML para formatar o texto.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="rounded-lg border p-4 bg-gray-50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        Prévia Visual
                      </p>
                      <div className="bg-white p-4 rounded border shadow-sm min-h-[100px]">
                        {form.watch('email_signature') ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: form.watch('email_signature') || '',
                            }}
                          />
                        ) : (
                          <p className="text-muted-foreground italic text-sm">
                            A assinatura aparecerá aqui...
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferências de Notificação</CardTitle>
                    <CardDescription>
                      Escolha quais alertas você deseja receber no sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="alerts_overdue_tasks"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Alertas de tarefas atrasadas
                            </FormLabel>
                            <FormDescription>
                              Receba avisos sobre tarefas que passaram do prazo.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="alerts_new_leads"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Novos leads
                            </FormLabel>
                            <FormDescription>
                              Seja notificado quando um novo contato for
                              cadastrado.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="alerts_birthdays"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Aniversários
                            </FormLabel>
                            <FormDescription>
                              Lembretes diários de aniversariantes do dia.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals">
                <Card>
                  <CardHeader>
                    <CardTitle>Metas Mensais</CardTitle>
                    <CardDescription>
                      Defina os objetivos para acompanhar no dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="monthly_sales_goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor de vendas esperado (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormDescription>
                              Meta de faturamento mensal.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="monthly_new_contacts_goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de novos contatos</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Meta de aquisição de leads.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="conversion_rate_goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de conversão (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Percentual desejado de vendas.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="auctions">
                <Card>
                  <CardHeader>
                    <CardTitle>Padrões de Leilão</CardTitle>
                    <CardDescription>
                      Configurações padrão para novos leilões criados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="auction_default_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local Padrão</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Tattersall de Cidade Jardim"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="auction_default_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horário Típico</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 19:00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="auction_default_fees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxas Padrão</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 8% (Comissão)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </form>
      </Form>
    </div>
  )
}
