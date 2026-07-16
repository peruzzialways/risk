import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer.js";
import { rowToQuote, quoteToRow } from "@/lib/quoteMapping.js";
import { sampleRowsForInsert } from "@/lib/constants.js";

export async function POST() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert(sampleRowsForInsert().map(quoteToRow))
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(rowToQuote));
}
