import "server-only";
import { randomUUID } from "node:crypto";
import {
  Detail,
  Overview,
  type Context,
  type Ratings,
  type Pdp,
} from "./contracts";
export class UpstreamError extends Error {
  constructor(public status: number) {
    super("Upstream request failed");
  }
}
async function read(base: string, path: string, id: string) {
  const response = await fetch(new URL(path, base), {
    cache: "no-store",
    signal: AbortSignal.timeout(1800),
    headers: { "X-Request-ID": id },
  });
  if (!response.ok) throw new UpstreamError(response.status);
  return response.json();
}
export async function loadPdp(sku: string, context: Context): Promise<Pdp> {
  const id = randomUUID();
  const qs = new URLSearchParams({
    channel: context.channel,
    locationId: context.locationId,
  });
  const catalog = read(
    process.env.CATALOG_URL || "http://localhost:8081",
    `/api/v1/products/${encodeURIComponent(sku)}?${qs}`,
    id,
  );
  const reviews = read(
    process.env.RATINGS_URL || "http://localhost:8082",
    `/api/v1/products/by-sku/${encodeURIComponent(sku)}?page=${context.reviewPage}&size=${context.reviewSize}`,
    id,
  )
    .then((value) => {
      const data = Overview.parse(value);
      if (data.product.sku !== sku) throw new Error("Mismatched reviews SKU");
      return { status: "AVAILABLE", data } as Ratings;
    })
    .catch(
      (error) =>
        ({
          status:
            error instanceof UpstreamError && error.status === 404
              ? "NOT_REGISTERED"
              : "UNAVAILABLE",
          data: null,
        }) as Ratings,
    );
  // allSettled observes both promises even if the required catalog fails.
  const [productResult, ratingsResult] = await Promise.allSettled([
    catalog,
    reviews,
  ]);
  if (productResult.status === "rejected") {
    const error = productResult.reason;
    throw new UpstreamError(
      error instanceof UpstreamError && [400, 404].includes(error.status)
        ? error.status
        : 503,
    );
  }
  const product = Detail.parse(productResult.value);
  if (product.product.sku !== sku) throw new UpstreamError(503);
  const ratings =
    ratingsResult.status === "fulfilled"
      ? ratingsResult.value
      : ({ status: "UNAVAILABLE", data: null } as Ratings);
  return {
    ...product,
    ratings,
    degradedSections: ratings.status === "AVAILABLE" ? [] : ["ratings"],
  };
}
