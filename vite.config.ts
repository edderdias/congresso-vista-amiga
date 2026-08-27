import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const SUPABASE_HOST = "ssivgaugwfsltmqtojwz.supabase.co";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // "prompt": avisa o usuário e só atualiza quando ele confirmar
      // (evita recarregar a página no meio do preenchimento de um formulário)
      registerType: "prompt",
      pwaAssets: {
        image: "public/logo.svg",
        // Fundo verde no preenchimento dos ícones maskable/apple (evita cantos brancos)
        preset: {
          transparent: {
            sizes: [64, 192, 512],
            favicons: [[48, "favicon.ico"]],
          },
          maskable: {
            sizes: [512],
            padding: 0.2,
            resizeOptions: { background: "#16a34a" },
          },
          apple: {
            sizes: [180],
            padding: 0.12,
            resizeOptions: { background: "#16a34a" },
          },
        },
      },
      manifest: {
        name: "Sistema da Congregação",
        short_name: "Congregação",
        description: "Gerencie sua congregação de forma eficiente",
        lang: "pt-BR",
        theme_color: "#16a34a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // A imagem de apresentação (2 MB) não precisa ficar em cache
        globIgnores: ["**/sistema da congregação.png"],
        // SPA: rotas do cliente caem no index.html
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Nunca servir dados do Supabase a partir do cache
            urlPattern: ({ url }) => url.hostname === SUPABASE_HOST,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
