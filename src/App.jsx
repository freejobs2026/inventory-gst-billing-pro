import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowLeftRight, BarChart3, Bell, Boxes, Building2,
  Check, ChevronDown, CircleHelp, ClipboardList, CreditCard, FilePlus2, FileText,
  LayoutDashboard, LogOut, Menu, Package, Plus, Search, Settings, ShieldCheck,
  ShoppingBag, ShoppingCart, Smartphone, Trash2, TrendingUp, Truck, Users, X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const dateText = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const shortId = (id) => id ? `${id.slice(0, 8).toUpperCase()}` : '—';

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products & Stock', icon: Package },
  { id: 'sales', label: 'Sales & Invoices', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'purchases', label: 'Purchases', icon: Truck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'reports', label: 'Reports & GST', icon: BarChart3 },
  { id: 'settings', label: 'Business Settings', icon: Settings },
];

function Brand({ compact = false }) {
  return <div className="brand-lockup"><div className="brand-mark"><Boxes size={21} /></div>{!compact && <div><div className="brand-name">INVENTORY <span>& GST</span></div><div className="brand-sub">BILLING PRO</div></div>}</div>;
}

function Notice({ children, kind = 'info', onClose }) {
  if (!children) return null;
  return <div className={`notice ${kind}`} role="status">{children}{onClose && <button className="icon-button" onClick={onClose} aria-label="Dismiss"><X size={15} /></button>}</div>;
}

function AuthScreen() {
  const [mode, setMode] = useState('email');
  const [action, setAction] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submitEmail = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (action === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (authError) throw authError;
        setMessage(data.session ? 'Account created. Your workspace will open next.' : 'Account created. Check your email to confirm your address, then sign in.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (err) { setError(err.message || 'Authentication failed.'); }
    finally { setBusy(false); }
  };

  const sendPhoneOtp = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
      if (authError) throw authError;
      setOtpSent(true); setMessage('OTP sent. Enter the verification code received on your phone.');
    } catch (err) { setError(err.message || 'Could not send OTP. Check phone number and SMS provider settings.'); }
    finally { setBusy(false); }
  };

  const verifyPhoneOtp = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { error: authError } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: otp.trim(), type: 'sms' });
      if (authError) throw authError;
    } catch (err) { setError(err.message || 'OTP verification failed.'); }
    finally { setBusy(false); }
  };

  return <div className="auth-shell">
    <div className="auth-side">
      <Brand />
      <div className="auth-pitch"><div className="eyebrow">BUSINESS MANAGEMENT, REIMAGINED</div><h1>One workspace.<br /><span>Every business.</span></h1><p>Inventory, GST billing, payments and reports — organized in one secure platform built for growing businesses.</p>
        <div className="auth-points"><div><ShieldCheck size={18} /><span>Private business workspaces</span></div><div><FileText size={18} /><span>GST-ready invoice workflow</span></div><div><Smartphone size={18} /><span>Works on desktop and mobile</span></div></div>
      </div>
      <div className="auth-foot">© {new Date().getFullYear()} Inventory & GST Billing PRO</div>
    </div>
    <div className="auth-main"><div className="auth-card">
      <div className="mobile-brand"><Brand /></div>
      <div className="eyebrow">WELCOME TO YOUR WORKSPACE</div><h2>{action === 'signup' ? 'Create your account' : 'Sign in to continue'}</h2><p className="muted">Use your email and password or verify your phone number.</p>
      <div className="auth-tabs"><button className={mode === 'email' ? 'active' : ''} onClick={() => { setMode('email'); setError(''); }}>Email</button><button className={mode === 'phone' ? 'active' : ''} onClick={() => { setMode('phone'); setError(''); }}>Phone OTP</button></div>
      {!isSupabaseConfigured && <Notice kind="warning">Backend not connected yet. Add your Supabase URL and publishable key in <code>.env.local</code> to enable authentication.</Notice>}
      {mode === 'email' ? <form onSubmit={submitEmail} className="form-stack">
        <label>Email address<input required type="email" autoComplete="email" placeholder="you@business.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input required minLength={8} type="password" autoComplete={action === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="btn btn-gold full" disabled={busy || !isSupabaseConfigured}>{busy ? 'Please wait…' : action === 'signup' ? 'Create account' : 'Sign in'} <ArrowDownToLine size={16} /></button>
        <button type="button" className="text-button" onClick={() => { setAction(action === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}>{action === 'signin' ? 'New here? Create an account' : 'Already registered? Sign in'}</button>
      </form> : <form onSubmit={otpSent ? verifyPhoneOtp : sendPhoneOtp} className="form-stack">
        <label>Phone number<input required type="tel" autoComplete="tel" placeholder="+919876543210" value={phone} onChange={e => setPhone(e.target.value)} /></label>
        {otpSent && <label>Verification code<input required inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} /></label>}
        <button className="btn btn-gold full" disabled={busy || !isSupabaseConfigured}>{busy ? 'Please wait…' : otpSent ? 'Verify and sign in' : 'Send phone OTP'} <Smartphone size={16} /></button>
        {otpSent && <button type="button" className="text-button" onClick={() => { setOtpSent(false); setOtp(''); }}>Use another number</button>}
      </form>}
      {error && <Notice kind="error">{error}</Notice>}{message && <Notice kind="success">{message}</Notice>}
      <div className="auth-legal">By continuing, you agree to use this service lawfully and keep your account credentials secure.</div>
    </div></div>
  </div>;
}

