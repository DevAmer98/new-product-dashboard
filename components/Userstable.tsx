'use client'
import { useEffect, useState } from 'react'


type User = { id: string; name: string; email: string; signedUp: string }


export default function UsersTable(){
const [users, setUsers] = useState<User[]>([])
const [loading, setLoading] = useState(true)


useEffect(()=>{
// placeholder: replace with real API call (fetch from /api/admin/users)
setTimeout(()=>{
setUsers([
{id:'1', name:'Alice', email:'alice@example.com', signedUp:'2025-08-01'},
{id:'2', name:'Bob', email:'bob@example.com', signedUp:'2025-08-05'},
{id:'3', name:'Cara', email:'cara@example.com', signedUp:'2025-08-12'},
])
setLoading(false)
}, 600)
},[])


if(loading) return <div className="p-4 bg-white border rounded">Loading...</div>


return (
<div className="bg-white border rounded overflow-hidden">
<table className="w-full text-left">
<thead className="bg-gray-50">
<tr>
<th className="px-4 py-3">Name</th>
<th className="px-4 py-3">Email</th>
<th className="px-4 py-3">Signed Up</th>
<th className="px-4 py-3">Actions</th>
</tr>
</thead>
<tbody>
{users.map(u=> (
<tr key={u.id} className="border-t">
<td className="px-4 py-3">{u.name}</td>
<td className="px-4 py-3">{u.email}</td>
<td className="px-4 py-3">{u.signedUp}</td>
<td className="px-4 py-3">
<button className="text-sm px-3 py-1 border rounded">View</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
)
}