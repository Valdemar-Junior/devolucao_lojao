import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const linkClassName =
  "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.97]";
const activeClassName =
  "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_6px_16px_-6px_hsl(357_84%_45%/0.7)] hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 hover:text-white";

const AppHeader = () => (
  <header className="sticky top-0 z-40 border-b border-border/70 bg-white/80 backdrop-blur-xl">
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
      <NavLink
        to="/"
        className="group flex shrink-0 items-center gap-2.5"
      >
        <img
          src="/LOGONEW_20.png"
          alt="Lojão dos Móveis"
          className="h-9 w-auto drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        />
        <span className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">
          Devoluções &amp; Penalidades
        </span>
      </NavLink>

      <nav className="flex items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-white/70 p-1 shadow-sm">
        <NavLink to="/" end className={cn(linkClassName)} activeClassName={activeClassName}>
          Nova Solicitação
        </NavLink>
        <NavLink to="/solicitacoes" className={linkClassName} activeClassName={activeClassName}>
          Solicitações
        </NavLink>
        <NavLink to="/penalidades" className={linkClassName} activeClassName={activeClassName}>
          Penalidades
        </NavLink>
        <NavLink to="/configuracoes" className={linkClassName} activeClassName={activeClassName}>
          Configurações
        </NavLink>
      </nav>
    </div>
  </header>
);

export default AppHeader;