function CreateBusiness({ onCreated, user }) {
  const [name, setName] = useState(''); const [gstin, setGstin] = useState(''); const [state, setState] = useState('Karnataka'); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const create = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const { data, error: rpcError } = await supabase.rpc('create_business', { p_name: name.trim(), p_state: state, p_gstin: gstin.trim() || null });
    if (rpcError) setError(rpcError.message); else await onCreated(data);
    setBusy(false);
  };
  return <div className="onboard-wrap"><div className="onboard-card"><Brand /><div className="eyebrow">FIRST-TIME SETUP</div><h1>Create your business workspace</h1><p className="muted">This creates a private workspace. You become its owner and can invite staff later.</p><form onSubmit={create} className="form-stack"><label>Business / shop name<input required minLength={2} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sri Lakshmi Traders" /></label><label>GSTIN (optional)<input maxLength={15} value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="15-character GSTIN" /></label><label>Business state<select value={state} onChange={e => setState(e.target.value)}>{['Andhra Pradesh','Delhi','Gujarat','Karnataka','Kerala','Maharashtra','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal','Other'].map(x => <option key={x}>{x}</option>)}</select></label><button className="btn btn-gold full" disabled={busy}>{busy ? 'Creating workspace…' : 'Create workspace'} <Building2 size={16} /></button></form>{error && <Notice kind="error">{error}</Notice>}<div className="auth-legal">Signed in as {user?.email || user?.phone || 'your account'}</div></div></div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [memberships, setMemberships] = useState([]);
  const [org, setOrg] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState({ products: [], customers: [], invoices: [], purchases: [], payments: [], movements: [] });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session: current } }) => { setSession(current); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
    return () => subscription.unsubscribe();
  }, []);

  const loadMemberships = useCallback(async () => {
    if (!session?.user) { setMemberships([]); setOrg(null); return; }
    const { data: rows, error } = await supabase.from('org_memberships').select('org_id, role, organizations(id, name, state, gstin, currency)').eq('user_id', session.user.id).eq('status', 'active');
    if (error) { setNotice({ kind: 'error', text: `Could not load your business workspaces: ${error.message}` }); return; }
    const list = (rows || []).map(row => ({ ...row.organizations, role: row.role })).filter(x => x.id);
    setMemberships(list);
    setOrg(current => current && list.some(x => x.id === current.id) ? current : list[0] || null);
  }, [session]);

  useEffect(() => { if (session) loadMemberships(); else { setMemberships([]); setOrg(null); } }, [session, loadMemberships]);

  const loadData = useCallback(async () => {
    if (!org?.id) return;
    setLoading(true);
    const tables = ['products', 'customers', 'sales_invoices', 'purchase_bills', 'payments', 'stock_movements'];
    const results = await Promise.all(tables.map(table => supabase.from(table).select('*').eq('org_id', org.id).order('created_at', { ascending: false }).limit(500)));
    const failed = results.find(r => r.error);
    if (failed) setNotice({ kind: 'error', text: failed.error.message });
    setData({ products: results[0].data || [], customers: results[1].data || [], invoices: results[2].data || [], purchases: results[3].data || [], payments: results[4].data || [], movements: results[5].data || [] });
    setLoading(false);
  }, [org]);

  useEffect(() => { loadData(); }, [loadData]);

  const signOut = async () => { await supabase.auth.signOut(); setData({ products: [], customers: [], invoices: [], purchases: [], payments: [], movements: [] }); };
  const refresh = async () => { await loadData(); };
  const createBusinessDone = async () => { await loadMemberships(); };

  if (authLoading) return <div className="center-screen"><div className="loader" /><span>Preparing your secure workspace…</span></div>;
  if (!isSupabaseConfigured) return <AuthScreen />;
  if (!session) return <AuthScreen />;
  if (!memberships.length) return <CreateBusiness onCreated={createBusinessDone} user={session.user} />;
  if (!org) return <div className="center-screen"><div className="loader" /><span>Loading business…</span></div>;

  const salesTotal = data.invoices.reduce((sum, x) => sum + Number(x.grand_total || 0), 0);
  const purchaseTotal = data.purchases.reduce((sum, x) => sum + Number(x.grand_total || 0), 0);
  const stockValue = data.products.reduce((sum, x) => sum + Number(x.stock_qty || 0) * Number(x.purchase_price || 0), 0);
  const lowStock = data.products.filter(x => Number(x.stock_qty) <= Number(x.low_stock_threshold)).length;
  const currentTitle = nav.find(x => x.id === page)?.label || 'Dashboard';

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}><div className="sidebar-top"><Brand /><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
      <div className="workspace-select"><span className="workspace-label">WORKSPACE</span><div className="workspace-name"><div className="workspace-icon"><Building2 size={16} /></div><select aria-label="Select business" value={org.id} onChange={e => setOrg(memberships.find(x => x.id === e.target.value))}>{memberships.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><ChevronDown size={14} /></div><span className="role-pill">{org.role}</span></div>
      <div className="nav-label">MAIN MENU</div><nav className="side-nav">{nav.map(item => { const Icon = item.icon; return <button key={item.id} className={page === item.id ? 'nav-item active' : 'nav-item'} onClick={() => { setPage(item.id); setSidebarOpen(false); setNotice(null); }}><Icon size={18} /><span>{item.label}</span>{item.id === 'products' && lowStock > 0 && <em>{lowStock}</em>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="secure-card"><ShieldCheck size={18} /><div><b>Workspace protected</b><span>Tenant-level data access</span></div></div><button className="nav-item" onClick={signOut}><LogOut size={18} /><span>Sign out</span></button><div className="sidebar-version">INVENTORY & GST PRO <span>v1.0.0</span></div></div>
    </aside>
    {sidebarOpen && <button aria-label="Close menu" className="mobile-scrim" onClick={() => setSidebarOpen(false)} />}
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div><div className="breadcrumb">WORKSPACE <span>/</span> {currentTitle.toUpperCase()}</div><h1>{currentTitle}</h1></div></div><div className="topbar-right"><div className="top-business"><span className="online-dot" />{org.name}</div><div className="avatar">{(session.user.email || session.user.phone || 'U').slice(0, 1).toUpperCase()}</div></div></header>
      <div className="page-content">{notice && <Notice kind={notice.kind} onClose={() => setNotice(null)}>{notice.text}</Notice>}{loading && <div className="loading-line"><div /></div>}
        {page === 'dashboard' && <Dashboard org={org} data={data} salesTotal={salesTotal} purchaseTotal={purchaseTotal} stockValue={stockValue} lowStock={lowStock} onNavigate={setPage} />}
        {page === 'products' && <Products org={org} products={data.products} search={search} setSearch={setSearch} onRefresh={refresh} onNotice={setNotice} />}
        {page === 'sales' && <Sales org={org} products={data.products} customers={data.customers} invoices={data.invoices} onRefresh={refresh} onNotice={setNotice} />}
        {page === 'customers' && <Customers org={org} customers={data.customers} onRefresh={refresh} onNotice={setNotice} />}
        {page === 'purchases' && <Purchases org={org} products={data.products} suppliersFallback={true} purchases={data.purchases} onRefresh={refresh} onNotice={setNotice} />}
        {page === 'payments' && <Payments org={org} payments={data.payments} onRefresh={refresh} onNotice={setNotice} />}
        {page === 'reports' && <Reports data={data} salesTotal={salesTotal} purchaseTotal={purchaseTotal} stockValue={stockValue} />}
        {page === 'settings' && <SettingsPage org={org} role={org.role} onRefresh={refresh} onNotice={setNotice} user={session.user} />}
      </div>
      <footer className="main-footer"><span>© {new Date().getFullYear()} Inventory & GST Billing PRO</span><span><ShieldCheck size={13} /> Private business workspace</span></footer>
    </main>
  </div>;
}

function PageHeading({ title, description, action }) { return <div className="page-heading"><div><h2>{title}</h2><p>{description}</p></div>{action}</div>; }
function StatCard({ label, value, detail, icon: Icon, tone = 'gold' }) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={18} /></div></div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>; }

function Dashboard({ org, data, salesTotal, purchaseTotal, stockValue, lowStock, onNavigate }) {
  const recent = data.invoices.slice(0, 5); const collected = data.payments.filter(x => x.payment_type === 'receipt').reduce((a, x) => a + Number(x.amount || 0), 0);
  return <><div className="welcome-row"><div><div className="eyebrow">BUSINESS OVERVIEW</div><h2>Good business starts with clarity.</h2><p>Here is what is happening at {org.name}.</p></div><div className="date-chip"><Activity size={15} /> Live workspace data</div></div>
    <div className="stats-grid"><StatCard label="Total sales" value={money(salesTotal)} detail={`${data.invoices.length} invoices recorded`} icon={TrendingUp} /><StatCard label="Purchases" value={money(purchaseTotal)} detail={`${data.purchases.length} purchase bills`} icon={ShoppingBag} tone="blue" /><StatCard label="Stock value" value={money(stockValue)} detail={`${data.products.length} active products`} icon={Boxes} tone="purple" /><StatCard label="Low stock alerts" value={lowStock} detail="Products at or below minimum" icon={Bell} tone="red" /></div>
    <div className="dashboard-grid"><section className="panel recent-panel"><div className="panel-heading"><div><h3>Recent sales invoices</h3><p>Latest activity in this workspace</p></div><button className="btn btn-outline btn-sm" onClick={() => onNavigate('sales')}>View all</button></div>{recent.length ? <div className="table-wrap"><table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Status</th><th className="align-right">Amount</th></tr></thead><tbody>{recent.map(x => <tr key={x.id}><td className="strong">{x.invoice_number}</td><td>{dateText(x.invoice_date)}</td><td>{x.customer_name || 'Walk-in customer'}</td><td><span className={`status ${x.payment_status}`}>{x.payment_status}</span></td><td className="align-right strong">{money(x.grand_total)}</td></tr>)}</tbody></table></div> : <EmptyState icon={FileText} title="No invoices yet" text="Your sales invoices will appear here once you record your first sale." action={<button className="btn btn-gold btn-sm" onClick={() => onNavigate('sales')}>Create first invoice</button>} />}</section>
      <section className="panel quick-panel"><div className="panel-heading"><div><h3>Quick actions</h3><p>Common business tasks</p></div></div><div className="quick-actions"><button onClick={() => onNavigate('products')}><div className="quick-icon"><Plus size={19} /></div><span><b>Add product</b><small>Create a stock item</small></span></button><button onClick={() => onNavigate('sales')}><div className="quick-icon"><FilePlus2 size={19} /></div><span><b>New invoice</b><small>Record a customer sale</small></span></button><button onClick={() => onNavigate('customers')}><div className="quick-icon"><Users size={19} /></div><span><b>Add customer</b><small>Save customer details</small></span></button><button onClick={() => onNavigate('reports')}><div className="quick-icon"><BarChart3 size={19} /></div><span><b>View reports</b><small>Sales and GST summary</small></span></button></div></section></div>
    <div className="bottom-grid"><section className="panel"><div className="panel-heading"><div><h3>Inventory health</h3><p>Stock levels requiring attention</p></div><button className="link-button" onClick={() => onNavigate('products')}>Manage stock <ArrowLeftRight size={14} /></button></div>{lowStock ? data.products.filter(x => Number(x.stock_qty) <= Number(x.low_stock_threshold)).slice(0, 5).map(p => <div className="stock-alert" key={p.id}><div className="stock-product"><div className="product-avatar"><Package size={16} /></div><div><b>{p.name}</b><small>{p.sku || shortId(p.id)}</small></div></div><div className="stock-count"><b>{Number(p.stock_qty)}</b><small>min {Number(p.low_stock_threshold)}</small></div><span className="status unpaid">Low stock</span></div>) : <div className="healthy-state"><Check size={17} /> All products are above their minimum stock levels.</div>}</section><section className="panel"><div className="panel-heading"><div><h3>Workspace snapshot</h3><p>Current business records</p></div></div><div className="snapshot-list"><div><span>Customers</span><b>{data.customers.length}</b></div><div><span>Suppliers recorded in purchases</span><b>{new Set(data.purchases.map(x => x.supplier_name).filter(Boolean)).size}</b></div><div><span>Customer receipts</span><b>{money(collected)}</b></div><div><span>Stock movements</span><b>{data.movements.length}</b></div></div></section></div>
  </>;
}

function Modal({ title, children, onClose }) { return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-head"><h3>{title}</h3><button className="icon-button" onClick={onClose}><X size={18} /></button></div>{children}</div></div>; }

function Products({ org, products, search, setSearch, onRefresh, onNotice }) {
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: '', hsn_code: '', unit: 'pcs', purchase_price: '0', sale_price: '0', gst_rate: '18', stock_qty: '0', low_stock_threshold: '5' });
  const filtered = products.filter(p => `${p.name} ${p.sku || ''} ${p.hsn_code || ''}`.toLowerCase().includes(search.toLowerCase()));
  const save = async e => { e.preventDefault(); setBusy(true); onNotice(null); const payload = { ...form, org_id: org.id, purchase_price: Number(form.purchase_price), sale_price: Number(form.sale_price), gst_rate: Number(form.gst_rate), stock_qty: Number(form.stock_qty), low_stock_threshold: Number(form.low_stock_threshold) };
    const { data, error } = await supabase.from('products').insert(payload).select('id').single();
    if (error) onNotice({ kind: 'error', text: error.message }); else { if (Number(form.stock_qty) > 0) await supabase.from('stock_movements').insert({ org_id: org.id, product_id: data.id, movement_type: 'opening', quantity_delta: Number(form.stock_qty), unit_cost: Number(form.purchase_price), notes: 'Opening stock' }); onNotice({ kind: 'success', text: 'Product added successfully.' }); setShow(false); setForm({ name: '', sku: '', category: '', hsn_code: '', unit: 'pcs', purchase_price: '0', sale_price: '0', gst_rate: '18', stock_qty: '0', low_stock_threshold: '5' }); await onRefresh(); } setBusy(false); };
  const remove = async p => { if (!window.confirm(`Archive ${p.name}? It will no longer appear in active product lists.`)) return; const { error } = await supabase.from('products').update({ is_active: false }).eq('id', p.id).eq('org_id', org.id); if (error) onNotice({ kind: 'error', text: error.message }); else { onNotice({ kind: 'success', text: 'Product archived.' }); await onRefresh(); } };
  return <><PageHeading title="Products & Stock" description="Maintain your product catalogue, GST rates and inventory quantities." action={<button className="btn btn-gold" onClick={() => setShow(true)}><Plus size={16} /> Add product</button>} />
    <div className="toolbar"><div className="search-box"><Search size={16} /><input placeholder="Search product, SKU or HSN…" value={search} onChange={e => setSearch(e.target.value)} /></div><span className="muted small-text">{filtered.length} products</span></div>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU / HSN</th><th>Purchase</th><th>Selling</th><th>GST</th><th>Available stock</th><th>Stock value</th><th></th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td><div className="table-product"><div className="product-avatar"><Package size={16} /></div><div><b>{p.name}</b><small>{p.category || 'Uncategorized'}</small></div></div></td><td>{p.sku || '—'}<small className="cell-sub">{p.hsn_code || 'No HSN'}</small></td><td>{money(p.purchase_price)}</td><td className="strong">{money(p.sale_price)}</td><td>{Number(p.gst_rate)}%</td><td><span className={Number(p.stock_qty) <= Number(p.low_stock_threshold) ? 'stock-low' : 'stock-ok'}>{Number(p.stock_qty)} {p.unit}</span></td><td>{money(Number(p.stock_qty) * Number(p.purchase_price))}</td><td><button className="icon-button danger-icon" title="Archive product" onClick={() => remove(p)}><Trash2 size={16} /></button></td></tr>)}</tbody></table>{!filtered.length && <EmptyState icon={Package} title="No products found" text="Add a product or try a different search." />}</div></section>
    {show && <Modal title="Add a product" onClose={() => setShow(false)}><form className="form-stack modal-form" onSubmit={save}><div className="form-grid"><label>Product name *<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>SKU / product code<input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></label><label>Category<input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label><label>HSN code<input value={form.hsn_code} onChange={e => setForm({ ...form, hsn_code: e.target.value })} /></label><label>Purchase price (₹)<input required type="number" min="0" step="0.01" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} /></label><label>Selling price (₹)<input required type="number" min="0" step="0.01" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} /></label><label>GST rate<select value={form.gst_rate} onChange={e => setForm({ ...form, gst_rate: e.target.value })}>{[0,5,12,18,28].map(x => <option key={x} value={x}>{x}%</option>)}</select></label><label>Unit<input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></label><label>Opening stock<input required type="number" min="0" step="0.001" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} /></label><label>Minimum stock alert<input required type="number" min="0" step="0.001" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} /></label></div><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShow(false)}>Cancel</button><button disabled={busy} className="btn btn-gold">{busy ? 'Saving…' : 'Save product'}</button></div></form></Modal>}
  </>;
}

