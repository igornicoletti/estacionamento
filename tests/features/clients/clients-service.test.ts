import { describe, expect, it } from "vitest"

import {
  listClients,
  listClientVehicles,
} from "@/features/clients/services/clients-service"

describe("clients-service", () => {
  it("returns clients with normalized and typed fields", async () => {
    const clients = await listClients()

    expect(clients.length).toBeGreaterThan(0)
    expect(clients[0]).toMatchObject({
      cod_pessoa: 1001,
      nom_pessoa: "Auto Center Alfa Ltda",
      sgl_estado: "SP",
      qtd_veiculos: 2,
    })
  })

  it("returns vehicles linked to client code", async () => {
    const vehicles = await listClientVehicles()
    const linkedVehicles = vehicles.filter((vehicle) => vehicle.cod_pessoa === 1001)

    expect(linkedVehicles).toHaveLength(2)
    expect(linkedVehicles[0]).toMatchObject({
      cod_veiculo: 5001,
      cod_pessoa: 1001,
      num_placa: "ABC1D23",
    })
  })
})
