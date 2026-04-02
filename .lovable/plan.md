## Plano de Implementação

### Fase 1 — Banco de Dados e Autenticação
1. **Tabelas**: `profiles`, `user_roles`, `channels` (grupos/DMs), `channel_members`, `messages`, `meetings`, `meeting_participants`, `broadcasts`
2. **RLS policies** com função `has_role()` para admin
3. **Auth**: Login real com email/senha via Supabase Auth
4. **Trigger**: Auto-criar perfil no signup

### Fase 2 — Chat em Tempo Real
1. Mensagens persistentes com Realtime subscriptions
2. Criação de grupos (canais) — regra de dono para remover membros/deletar
3. Upload de arquivos (PDF, imagens) via Storage
4. Status online/offline baseado em presença

### Fase 3 — Módulo de Reuniões
1. Modal "Agendar Reunião" (título, tipo sala, data, recorrência, senha, convidados)
2. "Reunião Agora" com ID automático
3. Modal "Entrar em Reunião" com validação ID + senha
4. Visualização de salas em andamento / ilustração vazia
5. Histórico com badges (Finalizado/Em Andamento)

### Fase 4 — Painel Admin (aba "Gestão")
1. CRUD de usuários
2. Broadcast de aviso geral
3. Gerenciar permissões de módulos por usuário
4. Aba visível apenas para admin

### Considerações Técnicas
- Roles em tabela separada (`user_roles`) — nunca no perfil
- `has_role()` security definer para evitar recursão RLS
- Todas as cores via design tokens existentes
- SPA com estado mantido entre abas
