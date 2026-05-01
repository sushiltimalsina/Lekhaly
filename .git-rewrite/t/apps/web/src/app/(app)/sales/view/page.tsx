"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SalesViewRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/sales");
    }, [router]);

    return null;
}
