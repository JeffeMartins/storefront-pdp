"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" className="notice">
      <h1>Uma pausa no som.</h1>
      <p>
        Não conseguimos consultar o catálogo agora. Tente novamente em
        instantes.
      </p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
