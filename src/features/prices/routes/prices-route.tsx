import { PageHeader, PageSection } from "@/components/page"

export function PricesRoute() {
  return (
    <PageSection>
      <PageHeader
        title="Preços"
        subtitle="Estrutura inicial para tabelas e políticas de preço da operação."
      />

      <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
        A próxima etapa vai detalhar faixas, tabelas e exceções de preço.
      </div>
    </PageSection>
  )
}
