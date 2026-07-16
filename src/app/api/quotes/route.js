import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer.js";
import { rowToQuote, quoteToRow } from "@/lib/quoteMapping.js";
import { validateQuote, normalizeQuote } from "@/lib/quotes.js";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(rowToQuote));
}

export async function POST(request) {
  const body = await request.json();
  const validationError = validateQuote(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const record = normalizeQuote(body);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert(quoteToRow(record))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToQuote(data), { status: 201 });
}

export async function DELETE() {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("quotes").delete().not("id", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
