import { createClient } from '@supabase/supabase-js';

const config = window.MENTEABERTA_CONFIG;
const db = createClient(config.url, config.publishableKey);
const $ = id => document.getElementById(id);
const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const moodEmoji = {'Muito Feliz':'😄',Bem:'😊',Neutro:'😐',Triste:'😢',Ansioso:'😰'};
const statusLabel = {pending:'Aguardando análise',approved:'Aprovado',rejected:'Não aprovado'};
const date = value => new Date(value).toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'});
let user = null, admin = false, epoch = 0, currentFilter = 'todos', feedPage = 0, hasMore = false;
let feed = [], supports = new Set(), toastTimer, lastFocus;
const busy = new Set();

function notify(message, error = false) {
  const toast = $('ma-toast');
  toast.textContent = message;
  toast.style.background = error ? '#9f1239' : '#312e81';
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6500);
}
function explain(error) {
  console.error(error);
  const message = error?.message || '';
  if (/Invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(message)) return 'Confirme seu e-mail antes de entrar.';
  if (/already registered|already been registered/i.test(message)) return 'Este e-mail já está cadastrado. Entre ou recupere sua senha.';
  if (/rate limit|over_email_send_rate_limit/i.test(message)) return 'Limite temporário de envio de e-mail. Aguarde alguns minutos e tente novamente.';
  if (/invalid|expired/i.test(message) && /token|otp/i.test(message)) return 'Código inválido ou expirado. Solicite um novo código.';
  if (/Failed to fetch|NetworkError|network/i.test(message)) return 'Não foi possível conectar. Confira a internet e tente novamente.';
  if (error?.code === '23505') return 'Este registro já existe. Atualize a página para consultar.';
  if (/signups not allowed|email address.*not authorized|Error sending confirmation/i.test(message)) return 'O serviço de e-mail não conseguiu enviar a confirmação. Tente mais tarde ou contate a administração.';
  return 'Não foi possível concluir. Tente novamente; se persistir, contate a administração.';
}
function check(result) { if (result.error) throw result.error; return result.data; }
async function run(key, button, action) {
  if (busy.has(key)) return;
  busy.add(key);
  if (button) button.disabled = true;
  try { await action(); } catch (error) { notify(explain(error), true); }
  finally { busy.delete(key); if (button) button.disabled = false; }
}
function openModal(id) {
  lastFocus = document.activeElement;
  $(id).hidden = false;
  $(id).querySelector('input,button')?.focus();
}
function closeModal(id) { $(id).hidden = true; lastFocus?.focus(); }
function requireUser() { if (user) return true; showAuth('login'); return false; }