function Customers({ org, customers, onRefresh, onNotice }) {
  const [show, setShow] = useState(false); const [form, setForm] = useState({ name: '', phone: '', email: '', gstin: '', state: 'Karnataka', billing_address: '' }); const [busy, setBusy] = useState(false); const [search, setSearch] = useState('');
  const save = async e => { e.preventDefault(); setBusy(true); const { error } = await supabase.from('customers').insert({ ...form, org_id: org.id }); if (error) onNotice({ kind: 'error', text: error.message }); else { onNotice({ kind: 'success', text: 'Customer saved.' }); setShow(false); setForm({ name: '', phone: '', email: '', gstin: '', state: 'Karnataka', billing_address: '' }); await onRefresh(); } setBusy(false); };
  const list = customers.filter(x => `${x.name} ${x.phone || ''} ${x.gstin || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeading title="Customers" description="Keep customer contact, GST and billing information in one place." action={<button className="btn btn-gold" onClick={() => setShow(true)}><Plus size={16} /> Add customer</button>} /><div className="toolbar"><div className="search-box"><Search size={16} /><input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} /></div><span className="muted small-text">{list.length} customers</span></div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>GSTIN</th><th>State</th><th>Added</th></tr></thead><tbody>{list.map(c => <tr key={c.id}><td className="strong">{c.name}</td><td>{c.phone || '—'}</td><td>{c.email || '—'}</td><td>{c.gstin || '—'}</td><td>{c.state || '—'}</td><td>{dateText(c.created_at)}</td></tr>)}</tbody></table>{!list.length && <EmptyState icon={Users} title="No customers yet" text="Add customers to use them on sales invoices." />}</div></section>{show && <Modal title="Add customer" onClose={() => setShow(false)}><form className="form-stack modal-form" onSubmit={save}><div className="form-grid"><label>Customer name *<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Phone<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label><label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>GSTIN<input maxLength={15} value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} /></label><label>State<input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></label><label>Billing address<input value={form.billing_address} onChange={e => setForm({ ...form, billing_address: e.target.value })} /></label></div><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShow(false)}>Cancel</button><button disabled={busy} className="btn btn-gold">{busy ? 'Saving…' : 'Save customer'}</button></div></form></Modal>}</>;
}

function Sales({ org, products, customers, invoices, onRefresh, onNotice }) {
  const [show, setShow] = useState(false); const [customerId, setCustomerId] = useState(''); const [supplyType, setSupplyType] = useState('intrastate'); const [productId, setProductId] = useState(''); const [qty, setQty] = useState('1'); const [discount, setDiscount] = useState('0'); const [cart, setCart] = useState([]); const [paid, setPaid] = useState(false); const [busy, setBusy] = useState(false); const [search, setSearch] = useState('');
  const activeProducts = products.filter(p => p.is_active && Number(p.stock_qty) > 0); const selected = activeProducts.find(p => p.id === productId);
  const add = () => { if (!selected || Number(qty) <= 0 || Number(qty) > Number(selected.stock_qty)) return; setCart(old => [...old, { product_id: selected.id, name: selected.name, quantity: Number(qty), discount_percent: Number(discount), unit_price: Number(selected.sale_price), gst_rate: Number(selected.gst_rate) }]); setProductId(''); setQty('1'); setDiscount('0'); };
  const taxable = cart.reduce((sum, x) => sum + x.quantity * x.unit_price * (1 - x.discount_percent / 100), 0); const tax = cart.reduce((sum, x) => sum + x.quantity * x.unit_price * (1 - x.discount_percent / 100) * x.gst_rate / 100, 0); const total = taxable + tax;
  const create = async e => { e.preventDefault(); if (!cart.length) return; setBusy(true); const { data, error } = await supabase.rpc('create_sales_invoice', { p_org_id: org.id, p_customer_id: customerId || null, p_supply_type: supplyType, p_items: cart.map(x => ({ product_id: x.product_id, quantity: x.quantity, discount_percent: x.discount_percent })), p_paid_amount: paid ? total : 0, p_payment_method: paid ? 'cash' : null });
    if (error) onNotice({ kind: 'error', text: error.message }); else { onNotice({ kind: 'success', text: `Invoice ${data?.invoice_number || ''} created successfully.` }); setShow(false); setCart([]); setPaid(false); await onRefresh(); } setBusy(false); };
  const filtered = invoices.filter(x => `${x.invoice_number} ${x.customer_name || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeading title="Sales & Invoices" description="Create sales invoices with server-calculated GST and automatic stock deduction." action={<button className="btn btn-gold" onClick={() => setShow(true)}><Plus size={16} /> New invoice</button>} /><div className="stats-grid compact-stats"><StatCard label="Invoices" value={invoices.length} detail="All recorded invoices" icon={FileText} /><StatCard label="Sales value" value={money(invoices.reduce((a, x) => a + Number(x.grand_total), 0))} detail="Including GST" icon={TrendingUp} tone="blue" /></div><div className="toolbar"><div className="search-box"><Search size={16} /><input placeholder="Search invoice or customer…" value={search} onChange={e => setSearch(e.target.value)} /></div></div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Invoice no.</th><th>Date</th><th>Customer</th><th>Supply</th><th>Payment</th><th className="align-right">Total</th></tr></thead><tbody>{filtered.map(x => <tr key={x.id}><td className="strong">{x.invoice_number}</td><td>{dateText(x.invoice_date)}</td><td>{x.customer_name || 'Walk-in customer'}</td><td>{x.supply_type === 'interstate' ? 'Interstate · IGST' : 'Intrastate · CGST/SGST'}</td><td><span className={`status ${x.payment_status}`}>{x.payment_status}</span></td><td className="align-right strong">{money(x.grand_total)}</td></tr>)}</tbody></table>{!filtered.length && <EmptyState icon={FileText} title="No sales invoices" text="Create your first invoice to start tracking sales." />}</div></section>
    {show && <Modal title="Create sales invoice" onClose={() => setShow(false)}><form onSubmit={create} className="form-stack modal-form"><div className="form-grid"><label>Customer<select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Supply type<select value={supplyType} onChange={e => setSupplyType(e.target.value)}><option value="intrastate">Intrastate — CGST + SGST</option><option value="interstate">Interstate — IGST</option></select></label></div><div className="cart-add"><label>Product<select value={productId} onChange={e => setProductId(e.target.value)}><option value="">Select product</option>{activeProducts.map(p => <option key={p.id} value={p.id}>{p.name} · {money(p.sale_price)} · stock {p.stock_qty}</option>)}</select></label><label>Qty<input type="number" min="0.001" step="0.001" value={qty} onChange={e => setQty(e.target.value)} /></label><label>Discount %<input type="number" min="0" max="100" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} /></label><button type="button" className="btn btn-outline add-line" disabled={!selected || Number(qty) <= 0 || Number(qty) > Number(selected?.stock_qty)} onClick={add}><Plus size={15} /> Add</button></div>{cart.length > 0 && <div className="cart-lines">{cart.map((x, i) => <div className="cart-line" key={`${x.product_id}-${i}`}><div><b>{x.name}</b><small>{x.quantity} × {money(x.unit_price)} · GST {x.gst_rate}% · discount {x.discount_percent}%</small></div><b>{money(x.quantity * x.unit_price * (1 - x.discount_percent / 100) * (1 + x.gst_rate / 100))}</b><button type="button" className="icon-button danger-icon" onClick={() => setCart(old => old.filter((_, j) => j !== i))}><Trash2 size={15} /></button></div>)}</div>}<div className="invoice-totals"><div><span>Taxable value</span><b>{money(taxable)}</b></div><div><span>GST total</span><b>{money(tax)}</b></div><div className="grand"><span>Invoice total</span><b>{money(total)}</b></div></div><label className="check-label"><input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} /> Mark full invoice amount as paid (cash)</label><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShow(false)}>Cancel</button><button className="btn btn-gold" disabled={busy || !cart.length}>{busy ? 'Creating…' : 'Create invoice'}</button></div><p className="form-help">The database checks stock again and computes invoice amounts in one transaction before saving.</p></form></Modal>}
  </>;
}

