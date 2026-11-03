import { z } from "zod";
const sku = z.string().regex(/^[A-Z0-9][A-Z0-9._-]{0,63}$/);
export const Query = z.object({
  channel: z.enum(["WEB", "PICKUP"]).default("WEB"),
  locationId: z
    .string()
    .regex(/^[A-Z0-9-]{1,40}$/)
    .default("CD-DEMO-01"),
  reviewPage: z.coerce.number().int().min(0).max(10000).default(0),
  reviewSize: z.coerce.number().int().min(1).max(20).default(5),
});
export const Sku = sku;
const decimal = z.string().regex(/^\d{1,10}\.\d{2}$/);
export const Detail = z.object({
  product: z.object({
    sku,
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string(),
    description: z.string(),
    brand: z.string(),
    category: z.string(),
    images: z.array(
      z.object({
        src: z.string().regex(/^\/pdp-assets\/products\/[a-z0-9-]+\.svg$/),
        alt: z.string(),
      }),
    ),
    attributes: z.array(z.object({ name: z.string(), value: z.string() })),
    variants: z.array(
      z.object({
        sku,
        slug: z.string().regex(/^[a-z0-9-]+$/),
        label: z.string(),
        color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
      }),
    ),
  }),
  offer: z.object({
    status: z.enum(["AVAILABLE", "UNAVAILABLE"]),
    currency: z.literal("BRL"),
    listPrice: decimal.nullable(),
    price: decimal.nullable(),
    channel: z.enum(["WEB", "PICKUP"]),
    locationId: z.string(),
    updatedAt: z.string().nullable(),
  }),
  availability: z.object({
    status: z.enum(["IN_STOCK", "OUT_OF_STOCK", "UNAVAILABLE"]),
    quantity: z.number().int().nonnegative(),
    updatedAt: z.string().nullable(),
  }),
});
export const Overview = z.object({
  product: z.object({ sku }),
  summary: z.object({
    totalReviews: z.number().int().nonnegative(),
    averageRating: z.number().min(0).max(5),
  }),
  reviews: z.object({
    content: z.array(
      z.object({
        id: z.string(),
        author: z.string(),
        rating: z.number().int().min(1).max(5),
        title: z.string(),
        content: z.string(),
        createdAt: z.string(),
      }),
    ),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
export type Context = z.infer<typeof Query>;
export type ProductDetail = z.infer<typeof Detail>;
export type Reviews = z.infer<typeof Overview>;
export type Ratings =
  | { status: "AVAILABLE"; data: Reviews }
  | { status: "UNAVAILABLE" | "NOT_REGISTERED"; data: null };
export type Pdp = ProductDetail & {
  ratings: Ratings;
  degradedSections: string[];
};
