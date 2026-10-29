# MenteAberta

Site de educação emocional baseado no pacote `MenteAberta_Original_Aprimorado_v4`, preservando as ilustrações, as histórias interativas e as respostas programadas da Bia.

- **Site:** https://eximaq.github.io/mente-aberta/
- **Repositório:** https://github.com/Eximaq/mente-aberta
- **Supabase:** projeto `apilsepmphnrgsipnypk`, organização Noxgran, região São Paulo.

## Recursos implementados

- Cadastro, login, confirmação por link/código e recuperação de senha pelo Supabase Auth.
- Diário emocional privado, com os sete últimos registros na tela e exportação do histórico completo.
- Comunidade compartilhada: relatos aguardam aprovação; apoios são únicos por conta e podem ser retirados.
- Painel administrativo para aprovar, rejeitar ou devolver relatos/candidaturas para análise.
- Candidatura de voluntários com comprovantes privados em PDF, JPG, PNG ou WebP, até 5 MB. Uma candidatura por conta; é possível retirá-la e reenviar.
- Download dos próprios dados e exclusão dos dados de participação.
- Bia local com respostas programadas, sem envio da conversa ao banco.

## Pendência para cadastro e recuperação por e-mail em produção

**É necessário conectar um provedor SMTP.** O proprietário optou por deixar esta etapa preparada. O remetente padrão de teste do Supabase tem restrições de destinatários e limites de envio, portanto o cadastro público por e-mail e a recuperação de senha não devem ser considerados liberados até essa conexão.

1. Escolha um serviço de envio transacional e valide um domínio/remetente que você controle.
2. No [SMTP do projeto](https://supabase.com/dashboard/project/apilsepmphnrgsipnypk/auth/smtp), habilite o SMTP e preencha remetente, host, porta, usuário e senha/chave fornecidos pelo serviço. Guarde a credencial somente nesse painel.
3. Salve e confira os limites em **Authentication → Rate Limits**.
4. Faça um cadastro real com um e-mail seu, abra o link de confirmação e teste a recuperação de senha.

A URL principal e o redirecionamento permitido já foram ajustados para `https://eximaq.github.io/mente-aberta/`. Após testar o SMTP, altere `emailDeliveryReady` para `true` em `assets/backend-config.js` para remover o aviso de ativação do cadastro. Consulte a [documentação de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Administração

O e-mail do administrador foi configurado diretamente na lista privada do banco; ele não fica publicado neste repositório. Crie a conta com o e-mail informado ao configurar o projeto, confirme o endereço e entre. O botão **Administração** aparecerá automaticamente. A senha é definida pelo próprio titular.

Para autorizar outra pessoa, o proprietário pode executar no SQL Editor:

```sql
insert into private.administrators(email)
values (lower('email-do-administrador@exemplo.com'))
on conflict do nothing;
```

Somente endereços confirmados recebem esse acesso. `user_metadata` não concede permissões. Para revogar acesso, remova o e-mail da lista privada. As políticas consultam o banco em cada operação, sem depender de uma flag editável no navegador.

## Desenvolvimento

Requer Node.js 22 ou posterior e Python 3 para o servidor de exemplo.

```sh
npm ci
npm run build
npm test
npm start
```

Abra `http://127.0.0.1:4173`. O site é estático, sem necessidade de servidor Node em produção. `assets/backend.bundle.js` é versionado para que o GitHub Pages sirva o projeto diretamente. Após editar `src/backend.js`, execute `npm run build` e inclua o bundle no commit.

O projeto Supabase é definido em `assets/backend-config.js`. A chave publicável pode estar no frontend; as regras de acesso ficam no banco. **Nunca coloque service_role, chave secreta, senha do banco ou credenciais SMTP no repositório.**

## Banco e permissões

As migrações em `supabase/migrations/` foram aplicadas ao projeto remoto. Não execute as migrações novamente no projeto já configurado. Em outro projeto vazio, aplique-as na ordem e ajuste a URL/chave publicável.

| Recurso | Visitante | Usuário | Administrador |
| --- | --- | --- | --- |
| Relatos aprovados | Ler | Ler e apoiar | Moderar |
| Relatos pendentes/rejeitados | Sem acesso | Apenas os próprios | Analisar |
| Diário | Sem acesso | Apenas o próprio | Sem acesso aos diários de terceiros |
| Candidaturas/comprovantes | Sem acesso | Apenas os próprios | Analisar |
| Lista de administradores | Sem acesso | Sem acesso | Mantida pelo proprietário no banco |

Todas as tabelas expostas têm RLS. Os comprovantes usam bucket privado e links de 60 segundos. Contas de acesso permanecem no Supabase Auth quando o usuário apaga seus dados de participação; o proprietário pode excluí-las no painel, removendo documentos pendentes antes disso. Backups e logs seguem a política do provedor.

## Validação

Os 43 testes originais da Bia passam em `npm test`. O script `scripts/integration.cjs` verifica o backend com três contas descartáveis já confirmadas, sem criar contas ou enviar e-mails. Forneça um arquivo de credenciais **fora do repositório** pela variável `MENTEABERTA_TEST_USERS_FILE`, com objetos `{role: 'alice'|'bob'|'admin', email, password, id}`. Use um projeto de QA; autorize a conta `admin` somente nesse ambiente.

```sh
node scripts/integration.cjs
```

O script verifica isolamento de dados, bloqueio de promoção por metadata, moderação, apoio único e acesso aos documentos. Remove os dados que cria ao final, salvo quando `MENTEABERTA_KEEP_QA=1` é definido para inspeção da interface. As contas descartáveis devem ser removidas pelo responsável após o teste.

## Conteúdo e operação

A Bia continua sendo uma assistente programada. O plantão de enfermagem é uma seção informativa, sem atendimento humano ao vivo. O certificado é um modelo ilustrativo e sua emissão depende da instituição. Candidaturas e relatos precisam ser analisados por quem administra o projeto. Os materiais do pacote original são preservados; não foi atribuída uma licença de redistribuição que o proprietário não tenha informado.