function Purchases({ org, products, purchases, onRefresh, onNotice }) {
  const [show, setShow] = useState(false); const [supplier, setSupplier] = useState(''); const [productId, setProductId] = useState(''); const [qty, setQty] = useState('1'); const [rate, setRate] = useState(''); const [gst, setGst] = useState('18'); const [busy, setBusy] = useState(false);
  const save = async e => { e.preventDefault(); setBusy(true); const { data, error } = await supabase.rpc('create_purchase_bill', { p_org_id: org.id, p_supplier_name: supplier.trim(), p_items: [{ product_id: productId, quantity: Number(qty), unit_price: Number(rate), gst_rate: Number(gst) }], p_bill_date: new Date().toISOString().slice(0,10) }); if (error) onNotice({kind:'error', text:error.message}); else { onNotice({kind:'success', text:`Purchase ${data?.bill_number || ''} recorded and stock increased.`}); setShow(false); await onRefresh(); } setBusy(false); };
  return <><PageHeading title="Purchases" description="Record supplier purchases and update inventory." action={<button className="btn btn-gold" onClick={() => setShow(true)}><Plus size={16} /> Record purchase</button>} /><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Bill no.</th><th>Date</th><th>Supplier</th><th>Taxable value</th><th>GST</th><th className="align-right">Total</th></tr></thead><tbody>{purchases.map(p => <tr key={p.id}><td className="strong">{p.bill_number || shortId(p.id)}</td><td>{dateText(p.bill_date)}</td><td>{p.supplier_name || '—'}</td><td>{money(p.taxable_amount)}</td><td>{money(p.gst_amount)}</td><td className="align-right strong">{money(p.grand_total)}</td></tr>)}</tbody></table>{!purchases.length && <EmptyState icon={Truck} title="No purchases recorded" text="Record a supplier bill to track purchase costs and stock increases." />}</div></section>{show && <Modal title="Record purchase" onClose={() => setShow(false)}><form className="form-stack modal-form" onSubmit={save}><label>Supplier name<input required value={supplier} onChange={e => setSupplier(e.target.value)} /></label><label>Product<select required value={productId} onChange={e => { setProductId(e.target.value); const p = products.find(x => x.id === e.target.value); if (p) { setRate(String(p.purchase_price)); setGst(String(p.gst_rate)); } }}><option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="form-grid"><label>Quantity<input type="number" required min="0.001" step="0.001" value={qty} onChange={e => setQty(e.target.value)} /></label><label>Purchase rate<input type="number" required min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} /></label><label>GST rate<select value={gst} onChange={e => setGst(e.target.value)}>{[0,5,12,18,28].map(x => <option key={x} value={x}>{x}%</option>)}</select></label></div><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShow(false)}>Cancel</button><button disabled={busy || !productId} className="btn btn-gold">{busy ? 'Saving…' : 'Save purchase'}</button></div><p className="form-help">This first screen records one product line per bill. Posting, stock increase and movement history are saved together by a database function.</p></form></Modal>}</>;
}

