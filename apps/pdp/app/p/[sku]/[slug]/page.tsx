import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Query, Sku } from "../../../../lib/contracts";
import { loadPdp, UpstreamError } from "../../../../lib/pdp";
import Product from "../../../../components/Product";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ sku: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sku, slug } = await params;
  return {
    title: `Aurora · ${sku}`,
    alternates: {
      canonical: `/p/${encodeURIComponent(sku)}/${encodeURIComponent(slug)}`,
    },
    robots: { index: false, follow: false },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { sku, slug } = await params;
  const parsed = Sku.safeParse(sku);
  if (!parsed.success) notFound();
  const context = Query.safeParse(await searchParams);
  if (!context.success)
    return (
      <main id="conteudo" className="notice">
        <h1>Seleção inválida</h1>
        <a href={`/p/${sku}/${slug}`}>Voltar ao produto</a>
      </main>
    );
  let data;
  try {
    data = await loadPdp(parsed.data, context.data);
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404) notFound();
    throw error;
  }
  if (slug !== data.product.slug)
    redirect(
      `/p/${sku}/${data.product.slug}?${new URLSearchParams(Object.entries(context.data).map(([k, v]) => [k, String(v)]))}`,
    );
  const structured = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.product.name,
    sku: data.product.sku,
    description: data.product.description,
    brand: { "@type": "Brand", name: data.product.brand },
    ...(data.offer.status === "AVAILABLE" && data.offer.price
      ? {
          offers: {
            "@type": "Offer",
            price: data.offer.price,
            priceCurrency: "BRL",
            availability: `https://schema.org/${data.availability.status === "IN_STOCK" ? "InStock" : "OutOfStock"}`,
          },
        }
      : {}),
    ...(data.ratings.status === "AVAILABLE" &&
    data.ratings.data.summary.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: data.ratings.data.summary.averageRating,
            reviewCount: data.ratings.data.summary.totalReviews,
          },
        }
      : {}),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\u003c"),
        }}
      />
      <Product initial={data} initialContext={context.data} />
    </>
  );
}
