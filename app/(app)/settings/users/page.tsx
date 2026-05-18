import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { USERS } from "@/lib/data/users";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="label">Platform</div>
        <h1 className="text-2xl font-semibold">Users</h1>
      </div>
      <Card>
        <CardHeader title="Team" action={<span className="chip">{USERS.length} active</span>} />
        <CardBody className="!p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted text-xs">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Team</th>
              </tr>
            </thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.email} className="border-b border-border last:border-0 hover:bg-panel2">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full grid place-items-center text-xs font-semibold"
                      style={{ background: `hsl(${u.avatarHue}, 50%, 22%)`, color: `hsl(${u.avatarHue}, 90%, 75%)` }}
                    >
                      {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    {u.name}
                  </td>
                  <td className="px-4 py-2 text-muted font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-2"><span className="chip">{u.role}</span></td>
                  <td className="px-4 py-2 text-muted">{u.team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
