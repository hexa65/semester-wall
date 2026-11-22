import { NavLink } from "react-router";
import { useLogout, useMe } from "../../hooks/useAuth";
import { APP_NAME } from "../../lib/constants";

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Today", end: true },
  { to: "/calendar", label: "Calendar" },
  { to: "/deadlines", label: "Deadlines" },
  { to: "/courses", label: "Courses" },
  { to: "/timetable", label: "Timetable" },
];

export function Header() {
  const me = useMe();
  const logout = useLogout();
  return (
    <header className="border-t-8 border-ink border-b-2 bg-sheet">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
        <p className="font-display text-2xl font-bold">{APP_NAME}</p>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-x-1">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center px-3 font-semibold hover:bg-pin-soft ${
                      isActive ? "border-b-4 border-pin" : "border-b-4 border-transparent"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {me.data ? <span className="max-w-[12rem] truncate" title={me.data.email}>Signed in as {me.data.name || me.data.email}</span> : null}
          <button
            type="button"
            onClick={logout}
            className="min-h-11 min-w-11 cursor-pointer border-2 border-ink px-3 font-semibold hover:bg-pin-soft"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
