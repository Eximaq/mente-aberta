(() => {
  "use strict";
  const slot=document.getElementById("bia-ai-switch-slot");
  if (!slot) return;
  const box=document.createElement("div");
  box.style.cssText="display:flex;flex-wrap:wrap;gap:9px;align-items:center;justify-content:space-between";
  const label=document.createElement("span");
  label.style.cssText="color:#4f46a5;font-size:12px;font-weight:700";
  label.textContent="Bia programada (padrão) • IA experimental desativada";
  const button=document.createElement("button");
  button.type="button"; button.className="mente-option";button.textContent="Experimentar IA (18+)";
  box.append(label,button);slot.append(box);
  const info=document.createElement("p");
  info.style.cssText="font-size:11px;color:#655d80;line-height:1.5;margin:7px 0 0";
  info.textContent="Modo IA: somente testes por adultos. As mensagens recentes são enviadas ao Groq; não informe dados pessoais ou de saúde sensíveis. Não é atendimento de saúde. Limite: 4/min e 30/dia.";
  slot.append(info);

  let active=false,working=false,history=[];
  let client;
  const getClient=()=>{
    if(client)return client;
    const cfg=window.MENTEABERTA_CONFIG;
    if(!window.supabase?.createClient || !cfg?.url || !cfg?.publishableKey)throw new Error("Supabase não está disponível. Recarregue a página.");
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  };
  const textFeedback=(msg)=>window.appendChatMessage?.("bia",msg);
  const setMode=(next)=>{
    active=next;history=[];
    label.textContent=active?"Bia IA experimental ativa • mensagens enviadas ao Groq":"Bia programada (padrão) • IA experimental desativada";
    button.textContent=active?"Voltar à Bia programada":"Experimentar IA (18+)";
    button.setAttribute("aria-pressed",String(active));
  };
  button.addEventListener("click",async()=>{
    if(working)return;
    if(active){setMode(false);textFeedback("Voltei ao modo programado. 💜");return;}
    let u;
    try{const {data,error}=await getClient().auth.getUser();if(error)throw error;u=data.user;}
    catch{ textFeedback("Não consegui verificar sua sessão. Atualize o site e entre novamente.");return; }
    if(!u){textFeedback("Para experimentar a IA, entre na sua conta primeiro.");return;}
    const confirmed=window.confirm("Teste experimental exclusivo para maiores de 18 anos. Você confirma que é adulto e concorda em enviar o texto desta conversa à API do Groq, sem dados pessoais ou íntimos? A Bia não substitui atendimento humano.");
    if(!confirmed)return;
    setMode(true);textFeedback("Modo experimental ativado. Sou uma IA, não uma profissional de saúde. Como você gostaria de começar? 💜");
  });
  window.MenteAbertaAI={
    enabled:()=>active,
    reset:()=>{history=[];},
    async send(message){
      if(!active||working)return;
      working=true;
      const input=document.getElementById("chat-input");
      const typing=document.getElementById("bia-typing");
      const previous=history.slice(-10);
      window.appendChatMessage?.("user",message);
      input.disabled=true;typing.classList.remove("hidden");
      document.getElementById("bia-choice-bar")?.replaceChildren();
      try{
        const {data:{session}}=await getClient().auth.getSession();
        if(!session?.access_token)throw new Error("Faça login novamente para utilizar a IA.");
        const cfg=window.MENTEABERTA_CONFIG;
        const response=await fetch(cfg.url+"/functions/v1/bia-chat",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token,"apikey":cfg.publishableKey},
          body:JSON.stringify({message,history:previous})
        });
        const output=await response.json();
        if(!response.ok)throw new Error(output.error||"A IA está temporariamente indisponível.");
        const answer=String(output.answer||"").trim();
        if(!answer)throw new Error("A IA não conseguiu responder.");
        window.appendChatMessage?.("bia",answer);
        history.push({role:"user",content:message},{role:"assistant",content:answer});
        history=history.slice(-10);
        document.getElementById("crisis-banner")?.classList.toggle("hidden",!output.safety);
      } catch(err){
        textFeedback("A IA está indisponível: "+String(err?.message||"erro de conexão")+"\nVocê pode voltar ao modo programado no botão acima.");
      } finally {
        working=false;input.disabled=false;typing.classList.add("hidden");input.focus();
      }
    }
  };
})();
