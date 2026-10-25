(function(){
  const { $, esc, sb, safeUrl, fmtDate, setMsg, toast } = V;
  let keys = [], filter = '', status = 'all', editing = null;

  function show(view){ ['loading','login','denied','panel'].forEach(v => $(v).classList.toggle('hidden', v !== view)); $('logoutBtn').classList.toggle('hidden', view !== 'panel' && view !== 'denied'); }

  async function route(session){
    if (!session) return show('login');
    const { data } = await sb.rpc('is_admin');
    if (data !== true) return show('denied');
    show('panel'); loadKeys();
  }

  async function signIn(e){
    e.preventDefault();
    const email = $('aEmail').value.trim(), pass = $('aPass').value;
    const btn = $('aBtn'); btn.disabled = true; setMsg('aMsg', '');
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    btn.disabled = false;
    if (error) setMsg('aMsg', V.authError(error.message), 'err');
  }

  async function loadKeys(){
    const { data, error } = await sb.from('keys').select('*').order('created_at', { ascending: false });
    if (error) { $('list').innerHTML = '<div class="empty">Chargement impossible.</div>'; return; }
    keys = data; render();
  }

  function render(){
    const total = keys.length, used = keys.filter(k => k.used_by).length;
    $('sTotal').textContent = total; $('sFree').textContent = total - used; $('sUsed').textContent = used;
    const q = filter.toLowerCase();
    const rows = keys.filter(k => (status === 'all' || (status === 'used') === !!k.used_by) && (!q || (k.key + ' ' + k.product + ' ' + (k.used_by_name || '')).toLowerCase().includes(q)));
    if (!rows.length) { $('list').innerHTML = '<div class="empty"><b>' + (total ? 'Aucun résultat' : 'Aucune KEY') + '</b>' + (total ? 'Modifiez votre recherche.' : 'Créez votre première KEY ci-dessus.') + '</div>'; return; }
    $('list').innerHTML = '<div class="tablewrap"><table><thead><tr><th>KEY</th><th>Produit</th><th>État</th><th>Lien</th><th></th></tr></thead><tbody>' +
      rows.map(k => '<tr><td><code>' + esc(k.key) + '</code></td><td>' + esc(k.product) + '</td><td>' +
        (k.used_by ? '<span class="badge used">Utilisée</span> <span style="color:var(--muted);font-size:12px">' + esc(k.used_by_name || '') + ' · ' + esc(fmtDate(k.used_at)) + '</span>' : '<span class="badge ok">Disponible</span>') +
        '</td><td>' + (safeUrl(k.download_url) ? '<a href="' + esc(k.download_url) + '" target="_blank" rel="noopener">Ouvrir</a>' : '<span style="color:var(--muted)">—</span>') +
        '</td><td class="actions"><button class="btn ghost sm" data-act="copy" data-key="' + esc(k.key) + '">Copier</button><button class="btn ghost sm" data-act="edit" data-key="' + esc(k.key) + '">Modifier</button><button class="btn danger sm" data-act="del" data-key="' + esc(k.key) + '">Supprimer</button></td></tr>').join('') +
      '</tbody></table></div>';
  }

  async function create(e){
    e.preventDefault();
    const product = $('product').value.trim(), url = $('url').value.trim(), manual = $('key').value.trim().toUpperCase();
    const qty = Math.max(1, Math.min(200, parseInt($('qty').value, 10) || 1));
    if (!product) return setMsg('cMsg', 'Indiquez le nom du produit.', 'err');
    if (url && !safeUrl(url)) return setMsg('cMsg', 'Le lien doit commencer par http:// ou https://', 'err');
    if (manual && !V.KEY_RE.test(manual)) return setMsg('cMsg', 'Format attendu : VEXORA-XXXX-XXXX-XXXX', 'err');
    const list = manual ? [manual] : Array.from({ length: qty }, () => V.genKey());
    const rows = list.map(key => ({ key, product, download_url: url || null }));
    const btn = $('cBtn'); btn.disabled = true; setMsg('cMsg', '');
    const { error } = await sb.from('keys').insert(rows);
    btn.disabled = false;
    if (error) return setMsg('cMsg', error.code === '23505' ? 'Cette KEY existe déjà.' : 'Création impossible. Vérifiez vos droits.', 'err');
    $('key').value = ''; setMsg('cMsg', rows.length + (rows.length > 1 ? ' KEYS créées.' : ' KEY créée.'), 'ok');
    loadKeys();
  }

  async function onAction(e){
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const key = b.dataset.key, k = keys.find(x => x.key === key);
    if (b.dataset.act === 'copy') { try { await navigator.clipboard.writeText(key); toast('KEY copiée'); } catch { toast(key); } }
    if (b.dataset.act === 'edit' && k) { editing = k; $('eProduct').value = k.product; $('eUrl').value = k.download_url || ''; setMsg('eMsg', ''); $('modal').classList.remove('hidden'); }
    if (b.dataset.act === 'del') {
      if (!confirm('Supprimer définitivement cette KEY ?\n' + key)) return;
      const { error } = await sb.from('keys').delete().eq('key', key);
      if (error) return toast('Suppression impossible');
      loadKeys();
    }
  }

  async function saveEdit(e){
    e.preventDefault();
    const product = $('eProduct').value.trim(), url = $('eUrl').value.trim();
    if (!product) return setMsg('eMsg', 'Le nom du produit est requis.', 'err');
    if (url && !safeUrl(url)) return setMsg('eMsg', 'Lien invalide (http:// ou https://).', 'err');
    const { error } = await sb.from('keys').update({ product, download_url: url || null }).eq('key', editing.key);
    if (error) return setMsg('eMsg', 'Enregistrement impossible.', 'err');
    $('modal').classList.add('hidden'); toast('Modifications enregistrées'); loadKeys();
  }

  async function init(){
    if (!V.configured) { V.unavailable('app'); return; }
    $('loginForm').addEventListener('submit', signIn);
    $('createForm').addEventListener('submit', create);
    $('list').addEventListener('click', onAction);
    $('editForm').addEventListener('submit', saveEdit);
    $('eCancel').addEventListener('click', () => $('modal').classList.add('hidden'));
    $('search').addEventListener('input', e => { filter = e.target.value.trim(); render(); });
    $('statusSel').addEventListener('change', e => { status = e.target.value; render(); });
    $('logoutBtn').addEventListener('click', () => sb.auth.signOut());
    $('gen').addEventListener('click', () => { $('key').value = V.genKey(); });
    sb.auth.onAuthStateChange((_e, s) => setTimeout(() => route(s), 0));
    const { data } = await sb.auth.getSession(); route(data.session);
  }
  init();
})();
