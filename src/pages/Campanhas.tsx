import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Megaphone,
  Mail,
  MessageSquare,
  Plus,
  BarChart2,
  PauseCircle,
  PlayCircle,
  Calendar as CalendarIcon,
  Users,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { campaignsService, Campaign } from '@/services/campaigns'
import { CampaignForm } from '@/components/campaigns/CampaignForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Campanhas() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const data = await campaignsService.getCampaigns()
      setCampaigns(data)
    } catch (error) {
      console.error('Failed to fetch campaigns', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa':
      case 'Em Andamento':
        return 'bg-green-500 hover:bg-green-600'
      case 'Pausada':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'Concluída':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'Agendada':
        return 'bg-purple-500 hover:bg-purple-600'
      default:
        return 'bg-gray-400 hover:bg-gray-500'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">
            Campanhas de Marketing
          </h1>
          <p className="text-muted-foreground">
            Engaje sua audiência com campanhas segmentadas multicanal.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure os detalhes, público e cronograma da sua campanha.
              </DialogDescription>
            </DialogHeader>
            <CampaignForm
              onSuccess={() => {
                setIsCreateOpen(false)
                fetchCampaigns()
              }}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Nenhuma campanha encontrada</h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
              Crie sua primeira campanha para começar a se comunicar com seus
              contatos.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              Criar Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Visão Geral de Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Nome & Objetivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Canais</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-base">
                          {campaign.name}
                        </span>
                        <span
                          className="text-xs text-muted-foreground line-clamp-1"
                          title={campaign.objective || ''}
                        >
                          {campaign.objective || 'Sem objetivo definido'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(campaign.status)} text-white border-0`}
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">
                            Início:
                          </span>
                          {format(new Date(campaign.start_date), 'dd/MM/yy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">
                            Fim:
                          </span>
                          {format(new Date(campaign.end_date), 'dd/MM/yy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {campaign.channels.includes('email') && (
                          <div
                            className="p-1.5 bg-blue-100 text-blue-600 rounded-md"
                            title="E-mail"
                          >
                            <Mail className="h-4 w-4" />
                          </div>
                        )}
                        {campaign.channels.includes('whatsapp') && (
                          <div
                            className="p-1.5 bg-green-100 text-green-600 rounded-md"
                            title="WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* This would be real data ideally, for now placeholder or computed if available */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>-</span>{' '}
                        {/* We don't store audience count persistently yet, or we fetch it */}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" title="Ver detalhes">
                        <BarChart2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
