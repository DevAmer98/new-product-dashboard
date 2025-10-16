import Link from 'next/link'


export default function Sidebar(){
return (
<aside className="w-64 h-screen sticky top-0 bg-white border-r p-4">
<div className="mb-8">
<h3 className="text-xl font-semibold">MyApp Admin</h3>
<p className="text-sm text-muted">Dashboard</p>
</div>


<nav className="space-y-2">
<Link href="#" className="block p-2 rounded hover:bg-gray-50">Overview</Link>
<Link href="/users" className="block p-2 rounded hover:bg-gray-50">Users</Link>
<Link href="/clients" className="block p-2 rounded hover:bg-gray-50">Clients</Link>
<Link href="/orders" className="block p-2 rounded hover:bg-gray-50">Orders</Link>
<Link href="/quotations" className="block p-2 rounded hover:bg-gray-50">Quotations</Link>
<Link href="#" className="block p-2 rounded hover:bg-gray-50">Tracking</Link>
<Link href="#" className="block p-2 rounded hover:bg-gray-50">Reports</Link>
</nav>


<div className="mt-8 text-sm text-muted">
<p>Version 0.1</p>
</div>
</aside>
)
}