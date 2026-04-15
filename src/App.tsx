import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index.tsx";
import Order from "./pages/Order.tsx";
import CheckoutReturn from "./pages/CheckoutReturn.tsx";
import NotFound from "./pages/NotFound.tsx";
import TermsAndConditions from "./pages/TermsAndConditions.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/order" element={<Order />} />
            <Route path="/checkout/return" element={<CheckoutReturn />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
