import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import SenhaGate from "./components/SenhaGate";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Configuracoes from "./pages/Configuracoes";
import Penalidades from "./pages/Penalidades";
import Solicitacoes from "./pages/Solicitacoes";

const queryClient = new QueryClient();

const AppLayout = () => (
  <div className="min-h-screen">
    <div className="h-1 w-full bg-gradient-to-r from-red-700 via-rose-500 to-amber-400" />
    <AppHeader />
    <Outlet />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/solicitacoes" element={<Solicitacoes />} />
            <Route
              path="/penalidades"
              element={
                <SenhaGate>
                  <Penalidades />
                </SenhaGate>
              }
            />
            <Route path="/vendedores" element={<Navigate to="/penalidades" replace />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
