import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; // <--- Importação da biblioteca de notificações

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Supples | Gestão de Loja",
  description: "Sistema completo para gestão de lojas de suplementos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        
        {/* Conteúdo principal da página (Login, Dashboard, etc.) */}
        {children}

        {/* Configuração das Notificações (Sonner):
            - position: Onde aparece (Canto superior direito)
            - richColors: Verde para sucesso, Vermelho para erro
            - theme: Escuro para combinar com o site
            - closeButton: Botão de fechar no card
        */}
        <Toaster 
          position="top-right" 
          richColors 
          theme="dark" 
          closeButton 
        />
        
      </body>
    </html>
  );
}