# A4 Telemetry API

Sistema de telemetria para processamento de dados de sensores com isolamento multi-tenant e armazenamento em série temporal.

## Sobre o Projeto

Esta API foi desenvolvida para validar um componente central de telemetria que:
- Recebe dados de sensores em tempo real
- Valida a propriedade de dispositivos por tenant
- Armazena leituras em base analítica de série temporal
- Garante isolamento completo entre diferentes clientes (multi-tenant)

## Arquitetura

O projeto segue princípios de Clean Architecture com separação clara de responsabilidades:

```
src/
├── domain/              # Lógica de negócio
│   └── usecases/        # Casos de uso da aplicação
├── repositories/        # Camada de acesso a dados
├── infra/              # Infraestrutura
│   ├── db/             # Configuração do banco de dados
│   │   ├── schema.ts   # Schemas Drizzle ORM
│   │   └── migrations/ # Migrações SQL
│   └── http/           # Camada HTTP
│       ├── controllers/
│       ├── middleware/
│       └── routes.ts
└── factories/          # Injeção de dependências (Singleton Pattern)
```

## 🛠️ Tecnologias Utilizadas

- **Node.js** + **TypeScript** - Runtime e linguagem
- **Fastify** - Framework HTTP de alta performance
- **Drizzle ORM** - Type-safe SQL ORM
- **PostgreSQL 16** - Banco de dados relacional
- **Docker Compose** - Orquestração de containers
- **Tap** - Framework de testes

## Pré-requisitos

- Node.js >= 18
- Docker e Docker Compose
- npm ou yarn

## Como Rodar o Projeto

### 1. Clonar o repositório

```bash
git clone <repository-url>
cd a4-telemetry-api
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://a4:a4pass@localhost:5432/a4_telemetry
PORT=3000
```

### 4. Subir o banco de dados com Docker

```bash
# Docker Compose v2 (recomendado – padrão atual)
docker compose up -d

# Docker Compose v1 (ambientes mais antigos)
docker-compose up -d
```

Observação:
O comando docker compose (sem hífen) é o padrão nas versões mais recentes do Docker Desktop.
O comando docker-compose é mantido aqui para compatibilidade com ambientes legados.

Isso irá inicializar:
- PostgreSQL na porta 5432
- Container: `a4_postgres`
- Database: `a4_telemetry`

### 5. Executar migrações do banco

```bash
npm run db:migrate
```

### 6. (Opcional) Popular banco com dados de teste

```bash
npm run db:seed
```

Isso criará:
- 2 tenants: `tenant-a` e `tenant-b`
- 2 dispositivos por tenant
- Leituras de telemetria de exemplo

### 7. Iniciar o servidor

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

## 📡 Endpoints da API

### Health Check

```http
GET /health
```

**Resposta:**
```json
{
  "ok": true
}
```

### Ingerir Telemetria

```http
POST /telemetry
Content-Type: application/json
x-tenant-id: tenant-a

{
  "deviceId": "uuid-do-dispositivo",
  "value": 23.5
}
```

**Validações:**
- Header `x-tenant-id` é obrigatório
- O dispositivo deve pertencer ao tenant autenticado
- Valor deve ser numérico

**Respostas:**
- `201 Created` - Telemetria registrada com sucesso
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Tenant não autenticado
- `404 Not Found` - Dispositivo não encontrado ou não pertence ao tenant

### Consultar Telemetria

```http
GET /telemetry/:deviceId
x-tenant-id: tenant-a
```

**Resposta:**
```json
{
  "deviceId": "uuid-do-dispositivo",
  "readings": [
    {
      "value": 23.50,
      "timestamp": "2026-01-16T10:30:00.000Z"
    },
    {
      "value": "22.80",
      "timestamp": "2026-01-16T10:29:00.000Z"
    }
  ]
}
```

Retorna as últimas 10 leituras do sensor, ordenadas por timestamp decrescente.

**Validações:**
- Header `x-tenant-id` é obrigatório
- O dispositivo deve pertencer ao tenant autenticado

