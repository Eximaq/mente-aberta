MENTEABERTA — Atualização focalizada v4 (notas do pacote de origem)
=====================================

ESTA VERSÃO NÃO RECRIA O SITE. Parte da versão v3 do HTML original.
Preserva as seções, gradientes, personagens e funcionalidades anteriores.

ALTERAÇÕES:
• Logo independente em /assets/menteaberta-logo.png (imagem PNG transparente),
  /assets/menteaberta-simbolo.png (ícone quadrado) e /assets/favicon.png.
• Símbolo: balão de conversa acolhedor e coração, não um cérebro;
  o cabeçalho utiliza uma imagem completa com nome, não CSS para construir a marca.
• Chat Bia v4: 17 assuntos, mais de 300 respostas temáticas e 100 respostas
  contextuais. Evita repetição imediata e acompanha a sequência da conversa.
• Tratamento especial de “estou bem, não aconteceu nada” e respostas curtas
  (nada, sim, não, não sei, quero uma dica, pouco tempo, etc).
• Conversas leves sobre hobbies, música, jogos, filmes e estudos.
• Corrigidos menu e botão de pitch em telas pequenas após a troca da logo.
• Testes de regressão para o caso real mostrado nas capturas de tela.

ARQUIVOS:
index.html                 — site original atualizado
assets/bia-conversas.js    — motor de conversas por regras
assets/menteaberta-logo.png — marca horizontal pronta para uso
assets/menteaberta-simbolo.png — símbolo PNG
assets/favicon.png         — favicon
assets/*.webp              — ilustrações já existentes
assets/tailwind-preview.css — CSS compilado para a versão offline

PARA ABRIR:
• Extraia o ZIP preservando a pasta assets/ e abra index.html com acesso à internet.
• Para ver sem precisar extrair ou carregar Tailwind por CDN, abra o HTML de
  prévia único entregue separadamente.
• Para publicar no GitHub Pages, faça upload do index.html e da pasta assets/.

TESTES:
  node --test tests/*.cjs

LIMITAÇÕES DO PACOTE DE ORIGEM (substituídas pela integração descrita em README.md):
• Bia é automatizada por regras, não compreende linguagem livre como uma IA generativa.
• Os diálogos NÃO são atendidos por seres humanos. Não servem para crise ou triagem clínica.
• Nenhum cadastro real ou banco de dados (Supabase) está configurado.
• Uso público com menores depende de revisão profissional e medidas de privacidade.
