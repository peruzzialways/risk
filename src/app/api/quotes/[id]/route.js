import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer.js";
import { rowToQuote, quoteToRow } from "@/lib/quoteMapping.js";
import { validateQuote, normalizeQuote } from "@/lib/quotes.js";

const notFoundOr500 = (error) =>
  NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });

export async function PATCH(request, { params }) {
  const { id } = params;
  const body = await request.json();

  // A full edit-form save includes `insured`; partial patches (status toggle,
  // comment edit) don't, and skip full-record validation.
  let patch = body;
  if (body.insured !== undefined) {
    const validationError = validateQuote(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    patch = normalizeQuote(body);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .update(quoteToRow(patch))
    .eq("id", id)
    .select()
    .single();

  if (error) return notFoundOr500(error);
  return NextResponse.json(rowToQuote(data));
}

export async function DELETE(request, { params }) {
  const { id } = params;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
