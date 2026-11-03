"use client";
import { useRef, useState, useEffect } from "react";
import type { Pdp, Context } from "../lib/contracts";
const money = (v: string | null) =>
  v === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(v));
const display: Record<string, string> = {
  "demo-ana": "Ana M.",
  "demo-bruno": "Bruno S.",
  "demo-carla": "Carla R.",
  "demo-diego": "Diego P.",
  "demo-elisa": "Elisa C.",
};
export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span
      className="rating"
      aria-label={`${value.toLocaleString("pt-BR")} de 5 estrelas${count === undefined ? "" : `, ${count} avaliações`}`}
    >
      <span className="stars" aria-hidden="true">
        <span>★★★★★</span>
        <span style={{ width: `${(value / 5) * 100}%` }}>★★★★★</span>
      </span>
      <strong>{value.toLocaleString("pt-BR")}</strong>
      {count !== undefined && (
        <span className="review-count">({count} avaliações)</span>
      )}
    </span>
  );
}
export default function Product({
  initial,
  initialContext,
}: {
  initial: Pdp;
  initialContext: Context;
}) {
  const [data, setData] = useState(initial);
  const [context, setContext] = useState(initialContext);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function update(next: Context) {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setPending(true);
    setError("");
    setAdded(false);
    try {
      const qs = new URLSearchParams(
        Object.entries(next).map(([k, v]) => [k, String(v)]),
      );
      const response = await fetch(`/api/pdp/${data.product.sku}?${qs}`, {
        signal: active.signal,
      });
      if (!response.ok)
        throw new Error(
          "Não foi possível atualizar. Sua seleção anterior foi mantida.",
        );
      const result: Pdp = await response.json();
      if (active.signal.aborted) return;
      setData(result);
      setContext(next);
      window.history.replaceState(null, "", `?${qs}`);
    } catch (e) {
      if (!active.signal.aborted)
        setError(e instanceof Error ? e.message : "Falha ao atualizar.");
    } finally {
      if (!active.signal.aborted) setPending(false);
    }
  }
  const { product, offer, availability, ratings } = data;
  const available =
    availability.status === "IN_STOCK" && offer.status === "AVAILABLE";
  const current = product.variants.find((v) => v.sku === product.sku);
  const discount =
    offer.price && offer.listPrice
      ? Math.round((1 - Number(offer.price) / Number(offer.listPrice)) * 100)
      : 0;
  return (
    <main id="conteudo">
      <div className="breadcrumb">
        <a href="/">Início</a>
        <span>/</span>
        <a href="/">Áudio</a>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <div className="product-layout">
        <section className="gallery" aria-label="Galeria do produto">
          <div className="gallery-top">
            <span className="pill">ESCUTE. SINTA. REPITA.</span>
            <span className="edition">AURORA / 01</span>
          </div>
          <img
            className="hero-product"
            src={product.images[0]?.src}
            alt={product.images[0]?.alt || product.name}
            width="720"
            height="700"
            fetchPriority="high"
          />
          <div className="gallery-bottom">
            <span>Projetado para o seu mundo.</span>
            <span>01 — 03</span>
          </div>
        </section>
        <section className="product-info" aria-busy={pending}>
          <div className="eyebrow">ÁUDIO SEM FIO · AURORA COLLECTION</div>
          <h1>{product.name}</h1>
          <p className="intro">O mundo lá fora. O seu som aqui dentro.</p>
          {ratings.status === "AVAILABLE" ? (
            <a className="rating-link" href="#avaliacoes">
              <Stars
                value={ratings.data.summary.averageRating}
                count={ratings.data.summary.totalReviews}
              />
            </a>
          ) : (
            <p className="muted">
              {ratings.status === "NOT_REGISTERED"
                ? "Avaliações ainda não cadastradas."
                : "Avaliações temporariamente indisponíveis."}
            </p>
          )}
          <div className="price-block">
            {discount > 0 && (
              <div>
                <s>{money(offer.listPrice)}</s>
                <span className="discount">−{discount}%</span>
              </div>
            )}
            <div className="price" data-testid="price">
              {offer.status === "AVAILABLE"
                ? money(offer.price)
                : "Preço indisponível"}
            </div>
            <span className="muted">
              Preço demonstrativo · Sem cobrança real
            </span>
          </div>
          <div className="color-label">
            Cor <strong>{current?.label}</strong>
          </div>
          <div className="swatches">
            {product.variants.map((v) => (
              <a
                key={v.sku}
                className={`swatch ${v.sku === product.sku ? "selected" : ""}`}
                href={`/p/${v.sku}/${v.slug}`}
                aria-label={`Cor ${v.label}`}
                aria-current={v.sku === product.sku ? "page" : undefined}
              >
                <span style={{ backgroundColor: v.color }} />
              </a>
            ))}
          </div>
          <label className="location-label" htmlFor="local">
            Como você quer receber?
          </label>
          <select
            id="local"
            value={context.locationId}
            disabled={pending}
            onChange={(e) =>
              update({
                ...context,
                locationId: e.target.value,
                channel: e.target.value === "CD-DEMO-01" ? "WEB" : "PICKUP",
              })
            }
          >
            <option value="CD-DEMO-01">Entrega em casa · CD Aurora</option>
            <option value="LOJA-CENTRO">Retirada · Centro</option>
            <option value="LOJA-PAULISTA">Retirada · Paulista</option>
          </select>
          <p className={`stock ${!available ? "unavailable" : ""}`}>
            {pending
              ? "Atualizando preço e disponibilidade…"
              : available
                ? "● Disponível no local selecionado"
                : availability.status === "OUT_OF_STOCK"
                  ? "● Esgotado neste local"
                  : "● Disponibilidade não confirmada"}
          </p>
          <button
            className="buy"
            disabled={!available || pending}
            onClick={() => setAdded(true)}
          >
            {available ? "Adicionar à sacola demo" : "Produto indisponível"}
            <span aria-hidden="true">↗</span>
          </button>
          <p className="demo-note" role="status">
            {added
              ? "Adicionado à sacola demonstrativa. Nenhum pedido foi criado."
              : "Demonstração de portfólio. Não realizamos vendas."}
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="perks">
            <span>
              ↺ <strong>Design durável</strong>
              <small>Feito para acompanhar você</small>
            </span>
            <span>
              ◇ <strong>Som sem limites</strong>
              <small>Até 40 horas de autonomia</small>
            </span>
          </div>
          <small className="sku">SKU {product.sku}</small>
        </section>
      </div>
      <section className="story">
        <div>
          <span className="eyebrow">MENOS RUÍDO. MAIS VOCÊ.</span>
          <h2>
            Encontre a sua
            <br />
            própria frequência.
          </h2>
        </div>
        <div>
          <p>{product.description}</p>
          <dl>
            {product.attributes.map((a) => (
              <div key={a.name}>
                <dt>{a.name}</dt>
                <dd>{a.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section id="avaliacoes" className="reviews">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPERIÊNCIAS QUE CONECTAM</span>
            <h2>Quem ouve, conta.</h2>
          </div>
          <span className="pill">AVALIAÇÕES DA NOSSA API</span>
        </div>
        {ratings.status === "AVAILABLE" ? (
          <div className="reviews-layout">
            <aside>
              {ratings.data.summary.totalReviews > 0 ? (
                <>
                  <div className="big-rating">
                    {ratings.data.summary.averageRating.toLocaleString("pt-BR")}
                  </div>
                  <Stars value={ratings.data.summary.averageRating} />
                  <p>
                    {ratings.data.summary.totalReviews} avaliações de
                    demonstração
                  </p>
                  <small>
                    Autores fictícios. Notas e comentários
                    <br />
                    persistidos na API de avaliações.
                  </small>
                </>
              ) : (
                <p>Este produto ainda não tem avaliações.</p>
              )}
            </aside>
            <div className="review-list">
              {ratings.data.reviews.content.map((r) => (
                <article className="review" key={r.id} data-testid="review">
                  <div className="review-meta">
                    <span className="avatar">
                      {(display[r.author] || r.author).slice(0, 1)}
                    </span>
                    <strong>{display[r.author] || r.author}</strong>
                    <span className="demo-badge">Demo</span>
                    <time dateTime={r.createdAt}>
                      {new Date(r.createdAt).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </time>
                  </div>
                  <Stars value={r.rating} />
                  <h3>{r.title}</h3>
                  <p>{r.content}</p>
                </article>
              ))}
              {ratings.data.reviews.totalPages > 1 && (
                <nav className="pagination" aria-label="Páginas de avaliações">
                  <button
                    disabled={pending || context.reviewPage === 0}
                    onClick={() =>
                      update({ ...context, reviewPage: context.reviewPage - 1 })
                    }
                  >
                    Anterior
                  </button>
                  <span>
                    Página {context.reviewPage + 1} de{" "}
                    {ratings.data.reviews.totalPages}
                  </span>
                  <button
                    disabled={
                      pending ||
                      context.reviewPage + 1 >= ratings.data.reviews.totalPages
                    }
                    onClick={() =>
                      update({ ...context, reviewPage: context.reviewPage + 1 })
                    }
                  >
                    Próxima
                  </button>
                </nav>
              )}
            </div>
          </div>
        ) : (
          <div className="review-empty">
            <h3>
              {ratings.status === "NOT_REGISTERED"
                ? "As primeiras histórias chegam em breve."
                : "As avaliações estão fazendo uma pausa."}
            </h3>
            <p>
              {ratings.status === "NOT_REGISTERED"
                ? "Este SKU ainda não foi cadastrado na API de avaliações."
                : "O produto continua disponível. Tente carregar as avaliações novamente em instantes."}
            </p>
            <button onClick={() => update(context)} disabled={pending}>
              Tentar novamente
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
