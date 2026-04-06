import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-8 text-gray-600">Welcome to Tenrixa AI. Your account is active.</p>
      
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-blue-800">Plan: Free Trial</h2>
          <p className="text-blue-600 text-sm">3 Credits Remaining</p>
        </div>
        <Link 
          href="/pricing" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
