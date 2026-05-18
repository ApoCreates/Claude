import { redirect } from "next/navigation";
import { setSession, demoCredentials, currentUser } from "@/lib/auth";

export default function LoginPage() {
  if (currentUser()) redirect("/dashboard");
  const creds = demoCredentials();

  async function loginAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim();
    if (!email) return;
    setSession(email);
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-md card">
        <div className="card-hd">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand text-brand-fg grid place-items-center text-sm font-bold">P</div>
            <div className="font-semibold">Pulse — F&amp;B CI</div>
          </div>
          <span className="chip">Demo</span>
        </div>
        <div className="card-bd space-y-4">
          <p className="text-sm text-muted">
            Sign in with a demo account. No password is required — this is a UI prototype with dummy data.
          </p>
          <form action={loginAction} className="space-y-3">
            <div>
              <div className="label mb-1">Email</div>
              <input name="email" required placeholder="ceo@demo.fnb" className="input" />
            </div>
            <button type="submit" className="btn btn-primary w-full justify-center">Sign in</button>
          </form>
          <div>
            <div className="label mb-2">Demo accounts</div>
            <div className="grid grid-cols-1 gap-1.5">
              {creds.map((c) => (
                <form key={c.email} action={loginAction}>
                  <input type="hidden" name="email" value={c.email} />
                  <button type="submit" className="w-full text-left px-3 py-2 rounded-md border border-border bg-panel2 hover:bg-border transition flex items-center justify-between">
                    <span className="text-sm">{c.name}</span>
                    <span className="text-xs text-muted">{c.role} · {c.email}</span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
