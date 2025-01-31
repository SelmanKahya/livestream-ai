import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const iterationId = searchParams.get("iterationId");

    let query = supabaseAdmin.from("program_code").select("code");

    if (iterationId) {
      query = query.eq("id", iterationId);
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.limit(1).single();

    if (error) {
      console.error("Error fetching program code:", error);
      return NextResponse.json(
        { error: "Failed to fetch program code" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No program code found" },
        { status: 404 }
      );
    }

    // Return the HTML content with appropriate headers
    return new NextResponse(data.code, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
