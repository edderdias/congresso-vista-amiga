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
import Groups from "./pages/Groups";
import Cleaning from "./pages/Cleaning";
import School from "./pages/School";
import Publishers from "./pages/Publishers";
import Auth from "./pages/Auth";
import PublicReport from "./pages/PublicReport";
import Meetings from "./pages/Meetings";
import AudioVideo from "./pages/AudioVideo";
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
          <Route path="/relatorio-publico" element={<PublicReport />} />
          <Route path="/relatorio-publico/:groupNumber" element={<PublicReport />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/groups" element={<Layout><Groups /></Layout>} />
          <Route path="/publishers" element={<Layout><Publishers /></Layout>} />
          <Route path="/meetings" element={<Layout><Meetings /></Layout>} />
          <Route path="/audio-video" element={<Layout><AudioVideo /></Layout>} />
          <Route path="/cleaning" element={<Layout><Cleaning /></Layout>} />
          <Route path="/designations" element={<Layout><Designations /></Layout>} />
          <Route path="/school" element={<Layout><School /></Layout>} />
          <Route path="/territories" element={<Layout><Territories /></Layout>} />
          <Route path="/users" element={<Layout><Users /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;