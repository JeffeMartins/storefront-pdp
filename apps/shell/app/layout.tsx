import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Aurora — Ouça o seu mundo",
  description:
    "Uma experiência de compra demonstrativa, com catálogo e avaliações reais de APIs autorais.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <div className="announcement">
          Feito para acompanhar o seu ritmo.{" "}
          <span>Conheça a coleção Aurora</span>
        </div>
        <header>
          <a href="/" className="brand" aria-label="Aurora, início">
            aurora<span>®</span>
          </a>
          <nav aria-label="Principal">
            <a href="/">Coleção</a>
            <a href="/p/FONE-BT-001/fone-bluetooth-aurora-grafite">
              Headphones
            </a>
            <a href="/#sobre">Sobre a Aurora</a>
          </nav>
          <span className="header-note">Design para o cotidiano ↗</span>
        </header>
        {children}
        <footer id="sobre">
          <a href="/" className="brand">
            aurora<span>®</span>
          </a>
          <p>Mais espaço para ouvir o que importa.</p>
          <small>
            Loja fictícia de portfólio · Sem compras ou pagamentos reais.
          </small>
        </footer>
      </body>
    </html>
  );
}
