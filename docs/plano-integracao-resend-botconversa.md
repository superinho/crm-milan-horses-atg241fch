# Plano de integração: Resend + BotConversa

## Objetivo

Transformar o Radar VIP em uma central de ativação comercial: escolher um leilão real, revisar segmentos e enviar mensagens rastreáveis por e-mail e WhatsApp, sem perder controle humano sobre clientes de alto valor.

## Princípios

- Usar apenas dados reais vindos da Smart Leilões e do Supabase.
- Separar campanha, destinatário, mensagem e evento de entrega.
- Nunca disparar em massa sem prévia, opt-out e deduplicação.
- Preferir envio assíncrono por fila para evitar travar a interface.
- Gravar cada tentativa de envio com payload, status e erro.

## Variáveis de ambiente

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO_EMAIL`
- `BOTCONVERSA_WEBHOOK_URL`
- `BOTCONVERSA_API_KEY`
- `BOTCONVERSA_DEFAULT_FLOW_ID`
- `BOTCONVERSA_WEBHOOK_SECRET`

Configuração no Supabase:

```bash
npx supabase secrets set RESEND_API_KEY="..." RESEND_FROM_EMAIL="Milan Horses <contato@seudominio.com>" --project-ref hllvhxwcgqsksjaudsdn
npx supabase secrets set BOTCONVERSA_WEBHOOK_URL="..." BOTCONVERSA_DEFAULT_FLOW_ID="..." --project-ref hllvhxwcgqsksjaudsdn
```

## Modelo de dados

Criar ou evoluir estas tabelas:

- `message_templates`: canal, nome, assunto, corpo, variáveis permitidas.
- `marketing_campaigns`: leilão alvo, segmento, status, canal, criador, métricas.
- `campaign_recipients`: contato, score, canal escolhido, status, opt-out, mensagem renderizada.
- `outbound_messages`: provedor, destinatário, payload, provider_message_id, status, erro.
- `message_events`: entregue, aberto, clicado, respondido, falhou, opt-out.

## Edge Functions

- `process-campaigns`: processa a fila com Resend e BotConversa.
- `dispatch-campaign`: alias de processamento para chamadas explícitas.
- `send-contact-email`: envio individual via Resend.
- `send-whatsapp-botconversa`: envio individual via webhook BotConversa.
- `resend-webhook`: recebe eventos de entrega/abertura/clique.
- `botconversa-webhook`: recebe status, resposta e opt-out.

## Fluxo no CRM

1. Radar VIP gera lista priorizada para um leilão real.
2. Usuário seleciona segmento e canal.
3. CRM mostra prévia da mensagem por cliente.
4. Usuário aprova envio ou agenda.
5. Edge Function cria destinatários e fila.
6. Workers enviam por Resend/BotConversa.
7. Tela mostra status: pendente, enviado, entregue, respondeu, falhou.

## Segurança e compliance

- Respeitar opt-out por canal.
- Bloquear envio para contatos sem e-mail/telefone válido.
- Limitar volume por minuto por provedor.
- Registrar usuário que aprovou a campanha.
- Permitir revisão manual para VIPs acima de valor configurado.
- Nunca expor API keys no frontend.

## Etapas de implementação

1. Criar migration das tabelas de campanha e mensagens.
2. Criar serviço frontend para montar campanha a partir do Radar VIP.
3. Implementar envio de teste individual com Resend.
4. Implementar envio de teste individual com BotConversa.
5. Implementar fila e tela de acompanhamento.
6. Implementar webhooks e métricas.
7. Liberar envio segmentado com limites conservadores.

## Critérios de pronto

- Envio de teste para e-mail real funciona e fica logado.
- Envio de teste para WhatsApp real funciona e fica logado.
- Uma campanha pode ser criada a partir do Radar VIP sem duplicar clientes.
- Falhas aparecem com motivo claro.
- Clientes sem consentimento ou canal válido são bloqueados.
- Nenhuma chave secreta aparece no bundle do frontend.
