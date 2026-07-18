# Validação de entrega — src/features/auth

## Checklist aplicado

- A raiz do diretório contém somente `index.ts`.
- Todos os subdiretórios exportam por barrel `index.ts`.
- O provider foi quebrado em arquivos menores e com responsabilidade única.
- A política de autorização permanece centralizada e reutilizável.
- A camada `api` normaliza payloads externos e isola Supabase da UI.
- Login mantém CPF com máscara, senha visível no fluxo e recuperação acima/alinhada como ação de label.
- Recuperação mantém CPF e telefone mascarados, motivo sem valor inicial e descrição condicional apenas para `other`.
- Não há marcadores de pendência conhecidos nos arquivos entregues.

## Comandos recomendados após aplicar no projeto

```bash
npm run typecheck
npm run lint
npm run build
```

## Observação operacional

A validação local do artefato confirma estrutura, sintaxe TypeScript e integridade do ZIP. A validação final de navegador deve ser executada no projeto real, com o Supabase configurado e as Edge Functions disponíveis.