function installUI() {
  document.body.insertAdjacentHTML('afterbegin', `<div class="ma-account-bar" id="ma-account-bar">
    <span id="ma-account-label">Conectando ao MenteAberta…</span>
    <button class="ma-button" id="ma-account">Entrar / Criar conta</button>
    <button class="ma-button secondary" id="ma-admin-open" hidden>Administração</button>
    <button class="ma-button secondary" id="ma-logout" hidden>Sair</button>
  </div>`);
  document.body.insertAdjacentHTML('beforeend', `<div class="ma-toast" id="ma-toast" role="status" aria-live="polite" hidden></div>
    <div class="ma-modal" id="ma-auth-modal" hidden role="dialog" aria-modal="true" aria-labelledby="ma-auth-title">
      <div class="ma-dialog"><header><h2 id="ma-auth-title">Sua conta MenteAberta</h2><button class="ma-button secondary" data-close="ma-auth-modal" aria-label="Fechar conta">✕</button></header>
        <p>Entre para manter seu diário privado, acompanhar relatos e enviar sua candidatura.</p>
        <form id="ma-auth-form" class="ma-form">
          <label>Ação<select id="ma-auth-mode"><option value="login">Entrar</option><option value="signup">Criar conta</option><option value="verify">Confirmar e-mail com código</option><option value="recover">Recuperar senha</option><option value="update">Definir nova senha</option></select></label>
          <label id="ma-email-label">E-mail<input id="ma-email" type="email" autocomplete="email" maxlength="254" required></label>
          <label id="ma-password-label">Senha<input id="ma-password" type="password" autocomplete="current-password" minlength="8" maxlength="128" required></label>
          <label id="ma-code-label" hidden>Código recebido por e-mail<input id="ma-code" inputmode="numeric" autocomplete="one-time-code" maxlength="12"></label>
          <label id="ma-consent-label" class="ma-check" hidden><input id="ma-account-consent" type="checkbox">Li a <a href="#" id="ma-privacy-link">Política de Privacidade</a> e concordo com o uso dos dados para os recursos solicitados.</label>
          <p class="ma-note" id="ma-email-activation">O envio de confirmações está em fase de ativação. Alguns e-mails podem ainda não receber a mensagem.</p>
          <p id="ma-auth-message" class="ma-message" role="status" hidden></p>
          <button class="ma-button" id="ma-auth-submit" type="submit">Entrar</button>
          <button class="ma-button secondary" id="ma-resend" type="button" hidden>Reenviar confirmação</button>
        </form>
      </div>
    </div>
    <div class="ma-modal" id="ma-account-modal" hidden role="dialog" aria-modal="true" aria-labelledby="ma-profile-title">
      <div class="ma-dialog"><header><h2 id="ma-profile-title">Minha conta</h2><button class="ma-button secondary" data-close="ma-account-modal" aria-label="Fechar minha conta">✕</button></header>
        <p id="ma-profile-email"></p><div class="ma-tools"><button class="ma-button secondary" id="ma-export">Baixar meus dados</button><button class="ma-button secondary" id="ma-password-change">Alterar senha</button></div>
        <p class="ma-note">Use “Sair” ao terminar em um dispositivo compartilhado.</p>
        <div class="ma-danger-zone"><h3>Apagar meus dados</h3><p>Remove seu diário, relatos e candidatura, incluindo o documento enviado. Esta ação não pode ser desfeita.</p>
          <label class="ma-form">Digite APAGAR para confirmar<input id="ma-delete-confirm" autocomplete="off"></label><button class="ma-button danger" id="ma-delete-data">Apagar meus dados</button>
        </div>
      </div>
    </div>
    <div class="ma-modal" id="ma-admin-modal" hidden role="dialog" aria-modal="true" aria-labelledby="ma-admin-title"><div class="ma-dialog ma-admin">
      <header><h2 id="ma-admin-title">Administração</h2><button class="ma-button secondary" data-close="ma-admin-modal" aria-label="Fechar administração">✕</button></header>
      <div class="ma-tools"><button class="ma-button" id="ma-admin-posts">Relatos</button><button class="ma-button secondary" id="ma-admin-volunteers">Voluntários</button></div>
      <p class="ma-note">Aprovar um relato o torna público. A aprovação de candidatura não emite certificado e não substitui a validação institucional.</p><div id="ma-admin-list" class="ma-admin-list" aria-live="polite"></div>
    </div></div>
    <div class="ma-modal" id="ma-privacy-modal" hidden role="dialog" aria-modal="true" aria-labelledby="ma-privacy-title"><div class="ma-dialog">
      <header><h2 id="ma-privacy-title">Seus dados</h2><button class="ma-button secondary" data-close="ma-privacy-modal" aria-label="Fechar privacidade">✕</button></header>
      <p>O MenteAberta usa Supabase Auth para seu e-mail e sua senha e um banco de dados na região de São Paulo. A sessão fica neste navegador até você sair. A senha é tratada pelo serviço de autenticação.</p>
      <p>Seu diário é acessível somente pela sua conta. A conversa com a Bia é programada e fica na memória desta aba; ela não é enviada ao banco.</p>
      <p>Relatos aprovados ficam visíveis publicamente com a assinatura escolhida. Essa assinatura oculta seu e-mail dos leitores, mas o relato continua vinculado à sua conta no banco. Evite nomes reais, contatos e informações que identifiquem outras pessoas.</p>
      <p>Candidaturas e comprovantes são acessíveis pela sua conta e pela administração. Os arquivos ficam em armazenamento privado e são abertos por links que expiram.</p>
      <p>Você pode exportar e apagar seus dados em “Minha conta”. A conta de autenticação permanece até sua exclusão pela administração do projeto. O provedor pode manter registros operacionais e cópias de segurança conforme suas políticas.</p>
    </div></div>`);
  $('post-form').insertAdjacentHTML('afterend', '<div id="ma-my-posts" class="ma-status" hidden></div>');
  $('feed-container').insertAdjacentHTML('afterend', '<div class="ma-tools" style="justify-content:center"><button class="ma-button secondary" id="ma-feed-refresh">Atualizar relatos</button><button class="ma-button secondary" id="ma-feed-more" hidden>Carregar mais</button></div>');
  $('volunteer-form').insertAdjacentHTML('beforebegin', '<div id="ma-volunteer-status" class="ma-status" role="status"></div>');
  $('volunteer-form').insertAdjacentHTML('beforeend', '<label class="ma-form ma-check"><span><input id="ma-volunteer-consent" type="checkbox" required> Concordo com o armazenamento dos dados e do comprovante para análise da minha candidatura pela administração. A candidatura não garante vaga ou certificado.</span></label>');
  $('emotion-history').insertAdjacentHTML('afterend', '<div class="ma-tools"><button class="ma-button secondary" id="ma-emotions-clear">Apagar histórico</button></div>');
  document.querySelector('footer').insertAdjacentHTML('beforeend', '<p style="text-align:center;padding:12px"><button id="ma-footer-privacy" type="button">Privacidade e dados</button></p>');
  document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => closeModal(button.dataset.close));
  document.querySelectorAll('.ma-modal').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal.id); }));
  document.addEventListener('keydown', event => {
    const modal = [...document.querySelectorAll('.ma-modal:not([hidden])')].at(-1);
    if (!modal) return;
    if (event.key === 'Escape') closeModal(modal.id);
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button,input,select,a[href]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  $('ma-account').onclick = () => { if (user) { $('ma-profile-email').textContent = user.email; openModal('ma-account-modal'); } else showAuth('login'); };
  $('ma-auth-mode').onchange = configureAuth;
  $('ma-auth-form').onsubmit = handleAuth;
  $('ma-resend').onclick = event => run('resend', event.target, async () => {
    if (!$('ma-email').reportValidity()) return;
    check(await db.auth.resend({type:'signup',email:$('ma-email').value.trim(),options:{emailRedirectTo:location.href.split('#')[0]}}));
    $('ma-auth-message').textContent = 'Confirmação solicitada. Confira sua caixa de entrada e o spam.';
    $('ma-auth-message').hidden = false;
  });
  $('ma-logout').onclick = event => run('logout', event.target, async () => { check(await db.auth.signOut()); notify('Você saiu da conta.'); });
  $('ma-password-change').onclick = () => { closeModal('ma-account-modal'); showAuth('update'); };
  $('ma-privacy-link').onclick = event => { event.preventDefault(); openModal('ma-privacy-modal'); };
  $('ma-footer-privacy').onclick = () => openModal('ma-privacy-modal');
  $('ma-feed-refresh').onclick = () => run('feed', $('ma-feed-refresh'), () => loadFeed(true));
  $('ma-feed-more').onclick = () => run('feed', $('ma-feed-more'), () => loadFeed(false));
  $('ma-export').onclick = event => run('export', event.target, exportData);
  $('ma-delete-data').onclick = event => run('delete-data', event.target, deleteData);
  $('ma-emotions-clear').onclick = event => run('clear-emotions', event.target, async () => {
    if (!requireUser() || !confirm('Apagar todos os registros do seu diário?')) return;
    check(await db.from('emotion_entries').delete().eq('user_id',user.id));
    await loadEmotions(); notify('Histórico apagado.');
  });
  $('ma-admin-open').onclick = () => { openModal('ma-admin-modal'); run('admin',null,() => loadAdmin('posts')); };
  $('ma-admin-posts').onclick = () => run('admin',null,() => loadAdmin('posts'));
  $('ma-admin-volunteers').onclick = () => run('admin',null,() => loadAdmin('volunteers'));
}
function configureAuth() {
  const mode = $('ma-auth-mode').value;
  $('ma-email-label').hidden = mode === 'update';
  $('ma-email').required = mode !== 'update';
  $('ma-password-label').hidden = ['verify','recover'].includes(mode);
  $('ma-password').required = !['verify','recover'].includes(mode);
  $('ma-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('ma-code-label').hidden = mode !== 'verify'; $('ma-code').required = mode === 'verify';
  $('ma-consent-label').hidden = mode !== 'signup'; $('ma-account-consent').required = mode === 'signup';
  $('ma-resend').hidden = mode !== 'verify';
  $('ma-email-activation').hidden = !['signup','verify','recover'].includes(mode) || config.emailDeliveryReady === true;
  $('ma-auth-submit').textContent = {login:'Entrar',signup:'Criar minha conta',verify:'Confirmar e entrar',recover:'Enviar recuperação',update:'Salvar nova senha'}[mode];
  $('ma-auth-message').hidden = true;
}
function showAuth(mode) { $('ma-auth-mode').value = mode; configureAuth(); openModal('ma-auth-modal'); }
function handleAuth(event) {
  event.preventDefault();
  run('auth', $('ma-auth-submit'), async () => {
    const mode = $('ma-auth-mode').value, email = $('ma-email').value.trim(), password = $('ma-password').value;
    $('ma-auth-message').hidden = true;
    if (mode === 'login') check(await db.auth.signInWithPassword({email,password}));
    else if (mode === 'signup') {
      const data = check(await db.auth.signUp({email,password,options:{emailRedirectTo:location.href.split('#')[0]}}));
      if (!data.session) {
        $('ma-password').value = '';
        $('ma-auth-mode').value = 'verify'; configureAuth();
        $('ma-auth-message').textContent = 'Confira seu e-mail para confirmar a conta. Abra o link recebido ou cole o código se a mensagem trouxer um código. Verifique também o spam.';
        $('ma-auth-message').hidden = false; return;
      }
    } else if (mode === 'verify') check(await db.auth.verifyOtp({email,token:$('ma-code').value.trim(),type:'signup'}));
    else if (mode === 'recover') {
      check(await db.auth.resetPasswordForEmail(email,{redirectTo:location.href.split('#')[0]}));
      $('ma-auth-message').textContent = 'Se houver uma conta com este e-mail, você receberá o link de recuperação.';
      $('ma-auth-message').hidden = false; return;
    } else if (mode === 'update') {
      if (!user) { notify('Abra o link de recuperação recebido por e-mail.',true); return; }
      check(await db.auth.updateUser({password}));
    }
    $('ma-password').value = ''; $('ma-code').value = '';
    closeModal('ma-auth-modal'); notify(mode === 'update' ? 'Senha atualizada.' : 'Conta conectada.');
  });
}

async function applySession(session, event) {
  const previous = user?.id;
  user = session?.user || null; admin = false; const version = ++epoch;
  $('ma-account-label').textContent = user ? 'Sua conta está conectada. Seu diário é privado.' : 'Entre para salvar seu diário e participar da comunidade.';
  $('ma-account').textContent = user ? 'Minha conta' : 'Entrar / Criar conta';
  $('ma-logout').hidden = !user; $('ma-admin-open').hidden = true;
  if (previous !== user?.id) {
    supports.clear(); $('ma-my-posts').replaceChildren(); $('emotion-history').replaceChildren();
    $('emotion-feedback').classList.add('hidden'); $('ma-volunteer-status').textContent = '';
    $('volunteer-form').reset(); $('preview-name').textContent = '[Nome do Voluntário]';
    $('ma-admin-list').replaceChildren(); $('ma-admin-modal').hidden = true;
    $('ma-account-modal').hidden = true; $('ma-delete-confirm').value = '';
  }
  await Promise.all([loadFeed(true), loadEmotions(), loadMyPosts(), loadApplication()].map(p => p.catch(error => notify(explain(error),true))));
  if (user && version === epoch) {
    const result = await db.rpc('current_user_is_admin');
    if (version === epoch && !result.error) { admin = result.data === true; $('ma-admin-open').hidden = !admin; }
  }
  if (event === 'PASSWORD_RECOVERY') showAuth('update');
}

async function loadFeed(reset = true) {
  const version = epoch, page = reset ? 0 : feedPage + 1, filter = currentFilter;
  let query = db.from('community_feed').select('*').order('created_at',{ascending:false}).order('id').range(page*20,page*20+19);
  if (filter !== 'todos') query = query.eq('category',filter);
  const rows = check(await query);
  let ownSupports = [];
  if (user && rows.length) ownSupports = check(await db.from('post_supports').select('post_id').eq('user_id',user.id).in('post_id',rows.map(row => row.id)));
  if (version !== epoch || filter !== currentFilter) return;
  feed = reset ? rows : [...feed,...rows]; feedPage = page; hasMore = rows.length === 20;
  if (reset) supports = new Set(); ownSupports.forEach(row => supports.add(row.post_id));
  renderFeed();
}
function renderFeed() {
  const container = $('feed-container'); container.replaceChildren();
  if (!feed.length) container.innerHTML = '<p class="ma-note">Ainda não há relatos aprovados neste canal. Envie sua mensagem para análise.</p>';
  for (const post of feed) {
    const card = document.createElement('article');
    card.className = 'bg-white rounded-[2.5rem] p-7 disney-card-shadow border border-indigo-100';
    card.innerHTML = `<div class="flex items-center justify-between mb-3"><span class="bg-indigo-50 text-indigo-700 text-xs font-extrabold px-3.5 py-1.5 rounded-full">${html(post.category)}</span><span class="text-xs text-slate-400 font-bold">${html(post.author)}</span></div><p class="text-slate-700 text-sm leading-relaxed font-medium" style="white-space:pre-wrap;overflow-wrap:anywhere">${html(post.content)}</p><div class="ma-tools"><button class="ma-button secondary" aria-pressed="${supports.has(post.id)}">${supports.has(post.id)?'💜 Apoiado':'♡ Apoiar'} · ${post.likes}</button><span class="ma-note">${html(date(post.created_at))}</span></div>`;
    card.querySelector('button').onclick = event => run(`support-${post.id}`,event.target,async () => {
      if (!requireUser()) return;
      if (supports.has(post.id)) check(await db.from('post_supports').delete().eq('post_id',post.id).eq('user_id',user.id));
      else check(await db.from('post_supports').insert({post_id:post.id,user_id:user.id}));
      await loadFeed(true);
    });
    container.append(card);
  }
  $('ma-feed-more').hidden = !hasMore;
}
function filterFeed(category) {
  currentFilter = category;
  document.querySelectorAll('.category-btn').forEach(button => {
    const selected = button.id === `btn-cat-${category.replace('#','')}`;
    button.className = `category-btn ${selected?'bg-indigo-600 text-white':'bg-white text-slate-700 border border-slate-200'} px-5 py-3 rounded-2xl text-sm font-bold transition`;
    button.setAttribute('aria-pressed',String(selected));
  });
  run('filter',null,() => loadFeed(true));
}
function handleNewPost(event) {
  event.preventDefault();
  run('post',$('post-form').querySelector('[type=submit]'),async () => {
    if (!requireUser()) return;
    check(await db.from('community_posts').insert({user_id:user.id,category:$('post-category').value,author:$('post-author').value.trim() || 'Jovem Anônimo(a)',content:$('post-content').value.trim()}));
    $('post-form').reset(); await loadMyPosts(); notify('Relato enviado para análise. Ele aparecerá publicamente após aprovação.');
  });
}
async function loadMyPosts() {
  const version = epoch, container = $('ma-my-posts');
  if (!user) { container.hidden = true; return; }
  const rows = check(await db.from('community_posts').select('id,content,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50));
  if (version !== epoch) return;
  container.hidden = false; container.innerHTML = '<strong>Meus relatos</strong>';
  if (!rows.length) container.insertAdjacentHTML('beforeend','<p>Você ainda não enviou relatos.</p>');
  for (const row of rows) {
    const item = document.createElement('div'); item.className = 'ma-card';
    item.innerHTML = `<span class="ma-state">${statusLabel[row.status]}</span><p>${html(row.content)}</p><button class="ma-button danger">Excluir meu relato</button>`;
    item.querySelector('button').onclick = event => run(`delete-${row.id}`,event.target,async () => {
      if (!confirm('Excluir este relato?')) return;
      check(await db.from('community_posts').delete().eq('id',row.id).eq('user_id',user.id));
      await Promise.all([loadMyPosts(),loadFeed(true)]);
    });
    container.append(item);
  }
}
function registerEmotion(mood, emoji, message) {
  run('emotion',null,async () => {
    if (!requireUser()) return;
    const version = epoch;
    check(await db.from('emotion_entries').insert({mood,user_id:user.id}));
    if (version !== epoch) return;
    const feedback = $('emotion-feedback'); feedback.classList.remove('hidden');
    feedback.textContent = `${moodEmoji[mood]} Você registrou: ${mood}. ${message}`;
    await loadEmotions();
  });
}
async function loadEmotions() {
  const version = epoch, container = $('emotion-history');
  if (!user) { container.innerHTML = '<p class="ma-note">Entre na sua conta para consultar seu diário privado.</p>'; return; }
  const rows = check(await db.from('emotion_entries').select('id,mood,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(7));
  if (version !== epoch) return;
  container.innerHTML = rows.length ? rows.map(row => `<div class="p-3.5 bg-slate-50 rounded-2xl border border-indigo-50 flex flex-col items-center gap-1"><span class="text-xs text-slate-400 font-extrabold">${html(new Date(row.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}))}</span><span class="text-3xl">${moodEmoji[row.mood]}</span><span class="text-xs font-bold text-slate-700">${html(row.mood)}</span></div>`).join('') : '<p class="ma-note">Nenhum registro ainda. Escolha uma emoção para começar.</p>';
}
async function loadApplication() {
  const version = epoch, container = $('ma-volunteer-status');
  if (!user) { container.textContent = 'Entre na sua conta para enviar e acompanhar uma candidatura.'; return; }
  const row = check(await db.from('volunteer_applications').select('id,status,created_at,document_path').eq('user_id',user.id).maybeSingle());
  if (version !== epoch) return;
  container.replaceChildren();
  if (!row) { container.textContent = 'Sua candidatura e seu comprovante serão enviados somente à administração do projeto.'; return; }
  container.innerHTML = `<strong>Sua candidatura: ${statusLabel[row.status]}</strong><p>Enviada em ${html(date(row.created_at))}.</p><div class="ma-tools"><button class="ma-button secondary">Ver comprovante</button><button class="ma-button danger">Retirar candidatura</button></div>`;
  const buttons = container.querySelectorAll('button');
  buttons[0].onclick = event => run('document',event.target,() => openDocument(row.document_path));
  buttons[1].onclick = event => run('withdraw',event.target,async () => {
    if (!confirm('Retirar sua candidatura e apagar seu comprovante?')) return;
    check(await db.storage.from('volunteer-documents').remove([row.document_path]));
    check(await db.from('volunteer_applications').delete().eq('id',row.id).eq('user_id',user.id));
    await loadApplication(); notify('Candidatura retirada.');
  });
}
function handleVolunteerSubmit(event) {
  event.preventDefault();
  run('volunteer',$('volunteer-form').querySelector('[type=submit]'),async () => {
    if (!requireUser()) return;
    const file = $('vol-file').files[0];
    const types = {'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
    if (!file || !types[file.type] || file.size > 5242880) { notify('Envie um PDF, JPG, PNG ou WebP de até 5 MB.',true); return; }
    const owner = user.id, id = crypto.randomUUID(), path = `${owner}/${id}/document.${types[file.type]}`;
    const existing = check(await db.from('volunteer_applications').select('id').eq('user_id',owner).maybeSingle());
    if (existing) { notify('Você já tem uma candidatura. Consulte o status acima ou retire a anterior.',true); return; }
    check(await db.storage.from('volunteer-documents').upload(path,file,{contentType:file.type,upsert:false}));
    try {
      check(await db.from('volunteer_applications').insert({id,user_id:owner,full_name:$('vol-name').value.trim(),email:$('vol-email').value.trim(),course:$('vol-course').value.trim(),enrollment:$('vol-matricula').value.trim(),semester:$('vol-periodo').value.trim(),motivation:$('q1').value.trim(),availability:$('q2').value,experience:$('q3').value.trim(),document_path:path}));
    } catch (error) { await db.storage.from('volunteer-documents').remove([path]); throw error; }
    $('volunteer-form').reset(); $('preview-name').textContent = '[Nome do Voluntário]';
    await loadApplication(); notify('Candidatura recebida. Você pode acompanhar a análise nesta página.');
  });
}
async function openDocument(path) {
  // Abrir imediatamente evita que o navegador bloqueie a janela após a requisição.
  const tab = window.open('about:blank','_blank');
  try {
    const data = check(await db.storage.from('volunteer-documents').createSignedUrl(path,60));
    if (tab) { tab.opener = null; tab.location.replace(data.signedUrl); }
    else notify('Seu navegador bloqueou a abertura do comprovante. Permita pop-ups para este site.',true);
  } catch (error) { tab?.close(); throw error; }
}
async function loadAdmin(kind) {
  if (!admin || !user) return;
  const version = epoch, table = kind === 'posts' ? 'community_posts' : 'volunteer_applications';
  $('ma-admin-list').textContent = 'Carregando…';
  const rows = check(await db.from(table).select('*').order('created_at',{ascending:false}).limit(200));
  if (version !== epoch || !admin) return;
  const container = $('ma-admin-list'); container.innerHTML = rows.length ? '' : '<p class="ma-note">Nenhum registro recebido.</p>';
  rows.sort((a,b) => (a.status !== 'pending') - (b.status !== 'pending'));
  for (const row of rows) {
    const card = document.createElement('article'); card.className = 'ma-card';
    card.innerHTML = kind === 'posts'
      ? `<h3>${html(row.author)} · ${html(row.category)}</h3><p>${html(row.content)}</p>`
      : `<h3>${html(row.full_name)}</h3><p>${html(row.email)}<br>${html(row.course)} · ${html(row.semester)} · Matrícula ${html(row.enrollment)}</p><p><strong>Motivação:</strong> ${html(row.motivation)}</p><p><strong>Disponibilidade:</strong> ${html(row.availability)}</p><p><strong>Experiência:</strong> ${html(row.experience)}</p><button class="ma-button secondary" data-document>Ver comprovante privado</button>`;
    card.insertAdjacentHTML('beforeend',`<span class="ma-state">${statusLabel[row.status]}</span><p class="ma-note">${html(date(row.created_at))}</p><div class="ma-tools"><button class="ma-button" data-status="approved">Aprovar</button><button class="ma-button danger" data-status="rejected">Rejeitar</button><button class="ma-button secondary" data-status="pending">Voltar para análise</button></div>`);
    card.querySelector('[data-document]')?.addEventListener('click',event => run('document',event.target,() => openDocument(row.document_path)));
    card.querySelectorAll('[data-status]').forEach(button => {
      button.disabled = button.dataset.status === row.status;
      button.onclick = event => run(`moderate-${row.id}`,event.target,async () => {
        const changed = check(await db.from(table).update({status:button.dataset.status}).eq('id',row.id).select('id'));
        if (!changed.length) throw new Error('Atualização não autorizada');
        await loadAdmin(kind); await Promise.all([loadFeed(true),loadMyPosts(),loadApplication()]); notify('Análise salva.');
      });
    });
    container.append(card);
  }
  if (rows.length === 200) container.insertAdjacentHTML('beforeend','<p class="ma-note">Exibindo as 200 inscrições mais recentes. Consulte o Supabase para registros anteriores.</p>');
}
async function exportData() {
  if (!requireUser()) return;
  const owner = user.id, version = epoch, data = {account:{email:user.email},exported_at:new Date().toISOString()};
  for (const table of ['community_posts','emotion_entries','volunteer_applications','post_supports']) {
    let rows = [], offset = 0;
    while (true) {
      const page = check(await db.from(table).select('*').eq('user_id',owner).order('created_at').range(offset,offset+499));
      rows.push(...page); if (page.length < 500) break; offset += 500;
    }
    data[table] = rows;
  }
  if (version !== epoch) return;
  const link = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  link.href = url; link.download = 'meus-dados-menteaberta.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
async function deleteData() {
  if (!requireUser()) return;
  if ($('ma-delete-confirm').value !== 'APAGAR') { notify('Digite APAGAR para confirmar.',true); return; }
  const owner = user.id;
  const application = check(await db.from('volunteer_applications').select('document_path').eq('user_id',owner).maybeSingle());
  if (application) check(await db.storage.from('volunteer-documents').remove([application.document_path]));
  for (const table of ['post_supports','community_posts','emotion_entries','volunteer_applications']) check(await db.from(table).delete().eq('user_id',owner));
  $('ma-delete-confirm').value = ''; await Promise.all([loadFeed(true),loadMyPosts(),loadEmotions(),loadApplication()]);
  notify('Seus dados de participação foram apagados. Sua conta de acesso continua ativa.');
}

Object.assign(window,{renderFeed,filterFeed,handleNewPost,registerEmotion,handleVolunteerSubmit,renderEmotionHistory:loadEmotions});
installUI();
db.auth.onAuthStateChange((event,session) => { setTimeout(() => { applySession(session,event).catch(error => notify(explain(error),true)); },0); });
window.addEventListener('online',() => run('refresh',null,() => applySession(user ? {user} : null)));
