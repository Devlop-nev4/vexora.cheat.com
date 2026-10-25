(function(){
  const cfg = window.VEXORA_CONFIG || {};
  const ok = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !/VOTRE/i.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY) && window.supabase);
  window.V = {
    cfg,
    configured: ok,
    sb: ok ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null,
    $: id => document.getElementById(id),
    esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    safeUrl: u => /^https?:\/\//i.test(u || '') ? u : '',
    fmtDate: d => d ? new Date(d).toLocaleDateString('fr-FR', {day:'2-digit', month:'long', year:'numeric'}) : '—',
    toast(text){
      const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
      document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
    },
    setMsg(id, text, type){ const e = V.$(id); if(e){ e.textContent = text || ''; e.className = 'msg' + (type ? ' ' + type : ''); } },
    genKey(){
      const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint32Array(12);
      crypto.getRandomValues(b);
      const c = i => A[b[i] % A.length];
      const part = o => [0,1,2,3].map(i => c(o + i)).join('');
      return 'VEXORA-' + part(0) + '-' + part(4) + '-' + part(8);
    },
    KEY_RE: /^VEXORA-[A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}$/,
    authError(m){
      m = String(m || '');
      if (/invalid login/i.test(m)) return 'Email ou mot de passe incorrect.';
      if (/already registered|already been registered/i.test(m)) return 'Un compte existe déjà avec cet email.';
      if (/not confirmed/i.test(m)) return 'Confirmez votre email avant de vous connecter.';
      if (/rate limit|too many/i.test(m)) return 'Trop de tentatives, réessayez dans quelques minutes.';
      if (/password/i.test(m) && /characters|short|weak/i.test(m)) return 'Mot de passe trop faible (8 caractères minimum).';
      if (/fetch|network/i.test(m)) return 'Connexion au service impossible. Réessayez.';
      return 'Une erreur est survenue. Réessayez.';
    },
    unavailable(rootId){
      const r = V.$(rootId);
      r.innerHTML = '<div class="notice-box"><h1>Service momentanément indisponible</h1><p class="sub" style="color:var(--muted)">Revenez dans quelques instants ou contactez-nous sur Discord.</p></div>';
    }
  };
  document.querySelectorAll('[data-discord]').forEach(a => { a.href = cfg.DISCORD_URL || '#'; a.target = '_blank'; a.rel = 'noopener'; });
})();
