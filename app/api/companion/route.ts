import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { src, name, description, instructions, seed, categoryId } = body;
    const userId = "0"; // Replace with actual user logic if needed

    if (!src || !name || !description || !instructions || !seed || !categoryId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('companions')
      .insert([{
        category_id: categoryId,
        user_id: userId,
        user_name: "User",
        src,
        name,
        description,
        instructions,
        seed,
      }])
      .select()
      .single();

    if (error) {
      console.log("Supabase error:", error);
      return new NextResponse("Database Error", { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.log("create companion error: " + error)
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error("Supabase error:", error);
      return new NextResponse("Database Error", { status: 500 });
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    console.error("Fetch categories error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
