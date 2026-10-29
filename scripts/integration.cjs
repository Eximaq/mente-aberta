// Teste contra um projeto de QA com três contas descartáveis já confirmadas.
// Não cria contas nem envia e-mails. Credenciais ficam fora do repositório.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL || 'https://apilsepmphnrgsipnypk.supabase.co';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Cjtp78hxn_5YNRG-m7kzlQ_L6plbIpM';
const users = JSON.parse(fs.readFileSync(process.env.MENTEABERTA_TEST_USERS_FILE,'utf8'));
const options = {auth:{persistSession:false,autoRefreshToken:false}};
const publicClient = createClient(url,key,options);
const ok = result => { assert.equal(result.error,null,result.error?.message); return result.data; };
const clients = {};
async function main() {
  for (const fixture of users) {
    const client = createClient(url,key,options);
    ok(await client.auth.signInWithPassword({email:fixture.email,password:fixture.password}));
    clients[fixture.role] = client;
  }
  const {alice:a,bob:b,admin:m} = clients;
  const alice = users.find(u=>u.role==='alice'), bob = users.find(u=>u.role==='bob');
  assert.equal(ok(await a.rpc('current_user_is_admin')),false);
  if (process.env.MENTEABERTA_ADMIN_ACTIVATION_CODE) {
    const activation_code = process.env.MENTEABERTA_ADMIN_ACTIVATION_CODE;
    assert.equal(ok(await m.rpc('current_user_is_admin')),false);
    assert.equal(ok(await b.rpc('activate_administrator',{activation_code})),false);
    assert.equal(ok(await m.rpc('activate_administrator',{activation_code:'invalid-activation-code-with-at-least-32-characters'})),false);
    assert.equal(ok(await m.rpc('activate_administrator',{activation_code})),true);
    assert.equal(ok(await m.rpc('activate_administrator',{activation_code})),false);
    console.log('PASS ativação administrativa: código correto, conta correta e uso único');
  }
  assert.equal(ok(await m.rpc('current_user_is_admin')),true);
  ok(await b.auth.updateUser({data:{role:'admin',is_admin:true}}));
  assert.equal(ok(await b.rpc('current_user_is_admin')),false);
  console.log('PASS login real, administrador autorizado e proteção contra promoção por metadata');

  const emotion = ok(await a.from('emotion_entries').insert({mood:'Bem'}).select()).at(0);
  assert.equal(ok(await b.from('emotion_entries').select('*').eq('id',emotion.id)).length,0);
  assert.equal(ok(await m.from('emotion_entries').select('*').eq('id',emotion.id)).length,0);
  assert.ok((await b.from('emotion_entries').insert({mood:'Bem',user_id:alice.id})).error);
  assert.ok((await publicClient.from('emotion_entries').select('*')).error);
  await b.from('emotion_entries').delete().eq('id',emotion.id);
  assert.equal(ok(await a.from('emotion_entries').select('id').eq('id',emotion.id)).length,1);
  console.log('PASS diário: isolamento entre contas, administração e visitantes; escrita e exclusão indevidas bloqueadas');

  const post = ok(await a.from('community_posts').insert({category:'#Ansiedade',author:'Pessoa de teste',content:'Relato de teste <img src=x onerror=alert(1)> sobre organizar os estudos.'}).select()).at(0);
  assert.equal(ok(await publicClient.from('community_feed').select('*').eq('id',post.id)).length,0);
  const denied = await a.from('community_posts').update({status:'approved'}).eq('id',post.id).select('id');
  assert.ok(denied.error || denied.data.length===0);
  assert.ok((await a.from('community_posts').insert({category:'#Ansiedade',author:'Teste',content:'Tentativa',status:'approved'})).error);
  assert.equal(ok(await m.from('community_posts').update({status:'approved'}).eq('id',post.id).select('id')).length,1);
  assert.equal(ok(await publicClient.from('community_feed').select('*').eq('id',post.id)).length,1);
  ok(await b.from('post_supports').insert({post_id:post.id}));
  assert.ok((await b.from('post_supports').insert({post_id:post.id})).error);
  assert.equal(ok(await publicClient.from('community_feed').select('likes').eq('id',post.id)).at(0).likes,1);
  ok(await b.from('post_supports').delete().eq('post_id',post.id).eq('user_id',bob.id));
  assert.equal(ok(await publicClient.from('community_feed').select('likes').eq('id',post.id)).at(0).likes,0);
  console.log('PASS moderação: pendência privada, publicação administrativa e apoio único reversível');

  const id = crypto.randomUUID(), path = `${alice.id}/${id}/document.pdf`;
  ok(await a.storage.from('volunteer-documents').upload(path,Buffer.from('%PDF-1.4\n% MenteAberta QA - documento fictício\n%%EOF'),{contentType:'application/pdf'}));
  assert.ok((await b.storage.from('volunteer-documents').download(path)).error);
  assert.ok((await publicClient.storage.from('volunteer-documents').download(path)).error);
  ok(await m.storage.from('volunteer-documents').download(path));
  assert.ok((await b.storage.from('volunteer-documents').upload(`${alice.id}/${crypto.randomUUID()}/document.pdf`,Buffer.from('qa'),{contentType:'application/pdf'})).error);
  assert.ok((await a.storage.from('volunteer-documents').upload(`${alice.id}/${crypto.randomUUID()}/document.html`,Buffer.from('<script>alert(1)</script>'),{contentType:'text/html'})).error);
  const application = {id,full_name:'Voluntária de Teste',email:alice.email,course:'Enfermagem',enrollment:'QA12345',semester:'4º período',motivation:'Quero contribuir com atividades educativas supervisionadas.',availability:'2 a 4 horas semanais',experience:'Primeira experiência em projetos sociais.',document_path:path};
  ok(await a.from('volunteer_applications').insert(application));
  assert.equal(ok(await b.from('volunteer_applications').select('*').eq('id',id)).length,0);
  assert.equal(ok(await m.from('volunteer_applications').select('*').eq('id',id)).length,1);
  assert.ok((await b.from('volunteer_applications').insert({...application,id:crypto.randomUUID(),user_id:alice.id})).error);
  assert.equal(ok(await m.from('volunteer_applications').update({status:'approved'}).eq('id',id).select('id')).length,1);
  assert.equal(ok(await a.from('volunteer_applications').select('status').eq('id',id)).at(0).status,'approved');
  ok(await a.storage.from('volunteer-documents').createSignedUrl(path,60));
  console.log('PASS candidatura, status, comprovante privado, link temporário e bloqueio de tipo de arquivo');
  if (process.env.MENTEABERTA_KEEP_QA === '1') {
    console.log('Dados de QA mantidos temporariamente para validação da interface.');
  } else {
    ok(await a.storage.from('volunteer-documents').remove([path]));
    ok(await a.from('volunteer_applications').delete().eq('id',id));
    ok(await a.from('community_posts').delete().eq('id',post.id));
    ok(await a.from('emotion_entries').delete().eq('id',emotion.id));
  }
  for (const client of Object.values(clients)) await client.auth.signOut();
  console.log('Integração com Supabase verificada.');
}
main().catch(error => { console.error(error.message); process.exitCode=1; });