function Payments({ org, payments, onRefresh, onNotice }) {
  const [show, setShow] = useState(false); const [form, setForm] = useState({ payment_type: 'receipt', party_name: '', amount: '', payment_method: 'upi', reference_no: '', notes: '' }); const [busy, setBusy] = useState(false);
  const save = async e => { e.preventDefault(); setBusy(true); const { error } = await supabase.from('payments').insert({ ...form, org_id: org.id, amount: Number(form.amount), payment_date: new Date().toISOString().slice(0,10) }); if (error) onNotice({kind:'error',text:error.message}); else { onNotice({kind:'success',text:'Payment entry recorded.'}); setShow(false); await onRefresh(); } setBusy(false); };
  return <><PageHeading title="Payments" description="Record customer receipts and supplier payments." action={<button className="btn btn-gold" onClick={() => setShow(true)}><Plus size={16} /> Add payment</button>} /><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Mode</th><th>Reference</th><th className="align-right">Amount</th></tr></thead><tbody>{payments.map(p => <tr key={p.id}><td>{dateText(p.payment_date)}</td><td><span className={`status ${p.payment_type === 'receipt' ? 'paid' : 'unpaid'}`}>{p.payment_type}</span></td><td>{p.party_name || '—'}</td><td>{p.payment_method}</td><td>{p.reference_no || '—'}</td><td className="align-right strong">{money(p.amount)}</td></tr>)}</tbody></table>{!payments.length && <EmptyState icon={CreditCard} title="No payment entries" text="Record receipts and supplier payments to maintain your cash movement history." />}</div></section>{show && <Modal title="Add payment entry" onClose={() => setShow(false)}><form className="form-stack modal-form" onSubmit={save}><label>Payment type<select value={form.payment_type} onChange={e => setForm({...form,payment_type:e.target.value})}><option value="receipt">Customer receipt</option><option value="supplier_payment">Supplier payment</option></select></label><label>Party name<input required value={form.party_name} onChange={e => setForm({...form,party_name:e.target.value})} /></label><div className="form-grid"><label>Amount (₹)<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} /></label><label>Payment mode<select value={form.payment_method} onChange={e => setForm({...form,payment_method:e.target.value})}>{['cash','upi','bank_transfer','card','cheque','other'].map(x=><option key={x} value={x}>{x.replace('_',' ')}</option>)}</select></label><label>Reference number<input value={form.reference_no} onChange={e => setForm({...form,reference_no:e.target.value})} /></label><label>Notes<input value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} /></label></div><div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShow(false)}>Cancel</button><button disabled={busy} className="btn btn-gold">{busy?'Saving…':'Save payment'}</button></div><p className="form-help">This first version records payment history. Invoice allocation and payment reversal workflows are planned for the next release.</p></form></Modal>}</>;
}

