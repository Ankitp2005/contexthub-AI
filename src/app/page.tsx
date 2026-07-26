import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";

export default async function Home() {
  const { userId } = await auth();

  // Logged-in users go straight to the real functional dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return <HomeClient userId={null} />;
}

