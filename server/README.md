# Brev-ly

Um serviço moderno e eficiente de encurtamento de URLs construído com TypeScript, Fastify e PostgreSQL, apresentando uma API RESTful com documentação OpenAPI.

## Recursos

- Encurta URLs longas em links compactos e fáceis de compartilhar
- API RESTful com documentação OpenAPI abrangente
- Tratamento robusto de erros usando padrões de programação funcional
- Base de código com segurança de tipos usando TypeScript
- Backend de alto desempenho com Fastify
- Armazenamento persistente com PostgreSQL
- Gerenciamento de banco de dados com Drizzle ORM
- Validação de entrada com Zod
- Testes abrangentes com Vitest

## Tecnologias

- **Framework Backend**: Fastify
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: Drizzle ORM
- **Documentação da API**: OpenAPI com Swagger UI
- **Validação**: Zod
- **Testes**: Vitest
- **Linting/Formatação**: Biome
- **Gerenciador de Pacotes**: pnpm

## Funcionalidades e Regras
- [x]  Deve ser possível criar um link
    - [x]  Não deve ser possível criar um link com URL encurtada mal formatada
    - [x]  Não deve ser possível criar um link com URL encurtada já existente
- [x]  Deve ser possível deletar um link
- [x]  Deve ser possível obter a URL original por meio de uma URL encurtada
- [x]  Deve ser possível listar todas as URL’s cadastradas
- [x]  Deve ser possível incrementar a quantidade de acessos de um link
- [x]  Deve ser possível exportar os links criados em um CSV
    - [x]  Deve ser possível acessar o CSV por meio de uma CDN (Amazon S3, Cloudflare R2, etc)
    - [x]  Deve ser gerado um nome aleatório e único para o arquivo
    - [x]  Deve ser possível realizar a listagem de forma performática
    - [x]  O CSV deve ter campos como, URL original, URL encurtada, contagem de acessos e data de criação.

## Documentação da API

A documentação da API está disponível através do Swagger UI quando a aplicação está em execução. Você pode acessá-la em:

```
http://localhost:PORT/docs
```

## Desenvolvimento

### Pré-requisitos

- Node.js (versão LTS recomendada)
- Gerenciador de pacotes pnpm
- Banco de dados PostgreSQL

### Configuração

*Nota: Instruções de instalação baseadas em Docker serão fornecidas separadamente.*

### Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento com recarga automática
- `pnpm test` - Executa os testes
- `pnpm test:watch` - Executa os testes em modo de observação
- `pnpm test:coverage` - Executa os testes com relatório de cobertura
- `pnpm db:generate` - Gera migrações de banco de dados
- `pnpm db:migrate` - Aplica migrações de banco de dados
- `pnpm db:studio` - Abre o Drizzle Studio para gerenciamento do banco de dados
- `pnpm clean` - Remove a pasta `dist`
- `pnpm build` - Compila o projeto
- `pnpm start` - Inicia o servidor de produção

## Testes

O projeto utiliza Vitest para testes. Execute os testes com:

```bash
pnpm test
```

Para relatórios de cobertura de testes:

```bash
pnpm test:coverage
```

## Licença

ISC

## Autor

Felipe Balloni Ferreira
