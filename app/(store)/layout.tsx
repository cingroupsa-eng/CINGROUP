import { getCategories, getSettings } from "@/lib/data";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { StoreProvider } from "@/components/store/StoreContext";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { MobileMenu } from "@/components/store/MobileMenu";
import { BottomNav } from "@/components/store/BottomNav";
import { SearchOverlay } from "@/components/store/SearchOverlay";
import { WhatsAppFloat } from "@/components/store/WhatsAppFloat";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <StoreProvider settings={settings} categories={categories}>
      <CartProvider>
        <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-skip focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" className="min-h-[60vh]">
          {children}
        </main>
        <Footer settings={settings} categories={categories} />
        <BottomNav />
        <WhatsAppFloat />
        <MobileMenu />
        <SearchOverlay />
        <CartDrawer />
      </CartProvider>
    </StoreProvider>
  );
}
