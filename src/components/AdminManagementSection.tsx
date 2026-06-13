import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';

export default function AdminManagementSection({ onError, onSuccess }: {onError: (m:string)=>void; onSuccess:(m:string)=>void}) {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data?.users || []);
    } catch (e:any) {
      onError(String(e.message || e));
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{padding:20}}>
      <h2>Admin Management</h2>
      <div style={{display:'flex',gap:20}}>
        <div style={{flex:1}}>
          <h3>Admins</h3>
          <ul>
            {users.map(u => (
              <li key={u._id} style={{padding:8,borderBottom:'1px solid #eee'}}>
                <strong>{u.name}</strong> <small>{u.email}</small>
                <div><small>{u.role} • {u.blocked ? 'Blocked' : 'Active'}</small></div>
                <button onClick={() => setSelected(u)}>View</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{width:420}}>
          {selected ? (
            <div>
              <h3>{selected.name}</h3>
              <p>{selected.email}</p>
              <p>Role: {selected.role}</p>
              <p>Status: {selected.blocked ? 'Blocked' : 'Active'}</p>
              <div style={{marginTop:12}}>
                <button onClick={async ()=>{try{await adminApi.forceLogoutUser(selected._id); onSuccess('Forced logout'); await load();}catch(e){onError(String(e))}}}>Force logout</button>
                <button onClick={async ()=>{try{await adminApi.blockUser(selected._id); onSuccess('Blocked'); await load();}catch(e){onError(String(e))}}}>Block</button>
                <button onClick={async ()=>{try{await adminApi.unblockUser(selected._id); onSuccess('Unblocked'); await load();}catch(e){onError(String(e))}}}>Unblock</button>
              </div>
            </div>
          ) : <div>Select an admin to view details</div>}
        </div>
      </div>
    </div>
  );
}
