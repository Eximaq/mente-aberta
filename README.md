# MenteAberta

Site de educação emocional baseado no pacote `MenteAberta_Original_Aprimorado_v4`, preservando as ilustrações, as histórias interativas e as respostas programadas da Bia.

- **Site:** https://eximaq.github.io/mente-aberta/
- **Repositório:** https://github.com/Eximaq/mente-aberta
- **Supabase:** projeto `apilsepmphnrgsipnypk`, organização Noxgran, região São Paulo.

## Recursos implementados

- Cadastro com entrada imediata, login e alteração de senha pelo Supabase Auth, sem confirmação de e-mail na apresentação.
- Diário emocional privado, com os sete últimos registros na tela e exportação do histórico completo.
- Comunidade compartilhada: relatos aguardam aprovação; apoios são únicos por conta e podem ser retirados.
- Painel administrativo para aprovar, rejeitar ou devolver relatos/candidaturas para análise.
- Candidatura de voluntários com comprovantes privados em PDF, JPG, PNG ou WebP, até 5 MB. Uma candidatura por conta; é possível retirá-la e reenviar.
- Download dos próprios dados e exclusão dos dados de participação.
- Bia local com respostas programadas, sem envio da conversa ao banco.

## Configuração para apresentação acadêmica

**O cadastro funciona sem SMTP.** A confirmação de e-mail está desativada para que uma nova conta possa entrar imediatamente. O e-mail informado não comprova identidade. Os dados continuam protegidos por conta e pelas regras de acesso do banco.

Para demonstrar: abra o site, clique em **Entrar / Criar conta → Criar conta**, informe e-mail e senha e aceite o uso dos dados. A conta entra imediatamente e pode usar diário, comunidade e candidatura de voluntariado. Os artigos do blog, as histórias e a Bia também funcionam sem login.

Guarde a senha: esta versão não envia recuperação por e-mail. A senha pode ser alterada em **Minha conta** enquanto o usuário estiver conectado. Para habilitar envio de e-mails no futuro, conecte SMTP e adapte a interface antes de reativar a confirmação. Consulte a [documentação de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Administração

O responsável recebeu um código privado de ativação fora do repositório público. Crie a conta com o e-mail indicado, entre em **Minha conta → Ativar administração do projeto**, cole o código e confirme. Ele só funciona para o e-mail designado e só pode ser usado uma vez. Depois disso o acesso fica vinculado ao ID da conta; cadastrar um endereço de e-mail sozinho não concede administração.

Para autorizar outra conta já identificada pelo proprietário, use o ID correto no SQL Editor:

```sql
insert into private.administrators(email,user_id)
select lower(email),id from auth.users where id = 'ID-DA-CONTA-IDENTIFICADA'::uuid
on conflict (email) do update set user_id=excluded.user_id,activation_hash=null;
```

Não conceda permissões com base apenas no e-mail de um cadastro sem verificação. `user_metadata` não concede permissões. Para revogar acesso, remova a associação da lista privada. As políticas consultam o banco em cada operação, sem depender de uma flag editável no navegador.

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
