import { redirect } from "next/navigation";
import { createClient } from '@supabase/supabase-js';

import { CompanionForm } from "./components/companion-form";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CompanionIdPageProps {
  params: {
    companionId: string;
  };
}

const CompanionIdPage = async ({
  params
}: CompanionIdPageProps) => {
  const userId = "test-user";

  if (!userId) {
    return redirect("/sign-in");
  }

  // For "new" companion, don't try to fetch existing data
  let companion = null;
  if (params.companionId !== "new") {
    const { data } = await supabase
      .from('companions')
      .select('*')
      .eq('id', params.companionId)
      .eq('user_id', userId)
      .single();
    
    companion = data;
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return ( 
    <CompanionForm initialData={companion} categories={categories || []} />
  );
}
 
export default CompanionIdPage;
