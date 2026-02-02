"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Direkt dashboard'a yönlendir - login kontrolü yok
    router.push("/dashboard");
  }, [router]);

  return null;
}