**Respostas:**
- `200 OK` - Leituras retornadas com sucesso
- `401 Unauthorized` - Tenant não autenticado
- `404 Not Found` - Dispositivo não encontrado ou não pertence ao tenant

## Executar Testes

### Rodar todos os testes

```bash
npm test
```

### Testes de Integração

O projeto inclui um teste de integração abrangente que valida:
- ✅ Tenant A pode inserir telemetria no seu próprio dispositivo
- ✅ Tenant B NÃO pode inserir telemetria no dispositivo do Tenant A
- ✅ Tenant B NÃO pode consultar telemetria do dispositivo do Tenant A
- ✅ Tenant A pode consultar telemetria do seu próprio dispositivo

Localização: `tests/tenant-isolation.int.test.ts`

## 🔒 Segurança Multi-Tenant

O sistema implementa isolamento rigoroso entre tenants em múltiplas camadas:

### 1. Middleware de Autenticação
```typescript
// Valida presença do x-tenant-id em toda requisição
authMiddleware(request, reply)
```

### 2. Repositórios com Tenant Isolation
```typescript
// Sempre inclui tenantId nas queries
findByIdAndTenant(deviceId, tenantId)
```

### 3. Use Cases com Validação
```typescript
// Verifica propriedade antes de qualquer operação
const device = await deviceRepo.findByIdAndTenant(deviceId, tenantId)
if (!device) throw new Error('Device not found')
```

### 4. Resposta Segura
- Retorna `404` (não `403`) quando dispositivo não pertence ao tenant
- Evita vazar informações sobre existência de dispositivos de outros tenants

## Schema do Banco de Dados

### Tabela: `devices`
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  tenant_id TEXT NOT NULL
);
```

### Tabela: `sensor_readings`
```sql
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY,
  device_id UUID NOT NULL,
  value NUMERIC(10, 2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em modo watch
npm run build            # Compila TypeScript para JavaScript
npm start                # Inicia servidor em produção

# Banco de Dados
npm run db:generate      # Gera novas migrações
npm run db:migrate       # Executa migrações pendentes
npm run db:seed          # Popula banco com dados de teste

# Testes
npm test                 # Executa todos os testes
```

## Estrutura de Injeção de Dependências

O projeto utiliza o padrão **Singleton Factory** para gerenciar dependências:

```typescript
// factories/app.factory.ts
class AppFactory {
  private static instance: AppFactory

  static getInstance(): AppFactory {
    if (!this.instance) {
      this.instance = new AppFactory()
    }
    return this.instance
  }

  getIngestTelemetryUseCase() { /* ... */ }
  getLastTelemetryUseCase() { /* ... */ }
}
```

**Benefícios:**
- Controle centralizado de dependências
- Fácil substituição para testes
- Garante única instância de repositórios

## Exemplo de Uso com cURL

```bash
# 1. Verificar saúde da API
curl http://localhost:3000/health

# 2. Inserir telemetria
curl -X POST http://localhost:3000/telemetry \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-a" \
  -d '{
    "deviceId": "device-a-uuid",
    "value": 25.3
  }'

# 3. Consultar telemetria
curl http://localhost:3000/telemetry/device-a-uuid \
  -H "x-tenant-id: tenant-a"
```

## Próximos Passos / Melhorias Futuras

- [ ] Implementar ClickHouse para armazenamento de séries temporais em escala
- [ ] Adicionar autenticação JWT real (atualmente simulado via header)
- [ ] Implementar rate limiting por tenant
- [ ] Adicionar métricas e observabilidade (Prometheus/Grafana)
- [ ] Documentação OpenAPI/Swagger
- [ ] Adicionar mais testes unitários
- [ ] Implementar cache de dispositivos (Redis)
- [ ] Adicionar validação de schema com Zod
- [ ] Configurar CI/CD pipeline

## Licença

Este projeto foi desenvolvido como teste técnico para A4 Solutions.

---

Desenvolvido por Brendo Gaigher
