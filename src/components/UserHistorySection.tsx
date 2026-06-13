import React, {useEffect, useState} from 'react';
import {adminApi, AdminUser, ActivityItem, AdminOrder} from '../services/api';

export default function UserHistorySection({onError, onSuccess}:{onError:(m:string)=>void; onSuccess:(m:string)=>void}){
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loginHistory, setLoginHistory] = useState<ActivityItem[]>([]);
  const [payments, setPayments] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [activityPage, setActivityPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const pageSize = 10;

  async function loadUsers(){
    try{
      const res = await adminApi.getUsers();
      setUsers(res.data?.users || []);
    }catch(e:any){ onError(String(e.message || e)); }
  }

  useEffect(()=>{ loadUsers(); }, []);

  async function selectUser(user: AdminUser){
    setSelected(user);
    setActivities([]);
    setLoginHistory([]);
    setPayments([]);
    setActivityPage(1);
    setLoginPage(1);
    setPaymentPage(1);
    setLoading(true);
    try{
      const [a, l, p] = await Promise.all([
        adminApi.getUserActivities(user._id || user.id || '', 1, pageSize),
        adminApi.getUserLoginHistory(user._id || user.id || '', 1, pageSize),
        adminApi.getUserPayments(user._id || user.id || '', 1, pageSize),
      ]);
      setActivities(a.data?.activities || []);
      setLoginHistory(l.data?.history || []);
      setPayments(p.data?.payments || []);
    }catch(e:any){ onError(String(e.message || e)); }
    finally{ setLoading(false); }
  }

  async function loadActivityPage(page: number){
    if(!selected) return;
    setLoading(true);
    try{
      const res = await adminApi.getUserActivities(selected._id || selected.id || '', page, pageSize);
      setActivities(res.data?.activities || []);
      setActivityPage(page);
    }catch(e:any){ onError(String(e.message || e)); }
    finally{ setLoading(false); }
  }

  async function loadLoginPage(page: number){
    if(!selected) return;
    setLoading(true);
    try{
      const res = await adminApi.getUserLoginHistory(selected._id || selected.id || '', page, pageSize);
      setLoginHistory(res.data?.history || []);
      setLoginPage(page);
    }catch(e:any){ onError(String(e.message || e)); }
    finally{ setLoading(false); }
  }

  async function loadPaymentPage(page: number){
    if(!selected) return;
    setLoading(true);
    try{
      const res = await adminApi.getUserPayments(selected._id || selected.id || '', page, pageSize);
      setPayments(res.data?.payments || []);
      setPaymentPage(page);
    }catch(e:any){ onError(String(e.message || e)); }
    finally{ setLoading(false); }
  }

  function PaginationControls({page, hasMore, onPrev, onNext}: {page:number; hasMore:boolean; onPrev:()=>void; onNext:()=>void}){
    return (
      <div style={{display:'flex', gap:8, marginTop:12, justifyContent:'space-between', alignItems:'center'}}>
        <div><small>Page {page}</small></div>
        <div style={{display:'flex',gap:8}}>
          <button disabled={page===1} onClick={onPrev}>← Prev</button>
          <button disabled={!hasMore} onClick={onNext}>Next →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:20}}>
      <h2>User History & Activity Audit</h2>
      <div style={{display:'flex',gap:20}}>
        <div style={{flex:0.8, borderRight:'1px solid #e0e0e0', paddingRight:16}}>
          <h3>Customers</h3>
          <ul style={{listStyle:'none', padding:0, margin:0}}>
            {users.map(u=> (
              <li key={u._id || u.email} style={{padding:10,borderBottom:'1px solid #eee', cursor:'pointer', backgroundColor: (selected?._id === u._id || selected?.email === u.email) ? '#f5f5f5' : 'transparent'}} onClick={()=>selectUser(u)}>
                <div style={{display:'flex',justifyContent:'space-between', alignItems:'start'}}>
                  <div>
                    <strong>{u.name || 'Unnamed'}</strong>
                    <div><small>{u.email}</small></div>
                    <div><small>Status: {u.blocked ? '🔒 Blocked' : '✓ Active'} • Verified: {u.isVerified ? 'Yes' : 'No'}</small></div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div style={{flex:1.2}}>
          {selected ? (
            <div>
              <div style={{backgroundColor:'#f9f9f9', padding:12, borderRadius:4, marginBottom:16}}>
                <h3 style={{margin:'0 0 8px 0'}}>{selected.name || selected.email}</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div><small><strong>Email:</strong> {selected.email}</small></div>
                  <div><small><strong>Role:</strong> {selected.role}</small></div>
                  <div><small><strong>Phone:</strong> {selected.phone || 'N/A'}</small></div>
                  <div><small><strong>Last Login:</strong> {selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString() : 'Never'}</small></div>
                  <div><small><strong>Created:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : 'N/A'}</small></div>
                  <div><small><strong>Status:</strong> {selected.blocked ? '🔒 Blocked' : '✓ Active'}</small></div>
                </div>
              </div>

              <section style={{marginBottom:20}}>
                <h4 style={{marginBottom:12}}>Recent Activities ({activities.length})</h4>
                {loading && activityPage === 1 ? <p>Loading...</p> : (
                  activities.length ? (
                    <>
                      <div style={{overflowX:'auto'}}>
                        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                          <thead>
                            <tr style={{borderBottom:'2px solid #ddd'}}>
                              <th style={{textAlign:'left', padding:8}}>Action</th>
                              <th style={{textAlign:'left', padding:8}}>Details</th>
                              <th style={{textAlign:'left', padding:8}}>Timestamp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activities.map(a=> (
                              <tr key={a._id || a.createdAt} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:8}}><strong>{a.action}</strong></td>
                                <td style={{padding:8}}><small>{a.details || '—'}</small></td>
                                <td style={{padding:8}}><small>{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</small></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <PaginationControls page={activityPage} hasMore={activities.length===pageSize} onPrev={()=>loadActivityPage(activityPage-1)} onNext={()=>loadActivityPage(activityPage+1)} />
                    </>
                  ) : <p><small>No recent activities recorded.</small></p>
                )}
              </section>

              <section style={{marginBottom:20}}>
                <h4 style={{marginBottom:12}}>Login / Logout History ({loginHistory.length})</h4>
                {loginHistory.length ? (
                  <>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                        <thead>
                          <tr style={{borderBottom:'2px solid #ddd'}}>
                            <th style={{textAlign:'left', padding:8}}>Event</th>
                            <th style={{textAlign:'left', padding:8}}>IP Address</th>
                            <th style={{textAlign:'left', padding:8}}>User Agent</th>
                            <th style={{textAlign:'left', padding:8}}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginHistory.map(h=> {
                            const details = typeof h.details === 'string' ? (() => {try{return JSON.parse(h.details)}catch{return {}}})() : h.details || {};
                            const ip = (details as any).ipAddress || '—';
                            const ua = (details as any).userAgent || '—';
                            return (
                              <tr key={h._id || h.createdAt} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:8}}><strong>{h.action}</strong></td>
                                <td style={{padding:8}}><small>{ip}</small></td>
                                <td style={{padding:8}}><small title={ua} style={{maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', display:'inline-block'}}>{ua}</small></td>
                                <td style={{padding:8}}><small>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</small></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls page={loginPage} hasMore={loginHistory.length===pageSize} onPrev={()=>loadLoginPage(loginPage-1)} onNext={()=>loadLoginPage(loginPage+1)} />
                  </>
                ) : <p><small>No login history recorded.</small></p>}
              </section>

              <section style={{marginBottom:20}}>
                <h4 style={{marginBottom:12}}>Payments & Orders ({payments.length})</h4>
                {payments.length ? (
                  <>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                        <thead>
                          <tr style={{borderBottom:'2px solid #ddd'}}>
                            <th style={{textAlign:'left', padding:8}}>Order ID</th>
                            <th style={{textAlign:'left', padding:8}}>Amount</th>
                            <th style={{textAlign:'left', padding:8}}>Status</th>
                            <th style={{textAlign:'left', padding:8}}>Payment</th>
                            <th style={{textAlign:'left', padding:8}}>Reference</th>
                            <th style={{textAlign:'left', padding:8}}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(o=> (
                            <tr key={o._id} style={{borderBottom:'1px solid #eee'}}>
                              <td style={{padding:8}}><strong style={{fontSize:'12px'}}>{o._id?.slice(-8) || '—'}</strong></td>
                              <td style={{padding:8}}><strong>₹{o.totalAmount || 0}</strong></td>
                              <td style={{padding:8}}><small>{o.orderStatus || '—'}</small></td>
                              <td style={{padding:8}}><small>{o.paymentStatus || '—'}</small></td>
                              <td style={{padding:8}}><small title={o.paymentReference || o.razorpayPaymentId || '—'} style={{maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', display:'inline-block'}}>{o.paymentReference || o.razorpayPaymentId || '—'}</small></td>
                              <td style={{padding:8}}><small>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</small></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationControls page={paymentPage} hasMore={payments.length===pageSize} onPrev={()=>loadPaymentPage(paymentPage-1)} onNext={()=>loadPaymentPage(paymentPage+1)} />
                  </>
                ) : <p><small>No payments recorded.</small></p>}
              </section>
            </div>
          ) : <div style={{padding:20, textAlign:'center', color:'#999'}}>Select a customer to view detailed history</div>}
        </div>
      </div>
    </div>
  );
}
