# Planejamento: recuperacao de acesso e regras comerciais

## Recuperacao de acesso

Base validada nos fluxos oficiais do Supabase Auth:

- Nao coletar nova senha em uma solicitacao publica pendente. A senha nao deve ficar em tabela operacional enquanto a identidade ainda esta em revisao.
- Para usuario que perdeu senha, o caminho seguro e redefinicao de senha por link/OTP de recuperacao ou uma acao administrativa autenticada que define senha temporaria e exige troca no proximo login.
- A solicitacao publica pode continuar existindo apenas como fila de validacao de identidade: CPF, telefone, e-mail opcional, motivo e justificativa.
- A aprovacao da solicitacao deve disparar uma destas acoes, conforme decisao de negocio:
  - Enviar fluxo oficial de recuperacao por e-mail.
  - Gerar senha temporaria pelo painel administrativo, revogar sessoes ativas e exigir troca de senha no proximo acesso.

Perguntas bloqueantes:

1. O ambiente tera e-mail transacional configurado para o fluxo oficial de recuperacao?
2. Quando o admin aprovar uma recuperacao, ele deve gerar uma senha temporaria manualmente ou o sistema deve gerar automaticamente?
3. Qual canal autorizado sera usado para entregar senha temporaria ou link de recuperacao ao usuario?
4. Quais dados comprovam identidade antes da aprovacao: CPF e telefone bastam ou precisa de verificacao adicional?

## Regras comerciais

Modelo aplicado para manter uma unica tabela e um unico formulario dinamico:

- Usar `commercial_rules` como entidade unica.
- Usar `type` para diferenciar:
  - `vip`: cliente ou veiculo.
  - `fuel_benefit`: isencao por abastecimento.
  - `yard_cleaning`: alerta de limpeza de patio por ocupacao da unidade e permanencia sem saida.
- Campos comuns:
  - `id`, `type`, `target_type`, `applies_to_all_units`, `unit_ids`, `status`, `starts_at`, `ends_at`, `reason`, `created_at`, `updated_at`, `created_by`, `updated_by`.
- Campos especificos ficam tipados em `commercial_rules` e validados por constraints/RPC:
  - VIP: `client_id`, `client_name`, `vehicle_id`, `vehicle_plate`.
  - Abastecimento: `fuel_min_liters`, `benefit_hours`.
  - Limpeza de patio: `yard_occupancy_threshold` e `yard_stale_vehicle_hours`.
- A tabela da UI deve ser unica, com colunas: tipo, abrangencia, regra, status, vigencia e atualizado em.
- O formulario deve alternar campos por `rule_type`:
  - VIP: cliente, veiculo opcional, unidades ou rede.
  - Abastecimento: unidade ou rede, litros minimos e horas de beneficio.
  - Limpeza de patio: uma unidade, vagas configuradas em `unit_yard_configs.parking_spots`, limite de vagas preenchidas e limite em horas sem saida.

Status de implementacao local:

1. Sidebar: primeiro item renomeado para Dashboard, com icone de dashboard e sem label de grupo "Area de trabalho".
2. Banco: migracao adiciona tipos de limpeza de patio, campos especificos, constraints de payload e RPC `save_commercial_rule_version`.
3. UI: formulario dinamico cadastra VIP, isencao por abastecimento e limpeza de patio consolidada.
4. UI: tabela de regras permanece unica e exibe tipo, regra, abrangencia, status e atualizado em.
5. Pendente: motor de alertas operacionais. Ele precisa consumir ocupacao/entradas sem saida e gerar notificacoes/tarefas com deduplicacao.

Perguntas bloqueantes:

1. De onde vem o evento de abastecimento e como ele se relaciona com placa, cliente e unidade?
2. A isencao por abastecimento deve zerar a cobranca ou apenas conceder horas gratuitas antes da cobranca normal?
3. Quem recebe os alertas: responsaveis da unidade, administradores, operadores logados ou uma lista configuravel?
4. Como evitar alertas repetidos: intervalo minimo, status pendente/resolvido ou ambos?
5. A verificacao manual de patio deve gerar tarefa operacional, notificacao simples ou registro auditavel com responsavel e conclusao?

## Sequencia de implementacao

1. Decidir o fluxo de recuperacao de acesso e canal de notificacao.
2. Criar tabela de alertas/tarefas de limpeza de patio quando o fluxo de responsaveis e deduplicacao for definido.
3. Implementar job/RPC/Edge Function que avalia regras ativas e gera alertas.
4. Adicionar testes de schema, permissao, renderizacao de formulario dinamico e sanitizacao de textos exibidos.
