export default function StatCard({ title, value }: { title: string; value: string }){
return (
<div className="bg-white p-4 rounded-lg shadow-sm border">
<p className="text-sm text-muted">{title}</p>
<div className="mt-2 text-2xl font-semibold">{value}</div>
</div>
)
}