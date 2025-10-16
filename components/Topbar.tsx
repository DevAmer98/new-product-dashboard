export default function Topbar(){
return (
<header className="flex items-center justify-between">
<div className="flex items-center gap-4">
<button className="p-2 rounded bg-white border">☰</button>
<div>
<h3 className="text-lg font-semibold">Dashboard</h3>
<p className="text-sm text-muted">Welcome back</p>
</div>
</div>


<div className="flex items-center gap-4">
<input className="border rounded px-3 py-1" placeholder="Search users, orders..." />
<div className="flex items-center gap-3">
<div className="rounded-full bg-gray-200 h-9 w-9 flex items-center justify-center">A</div>
</div>
</div>
</header>
)
}