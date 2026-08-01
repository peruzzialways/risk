import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer.js";
import { rowToQuote, quoteToRow } from "@/lib/quoteMapping.js";
import { validateQuote, normalizeQuote } from "@/lib/quotes.js";
import { getUnit } from "@/lib/units.js";

export async function GET(request, { params }) {
  const { unit } = params;
  if (!getUnit(unit)) return NextResponse.json({ error: "Unknown unit" }, { status: 404 });

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("unit", unit)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(rowToQuote));
}

export async function POST(request, { params }) {
  const { unit } = params;
  if (!getUnit(unit)) return NextResponse.json({ error: "Unknown unit" }, { status: 404 });

  const body = await request.json();
  const validationError = validateQuote(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const record = normalizeQuote(body);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert({ ...quoteToRow(record), unit })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rowToQuote(data), { status: 201 });
}

export async function DELETE(request, { params }) {
  const { unit } = params;
  if (!getUnit(unit)) return NextResponse.json({ error: "Unknown unit" }, { status: 404 });

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("quotes").delete().eq("unit", unit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
