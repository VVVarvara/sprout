import Link from "next/link";
import { loginAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="authwrap">
      <div className="authcard">
        <div className="brand">
          <span className="leafmark" aria-hidden /> Sprout
        </div>
        <p className="muted" style={{ textAlign: "center", marginBottom: "1rem" }}>
          Nutrition &amp; lifestyle coaching
        </p>
        <div className="card">
          <h2>Log in</h2>
          {searchParams.error && <div className="alert error">{searchParams.error}</div>}
          <form action={loginAction}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
            <button className="btn" style={{ width: "100%" }}>Log in</button>
          </form>
          <p className="small" style={{ marginTop: "1rem" }}>
            New client? <Link href="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
