import Link from "next/link";
import { logoutAction } from "@/lib/actions";

export default function Shell({
  user,
  active,
  children
}: {
  user: { name: string; role: string };
  active: string;
  children: React.ReactNode;
}) {
  const clientLinks = [
    { href: "/dashboard", key: "dashboard", label: "Dashboard" },
    { href: "/checkin", key: "checkin", label: "Daily check-in" },
    { href: "/questionnaires", key: "questionnaires", label: "Questionnaires" },
    { href: "/documents", key: "documents", label: "My documents" }
  ];
  const coachLinks = [
    { href: "/coach", key: "coach", label: "Clients" },
    { href: "/questionnaires", key: "questionnaires", label: "Questionnaires" }
  ];
  const links = user.role === "COACH" ? coachLinks : clientLinks;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="leafmark" aria-hidden />
          Sprout
        </div>
        <nav aria-label="Main">
          {links.map((l) => (
            <Link key={l.key} href={l.href} className={active === l.key ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="spacer" />
        <div className="userchip">
          {user.name}
          <br />
          <span style={{ opacity: 0.7 }}>{user.role === "COACH" ? "Coach" : "Client"}</span>
        </div>
        <form action={logoutAction}>
          <button className="btn secondary small" style={{ marginLeft: "0.7rem", borderColor: "#889b82", color: "#cdd8c8" }}>
            Log out
          </button>
        </form>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
