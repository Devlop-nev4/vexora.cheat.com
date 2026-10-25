(function(){
  const { $, esc, sb, safeUrl, fmtDate, setMsg, toast } = V;
  let mode = 'login';

  function show(view){
    ['loading','landing','dashboard'].forEach(v => $(v).classList.toggle('hidden', v !== view));
    $('logoutBtn').classList.toggle('hidden', view !== 'dashboard');
    if (view !== 'dashboard') $('adminLink').classList.add('hidden');
  }

  function setMode(m){
    mode = m;
    $('tabLogin').classList.toggle('active', m === 'login');
    $('tabRegister').classList.toggle('active', m === 'register');
    $('nameWrap').classList.toggle('hidden', m === 'login');
    $('authSubmit').textContent = m === 'login' ? 'Se connecter' : 'Créer mon compte';
    $('authTitle').textContent = m === 'login' ? 'Connexion' : 'Créer un compte';
    $('authSub').textContent = m === 'login' ? 'Accédez à votre espace membre.' : 'Quelques secondes suffisent.';
    $('authPass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    setMsg('authMsg', '');
  }

  async function submitAuth(e){
    e.preventDefault();
    const email = $('authEmail').value.trim(), pass = $('authPass').value, name = $('authName').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg('authMsg', 'Entrez une adresse email valide.', 'err');
    if (pass.length < 8) return setMsg('authMsg', 'Le mot de passe doit contenir au moins 8 caractères.', 'err');
    const btn = $('authSubmit'); btn.disabled = true; setMsg('authMsg', '');
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        const { data, error } = await sb.auth.signUp({ email, password: pass, options: { data: { display_name: name || email.split('@')[0] } } });
        if (error) throw error;
        if (!data.session) { setMsg('authMsg', 'Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.', 'ok'); setMode('login'); }
      }
    } catch (err) { setMsg('authMsg', V.authError(err.message), 'err'); }
    btn.disabled = false;
  }

  async function renderDashboard(session){
    show('dashboard');
    const u = session.user;
    $('welcome').textContent = (u.user_metadata && u.user_metadata.display_name) || u.email.split('@')[0];
    sb.rpc('is_admin').then(r => { if (r.data === true) $('adminLink').classList.remove('hidden'); });
    await loadAccess();
  }

  async function loadAccess(){
    const { data, error } = await sb.rpc('my_activations');
    const box = $('access');
    if (error) { box.innerHTML = '<div class="empty">Impossible de charger vos accès pour le moment.</div>'; return; }
    $('statCount').textContent = data.length;
    $('countPill').textContent = data.length + (data.length > 1 ? ' produits' : ' produit');
    if (!data.length) { box.innerHTML = '<div class="empty"><b>Aucun accès pour le moment</b>Activez une KEY ci-dessus pour débloquer vos produits.</div>'; return; }
    box.innerHTML = '<div class="tablewrap"><table><thead><tr><th>Produit</th><th>KEY</th><th>Activée le</th><th></th></tr></thead><tbody>' +
      data.map(a => {
        const url = safeUrl(a.download_url);
        return '<tr><td><b>' + esc(a.product) + '</b></td><td><code>' + esc(a.key) + '</code></td><td>' + esc(fmtDate(a.used_at)) + '</td><td class="actions">' +
          (url ? '<a class="btn sm" href="' + esc(url) + '" target="_blank" rel="noopener">⬇ Télécharger</a>' : '<span class="badge used">Bientôt disponible</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  async function activate(e){
    e.preventDefault();
    const key = $('keyInput').value.trim().toUpperCase();
    if (!key) return setMsg('keyMsg', 'Entrez votre KEY.', 'err');
    const btn = $('keyBtn'); btn.disabled = true; setMsg('keyMsg', '');
    const { data, error } = await sb.rpc('activate_key', { p_key: key });
    btn.disabled = false;
    if (error) {
      const m = error.message || '';
      return setMsg('keyMsg', /invalid_key/.test(m) ? 'Cette KEY est invalide.' : /already_used/.test(m) ? 'Cette KEY a déjà été activée.' : /not_authenticated/.test(m) ? 'Session expirée, reconnectez-vous.' : 'Activation impossible. Réessayez.', 'err');
    }
    $('keyInput').value = '';
    setMsg('keyMsg', 'KEY activée : ' + (data && data[0] ? data[0].out_product : ''), 'ok');
    toast('Produit activé avec succès');
    loadAccess();
  }

  async function init(){
    if (!V.configured) { V.unavailable('app'); return; }
    $('authForm').addEventListener('submit', submitAuth);
    $('tabLogin').addEventListener('click', () => setMode('login'));
    $('tabRegister').addEventListener('click', () => setMode('register'));
    $('keyForm').addEventListener('submit', activate);
    $('logoutBtn').addEventListener('click', () => sb.auth.signOut());
    sb.auth.onAuthStateChange((_ev, s) => { setTimeout(() => s ? renderDashboard(s) : show('landing'), 0); });
    const { data } = await sb.auth.getSession();
    if (data.session) renderDashboard(data.session); else show('landing');
  }
  init();
})();
