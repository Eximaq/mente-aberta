const {test}=require('node:test');
const assert=require('node:assert/strict');
const Bia=require('../assets/bia-conversas.js');

const cases=[
 ['Oi',null,'hello'],
 ['Oi, tudo bem?',null,'hello'],
 ['Oie, boa tarde',null,'hello'],
 ['Oi, estou mal','tristeza','topic'],
 ['Oi, tudo bem? Estou mal','tristeza','topic'],
 ['Oi, quero estudar','estudo','topic'],
 ['Oi, quero estudar matemática','estudo','topic'],
 ['Quero me concentrar','foco','topic'],
 ['Tenho prova amanhã','provas','topic'],
 ['Estou nervosa','ansiedade','topic'],
 ['Me sinto sozinha','solidao','topic'],
 ['Me deixaram de lado','amizade','topic'],
 ['Estão me humilhando','bullying','topic'],
 ['Minha mãe não me entende','familia','topic'],
 ['Eu me acho feia','autoestima','topic'],
 ['Terminei com meu namorado','relacionamento','topic'],
 ['Não consigo dormir','sono','topic'],
 ['Estou com raiva','raiva','topic'],
 ['Não sei qual faculdade escolher','futuro','topic'],
 ['Quero relaxar','autocuidado','topic'],
 ['Hoje estou feliz','alegria','topic'],
 ['Quero desabafar','desabafo','topic'],
 ['Obrigado',null,'thanks'],
 ['Tchau',null,'end'],
 ['Quero me matar',null,'crisis'],
 ['Estou em perigo',null,'danger']
];
for(const [input,topic,kind] of cases){
 test('reconhece: '+input,()=>{
  const session=Bia.newSession();const out=Bia.answer(session,input);
  assert.ok(out && out.text.length>20);
  assert.equal(out.topic,topic);assert.equal(out.kind,kind);
  assert.ok(out.options.length>0);
 });
}
test('pergunta negativa não dispara risco agudo por engano',()=>{
 const out=Bia.answer(Bia.newSession(),'Eu não quero me matar');
 assert.notEqual(out.kind,'crisis');
});
test('cumprimento com assunto não é engolido pelo oi',()=>{
 const out=Bia.answer(Bia.newSession(),'Oi, tudo bem? Estou mal hoje');
 assert.equal(out.topic,'tristeza');
});
test('meio da conversa preserva tema, depois muda de assunto e despede',()=>{
 const s=Bia.newSession();
 let out=Bia.answer(s,'Oi, quero estudar');assert.equal(out.topic,'estudo');
 out=Bia.answer(s,'Sim');assert.equal(out.topic,'estudo');
 out=Bia.answer(s,'Tenho pouco tempo');assert.equal(out.topic,'estudo');
 out=Bia.answer(s,'Quero uma dica');assert.equal(out.kind,'advice');assert.equal(out.topic,'estudo');
 out=Bia.answer(s,'Quero mudar de assunto');assert.equal(out.kind,'new-topic');assert.equal(s.topic,null);
 out=Bia.answer(s,'Estou me sentindo triste');assert.equal(out.topic,'tristeza');
 out=Bia.answer(s,'Tchau');assert.equal(out.kind,'end');
 out=Bia.answer(s,'Oi tudo bem?');assert.equal(out.kind,'hello');
});
test('mesma mensagem produz variação sem repetir de imediato',()=>{
 const s=Bia.newSession();
 const a=Bia.answer(s,'Oi');const b=Bia.answer(s,'Oi');
 assert.notEqual(a.text,b.text);
});
test('tópicos possuem abertura, continuação, ajuda e opções',()=>{
 const count=Object.keys(Bia.topicData).length;
 assert.ok(count>=16);
 for(const t of Object.values(Bia.topicData)){
   assert.ok(t.opening.length>=4);
   assert.ok(t.middle.length>=4);
   assert.ok(t.advice.length>=3);
   assert.ok(t.options.length>=4);
 }
});
test('sem mensagens vazias depois de conversas longas',()=>{
 const s=Bia.newSession();const arr=['Oi','Oi tudo bem','Estou mal','Fui mal na escola','Sim','Foi hoje','Quero uma dica','Não','Não sei','Quero conversar','Obrigado','Quero continuar','Me sinto sozinha','Meu pai brigou comigo','Tchau'];
 for(const msg of arr){const out=Bia.answer(s,msg);assert.ok(out.text.length>25, msg);assert.ok(out.options.length,msg)}
});
