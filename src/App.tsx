import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Designations from "./pages/Designations";
import Territories from "./pages/Territories";
import Users from "./pages/Users";
import Groups from "./pages/Groups"; // New import
import Cleaning from "./pages/Cleaning"; // New import
import School from "./pages/School"; // New import
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/groups" element={<Layout><Groups /></Layout>} /> {/* New route */}
          <Route path="/cleaning" element={<Layout><Cleaning /></Layout>} /> {/* New route */}
          <Route path="/designations" element={<Layout><Designations /></Layout>} />
          <Route path="/school" element={<Layout><School /></Layout>} /> {/* New route */}
          <Route path="/territories" element={<Layout><Territories /></Layout>} />
          <Route path="/users" element={<Layout><Users /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;