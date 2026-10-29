const {test}=require('node:test');
const assert=require('node:assert/strict');
const Bia=require('../assets/bia-conversas.js');
function run(sequence){const state=Bia.newSession();return sequence.map(msg=>({msg,...Bia.answer(state,msg)}));}
test('bug screenshot: positive without special event is acknowledged, no forced celebration',()=>{
 const replies=run(['Oi estou bem','Estou bem, não aconteceu nada','Nada']);
 assert.equal(replies[0].topic,'alegria');
 assert.equal(replies[1].kind,'followup');
 assert.equal(replies[1].topic,'alegria');
 assert.ok(!/conquista especial|parab[eé]ns|voc[eê] conseguiu/.test(replies[1].text.toLowerCase()));
 assert.equal(replies[2].kind,'followup');
 assert.ok(!/o que aconteceu para deixar seu dia assim|o que fez voce se sentir assim|parte voce gostaria de lembrar/.test(Bia.normalize(replies[2].text)));
});
test('does not loop on reason after nothing',()=>{
 const replies=run(['Oi estou bem','não aconteceu nada','nada','quero que você puxe um assunto','gosto de jogos','jogo minecraft']);
 assert.equal(replies[3].kind,'casual');
 assert.ok(/jog/.test(replies[4].text.toLowerCase()));
 assert.match(replies[5].text,/minecraft/i);
});
test('guided education stays on topic across short answers',()=>{
 const replies=run(['Oi quero estudar','Tenho pouco tempo','Matemática','Quero montar um plano de estudos','Tenho 15 minutos']);
 assert.equal(replies[0].topic,'estudo');
 assert.equal(replies[1].topic,'estudo');
 assert.ok(/tempo|tarefa|minuto|plano|simpl/.test(replies[1].text.toLowerCase()));
 assert.match(replies[2].text,/matemática/i);
 assert.equal(replies[3].topic,'estudo');
 assert.equal(replies[4].topic,'estudo');
});
test('negation, limits and model transparency',()=>{
 const replies=run(['Oi estou mal','não quero falar sobre isso','Mudar de assunto','Quem é você?']);
 assert.equal(replies[0].topic,'tristeza');
 assert.equal(replies[1].kind,'boundary');
 assert.equal(replies[2].kind,'new-topic');
 assert.equal(replies[3].kind,'identity');
 assert.match(replies[3].text,/programadas/i);
});
test('non-danger denial is not emergency',()=>{
 assert.notEqual(Bia.answer(Bia.newSession(),'Não estou em perigo').kind,'danger');
 assert.equal(Bia.answer(Bia.newSession(),'Estou em perigo agora').kind,'danger');
 assert.equal(Bia.answer(Bia.newSession(),'Quero me matar').kind,'crisis');
});
test('no instant repeats for opening greetings and short followups',()=>{
 const replies=run(['Oi','Oi','Oi tudo bem','Oi tudo bem']);
 assert.notEqual(replies[0].text,replies[1].text);
 assert.notEqual(replies[2].text,replies[3].text);
});
test('variety count meets expanded content requirement',()=>{
 const s=Bia.statistics();
 assert.ok(s.topics>=17);
 assert.ok(s.topicReplies>=300);
 assert.ok(s.contextReplies>=100);
});
test('several long multi-topic conversations never return null',()=>{
 const sequences=[
 ['oi','tudo bem','estou bem','nada','nao sei','me faz uma pergunta','gosto de música','ouço rock','tchau'],
 ['oi estou mal','nao aconteceu nada','não sei','quero só desabafar','meu pai não me entende','não quero dicas','tchau'],
 ['oi quero estudar','tenho pouco tempo','Matemática','quero uma dica','não consigo me concentrar','sim','não','não sei','valeu','tchau'],
 ['Estou me sentindo sozinha','foi hoje','meu amigo não me entende','sim','quero ajuda profissional','tchau'],
 ];
 for(const seq of sequences){for(const res of run(seq)){assert.ok(res.text?.length>15,res.msg);assert.ok(res.options?.length>0,res.msg);}}
});
test('study negation does not cheerlead studying',()=>{
 for(const message of ['Não gosto de estudar','Não quero estudar','Odeio estudar']){
   const out=Bia.answer(Bia.newSession(),message);
   assert.equal(out.topic,'estudo');
   assert.ok(!/legal que voce quer estudar|que bom que quer estudar|bora estudar/.test(Bia.normalize(out.text)));
 }
});
test('quick option and casual hobby retain correct context',()=>{
 const replies=run(['Oi, estou bem','Nada de especial','Puxar um assunto leve','Gosto de rock','Tchau']);
 assert.equal(replies[2].kind,'casual');
 assert.match(replies[3].text,/rock/i);
 assert.equal(replies[4].kind,'end');
});
test('specific study time uses the time already supplied',()=>{
 const replies=run(['Quero estudar','Matemática','Tenho 15 minutos']);
 assert.match(replies[2].text,/15 minutos/i);
 assert.match(replies[2].text,/matemática/i);
 assert.ok(!/quanto tempo voce tem/.test(Bia.normalize(replies[2].text)));
});
