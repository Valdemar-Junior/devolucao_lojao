import { NavLink } from "@/components/NavLink";
import { Package2 } from "lucide-react";

const linkClassName =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const activeClassName = "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary";

const AppHeader = () => (
  <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
      <NavLink to="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-foreground">
        <Package2 className="h-6 w-6 text-primary" />
        Lojão
      </NavLink>
      <nav className="flex items-center gap-1 overflow-x-auto">
        <NavLink to="/" end className={linkClassName} activeClassName={activeClassName}>
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
