# Auditoria forense — `src/features/my-profile`

Data: 2026-08-01
Estado: auditoria concluída; refatoração pendente
Escopo: 13 arquivos, teste de rota, Auth, Security, Storage/RLS e Edge Function `profile-update`

## Conclusão

A feature usa perfil autenticado real, Edge Function para mutação, bucket privado, validação de arquivo/dimensões e reaproveita o fluxo de senha de Security. CPF/papel/unidade/status não são editáveis e telefone alterado revoga passkeys/sessões no backend.

O service contém fallback sintético quando Supabase não está configurado: converte avatar em data URI e devolve atualização local bem-sucedida. Isso pode mascarar configuração ausente e viola integridade produtiva. O formulário também mistura schema, normalização, UI e subcomponentes em um arquivo grande; exibe dado protegido em inputs desabilitados; e interpreta qualquer unidade ausente como escopo global, embora papéis manager/operator exijam unidade.

## Achados

| ID | Severidade | Achado | Refatoração |
| --- | --- | --- | --- |
| MP-01 | Alta | Ausência de Supabase gera upload/update sintéticos com aparência de sucesso. | Remover fallback; preview deve usar gateway memory injetado explicitamente e nunca ser default produtivo. |
| MP-02 | Alta | Mudança de telefone define `passkey_reset` e remove credenciais, mas o fluxo atual de cadastro não chama o finalizador/auditor backend. | Corrigir em Auth e adicionar integração telefone -> nova passkey -> status ativo. |
| MP-03 | Alta | `unitName` ausente vira “Escopo global” para qualquer papel; RPC atual retorna `unit_name=null`. | Resolver unidade por contrato real ou exibir “indisponível”; apenas papéis globais podem receber label global. |
| MP-04 | Média | CPF/display pode aparecer integralmente em input desabilitado e sem reveal intencional. | Usar valor mascarado garantido e componente de conteúdo sensível; não confiar no nome `cpfMasked`. |
| MP-05 | Média | Upload acontece antes de `profile-update`; falha posterior deixa objetos órfãos e cada envio usa novo timestamp. | Usar path canônico/versionado e rollback/cleanup seguro; testar falha entre upload e commit. |
| MP-06 | Média | Resposta da Function é parseada manualmente e defaults podem ocultar contrato inválido. | Criar schema Zod e gateway; falhar fechado. |
| MP-07 | Média | Browser confia em MIME/extensão/dimensão; não valida conteúdo no servidor. | Aplicar validação/transformação server-side e limites do bucket; impedir SVG/polyglot. |
| MP-08 | Média | `profile-form-card.tsx` contém schema, normalizadores e diversos presenters. | Mover schema para `schemas`, modelo para `model` e dividir seções visuais. |
| MP-09 | Média | `my-profile` importa `security` por deep imports e ainda reexporta aliases dela. | Consumir API pública estreita ou mover troca de senha para composição shared/auth; remover barrels cruzados. |
| MP-10 | Baixa | Campos protegidos são `disabled readOnly`, pouco adequados para leitura/cópia e sem descrição específica. | Renderizar texto semântico/read-only acessível; usar reveal quando sensível. |
| MP-11 | Baixa | Erros de upload/form não têm associação/`aria-live` completa; teste único cobre só caminho feliz. | Corrigir Field/descrições/foco e ampliar testes. |

## Segurança e privacidade

- `profile-update` exige ator ativo e normaliza path sob `<authUserId>/`; URL externa/data URI são rejeitadas remotamente.
- RLS do bucket limita escrita ao próprio diretório e leitura segue policy autorizada. Deve-se confirmar estado final após reset e remoto read-only.
- React escapa nome/e-mail; avatar externo deve ser eliminado na fronteira Auth conforme a auditoria de `auth`.
- A mudança de telefone consulta credenciais, atualiza status, remove passkeys e revoga sessões. Como cruza tabelas Auth e public sem transação total, falhas parciais precisam de testes/estado recuperável.
- `updated_at` e `updated_by` são enviados pela Edge Function; devem ser protegidos por trigger/server-side no schema efetivo.
- Nome/e-mail/telefone são PII; logs atuais incluem apenas actor ID e mensagem do banco, mas a política transversal de redaction deve ser aplicada.

