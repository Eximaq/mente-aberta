/* MenteAberta · Bia v3 · motor local de diálogos por intenções e contexto
 * Não usa IA generativa, nem comunica mensagens a servidor.
 * Texto educativo: revisão humana e protocolo assistencial necessários antes de uso público.
 */
(function (root) {
  'use strict';
  const norm = (text) => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
  const part = (s) => new RegExp(s, 'i');
  const TOPICS = {
    estudo: {
      label:'estudos', patterns:[/\bestud(?:ar|ando|o|os|ei)\b/,/\baprend(?:er|endo|i)\b/,/\brevis(?:ar|ao|aoes)\b/,/\b(?:materia|matematica|portugues|ingles|biologia|quimica|fisica|redacao|historia|geografia|dever de casa|escola)\b/],
      opening:[
        'Legal que você quer estudar! 📚 Está querendo começar uma matéria agora ou organizar uma rotina?',
        'Bora pensar nisso juntos. Qual matéria você quer aprender e quanto tempo tem disponível hoje?',
        'Podemos começar por algo pequeno. Você já sabe o conteúdo ou está tentando decidir por onde começar?',
        'Estudar fica mais leve com uma meta possível. O que seria uma boa conquista para hoje?'
      ],
      middle:[
        'Entendi. Se a tarefa está grande, que tal separar só o primeiro tópico? Qual seria?',
        'Você prefere aprender fazendo exercícios ou entendendo uma explicação primeiro?',
        'Podemos transformar isso num plano simples. Quanto tempo você consegue dedicar sem se sobrecarregar?',
        'Ficar com dúvida faz parte do aprendizado. O que você já conseguiu compreender até aqui?',
        'Uma meta pequena e uma pausa planejada costumam ajudar. O que mais está atrapalhando seu começo?'
      ],
      advice:[
        'Uma opção é: escolha um assunto, estude por 20 minutos, faça 5 minutos de pausa e depois tente explicar o que aprendeu com suas palavras. Quer adaptar esse plano?',
        'Para começar hoje: anote uma dúvida, escolha uma fonte confiável e faça dois exercícios. Depois veja onde travou. Quer montar isso para uma matéria específica?',
        'Se houver muita matéria, separe em “preciso aprender”, “preciso revisar” e “já sei”. Qual delas merece seu primeiro bloco de estudo?'
      ],
      options:['Quero montar um plano de estudos','Não consigo me concentrar','Tenho prova e estou nervoso','Quero estudar matemática']
    },
    provas: {
      label:'provas e notas',patterns:[/\bprovas?\b/,/\bvestibular\b/,/\benem\b/,/\b(?:notas?|boletim|avaliacao)\b/,/\bmedo de reprovar\b/],
      opening:[
        'Provas podem trazer bastante pressão. O que preocupa mais: o conteúdo, o tempo ou a expectativa de alguém?',
        'Entendo essa tensão. Você está se preparando para uma prova próxima ou pensando no resultado de uma que já fez?',
        'Uma nota não define tudo sobre você. Quer me contar de qual prova estamos falando?',
        'Antes de pensar em todas as matérias, qual é a prova mais próxima? Podemos começar por ela.'
      ],
      middle:[
        'Você está mais preocupado com o que ainda não estudou ou com o medo de esquecer na hora?',
        'O que você já fez para se preparar? Quero entender o ponto em que está agora.',
        'É uma situação exigente. Você prefere organizar uma revisão curta ou só conversar sobre a cobrança?',
        'Se a cobrança vier de alguém próximo, pode ajudar falar sobre o peso dessas expectativas. Isso acontece com você?'
      ],
      advice:[
        'Tente listar três conteúdos prioritários para revisar, reservar pausas e evitar virar a noite estudando. Quer escolher os três juntos?',
        'Se der branco, você pode ler a questão com calma, começar pelas que sabe e voltar às mais difíceis. O que costuma acontecer com você durante provas?',
        'Podemos montar uma revisão curta por assunto, sem tentar aprender tudo de uma vez. Qual matéria entra primeiro?'
      ],
      options:['A prova é amanhã','Tenho medo da nota','Quero revisar uma matéria','Quero diminuir a ansiedade']
    },
    foco: {
      label:'foco e organização',patterns:[/\b(?:concentrar|concentracao|distraid[oa]|distra(?:io|ida)|procrastin(?:ar|acao)|adiando|enrolando|sem foco)\b/,/\b(?:organiz(?:ar|acao)|rotina baguncada)\b/],
      opening:[
        'Ter dificuldade para começar é frustrante. Você se distrai com alguma coisa específica ou sente que a tarefa é grande demais?',
        'Quando o foco não vem, pode ajudar diminuir a meta. O que você está tentando fazer agora?',
        'Não precisamos resolver seu dia inteiro. Qual é a primeira tarefa que você gostaria de tirar do papel?',
        'Entendi. Isso costuma acontecer quando você está cansado ou mesmo quando está descansado?'
      ],
      middle:[
        'O que geralmente aparece na hora de começar: celular, preocupação, tédio ou cansaço?',
        'Se você pudesse fazer apenas cinco minutos dessa atividade, qual seria o primeiro passo?',
        'Já encontrou algum horário em que se concentra melhor? Podemos aproveitar isso.',
        'Às vezes ajustar o ambiente ajuda. Você está num lugar onde consegue tentar uma etapa pequena?'
      ],
      advice:[
        'Experimente deixar uma tarefa só à vista, silenciar distrações por dez minutos e depois reavaliar. Qual tarefa você escolheria?',
        'Uma estratégia é escrever “vou abrir o material e ler a primeira página” em vez de “vou estudar tudo”. Quer definir sua primeira ação?',
        'Se o foco estiver difícil por muito tempo e atrapalhar sua vida, vale conversar com alguém da saúde ou educação. Por agora, qual ajuste simples é possível?'
      ],
      options:['Me distraio no celular','Não consigo começar','Quero uma rotina simples','Quero falar de provas']
    },
    ansiedade: {
      label:'ansiedade',patterns:[/\bansios[oa]\b/,/\bansiedade\b/,/\b(?:nervos[oa]|preocupad[oa]|aflit[oa]|agoniad[oa])\b/,/\b(?:panico|crise de ansiedade|coracao acelerado)\b/],
      opening:[
        'Parece que sua cabeça está a mil. 💜 A ansiedade apareceu por causa de algo que aconteceu ou veio sem um motivo claro?',
        'Obrigada por dividir isso. Você quer falar do que está preocupando você ou tentar encontrar uma pausa?',
        'Quando a preocupação aperta, é difícil organizar os pensamentos. O que mais tem passado pela sua cabeça?',
        'Estou acompanhando. Isso começou hoje ou tem acontecido em outros dias?'
      ],
      middle:[
        'Entendi. Qual é a parte mais difícil desse sentimento neste momento?',
        'Você percebe algum horário ou situação em que essa preocupação aumenta?',
        'Se estiver confortável, podemos escolher um pensamento de cada vez. Qual está mais forte agora?',
        'Você prefere continuar contando ou pensar em algo pequeno que possa tornar o momento mais tranquilo?',
        'Há alguém de confiança com quem você costuma conversar quando fica assim?'
      ],
      advice:[
        'Se for confortável, tente notar seus pés no chão e nomear cinco coisas que consegue ver. Isso não resolve tudo, mas pode ajudar a se orientar no presente.',
        'Uma possibilidade é reduzir a tarefa à próxima ação concreta e fazer uma pausa breve. Qual parte está sob seu controle agora?',
        'Se a ansiedade estiver frequente ou atrapalhando sono, estudos e rotina, vale buscar ajuda profissional. Você gostaria de pensar em alguém de confiança para conversar?'
      ],
      options:['Acontece na escola','Penso demais no futuro','Quero uma dica para me acalmar','Quero só desabafar']
    },
    tristeza: {
      label:'tristeza',patterns:[/\b(?:triste|tristeza|desanimad[oa]|desmotivad[oa]|chorei|chorando|vazi[oa]|abatid[oa]|deprimid[oa])\b/,/\b(?:estou|to|ando|me sinto|me sentindo) (?:muito )?mal\b/,/\bnao (?:estou|to|me sinto) bem\b/,/\b(?:dia horrivel|dia ruim|dia pessimo)\b/],
      opening:[
        'Poxa, sinto muito que o dia esteja difícil. 💜 Quer me contar o que aconteceu?',
        'Obrigada por falar isso comigo. Esse sentimento começou hoje ou vem aparecendo há algum tempo?',
        'Nem sempre é fácil explicar quando estamos mal. Você quer só desabafar ou tentar entender o que pesou mais?',
        'Entendi que você não está bem. Estou aqui para uma conversa programada, sem julgamentos. Há algo que você gostaria de colocar em palavras?'
      ],
      middle:[
        'Isso parece ter sido bem desgastante. O que mais marcou você nessa situação?',
        'Se pudesse receber um tipo de apoio agora, seria companhia, descanso ou alguém para conversar?',
        'Você sente que está conseguindo cuidar das tarefas básicas ou está tudo ficando pesado?',
        'Não precisa contar detalhes que não queira. Quer falar do que ajudou, mesmo um pouquinho, em outros dias?',
        'Existe alguém de confiança com quem você se sentiria confortável em dividir isso?'
      ],
      advice:[
        'Talvez hoje seja suficiente escolher uma coisa pequena: beber água, descansar um pouco ou avisar alguém que está difícil. O que é possível para você?',
        'Se essa tristeza estiver persistindo ou atrapalhando a rotina, vale procurar alguém de confiança e um serviço de saúde. Posso ajudar a pensar em como começar essa conversa.',
        'Não precisamos transformar tudo em solução agora. Se preferir, podemos continuar conversando sobre o que aconteceu.'
      ],
      options:['Aconteceu hoje','Já faz alguns dias','Quero só desabafar','Quero pensar em apoio']
    },
    solidao: {
      label:'solidão',patterns:[/\b(?:sozinh[oa]|solidao|isolad[oa]|sem companhia)\b/,/\bninguem me entende\b/,/\bnao tenho amigos\b/],
      opening:[
        'Sentir-se só pode machucar, mesmo quando há gente por perto. Você sente falta de alguém específico?',
        'Obrigada por contar. Você anda passando muito tempo sozinho ou sente que ninguém te compreende?',
        'Parece que está faltando conexão. Isso começou depois de alguma mudança ou foi acontecendo aos poucos?',
        'Você merece ter pessoas com quem se sinta à vontade. Quer me contar como têm sido seus dias?'
      ],
      middle:[
        'Você sente mais falta de conversar ou de participar de momentos junto com outras pessoas?',
        'Tem alguém com quem já se sentiu bem no passado e com quem gostaria de retomar contato?',
        'Quando a solidão aparece mais: na escola, em casa ou à noite?',
        'Podemos pensar em um contato pequeno e seguro. Isso parece possível hoje?'
      ],
      advice:[
        'Uma mensagem simples como “oi, faz tempo que não conversamos” pode ser um começo, se houver alguém seguro para procurar.',
        'Atividades de interesse comum podem ajudar a construir vínculos aos poucos. Existe algo de que você gosta e que costuma reunir pessoas?',
        'Se a solidão vier acompanhada de sofrimento intenso, procurar apoio de uma pessoa de confiança é importante. Quem poderia ser esse apoio?'
      ],
      options:['Me sinto excluído','Sinto falta dos meus amigos','Quero conhecer pessoas','Quero desabafar']
    },
    amizade: {
      label:'amizades',patterns:[/\b(?:amig[oa]s?|amizade|colegas?|excluid[oa]|ignorado|ignorada)\b/,/\bme deixaram de lado\b/,/\bbriguei com (?:uma? )?(?:amig|colega)/],
      opening:[
        'Amizades mexem muito com a gente. Houve alguma discussão ou você percebeu alguém se afastando?',
        'Entendi. Você quer me contar o que aconteceu entre vocês?',
        'Ser deixado de lado é doloroso. Isso foi uma situação isolada ou vem acontecendo com frequência?',
        'Você gostaria de recuperar uma amizade ou está tentando entender uma situação que te magoou?'
      ],
      middle:[
        'Como você se sentiu naquela hora?',
        'Você já teve oportunidade de falar com essa pessoa sobre isso?',
        'O que você gostaria que ela entendesse?',
        'Se for seguro conversar, qual seria a primeira coisa que você gostaria de dizer?'
      ],
      advice:[
        'Uma conversa pode começar com “eu me senti triste quando isso aconteceu”, sem acusar ou adivinhar a intenção da outra pessoa.',
        'Se houver humilhação repetida ou ameaças, não precisa resolver sozinho: peça apoio a um adulto seguro.',
        'Também é válido construir novos vínculos sem apagar os antigos. Há alguma atividade de que você gosta para conhecer pessoas?'
      ],
      options:['Me deixaram de lado','Briguei com um amigo','Quero fazer novos amigos','Quero mudar de assunto']
    },
    bullying: {
      label:'bullying',patterns:[/\bbullying\b/,/\b(?:me zoam|me humilham|me ofendem|me intimidam|me perseguem)\b/,/\b(?:apelidos ofensivos|tirando sarro de mim|rindo de mim)\b/,/\b(?:me humilhando|estao me humilhando|me humilharam|estou sendo humilhad[oa])\b/],
      opening:[
        'Sinto muito que estejam te tratando assim. Você merece respeito. Isso acontece na escola, na internet ou em outro lugar?',
        'Humilhações repetidas não são brincadeira. Você está em segurança agora?',
        'Obrigada por contar. Existe um adulto de confiança que saiba do que está acontecendo?',
        'Não precisa enfrentar intimidação sozinho. Quer me contar o que houve, sem entrar em detalhes que te deixem desconfortável?'
      ],
      middle:[
        'Isso tem se repetido? Um professor, responsável ou coordenador está sabendo?',
        'Sua segurança importa. Você consegue buscar companhia de alguém confiável nesses momentos?',
        'Se for seguro, você pode registrar o que aconteceu e procurar um adulto. Tem alguém em mente?',
        'É importante não colocar você em risco tentando resolver sozinho. Você se sente seguro para pedir apoio?'
      ],
      advice:[
        'Se houver agressão ou ameaça agora, procure um lugar seguro e um adulto imediatamente. Em emergência, acione os serviços locais.',
        'Se acontecer online, preservar mensagens pode ajudar a relatar, desde que não coloque você em perigo. Procure apoio de um adulto seguro.',
        'Uma forma de pedir ajuda é dizer “isso está acontecendo várias vezes e preciso que um adulto me ajude a parar”. Quer pensar em quem procurar?'
      ],
      options:['Acontece na escola','Acontece na internet','Não sei para quem contar','Estou em perigo agora']
    },
    familia: {
      label:'família',patterns:[/\b(?:familia|familiares|meus pais|minha mae|meu pai|minha irma|minha irmao|irmaos?|responsaveis?)\b/,/\b(?:briga em casa|discussao em casa|problema em casa)\b/],
      opening:[
        'Conflitos em casa podem pesar bastante. Você quer me contar o que aconteceu?',
        'Entendi que envolve sua família. Você gostaria de ser ouvido ou precisa de ajuda para pensar em como conversar?',
        'Nem sempre é fácil falar com quem está perto. Você se sente seguro em casa?',
        'Parece uma situação importante para você. Isso aconteceu hoje ou já vem de algum tempo?'
      ],
      middle:[
        'O que você gostaria que sua família entendesse sobre o que está sentindo?',
        'Você já teve um momento mais tranquilo para conversar ou costuma virar discussão?',
        'Quando isso acontece, tem algum adulto de confiança fora de casa a quem possa recorrer?',
        'Se estiver seguro, podemos pensar numa maneira simples de expressar seu sentimento, sem exigir uma solução imediata.'
      ],
      advice:[
        'Quando houver segurança, tentar falar em um momento calmo e usar frases como “eu me sinto...” pode abrir um diálogo.',
        'Você não precisa insistir numa conversa se houver ameaça ou agressão. Nesse caso, sua segurança vem antes de qualquer acordo.',
        'Se for difícil falar pessoalmente, você poderia escrever uma mensagem curta para alguém confiável. Isso parece viável?'
      ],
      options:['Tive uma discussão','Ninguém me escuta','Quero pedir ajuda','Não me sinto seguro em casa']
    },
    autoestima: {
      label:'autoestima',patterns:[/\b(?:autoestima|feia|feio|aparencia|espelho|me comparo|insegur[oa]|vergonha do meu corpo|me acho horrivel)\b/,/\b(?:redes sociais|filtros da internet)\b/],
      opening:[
        'Comparações podem pesar muito. Aconteceu algo que mexeu com a forma como você se vê?',
        'Entendo. Essa insegurança tem mais a ver com comentários de outras pessoas ou com o que você pensa ao se olhar?',
        'Você não precisa gostar de tudo em si o tempo inteiro. Quer me contar o que desencadeou esse sentimento?',
        'A aparência é só uma parte da nossa história. Algo nas redes sociais te fez se comparar hoje?'
      ],
      middle:[
        'Quando esse pensamento aparece, existe algo que o deixa mais forte?',
        'O que você diria a um amigo que estivesse se tratando com tanta cobrança?',
        'Você sente que os comentários de outras pessoas influenciam muito como se vê?',
        'Se quiser, podemos pensar em qualidades suas que não tenham a ver com aparência.'
      ],
      advice:[
        'Se um perfil nas redes faz você se sentir pior com frequência, silenciar ou fazer uma pausa pode ser um cuidado possível.',
        'Uma ideia é escrever uma coisa que valoriza em si além da aparência: uma habilidade, um interesse ou um gesto de cuidado.',
        'Se alguém estiver humilhando você, procure ajuda de uma pessoa de confiança. Você merece respeito.'
      ],
      options:['Me comparo com outras pessoas','Fizeram um comentário','Quero ser mais gentil comigo','Quero desabafar']
    },
    relacionamento: {
      label:'relacionamentos',patterns:[/\b(?:namorad[oa]|namoro|namorar|ficante|termino|terminei|ciumes|cora[cç]ao partido|apaixonad[oa])\b/],
      opening:[
        'Relacionamentos podem trazer sentimentos intensos. O que aconteceu entre vocês?',
        'Entendi. Você está tentando entender uma conversa, um término ou algo que está vivendo agora?',
        'Quer me contar como isso tem feito você se sentir?',
        'Às vezes a gente fica cheio de perguntas. Você quer falar sobre confiança, limites ou saudade?'
      ],
      middle:[
        'O que você mais gostaria de entender nessa situação?',
        'Você se sente respeitado nessa relação?',
        'Aconteceu alguma coisa específica que mudou a forma como você se sente?',
        'Você prefere organizar o que gostaria de dizer ou só colocar para fora?'
      ],
      advice:[
        'Expressar o que você sente com respeito e falar dos seus limites pode ajudar, desde que haja segurança.',
        'Você não precisa aceitar pressão, controle ou ameaças para manter uma relação. Procure apoio se estiver vivendo isso.',
        'Depois de um término, pode ajudar ter tempo e apoio para lidar com a saudade. Como estão seus dias?'
      ],
      options:['Tivemos uma briga','Estou com ciúmes','Terminamos','Quero só conversar']
    },
    sono: {
      label:'sono',patterns:[/\b(?:sono|dormir|durmo|ins[oô]nia|insomnia|nao dormi|acordo cansad[oa]|sem dormir)\b/],
      opening:[
        'Dormir mal pode deixar o dia muito mais difícil. Você tem dificuldade para pegar no sono ou acorda várias vezes?',
        'Seu sono mudou recentemente? Às vezes a rotina ou preocupações interferem bastante.',
        'Entendi. Você sente que a cabeça não desliga quando vai deitar?',
        'O descanso faz diferença. Há quantos dias o sono está complicado?'
      ],
      middle:[
        'Você costuma usar o celular até a hora de dormir ou fica preocupado com alguma coisa?',
        'Em que horário o sono costuma apertar ou ir embora?',
        'Você está cansado durante o dia também?',
        'Se isso tem se repetido, é bom procurar orientação de saúde. Quer pensar numa mudança de rotina possível?'
      ],
      advice:[
        'Se der, experimente diminuir estímulos antes de deitar e criar um horário de descanso relativamente constante.',
        'Quando o sono fica ruim por muito tempo, um profissional pode investigar o motivo. Evite tomar medicamentos por conta própria.',
        'Você pode anotar o que está preocupando você antes de dormir e deixar para retomar no dia seguinte. Isso parece útil?'
      ],
      options:['Penso demais à noite','Não consigo pegar no sono','Acordo cansado','Quero falar de ansiedade']
    },
    raiva: {
      label:'raiva e frustração',patterns:[/\b(?:raiva|irritad[oa]|frustrad[oa]|odio|furios[oa]|bravo|brava|explodi|estressad[oa])\b/],
      opening:[
        'Parece que algo te irritou bastante. Quer me contar o que aconteceu?',
        'Raiva também é uma emoção importante. Você ficou magoado, injustiçado ou sobrecarregado?',
        'Imagino que isso tenha sido intenso. Você quer colocar em palavras o que mais incomodou?',
        'Entendi. Foi algo que aconteceu agora ou está se acumulando há algum tempo?'
      ],
      middle:[
        'O que você mais gostaria que fosse diferente nessa situação?',
        'Você teve espaço para se afastar e pensar antes de reagir?',
        'Ficar com raiva não significa agir de um jeito que machuque alguém. O que pode ajudar você a ganhar um pouco de espaço agora?',
        'Você quer conversar sobre a situação ou sobre como lidar com esse sentimento?'
      ],
      advice:[
        'Se for possível, afaste-se um pouco da discussão, beba água e volte a falar quando estiver mais calmo.',
        'Uma frase simples pode ajudar: “eu preciso de um momento antes de continuar essa conversa”.',
        'Se você tiver medo de perder o controle e ferir alguém, afaste-se da situação e procure apoio de uma pessoa segura imediatamente.'
      ],
      options:['Briguei com alguém','Me sinto injustiçado','Quero me acalmar','Quero desabafar']
    },
    futuro: {
      label:'futuro e decisões',patterns:[/\b(?:futuro|carreira|faculdade|profissao|escolher curso|nao sei o que fazer da vida|meu caminho)\b/],
      opening:[
        'Pensar no futuro pode animar e assustar ao mesmo tempo. O que mais tem passado pela sua cabeça?',
        'Você está tentando escolher um caminho ou lidando com expectativas de outras pessoas?',
        'Ninguém precisa ter a vida inteira definida agora. Qual decisão está mais próxima?',
        'Entendo essa preocupação. O que você gostaria de explorar sem se cobrar uma resposta definitiva?'
      ],
      middle:[
        'Essa escolha é sua ou você sente que alguém está pressionando?',
        'Há algo que você gosta de fazer, mesmo que ainda não saiba se vira profissão?',
        'Podemos pensar em interesses, possibilidades e próximos passos. Qual deles parece mais útil?',
        'O que seria um pequeno jeito de conhecer melhor essa área?'
      ],
      advice:[
        'Uma ideia é listar três interesses, conversar com pessoas de áreas diferentes e pesquisar cursos antes de decidir.',
        'Experimente separar o que você quer do que esperam de você. Nem tudo precisa ser decidido de uma vez.',
        'Visitar uma feira de profissões ou conhecer uma rotina de trabalho pode trazer informações mais concretas. Alguma área chama sua atenção?'
      ],
      options:['Não sei qual curso escolher','Minha família me pressiona','Tenho medo de errar','Quero falar da escola']
    },
    autocuidado: {
      label:'autocuidado',patterns:[/\b(?:autocuidado|cuidar de mim|relaxar|me acalmar|pausa|respirar|respiracao|descansar|bem estar)\b/],
      opening:[
        'Que bom reservar um momento para você. Quer uma ideia de pausa curta ou conversar sobre o que precisa?',
        'Cuidar de si não precisa ser complicado. O que faria diferença agora: silêncio, movimento leve ou descanso?',
        'Podemos pensar num cuidado pequeno e possível para hoje. Como está sua energia?',
        'Uma pausa também é produtiva quando você precisa dela. Quer tentar algo simples?'
      ],
      middle:[
        'Você prefere uma atividade mais quieta ou algo que ajude a mudar de ambiente?',
        'Já tem alguma coisa que costuma te trazer conforto?',
        'Qual parte do seu dia teria espaço para um cuidado pequeno?',
        'Se sentir desconforto com algum exercício, não precisa continuar. Quer outra opção?'
      ],
      advice:[
        'Se estiver confortável, coloque os pés no chão, solte os ombros e respire naturalmente. Você pode parar a qualquer momento.',
        'Uma pausa curta longe das telas ou uma caminhada leve podem ajudar, conforme seu contexto e disposição.',
        'Que tal escolher entre beber água, conversar com alguém ou descansar um pouco? Qual parece mais possível?'
      ],
      options:['Quero respirar um pouco','Quero montar uma rotina leve','Quero conversar','Estou cansado']
    },
    alegria: {
      label:'alegria e conquistas',patterns:[/\b(?:feliz|alegre|animad[oa]|consegui|conquista|vitoria|deu certo|passei de ano|estou bem|to bem|otim[oa])\b/],
      opening:[
        'Que notícia boa! ✨ O que aconteceu para deixar seu dia assim?',
        'Adorei saber que algo foi bem. Quer me contar esse momento?',
        'Que legal! Às vezes vale guardar uma lembrança dessas. Qual foi a melhor parte?',
        'Bom saber que você está bem. Quer celebrar alguma conquista ou só bater papo?'
      ],
      middle:[
        'Que parte você gostaria de lembrar por mais tempo?',
        'Você compartilhou essa notícia com alguém importante?',
        'Parece um momento especial. O que fez diferença para você chegar até aqui?',
        'Vamos aproveitar essa energia boa. Há algo que você queira fazer agora?'
      ],
      advice:[
        'Se quiser, anote esse momento no diário para revisitar depois. Não precisa transformar alegria em tarefa, claro.',
        'Você pode comemorar do seu jeito: descansando, contando para alguém ou simplesmente curtindo.',
        'Reconhecer uma conquista pequena também faz diferença. Qual foi o passo de que você mais gostou?'
      ],
      options:['Consegui algo importante','Quero contar uma coisa boa','Quero registrar no diário','Quero falar de outra coisa']
    },
    desabafo: {
      label:'desabafo',patterns:[/\b(?:desabafar|desabafo|preciso conversar|quero conversar|me escuta|preciso falar|preciso contar|to confus[oa]|confus[oa])\b/],
      opening:[
        'Pode começar por onde for mais fácil. O que aconteceu hoje?',
        'Claro. 💜 Você não precisa organizar tudo perfeitamente. O que está pesando mais agora?',
        'Estou aqui como assistente programada para conversar. Você quer contar uma situação ou falar do que está sentindo?',
        'Tudo bem. Vamos no seu ritmo. O que você gostaria de colocar para fora primeiro?'
      ],
      middle:[
        'Estou acompanhando. E como isso fez você se sentir?',
        'O que mais ficou na sua cabeça depois do que aconteceu?',
        'Tem alguma parte dessa história que parece mais difícil de explicar?',
        'Você gostaria que alguém tivesse feito algo diferente naquela hora?',
        'Quer continuar contando ou prefere pensar em um próximo passo pequeno?'
      ],
      advice:[
        'Às vezes conversar com alguém de confiança fora da tela também faz diferença. Existe alguém que você escolheria?',
        'Podemos tentar nomear o sentimento principal ou simplesmente continuar sua história. O que prefere?',
        'Se estiver muito difícil, não precisa resolver tudo agora. Qual seria a forma mais gentil de cuidar de você hoje?'
      ],
      options:['Tive um dia difícil','Quero falar de algo na escola','Quero falar da família','Só preciso que me escute']
    }
  };
  const general = {
    opening:[
      'Quero entender melhor. Você está falando de uma situação que aconteceu ou de como está se sentindo?',
      'Pode me contar um pouco mais? Não precisa ter as palavras perfeitas.',
      'Estou aqui para conversar dentro das possibilidades das minhas respostas programadas. O que você gostaria de explorar?',
      'Entendi um pedaço do que você disse. Qual parte seria importante para começarmos?',
      'Podemos ir por etapas. Você quer falar de estudos, emoções ou de algo que aconteceu hoje?'
    ],
    middle:[
      'Quero acompanhar seu raciocínio. O que aconteceu depois disso?',
      'Como você se sentiu quando isso aconteceu?',
      'O que seria mais útil agora: falar mais sobre isso ou pensar numa próxima ação?',
      'Se eu não entendi direito, pode me corrigir. Qual é a parte mais importante do que você contou?',
      'Podemos continuar daqui. Você gostaria de me contar mais detalhes?'
    ],
    advice:[
      'Uma forma de começar é separar o que aconteceu, como você se sentiu e o que gostaria que mudasse. Qual desses pontos prefere explorar?',
      'Se for um assunto muito específico, minhas respostas programadas podem não conseguir ajudar. Posso conversar sobre emoções, estudos, família e amizades.',
      'Quando fizer sentido, conversar com alguém de confiança fora da tela pode ajudar bastante.'
    ],
    options:['Estou me sentindo mal','Quero estudar','Quero desabafar','Falar de outro assunto']
  };
  const banks = {
    hello:[
      'Oi! 💜 Que bom ter você aqui. Como está se sentindo hoje?',
      'Oii! 😊 Quer conversar sobre o seu dia ou escolher algum assunto?',
      'Olá! Eu sou a Bia, uma assistente de respostas programadas. Sobre o que quer conversar?',
      'Oi, oi! Que tal me contar como foi seu dia?',
      'Hey! Seja bem-vindo por aqui. Quer desabafar, estudar ou só bater papo?',
      'Oie! Você pode começar por onde se sentir confortável. Como está hoje?'
    ],
    helloQuestion:[
      'Oii! Obrigada por perguntar. 💜 Eu sou uma assistente programada, então não tenho sentimentos como uma pessoa, mas posso conversar com você. E você, como está?',
      'Oi! 😊 Estou funcionando direitinho por aqui. Como foi seu dia até agora?',
      'Olá! Tudo certo com meu sistema. E por aí, como você está se sentindo hoje?'
    ],
    thanks:[
      'Por nada! 💜 Obrigada por conversar comigo. Quer continuar ou prefere encerrar por hoje?',
      'Fico contente que a conversa tenha sido útil. Tem mais algum assunto que gostaria de explorar?',
      'Imagina! Se precisar de apoio real, lembre que alguém de confiança também pode escutar você. Quer conversar mais um pouco?',
      'Você é sempre bem-vindo para conversar neste espaço. Quer tentar outro assunto?'
    ],
    goodbye:[
      'Até mais! 💜 Obrigada pela conversa. Cuide-se e procure pessoas de confiança quando precisar.',
      'Tchau! Espero que o resto do seu dia seja mais tranquilo. Se quiser, pode voltar para conversar depois.',
      'Foi bom acompanhar essa conversa. 💜 Até a próxima! Se precisar de ajuda real, busque alguém de confiança.',
      'Até logo! Um passo de cada vez também é progresso. 💜'
    ],
    affirmative:[
      'Tá bem. Podemos continuar com calma. Você quer me contar o que aconteceu depois?',
      'Entendi. Qual parte você gostaria de explorar primeiro?',
      'Certo. Quero acompanhar melhor: isso está acontecendo hoje ou já faz um tempo?',
      'Combinado. Você prefere conversar mais ou tentar uma ideia prática?'
    ],
    negative:[
      'Tudo bem, não precisamos seguir por esse caminho. Quer explicar de outro jeito ou mudar de assunto?',
      'Sem problema. Você decide o ritmo. O que seria mais confortável conversar agora?',
      'Entendi. Não vou insistir. Podemos ficar em outro assunto, se preferir.',
      'Obrigada por me dizer. Quer escolher outro tema ou continuar só desabafando?'
    ],
    confused:[
      'Não tem problema não saber agora. Quer começar contando só como está se sentindo?',
      'Tudo bem. Às vezes leva tempo para entender as coisas. Tem alguma parte mais clara para você?',
      'Podemos começar com algo simples: essa situação te deixou mais triste, preocupado ou irritado?',
      'Sem pressa. Se quiser, me conte uma coisa pequena que aconteceu hoje.'
    ],
    human:[
      'Eu sou uma assistente de respostas programadas, não uma pessoa real. Não há estudante acompanhando esta conversa. Para conversar com alguém de verdade, procure uma pessoa de confiança ou um serviço de apoio.',
      'Aqui você está falando com a Bia, um sistema automatizado. Se preferir ajuda humana, tente alguém de confiança, a escola ou um serviço de saúde.'
    ],
    reset:[
      'Claro, vamos mudar de assunto! 😊 Quer falar de estudos, sentimentos, amizades ou algo diferente?',
      'Tudo bem! A gente pode começar outro tema. Qual você escolhe agora?',
      'Combinado, assunto novo. 💜 O que você gostaria de conversar?'
    ]
  };
  // Bia v4: decisões conversacionais guiadas por intenções, não apenas palavras-chave.
  // Cada mensagem mantém o último assunto e o tipo de pergunta que a Bia fez.
  const defaultOptions=['Oi, Bia!','Estou bem','Quero estudar','Preciso desabafar'];
  const safeOptions=['Vou procurar alguém de confiança','Preciso de ajuda agora','Onde encontro apoio humano?'];
  const greeting=/^(?:(?:oi+|ola+|oie+|oiee+|opa|e ai|eae|hey|hello|bom dia|boa tarde|boa noite|salve|fala)(?:\s+bia)?)(?:\s+|$)/;
  const yes=/^(?:sim+|s|claro|isso|exatamente|pode ser|pode ser sim|quero sim|topo|aham|uhum|bora|vamos|com certeza|pode|isso mesmo|quero|ta bom|ok|beleza)$/;
  const no=/^(?:nao+|n|nem|prefiro nao|acho que nao|deixa|agora nao|nao quero|nao obrigado|nao obrigada|nem pensar|deixa pra la)$/;
  const unsure=/^(?:nao sei|sei la|talvez|nao tenho certeza|to confus[oa]|estou confus[oa]|nao faco ideia)$/;
  const bye=/^(?:tchau+|ate logo|ate mais|flw|fui|adeus|tenho que ir|vou sair|boa noite tchau|encerrar|pode encerrar|quero encerrar|ate depois|falou)(?:\s+bia)?$/;
  const thanks=/^(?:obrigad[oa]|muito obrigad[oa]|valeu|vlw|gratidao|brigad[oa]|obg)(?:\s+(?:mesmo|bia|de verdade|pela ajuda))?$/;
  const riskNegation=/\b(?:nao quero|nunca pensei em|nao penso em|nao vou|nao pretendo|nem penso em|nao tenho vontade de)\s+(?:me matar|me suicidar|morrer|tirar minha vida|me machucar|me ferir|me cortar)\b/;
  const dangerNegation=/\b(?:nao estou em perigo|nao corro perigo|nao estou sendo agredid[oa]|nao estao me ameacando)\b/;
  const danger=/\b(?:estou em perigo|estou sendo agredid[oa]|me batem|me ameacam|ameaca de morte|nao estou segur[oa]|nao me sinto segur[oa]|estao me machucando|sofro violencia|alguem quer me machucar)\b/;
  const risk=/\b(?:quero morrer|nao quero viver|vou me matar|quero me matar|penso em me matar|vou me suicidar|quero me suicidar|tirar minha vida|acabar com minha vida|nao aguento mais viver|vou me cortar|quero me ferir|vou me machucar|penso em tirar minha vida|queria nunca ter nascido)\b/;
  const possibleRisk=/\b(?:queria sumir para sempre|nao aguento mais nada|nao vejo saida|quero desaparecer para sempre|penso em me machucar)\b/;
  const askHuman=/\b(?:quem e voce|voce e (?:uma )?(?:pessoa|robo|ia)|pessoa de verdade|humano de verdade|falar com pessoa real|voce e real|voce e humana|voce e gente)\b/;
  const askHelp=/\b(?:apoio humano|ajuda profissional|psicolog[oa]|posto de saude|caps|cvv|onde (?:acho|encontro|procuro) ajuda)\b/;
  const askTips=/\b(?:dicas?|conselhos?|o que (?:faco|fazer)|me ajud(?:a|ar)|como (?:faco|posso|consigo)|sugest(?:ao|oes)|plano|passo a passo)\b/;
  const askNew=/\b(?:mudar de assunto|outro assunto|falar de outra coisa|comecar de novo|novo assunto|recome[cç]ar a conversa|reiniciar|outro tema)\b/;
  const genericHelloQuestion=/^(?:tudo bem|td bem|como voce esta|como vc ta|como vai|como ta)(?: bia)?$/;
  const noEvent=/^(?:(?:nao |n )?(?:aconteceu|rolou|houve) nada(?: de (?:especial|diferente))?|nada(?: de especial| demais| muito interessante)?|nenhuma coisa|nenhuma novidade|foi um dia normal|nao tenho novidade|so estou bem|simplesmente estou bem|sem motivo|nenhum motivo|sei la foi normal)$/;
  const okayButNothing=/\b(?:estou bem|to bem|estou otimo|ta tudo bem|estou feliz|estou tranquila|estou tranquilo|to feliz)\b.*\b(?:nada|normal|sem motivo)\b|\b(?:nao aconteceu nada|nao rolou nada|nada de especial|dia normal)\b/;
  const mixedFeeling=/\b(?:mais ou menos|mais ou menos assim|nem bem nem mal|normal|de boa|indo|na media|tanto faz)\b/;
  const smallTalk=/\b(?:entediad[oa]|sem fazer nada|sem assunto|bater papo|conversa aleatoria|puxar assunto|to de bobeira|so conversar)\b/;
  const lackTime=/\b(?:pouco tempo|so tenho (?:\d+|poucos) minutos|sem tempo|correria|rapidinho|tenho (?:10|15|20|30) minutos)\b/;
  const negatedPositive=/\b(?:nao estou bem|nao to bem|nao estou feliz|nem estou bem|estou mal|to mal|me sinto mal)\b/;
  const normalizedTopic = s => TOPICS[s] || general;
  function stripGreeting(n){let rest=n;for(let x=0;x<2;x++)rest=rest.replace(greeting,'').trim();return rest;}
  function hasText(n,expr){return expr.test(n);}
  const EXTRA = {
    alegria:{
      opening:['Que bom saber! 💜 Pode ser só um dia tranquilo, sem nenhuma novidade. Você quer bater papo ou fazer alguma coisa por aqui?', 'Oi! Fico contente que esteja tudo bem. Não precisa ter um motivo especial. Você está só de passagem ou quer conversar um pouquinho?', 'Que legal que está bem! Se quiser, a gente pode falar de música, rotina, estudos ou qualquer coisa do seu dia.', 'Às vezes estar bem já basta. Você prefere uma conversa leve ou explorar o diário e as histórias?'],
      middle:['Legal! E se nada diferente aconteceu, podemos simplesmente conversar. Sobre o que você gosta de falar?', 'Entendi. Você prefere trocar de assunto ou seguir falando sobre como está hoje?', 'Tudo certo, não precisa justificar estar bem. Quer me contar uma coisa de que gosta?', 'E quando o dia está comum assim, o que você costuma fazer para passar o tempo?'],
      advice:['Se quiser guardar o registro de um dia tranquilo, o diário está disponível. Ou a gente pode falar de outra coisa, sem compromisso.', 'Que tal aproveitar para fazer algo que gosta? Se preferir, posso ajudar a organizar uma atividade ou continuar só conversando.']
    },
    estudo:{
      opening:['Vamos estudar sem pressa. Você prefere que eu ajude a organizar o tempo ou escolher uma matéria para começar?', 'Estudar pode ficar menos pesado quando a gente define uma meta. Qual assunto está na sua lista hoje?', 'Bora! Você está com vontade de revisar algo que já viu ou entender um conteúdo novo?', 'Vamos por partes: qual matéria e qual seu objetivo hoje — aprender, revisar ou fazer exercícios?'],
      middle:['Se não sabe por onde começar, escolha um conteúdo específico, não a matéria inteira. Qual parece mais urgente?', 'Você quer estudar sozinho ou com apoio de exercícios e perguntas? Posso te ajudar a organizar a sequência.', 'Faz sentido. E você acha que aprende melhor lendo, fazendo exercícios ou explicando em voz alta?', 'O importante é deixar a primeira etapa pequena. Qual é a próxima ação possível para você?'],
      advice:['Sugestão: 5 minutos para separar o conteúdo, 15 de estudo e 5 para lembrar o que aprendeu. Se quiser, adapto ao tempo que você tem.', 'Monte uma lista de três dúvidas, comece pela mais simples e tente responder sem consultar o material. Depois confira e corrija.']
    },
    provas:{opening:['Qual a data da sua prova e qual matéria cai nela?', 'Se for uma avaliação importante, podemos pensar numa revisão por prioridade. Qual assunto parece mais difícil?'],middle:['Quero evitar um plano impossível. Você sabe quantos conteúdos ainda faltam?', 'Podemos escolher duas prioridades e deixar o resto para depois. Qual está te preocupando mais?'],advice:['Para revisão de última hora, priorize conteúdos já vistos e questões anteriores; evite sacrificar todo o descanso.', 'Se sua prova está próxima, separe a próxima meia hora em revisão curta, duas questões e uma pausa.']},
    foco:{opening:['Quando você tenta começar, o que mais atrapalha: celular, preocupação ou cansaço?', 'Você consegue me dizer qual tarefa está adiando neste momento?'],middle:['Se começasse por dois minutos, que pequeno passo seria possível?', 'Será que uma tarefa de cada vez ajudaria mais do que tentar tudo junto?'],advice:['Tente preparar o material e afastar uma distração por dez minutos. Depois avalie como se sentiu.', 'Um começo pequeno, como abrir o caderno e escrever uma pergunta, já pode destravar a tarefa.']},
    ansiedade:{opening:['Quer me contar o que está te deixando preocupado, ou prefere só conversar e se distrair um pouco?', 'Estou aqui para conversar. Essa ansiedade está mais ligada ao presente ou a algo que ainda vai acontecer?'],middle:['Você está buscando uma solução ou, por enquanto, só quer ser ouvido?', 'O que seria um alívio pequeno e possível agora?'],advice:['Uma pausa confortável e uma conversa com alguém de confiança podem ajudar. Se o sofrimento persistir, vale procurar apoio profissional.', 'Se a cabeça estiver acelerada, tente escolher apenas uma preocupação concreta para lidar agora.']},
    tristeza:{opening:['Poxa, sinto muito. Você não precisa contar tudo de uma vez; quer começar pelo que mais pesou?', 'Se foi um dia difícil, posso escutar o que você quiser dividir. Aconteceu algo ou é um sentimento sem motivo claro?'],middle:['Entendo. Você quer continuar contando ou gostaria de alguma ideia de apoio?', 'Não precisa encontrar uma explicação perfeita. Como tem sido sua rotina nesses dias?'],advice:['Se puder, fale com uma pessoa segura fora da tela. Companhia e cuidado prático fazem diferença.', 'Caso essa tristeza esteja durando muito ou atrapalhando sua rotina, buscar ajuda profissional é um passo importante.']},
    solidao:{opening:['Você está sentindo falta de uma pessoa específica ou de ter companhia em geral?', 'Às vezes sentir-se só acontece até perto de outras pessoas. É assim com você?'],middle:['Com quem você se sente mais à vontade para conversar, mesmo que seja só um pouco?', 'Você quer pensar em uma forma segura de se aproximar de alguém?'],advice:['Talvez enviar uma mensagem simples a alguém confiável possa ser um começo, se você se sentir confortável.', 'Participar de alguma atividade por interesse em comum pode ajudar a construir vínculos aos poucos.']},
    amizade:{opening:['Isso parece importante para você. É uma amizade antiga ou alguém que conheceu recentemente?', 'Você está querendo resolver uma discussão ou entender um afastamento?'],middle:['O que você gostaria que essa pessoa soubesse sobre como você ficou?', 'Tem alguma situação específica que continua na sua cabeça?'],advice:['Se for seguro, vale conversar sobre fatos e sentimentos sem assumir a intenção da outra pessoa.', 'Não é preciso aceitar humilhação para manter uma amizade. Seu bem-estar importa.']},
    bullying:{opening:['Isso acontece repetidamente? Você está em segurança neste momento?', 'Sinto muito pelo que está acontecendo. Já contou a algum adulto seguro ou à escola?'],middle:['Quando você pede ajuda, alguém costuma levar a sério?', 'Não precisa enfrentar a situação sozinho. Há alguém confiável perto de você?'],advice:['Guardar registros de mensagens, quando for seguro, e procurar um adulto de confiança pode ajudar a interromper as agressões.', 'A prioridade é proteger você. Em perigo imediato, procure ajuda presencial e serviços de emergência.']},
    familia:{opening:['Você quer ser ouvido por alguém da família ou precisa de uma forma de explicar o que sente?', 'Quando há uma discussão em casa, às vezes fica difícil falar. Você se sente seguro onde está?'],middle:['O que acontece quando tenta conversar com eles?', 'Tem algum horário em que a conversa costuma ser menos difícil?'],advice:['Se houver segurança, usar frases simples como “me senti...” pode ajudar a abrir o diálogo.', 'Se existe violência, procure apoio de adultos seguros e serviços de proteção; não precisa insistir em uma conversa arriscada.']},
    autoestima:{opening:['Isso começou depois de um comentário ou vem de comparações que você faz consigo?', 'Você gostaria de conversar sobre aparência, confiança ou uma situação específica?'],middle:['Quando você se percebe comparando, o que costuma acontecer depois?', 'O que você gostaria de ouvir de alguém que te conhece de verdade?'],advice:['Pode valer a pena limitar conteúdos que alimentam comparações. Sua identidade vai muito além de fotos.', 'Tente notar uma característica sua que não depende da aparência; pode ser um interesse ou um jeito de tratar as pessoas.']},
    relacionamento:{opening:['Você quer falar de algo que aconteceu com a pessoa ou dos seus próprios sentimentos?', 'É uma história recente? O que tem sido mais difícil de entender?'],middle:['Você sente que consegue conversar e colocar limites nessa relação?', 'O que você gostaria que fosse diferente daqui para frente?'],advice:['Relações saudáveis envolvem respeito, consentimento e espaço para conversar sem ameaças.', 'Se existir pressão ou controle, procure apoio de alguém seguro; não é algo que você precise aceitar.']},
    sono:{opening:['Você fica rolando na cama sem conseguir dormir ou acorda no meio da noite?', 'Isso acontece só de vez em quando ou está prejudicando os seus dias?'],middle:['Qual é a parte mais difícil de sua noite?', 'Você costuma ter tempo para desacelerar antes de deitar?'],advice:['Pode ajudar reduzir estímulos antes de dormir e manter uma rotina possível, sem se cobrar perfeição.', 'Dificuldade persistente para dormir merece avaliação de saúde, principalmente se afetar o dia.']},
    raiva:{opening:['O que foi que mais te irritou? Se quiser, podemos separar o que aconteceu do que você sentiu.', 'Parece que algo passou do limite para você. É uma situação recente?'],middle:['Você quer resolver o problema ou primeiro encontrar um jeito de se acalmar?', 'O que costuma te ajudar a ganhar espaço antes de reagir?'],advice:['Se a discussão estiver intensa, afastar-se e voltar depois pode evitar que alguém se machuque.', 'Você pode escrever o que gostaria de dizer e revisar quando estiver mais tranquilo.']},
    futuro:{opening:['O que pesa mais quando pensa no futuro: escolher uma área ou sentir a pressão de acertar?', 'Você tem alguma ideia do que gosta, mesmo que ainda não saiba qual profissão quer?'],middle:['O que é mais importante nessa decisão para você?', 'Quem participa dessa escolha além de você?'],advice:['Pesquise a rotina real de algumas áreas e converse com pessoas que trabalham nelas.', 'Você pode testar pequenos projetos e experiências antes de definir o caminho todo.']},
    autocuidado:{opening:['Você está buscando um descanso rápido ou quer criar um hábito de cuidado no dia a dia?', 'O que seria mais agradável agora: uma pausa quieta, uma caminhada ou uma conversa?'],middle:['Qual tipo de pausa você já experimentou?', 'Se algo te incomodar, a gente pode trocar de ideia sem problema.'],advice:['Se estiver confortável, solte os ombros, sinta os pés apoiados no chão e respire naturalmente.', 'Escolha uma coisa viável: água, descanso, movimento leve ou conversar com alguém.']},
    desabafo:{opening:['Pode falar do seu jeito. O que mais está ocupando seus pensamentos?', 'Estou acompanhando. Quer começar pelo que aconteceu hoje ou pelo que você vem sentindo?'],middle:['E depois disso, o que aconteceu?', 'Você gostaria de ser ouvido ou prefere que eu tente ajudar a organizar uma saída?'],advice:['Se tiver alguém seguro por perto, conversar fora da tela pode acrescentar acolhimento real.', 'Uma forma de organizar é separar fatos, sentimentos e o que você gostaria que mudasse.']}
  };
  for(const [key,extension] of Object.entries(EXTRA)){
    for(const partName of ['opening','middle','advice']) TOPICS[key]?.[partName]?.push(...(extension[partName]||[]));
  }
  // Follow-ups sem amarrar todas as opções à mesma fala, para não soar como menu de robô.
  const contexts = {
    noEvent:[
      'Ah, entendi! Foi só um dia tranquilo, sem nada de especial. 😊 Não precisa ter acontecido algo para estar bem. Quer conversar sobre alguma coisa aleatória?',
      'Tudo bem! Às vezes estar bem é justamente passar um dia comum. 💜 Você quer bater papo, explorar uma história ou falar de outra coisa?',
      'Então foi um dia normal, e tá tudo certo. Não vou ficar procurando um motivo. Quer que eu puxe um assunto leve?',
      'Saquei: nada de extraordinário, só tudo em paz. 😄 Prefere conversar sobre estudos, música, filmes ou só ficar de boa?',
      'Pode ser assim também. Gostar de um dia comum é válido. Tem algum assunto que você está com vontade de puxar?',
      'Sem novidades, então! Sem problema. Se quiser, posso te fazer uma pergunta divertida ou conversar sobre o que você gosta.'
    ],
    noEventFollow:[
      'Combinado, não precisa achar uma explicação. 😄 Quer que eu puxe um assunto leve ou prefere escolher?',
      'Tranquilo! A gente pode mudar de assunto. Que tal conversar sobre alguma coisa que você gosta de fazer?',
      'Entendi. Vou parar de insistir no que aconteceu. Quer falar de música, escola, amizades ou outro tema?',
      'Beleza, nenhum acontecimento especial. Quer me contar do que você gosta ou prefere que eu escolha uma pergunta?'
    ],
    neutral:[
      'Entendi, um dia meio normal. 😊 Quer conversar sobre o que andou fazendo ou mudar de assunto?',
      'Nem todo dia vem com uma emoção marcante. Você prefere papo leve ou falar de algo que está na cabeça?',
      'Tudo bem estar no meio-termo. Quer um assunto para puxar conversa ou prefere escolher?',
      'Saquei! Um dia comum. O que você normalmente gosta de fazer para passar o tempo?',
      'É válido se sentir só “normal”. Se quiser, podemos explorar um tema sem precisar falar de sentimentos.'
    ],
    generalPositive:[
      'Que bom que você está bem! 💜 Foi um dia tranquilo ou aconteceu alguma coisa que gostaria de compartilhar?',
      'Legal ouvir isso! Não precisa ter um motivo especial. Quer só bater papo ou falar de algum assunto?',
      'Que bom! 😊 Você quer aproveitar para conversar sobre algo de que gosta?',
      'Bom saber que está tudo certo por aí. Quer explorar uma história ou continuar conversando?',
      'Que notícia boa! Se quiser, podemos falar do seu dia ou mudar para algo completamente diferente.'
    ],
    shortAffirm:[
      'Certo! Podemos seguir pelo que você preferir. Quer me contar mais um detalhe ou tentar uma dica prática?',
      'Combinado. Você quer que eu faça uma pergunta sobre esse assunto ou prefere escolher um próximo passo?',
      'Beleza. Pode continuar do ponto em que parou, estou acompanhando o assunto.',
      'Tá bem. Você gostaria de falar mais sobre isso ou testar uma ideia simples?'
    ],
    shortNegative:[
      'Tudo bem, sem pressão. Não precisamos continuar nessa direção. Quer um assunto novo?',
      'Entendi, eu não vou insistir. Prefere só bater papo ou mudar de tema?',
      'Sem problema. Você pode escolher um caminho diferente. O que seria mais confortável?',
      'Beleza. Obrigada por dizer. Quer continuar de outro jeito?'
    ],
    unsure:[
      'Não precisa saber agora. 😊 Quer que eu faça uma pergunta simples, sem pressão?',
      'Tudo bem! Podemos começar por uma coisa pequena. O que você está com vontade de fazer neste momento?',
      'Às vezes a gente só não sabe mesmo. Quer deixar esse assunto para depois?',
      'Sem problema. Prefere que eu te dê duas opções ou que a gente mude de assunto?',
      'Tá tudo certo não ter resposta. Quer continuar conversando ou fazer uma pausa?'
    ],
    listening:[
      'Pode continuar. Estou acompanhando o que você está contando. O que aconteceu depois?',
      'Tudo bem, vou deixar as dicas de lado. Quer me contar mais sobre isso?',
      'Entendi. Pode falar no seu tempo. Qual parte você gostaria de dividir agora?',
      'Certo, sem soluções por enquanto. Pode continuar contando.',
      'Se quiser, me conte mais um pedacinho dessa história.'
    ],
    misunderstood:[
      'Você tem razão, minha resposta não combinou com o que disse. Sou programada e às vezes erro o contexto. Pode me corrigir em uma frase? Vou tentar seguir o que você quis dizer.',
      'Desculpa, essa resposta ficou fora de contexto. O que eu entendi errado: o assunto ou a pergunta que fiz?',
      'Acho que perdi o fio da conversa. Obrigada por avisar! Você quer que eu continue do que acabou de dizer ou prefira começar de novo?',
      'Ops, respondi outra coisa. Vou tentar de novo: qual ponto da sua mensagem eu deveria ter considerado?'
    ],
    repeat:[
      'Claro. Posso repetir ou explicar de um jeito mais simples. Qual parte ficou confusa?',
      'Sem problema. Quer que eu reformule a última ideia em poucas palavras?',
      'Posso tentar explicar melhor. Você prefere um exemplo ou uma frase mais curta?',
      'Claro! Diga qual parte não fez sentido e tento apresentar outra opção.'
    ],
    botCapabilities:[
      'Posso conversar com respostas programadas sobre escola, ansiedade, amizades, família, autoestima e autocuidado. Também posso sugerir passos simples e indicar recursos do site. Não sou uma pessoa ou profissional.',
      'Meu papel é conversar e oferecer informações educativas já preparadas. Não tenho acesso à internet durante esta conversa e não consigo atender emergências. Quer escolher um tema?',
      'Tenho vários caminhos de conversa, principalmente sobre sentimentos e estudos. Se eu entender algo errado, você pode me corrigir. Sobre o que quer falar?'
    ],
    casual:[
      'Bora bater papo! 😊 Você gosta mais de filmes, música, jogos ou séries?',
      'Vamos de pergunta leve: se tivesse uma tarde livre hoje, o que gostaria de fazer?',
      'Claro. Você prefere que eu faça uma pergunta curiosa ou quer escolher um assunto?',
      'Boa! Me conta uma coisa simples: que tipo de música você gosta?',
      'Sem assunto obrigatório aqui. 😄 Você quer conversar sobre algo divertido ou sobre sua rotina?',
      'Uma pergunta aleatória: você curte mais ficar em casa ou sair para algum lugar tranquilo?'
    ],
    timeLimited:[
      'Sem problema. Vamos fazer algo curto: qual é uma tarefa pequena que você precisa resolver primeiro?',
      'Se você só tem alguns minutos, a gente pode escolher uma prioridade. Qual matéria ou atividade é mais urgente?',
      'Vamos simplificar. Em cinco minutos você pode listar duas dúvidas e escolher uma para começar. Sobre qual assunto?',
      'Então nada de plano enorme. Qual é a única coisa que você gostaria de conseguir hoje?',
      'Posso ajudar com uma rotina expressa: alguns minutos para organizar, um bloco curto de foco e uma pausa. Quanto tempo tem?'
    ],
    askWhy:[
      'Perguntei para entender melhor, mas você não precisa responder. Quer que eu mude a pergunta?',
      'Foi só uma tentativa de acompanhar o assunto. Se não fizer sentido, podemos falar de outra coisa.',
      'Para não presumir o que você sente. Mas posso ter perguntado mal. Quer seguir por outro caminho?'
    ],
    greeting:[
      'Oii! 💜 Como está por aí? Pode ser uma conversa leve ou sobre algo importante.',
      'Oi! 😊 Que bom te ver. Quer falar de alguma coisa específica ou só conversar?',
      'Olá! Estou aqui com respostas programadas para conversar com você. Como foi seu dia?',
      'Opa! Tudo certo? Se quiser, pode começar por qualquer assunto.',
      'Oie! 🌷 Você quer conversar sobre estudos, sentimentos ou só bater papo?',
      'E aí! Como está o seu dia até agora?',
      'Oi, oi! Que tal me contar como você está ou escolher um tema?',
      'Olá! Pode chegar sem assunto pronto. Quer que eu puxe conversa?'
    ],
    greetingQuestion:[
      'Oi! 😊 Eu sou uma assistente programada, então não sinto as coisas como uma pessoa. Mas estou funcionando e pronta para conversar. E você, tudo bem?',
      'Oie! Por aqui tudo funcionando direitinho. 💜 Como está seu dia?',
      'Oi, obrigada por perguntar! Não tenho sentimentos humanos, mas posso te acompanhar numa conversa. E você, como vai?',
      'Olá! Estou pronta para conversar. Está tudo bem por aí?',
      'E aí! Eu funciono com mensagens preparadas, mas posso te ajudar a encontrar um assunto. Como você está?',
      'Oi! 😊 Tudo pronto por aqui. Quer conversar sobre o seu dia?'
    ],
    goodbye:[
      'Até mais! 💜 Obrigada pelo papo. Cuide-se!',
      'Tchau! Foi bom conversar com você. Até a próxima!',
      'Boa noite ou bom resto de dia! Se quiser, pode voltar para conversar depois.',
      'Até logo! Espero que tenha um dia tranquilo. 🌷',
      'Falou! 😊 Quando quiser começar outro assunto, estou por aqui.'
    ],
    thanks:[
      'Por nada! 💜 Quer encerrar ou prefere outro assunto?',
      'Imagina! Que bom que a conversa ajudou um pouco. Tem mais alguma coisa que quer explorar?',
      'De nada! 😊 Quer conversar mais ou fazer uma pausa?',
      'Disponha! Foi legal conversar. Se precisar de alguém de verdade, vale procurar uma pessoa de confiança.',
      'Você é bem-vindo para voltar quando quiser. Quer continuar?'
    ],
    topicReset:[
      'Claro! Assunto novo. 😊 Quer falar de estudos, família, amizade ou algo leve?',
      'Tudo bem, vamos começar outra conversa. Qual tema você escolhe?',
      'Combinado! Esquecendo o assunto anterior. Quer que eu puxe um novo?',
      'Bora mudar. Que tal falar de um interesse seu?',
      'Fechado. 💜 Sobre o que você gostaria de conversar agora?'
    ],
    boundary:[
      'Tudo bem, não precisa falar sobre isso. Quer mudar para algo mais leve?',
      'Respeito seu limite. Podemos deixar esse assunto quietinho e conversar sobre outra coisa.',
      'Sem problemas. Você escolhe o que quer dividir. Quer outro assunto?'
    ],
    question:[
      'Posso sim! Uma pergunta leve: qual foi a coisa mais interessante que você aprendeu recentemente?',
      'Vamos lá: qual atividade você gosta de fazer quando tem tempo livre?',
      'Claro: você prefere um dia tranquilo em casa ou um passeio com amigos?',
      'Uma pergunta: tem alguma matéria ou hobby que te desperte curiosidade?',
      'Boa! Que tipo de música combina com seu humor hoje?'
    ],
    precise:[
      'Posso responder de forma mais curta. Me diga em uma frase o que você quer explorar agora.',
      'Claro, vou ser breve. Quer uma pergunta ou uma sugestão prática?',
      'Tudo bem, sem textos grandes. Qual assunto escolhemos?'
    ]
  };
  const casualOptions=['Bater papo','Me faz uma pergunta','Quero estudar','Quero desabafar'];
  const neutralOptions=['Puxar um assunto leve','Quero estudar','Me faz uma pergunta','Quero desabafar'];
  const studyOptions=['Matemática','Português','Tenho pouco tempo','Me ajuda com um plano'];
  function newSession(){return {topic:null,turns:0,topicTurns:0,lastResponse:null,seen:{},closed:false,started:false,awaiting:null,lastPrompt:null,lastUser:null,lastReply:null,context:{},history:[]};}
  function pick(state,key,lines){
    if(!lines?.length)return '';
    const used=state.seen[key]||[];
    let candidates=lines.map((_,i)=>i).filter(i=>!used.includes(i));
    if(!candidates.length){state.seen[key]=[];candidates=lines.map((_,i)=>i).filter(i=>!(lines.length>1&&state.lastResponse?.key===key&&i===state.lastResponse?.index));if(!candidates.length)candidates=[0];}
    const index=candidates[Math.floor(Math.random()*candidates.length)];
    state.seen[key]=[...(state.seen[key]||[]),index];
    state.lastResponse={key,index};return lines[index];
  }
  function classify(n){
    const scores=[];
    for(const [key,topic] of Object.entries(TOPICS)){
      const matches=topic.patterns.filter(reg=>reg.test(n)).length;
      if(matches)scores.push([key,matches]);
    }
    if(!scores.length)return null;
    scores.sort((a,b)=>b[1]-a[1]);return scores[0][0];
  }
  function remember(state,original,n,reply,options,kind,topic,prompt){
    const result={text:reply,options,kind,topic:topic===undefined?state.topic:topic};
    state.lastUser=n;state.lastReply=reply;
    if(prompt!==undefined)state.lastPrompt=prompt;
    state.history.push({user:String(original).slice(0,350),topic:state.topic,kind});
    state.history=state.history.slice(-12);
    return result;
  }
  function answer(state,original){
    const n=norm(original).slice(0,650);if(!n)return null;
    const lastPrompt=state.lastPrompt;
    state.turns++;
    const say=(bankKey,options=defaultOptions,kind='followup',prompt=null,customBank=contexts)=>remember(state,original,n,pick(state,`v4:${bankKey}`,customBank[bankKey]),options,kind,state.topic,prompt);
    const literal=(reply,options,kind,topic=state.topic,prompt=null)=>remember(state,original,n,reply,options,kind,topic,prompt);
    // Risk handling comes before casual conversation and any other intent.
    if(risk.test(n)&&!riskNegation.test(n)&&!/\bquero morrer de (?:rir|vergonha|sono)\b/.test(n)){
      state.awaiting='safety';return literal('Sinto muito que esteja passando por isso. Sou uma assistente programada e não consigo prestar atendimento de emergência. Se houver perigo agora, procure uma pessoa segura perto de você. No Brasil, ligue 192 (SAMU) em emergência, 190 se houver ameaça imediata ou 188 (CVV) para apoio emocional. Você está em segurança neste momento?',safeOptions,'crisis');
    }
    if(danger.test(n)&&!dangerNegation.test(n)){
      state.awaiting='safety';return literal('Sua segurança vem primeiro. Se houver perigo agora, procure um local seguro e um adulto de confiança. Em emergência no Brasil, ligue 190 ou 192. Eu não consigo acionar ajuda por você. Há alguém seguro perto de você?',safeOptions,'danger');
    }
    if(possibleRisk.test(n)){
      state.awaiting='safety';return literal('Parece que está muito pesado, e quero levar isso a sério. Você está pensando em se machucar ou corre perigo agora? Se sim, procure ajuda presencial imediatamente. CVV 188 oferece apoio emocional e SAMU 192 atende emergências.',safeOptions,'safety-check');
    }
    if(state.awaiting==='safety'){
      if(/\b(?:sim|preciso|agora|estou|tenho medo|nao estou seguro)\b/.test(n))return literal('Se existe perigo agora, não dependa deste chat: procure uma pessoa segura e acione 190 ou 192 conforme a emergência. Você pode pedir que alguém fique com você enquanto busca ajuda. Para apoio emocional, CVV 188.',safeOptions,'crisis');
      if(/\b(?:nao|estou seguro|estou segura|sem perigo)\b/.test(n)){
        state.awaiting=null;return literal('Que bom que você está em segurança neste momento. Ainda assim, vale conversar com alguém de confiança sobre o que está acontecendo. Quer me contar o que ajudaria você agora?',safeOptions,'safety-check');
      }
      state.awaiting=null;
    }
    if(bye.test(n)){state.closed=true;state.topic=null;state.topicTurns=0;return say('goodbye',['Quero recomeçar a conversa','Quero falar de outro assunto'],'end');}
    if(thanks.test(n))return say('thanks',['Quero continuar','Outro assunto','Tchau, Bia'],'thanks');
    if(askHuman.test(n))return literal('Sou a Bia, uma assistente de respostas programadas. Não sou uma pessoa real e ninguém está acompanhando esta conversa. Para conversar com alguém de verdade, procure uma pessoa de confiança, escola ou serviço de saúde.',['Quero conversar','Quero estudar','Onde encontro apoio humano?'],'identity');
    if(askNew.test(n)||n==='quero recomeçar'){state.topic=null;state.topicTurns=0;state.awaiting=null;state.closed=false;return say('topicReset',casualOptions,'new-topic');}
    if(askHelp.test(n))return literal('Se precisar de apoio humano, procure uma pessoa adulta de confiança, escola ou serviço de saúde do SUS. CVV 188 oferece apoio emocional. Em emergências, ligue 192. Quer pensar em quem pode procurar?',safeOptions,'human-help');
    if(/\b(?:nao (?:entendeu|entendeste)|nada a ver|sem sentido|resposta errada|fora de contexto|voce nao entende|nao foi isso|eu nao disse isso|ta repetindo|repetitiva)\b/.test(n))return say('misunderstood',['Vou explicar melhor','Quero mudar de assunto','Me faz uma pergunta'],'clarification','clarification');
    if(/\b(?:pode repetir|repete|nao entendi|explique melhor|explica de novo|nao compreendi)\b/.test(n))return say('repeat',['Explica com um exemplo','Pode ser mais curta','Outro assunto'],'clarification','clarification');
    if(/\b(?:nao quero (?:falar|contar|responder)|prefiro nao (?:falar|contar|responder)|isso e pessoal|nao vou falar)\b/.test(n))return say('boundary',casualOptions,'boundary');
    if(/\b(?:o que voce faz|o que voce sabe fazer|como voce funciona|pode fazer o que|do que voce fala)\b/.test(n))return say('botCapabilities',defaultOptions,'identity');
    const greets=greeting.test(n);const rest=greets?stripGreeting(n):n;
    const isPureGreeting=greets&&(!rest||genericHelloQuestion.test(rest));
    if(isPureGreeting||(!greets&&genericHelloQuestion.test(n))){
      state.started=true;state.closed=false;
      return say(genericHelloQuestion.test(rest)||genericHelloQuestion.test(n)?'greetingQuestion':'greeting',defaultOptions,'hello','feeling');
    }
    if(/\b(?:nao quero estudar|odeio estudar|nao gosto de estudar|estudar e chato|nao aguento estudar)\b/.test(n)){
      state.topic='estudo';state.topicTurns++;
      return literal(pick(state,'study:resistance',[
        'Entendi, estudar não está sendo agradável. O problema é cansaço, dificuldade com a matéria ou falta de vontade de começar?',
        'Tudo bem não estar animado para estudar. Quer contar o que está tornando isso tão difícil?',
        'Parece que estudar virou um peso. Podemos só conversar sobre isso, sem montar um plano agora.',
        'Eu ouvi que você não quer estudar neste momento. Você prefere falar do motivo ou mudar de assunto?'
      ]),['Estou cansado','A matéria é difícil','Quero conversar','Mudar de assunto'],'followup','estudo','study');
    }
    // An explicit negative feeling should outrank a loosely positive token.
    if(negatedPositive.test(n)&&!n.includes('vou bem')){
      state.topic='tristeza';state.topicTurns=1;state.lastPrompt='reason';
      return literal(pick(state,'tristeza-start',TOPICS.tristeza.opening),TOPICS.tristeza.options,'topic');
    }
    if(/\b(?:nada de especial|nao aconteceu nada|nao rolou nada|dia normal|nenhuma novidade)\b/.test(n)||noEvent.test(n)||okayButNothing.test(n)){
      if(state.topic==='alegria'||state.topic===null||lastPrompt==='reason'||lastPrompt==='positive'){
        state.topic='alegria';state.topicTurns=Math.max(1,state.topicTurns);state.context.noEvent=true;
        return say(lastPrompt==='reason'||state.history.length>0?'noEventFollow':'noEvent',neutralOptions,'followup','casual');
      }
      // "não aconteceu nada" may refer to bullying/family: don't change to positivity.
      return literal('Entendi, não aconteceu nada específico. Quer continuar falando sobre isso ou mudar de assunto?',['Quero continuar','Mudar de assunto','Me faz uma pergunta'],'followup');
    }
    // Dedicated paths for a non-event follow-up without forcing cheerful celebration.
    if(n==='nada'||n==='nenhum'||n==='nenhuma'||n==='nao teve'){
      if(['reason','positive','casual'].includes(lastPrompt)||state.topic==='alegria'){
        state.topic='alegria';state.context.noEvent=true;
        return say('noEventFollow',neutralOptions,'followup','casual');
      }
      return say('shortNegative',casualOptions,'followup');
    }
    if(/\b(?:nao sei porque|nao sei o motivo|sem motivo aparente|nao sei o que aconteceu)\b/.test(n)){
      if(state.topic==='alegria')return say('noEvent',neutralOptions,'followup','casual');
      return say('unsure',['Quero continuar conversando','Quero uma dica','Outro assunto'],'followup');
    }
    if(mixedFeeling.test(n)&&n.split(' ').length<=9&&!/\b(?:prova|estudar|familia|escola|ansiedade|triste)\b/.test(n)){
      state.topic=null;return say('neutral',casualOptions,'feeling','casual');
    }
    // Discourse acts must be evaluated before classifiers: "me faz pergunta" is not desabafo.
    if(/\b(?:me faz uma pergunta|faz uma pergunta|me pergunta algo|puxa assunto|puxar um assunto|puxe um assunto|voce puxe um assunto|escolhe um assunto|pergunta qualquer coisa|manda outra pergunta)\b/.test(n)){
      state.lastPrompt='casual';return say('question',casualOptions,'casual','casual');
    }
    const games=[
      {pattern:/\bminecraft\b/,name:'Minecraft',lines:['Minecraft! 😄 Você gosta mais de construir, explorar ou sobreviver?', 'Ah, Minecraft! Você joga mais no modo criativo ou sobrevivência?', 'Legal! Você costuma jogar Minecraft sozinho ou com amigos?']},
      {pattern:/\b(?:lol|league of legends)\b/,name:'League of Legends',lines:['LoL! Você tem uma rota favorita?', 'Você gosta mais das partidas competitivas ou de jogar casualmente com amigos?', 'E no LoL, qual campeão você mais gosta de jogar?']},
      {pattern:/\b(?:cs|counter strike|cs2)\b/,name:'Counter-Strike',lines:['CS! Você prefere jogar competitivo ou só partidas com amigos?', 'Counter-Strike! Você costuma jogar mais como atacante ou defensor?']},
      {pattern:/\broblox\b/,name:'Roblox',lines:['Roblox tem muitos tipos de experiências. Qual você gosta mais?', 'Você costuma explorar jogos novos no Roblox ou tem um favorito?']},
      {pattern:/\bvalorant\b/,name:'Valorant',lines:['Valorant! Você tem um agente favorito?', 'Você joga Valorant mais pela competição ou para se divertir com os amigos?']}
    ];
    const game=games.find(g=>g.pattern.test(n));
    if(game){
      state.context.game=game.name;state.topic=null;
      return literal(pick(state,`game:${game.name}`,game.lines),casualOptions,'casual',null,'casual');
    }
    if(n==='rock' || /\bgosto de rock\b/.test(n)){
      state.topic=null;return literal(pick(state,'music:rock',[
        'Rock! 🎸 Você curte mais bandas clássicas ou sons mais atuais?',
        'Boa! Tem alguma banda de rock que você sempre escuta?',
        'Rock combina com muita coisa. Você prefere algo mais pesado ou mais tranquilo?'
      ]),casualOptions,'casual',null,'casual');
    }
    const hobbies=[
      {re:/\b(?:jogos|video game|videogame|lol|minecraft|valorant|cs|roblox|jogar|games)\b/,lines:['Jogos! 😄 Você curte mais jogar sozinho ou com amigos?', 'Legal, jogos dão assunto. Qual você está jogando ultimamente?', 'Que massa! Você gosta mais de jogos competitivos ou de explorar histórias?', 'Conta aí: qual jogo te diverte mais nesses dias?']},
      {re:/\b(?:musica|musicas|cantar|cantor|cantora|sertanejo|funk|rap|rock|pop|playlist)\b/,lines:['Música rende papo! Qual artista você tem ouvido mais?', 'Você prefere música animada ou algo tranquilo para o dia a dia?', 'Boa! Tem alguma música que te lembra um momento especial?', 'Qual estilo de música combina mais com você?']},
      {re:/\b(?:filme|filmes|serie|series|anime|cinema)\b/,lines:['Você curte filmes e séries! Qual foi o último que gostou?', 'Você prefere comédia, aventura, suspense ou animação?', 'Boa escolha de assunto. Tem uma série ou anime que sempre recomenda?', 'Quer falar de algum personagem favorito?']},
      {re:/\b(?:ler|livro|livros|quadrinho|hq|manga)\b/,lines:['Livros! Você gosta mais de fantasia, romance ou mistério?', 'Tem algum livro ou história que você está lendo agora?', 'Que legal. O que faz você gostar de uma história?']},
      {re:/\b(?:futebol|basquete|volei|esporte|treino|academia)\b/,lines:['Esporte é um bom assunto. Você pratica ou gosta de acompanhar?', 'Qual esporte você mais curte?', 'Você gosta mais da competição ou de se movimentar sem pressão?']}
    ];
    const hobby=hobbies.find(h=>h.re.test(n));
    if(hobby && !/\b(?:nao gosto|detesto|odeio)\b/.test(n)) {
      state.topic=null;return literal(pick(state,`hobby:${hobby.re.source}`,hobby.lines),casualOptions,'casual',null,'casual');
    }
    if(/\b(?:resposta curta|fala pouco|seja breve|seja objetiva|seja objetivo|resuma|responde curto)\b/.test(n))return say('precise',casualOptions,'preference');
    if(/\b(?:so me escuta|so quero desabafar|nao quero dicas|sem conselho|so quero conversar)\b/.test(n)){
      state.topic='desabafo';state.lastPrompt='story';return say('listening',['Pode continuar','Quero mudar de assunto','Quero uma dica'],'followup','story');
    }
    if(/^(?:por que|porque|pra que) (?:pergunta|quer saber|voce quer saber)/.test(n))return say('askWhy',casualOptions,'clarification');
    // Remember concrete details before any generic topic/hobby response.
    const durationMatch=n.match(/\b(?:tenho|so tenho|disponivel por|disponho de)\s*(10|15|20|30|45|60)\s*minutos?\b/)
      ||n.match(/\b(10|15|20|30|45|60)\s*minutos?\b/);
    if(durationMatch&&(state.topic==='estudo'||state.topic==='provas'||state.topic==='foco')){
      const minutes=Number(durationMatch[1]);
      state.context.studyMinutes=minutes;state.topic='estudo';state.topicTurns++;
      const plan=minutes<=15 ? `2 minutos para separar o material, ${Math.max(5,minutes-4)} minutos para estudar um conteúdo e 2 minutos para revisar o essencial.` : `${Math.round(minutes*.15)} minutos para organizar, ${Math.round(minutes*.65)} para estudar uma prioridade e o restante para revisar e descansar um pouco.`;
      const subject=state.context.studySubject ? ` em ${state.context.studySubject}` : '';
      return literal(`Perfeito, você tem ${minutes} minutos! 📚 Podemos usar ${plan} ${subject?`Vamos aplicar isso${subject}?`:'Qual matéria você quer priorizar nesse bloco?'}`,
        studyOptions,'advice','estudo','study');
    }
    // Goal-specific interpretation keeps details from the user's most recent answer.
    if(lackTime.test(n)&&(state.topic==='estudo'||state.topic==='provas'||state.topic==='foco'||/\bestud/.test(n))){
      state.topic='estudo';state.topicTurns++;
      return say('timeLimited',studyOptions,'followup','study');
    }
    if(/\b(?:matematica|portugues|ingles|biologia|fisica|quimica|geografia|historia|redacao)\b/.test(n)&&!(/\b(?:minha historia|historia triste)\b/.test(n))){
      const subject=n.match(/\b(?:matematica|portugues|ingles|biologia|fisica|quimica|geografia|historia|redacao)\b/)[0];
      const justStarted=state.topic!=='estudo';state.context.studySubject=subject==='matematica'?'matemática':subject==='fisica'?'física':subject==='portugues'?'português':subject==='quimica'?'química':subject==='historia'?'história':subject==='redacao'?'redação':subject;state.topic='estudo';state.topicTurns++;
      return literal(`Beleza, ${subject==='matematica'?'matemática':subject==='fisica'?'física':subject==='quimica'?'química':subject==='historia'?'história':subject==='portugues'?'português':subject==='redacao'?'redação':subject==='geografia'?'geografia':subject==='biologia'?'biologia':'inglês'}! 📚 Você está tentando entender um conteúdo específico, revisar para prova ou fazer exercícios? Se me disser o tópico, posso ajudar a organizar o estudo.`,studyOptions,justStarted?'topic':'followup','estudo','study');
    }
    if(/\b(?:quero montar um plano|quero um plano de estudo|quero organizar meus estudos)\b/.test(n)){
      state.topic='estudo';state.topicTurns++;
      return literal('Vamos montar algo possível. Primeiro: quantos minutos você tem hoje, e qual matéria é mais urgente?',['Tenho 15 minutos','Tenho meia hora','Tenho uma hora','Não sei por onde começar'],'advice','estudo','study');
    }
    if((yes.test(n)||no.test(n)||unsure.test(n))&&state.topic){
      const bank=normalizedTopic(state.topic);
      if(yes.test(n)){
        const reply=pick(state,`${state.topic}:v4-short-yes`,bank.middle);
        state.topicTurns++;return literal(reply,bank.options,'followup');
      }
      if(no.test(n))return say('shortNegative',['Quero continuar','Outro assunto','Quero uma dica'],'followup');
      return say('unsure',bank.options,'followup');
    }
    if(yes.test(n))return say('shortAffirm',casualOptions,'followup');
    if(no.test(n))return say('shortNegative',casualOptions,'followup');
    if(unsure.test(n))return say('unsure',casualOptions,'followup');
    if(/\b(?:quero (?:so )?bater papo|estou entediad[oa]|to entediad[oa]|puxar assunto|to de bobeira|sem assunto)\b/.test(n)||smallTalk.test(n)){
      state.topic=null;return say('casual',casualOptions,'casual','casual');
    }
    const positive=/\b(?:estou bem|to bem|estou otimo|to otimo|estou feliz|to feliz|estou tranquila|estou tranquilo|tudo bem por aqui|me sinto bem)\b/;
    if(positive.test(n)&&!negatedPositive.test(n)&&n.split(' ').length<=10){
      state.topic='alegria';state.topicTurns++;
      return say('generalPositive',neutralOptions,'topic','positive');
    }
    // Choice of a topic is a new discussion; keep short follow-ups on the same topic.
    let topic=classify(rest||n);
    if(!topic&&state.topic&&(n.split(' ').length<=18||/\b(?:aconteceu|depois|ontem|hoje|semana|mes|sempre|faz tempo|na escola|em casa)\b/.test(n))) topic=state.topic;
    if(!topic&&n.split(' ').length>18)topic='desabafo';
    if(!topic){
      state.topic=null;
      return say('casual',casualOptions,'casual','casual');
    }
    const changed=state.topic!==topic;state.topic=topic;
    state.topicTurns=changed?0:state.topicTurns;
    const bank=normalizedTopic(topic);
    let kind='topic',text;
    if(askTips.test(n)){
      kind='advice';text=pick(state,`${topic}:v4-advice`,bank.advice);
    }else if(changed||state.topicTurns===0){
      text=pick(state,`${topic}:v4-opening`,bank.opening);
    }else if(state.topicTurns>1&&state.topicTurns%4===3){
      kind='advice';text=pick(state,`${topic}:v4-advice`,bank.advice);
    }else{
      text=pick(state,`${topic}:v4-middle`,bank.middle);
    }
    state.topicTurns++;
    const followPrompt=topic==='alegria'?'positive':topic==='estudo'?'study':topic==='desabafo'?'story':'reason';
    return literal(text,bank.options,kind,topic,followPrompt);
  }
  function welcome(){return {text:'Oii! 💜 Sou a Bia, uma assistente com conversas programadas. Podemos bater papo sobre o seu dia, escola, amizades e emoções. Como você está hoje?',options:defaultOptions};}
  const api={newSession,answer,welcome,topics:Object.keys(TOPICS),topicData:TOPICS,normalize:norm,
    statistics:()=>({topics:Object.keys(TOPICS).length,topicReplies:Object.values(TOPICS).reduce((total,t)=>total+t.opening.length+t.middle.length+t.advice.length,0),contextReplies:Object.values(contexts).reduce((total,x)=>total+x.length,0)})};
  root.BiaConversas=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