function Reports({ data, salesTotal, purchaseTotal, stockValue }) {
  const salesTax = data.invoices.reduce((a,x)=>a+Number(x.gst_amount||0),0); const cgst = data.invoices.reduce((a,x)=>a+Number(x.cgst_amount||0),0); const sgst = data.invoices.reduce((a,x)=>a+Number(x.sgst_amount||0),0); const igst = data.invoices.reduce((a,x)=>a+Number(x.igst_amount||0),0);
  return <><PageHeading title="Reports & GST" description="A snapshot of recorded transactions and tax values. Have your accountant verify filings." /><div className="stats-grid"><StatCard label="Sales incl. GST" value={money(salesTotal)} detail="Recorded sales invoices" icon={TrendingUp} /><StatCard label="Purchase incl. GST" value={money(purchaseTotal)} detail="Recorded purchase bills" icon={ShoppingBag} tone="blue" /><StatCard label="GST on sales" value={money(salesTax)} detail="Output tax recorded" icon={FileText} tone="purple" /><StatCard label="Inventory value" value={money(stockValue)} detail="Current stock at purchase cost" icon={Boxes} tone="red" /></div><div className="reports-grid"><section className="panel"><div className="panel-heading"><div><h3>Output GST summary</h3><p>From saved sales invoices</p></div><span className="tag">GST</span></div><div className="snapshot-list"><div><span>CGST</span><b>{money(cgst)}</b></div><div><span>SGST</span><b>{money(sgst)}</b></div><div><span>IGST</span><b>{money(igst)}</b></div><div className="snapshot-total"><span>Total output GST</span><b>{money(salesTax)}</b></div></div></section><section className="panel"><div className="panel-heading"><div><h3>Transaction counts</h3><p>All records in this workspace</p></div></div><div className="snapshot-list"><div><span>Sales invoices</span><b>{data.invoices.length}</b></div><div><span>Purchase bills</span><b>{data.purchases.length}</b></div><div><span>Payments</span><b>{data.payments.length}</b></div><div><span>Stock movements</span><b>{data.movements.length}</b></div></div></section></div><Notice kind="warning">This is an operational summary, not a statutory GST return. Confirm HSN, place of supply, exemptions, credit notes, input tax credit eligibility and return treatment with a qualified GST professional before filing.</Notice></>;
}

