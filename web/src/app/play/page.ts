import { createClient } from "@/lib/supabase";
import { headers } from "next/headers";

export const revalidate = 0;

export default async function PlayPage() {
  const headersList = headers();
  const supabase = createClient();

  const { data: programCode } = await supabase
    .from("program_code")
    .select("code")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!programCode) {
    return <div>No program code found</div>;
  }

  return <div dangerouslySetInnerHTML={{ __html: programCode.code }} />;
}
