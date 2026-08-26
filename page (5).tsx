import Link from "next/link";
import { registerAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="authwrap">
      <div className="authcard">
        <div className="brand">
          <span className="leafmark" aria-hidden /> Sprout
        </div>
        <div className="card">
          <h2>Create your client account</h2>
          {searchParams.error && <div className="alert error">{searchParams.error}</div>}
          <form action={registerAction}>
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" required autoComplete="name" />
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
            <label htmlFor="password">Password (8+ characters)</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            <button className="btn" style={{ width: "100%" }}>Create account</button>
          </form>
          <p className="small" style={{ marginTop: "1rem" }}>
            Already registered? <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