function SettingsPage({ org, role, onNotice, user }) {
  const [name, setName] = useState(org.name || ''); const [gstin, setGstin] = useState(org.gstin || ''); const [state, setState] = useState(org.state || 'Karnataka'); const [busy, setBusy] = useState(false);
  const save = async e => { e.preventDefault(); setBusy(true); const { error } = await supabase.from('organizations').update({ name: name.trim(), gstin: gstin.trim() || null, state }).eq('id', org.id); if (error) onNotice({kind:'error',text:error.message}); else onNotice({kind:'success',text:'Business settings updated.'}); setBusy(false); };
  return <><PageHeading title="Business Settings" description="Manage your business identity and workspace information." /><div className="settings-grid"><section className="panel settings-panel"><div className="panel-heading"><div><h3>Business profile</h3><p>Details used on invoices and reports</p></div><Building2 size={19} /></div><form className="form-stack" onSubmit={save}><label>Business name<input required value={name} onChange={e=>setName(e.target.value)} disabled={!['owner','admin'].includes(role)} /></label><label>GSTIN<input maxLength={15} value={gstin} onChange={e=>setGstin(e.target.value.toUpperCase())} disabled={!['owner','admin'].includes(role)} /></label><label>State<input value={state} onChange={e=>setState(e.target.value)} disabled={!['owner','admin'].includes(role)} /></label>{['owner','admin'].includes(role) && <button className="btn btn-gold" disabled={busy}>{busy?'Saving…':'Save business profile'}</button>}</form></section><section className="panel settings-panel"><div className="panel-heading"><div><h3>Account & security</h3><p>Signed-in identity and workspace access</p></div><ShieldCheck size={19} /></div><div className="account-info"><span>Signed in as</span><b>{user.email || user.phone}</b></div><div className="account-info"><span>Your workspace role</span><b className="capitalize">{role}</b></div><div className="account-info"><span>Workspace ID</span><code>{org.id}</code></div><Notice kind="info">Staff invitations, role editing, subscription billing and audit logs are planned for the next milestone. Do not share your Supabase service-role key with users or place it in frontend code.</Notice></section></div></>;
}

function EmptyState({ icon: Icon, title, text, action }) { return <div className="empty-state"><div><Icon size={23} /></div><h3>{title}</h3><p>{text}</p>{action}</div>; }

export default App;
