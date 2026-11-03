import { NextResponse, type NextRequest } from "next/server";
import { Query, Sku } from "../../../../lib/contracts";
import { loadPdp, UpstreamError } from "../../../../lib/pdp";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> },
) {
  const sku = Sku.safeParse((await params).sku);
  const query = Query.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!sku.success || !query.success)
    return NextResponse.json(
      { title: "Parâmetros inválidos", status: 400 },
      { status: 400 },
    );
  try {
    return NextResponse.json(await loadPdp(sku.data, query.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof UpstreamError ? error.status : 503;
    return NextResponse.json(
      { title: "Não foi possível carregar o produto", status },
      { status },
    );
  }
}