## Performance

O perfil é pequeno e deriva do AuthContext, sem N+1. O maior custo é imagem: até 5 MB e 4096x4096 pode consumir memória elevada no browser. Redimensionar/comprimir em worker ou servidor antes de persistir, impor dimensão/pixels/bytes pós-transformação e cancelar upload ao fechar. Signed URL de avatar deve usar cache coerente com atualização/versionamento.

## Acessibilidade

Cards têm hierarquia e ações textuais, avatar é decorativo, campos editáveis possuem labels sr-only e erros. É necessário agrupar com `Field`, associar descrição/erro, marcar required, focar primeiro erro, anunciar upload/drag-and-drop, testar teclado/paste/zoom e evitar input disabled para conteúdo informativo. O dropzone deve ter nome acessível que indique escolher/arrastar arquivo.

## Matriz por arquivo

| Arquivo | Responsabilidade | Revisão/ação |
| --- | --- | --- |
| `index.ts` | API pública | Exporta quase toda a feature. Estreitar à rota/contratos realmente consumidos. |
| `my-profile-copy.ts` | Copy | Bom ponto central, mas contém copy de senha duplicada e erros do schema ainda hardcoded. Consolidar. |
| `components/index.ts` | Barrel/alias Security | Acoplamento cruzado indevido. Remover. |
| `components/profile-form-card.tsx` | Form, overview e protegidos | Grande e com schema/model. Dividir e corrigir PII/Field. |
| `components/profile-photo-dialog.tsx` | Seleção/preview/drop | Cleanup de object URL correto; melhorar associação de erro/ref, cancelamento e validação. |
| `docs/README.md` | Contrato | Documenta fallback data URI como dev; decisão deve ser removida. |
| `docs/VALIDATION.md` | Checklist | Afirma responsividade sem evidência automatizada; ampliar gates. |
| `hooks/use-my-profile.ts` | Adapter Auth + ações | Detecta data URI sintética e contém erro hardcoded. Remover fallback e usar erros tipados. |
| `routes/my-profile-route.tsx` | Orquestração/dialogs | Deep imports de Security, estados booleanos e key de remount frágil. Criar controller e API pública. |
| `services/index.ts` | Reexport cruzado e local | Remover barrel e alias de Security. |
| `services/profile-service.ts` | Upload, validação e Function | Monolítico, fallback sintético, parser manual e órfãos. Dividir gateway/schema/image policy. |
| `types/profile-types.ts` | Domínio/input/snapshot | Responsável, mas snapshot mistura commands de hook. Separar domínio de controller. |
| `utils/profile-models.ts` | Mapper/presenters | Pasta `utils` genérica e fallback global incorreto. Mover a `model` e usar papel/unidade. |

## Testes

`tests/features/my-profile/my-profile-route.test.tsx` cobre render e abertura/cancelamento da foto. Não cobre salvar, schema, ausência de Supabase, upload inválido/dimensão, orphan rollback, telefone/passkey, unidade por papel, PII, erro, retry, foco ou viewport. Devem existir testes separados de schema, gateway, image policy, hook e integração Edge/Storage/RLS.

## Critérios de aceite

- Configuração Supabase ausente ou chamada remota falha nunca produz sucesso local.
- Alteração de telefone conduz de forma testada a revogação e novo cadastro de passkey concluído/auditado.
- Papel unit-scoped nunca aparece como global sem unidade.
- CPF/telefone não aparecem integralmente por padrão.
- Upload inválido é rejeitado no cliente e servidor; falha pós-upload não deixa lixo permanente.
- Wire, domínio, formulário e controller estão separados e a API pública é estreita.
- Teclado, foco, drag-and-drop, leitor de tela, mobile, console e RLS passam.
