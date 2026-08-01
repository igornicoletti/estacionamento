import {
  type Client,
  type ClientStatus,
  type ClientTableRow,
} from "./clients-types"

export function resolveClientStatus(client: Client): ClientStatus {
  return client.ind_pessoa_ativa ? "ativo" : "inativo"
}

export function mapClientToTableRow(client: Client): ClientTableRow {
  return {
    ...client,
    status: resolveClientStatus(client),
  }
}
