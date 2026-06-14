import { auth } from "@clerk/nextjs/server";
import HomeClient from "./HomeClient";

export default async function Home() {
  const { userId } = await auth();

  return <HomeClient userId={userId} />;
}

