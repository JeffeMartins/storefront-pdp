export default function Home() {
  return (
    <main id="conteudo">
      <section className="landing">
        <div>
          <span className="eyebrow">AURORA COLLECTION / 2026</span>
          <h1>
            O seu mundo.
            <br />
            Em outra
            <br />
            frequência.
          </h1>
          <p>
            Conforto que acompanha. Som que aproxima. Conheça o headphone feito
            para os seus melhores momentos.
          </p>
          <a
            className="buy"
            href="/p/FONE-BT-001/fone-bluetooth-aurora-grafite"
          >
            Descobrir o Aurora <span>↗</span>
          </a>
        </div>
        <div className="landing-art">
          <img
            src="/pdp-assets/products/aurora-graphite.svg"
            alt="Headphone Aurora na cor grafite"
            width="720"
            height="700"
          />
        </div>
      </section>
      <section className="landing-note">
        <span>01 / Design autoral e responsivo</span>
        <span>02 / Catálogo com preço por localidade</span>
        <span>03 / Avaliações reais da nossa API</span>
      </section>
    </main>
  );
}
