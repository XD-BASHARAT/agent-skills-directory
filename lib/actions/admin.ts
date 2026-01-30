"use server"

import { checkAdminAuth } from "@/lib/auth"
import { env } from "@/lib/env"

export async function pingIndexNow() {
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) throw new Error("Unauthorized");

    const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agnxi.com";
    
    if (!env.INDEXNOW_KEY) {
        throw new Error("INDEXNOW_KEY environment variable is not set");
    }

    try {
        const sitemapRes = await fetch(`${SITE_URL}/sitemap.xml`);
        if (!sitemapRes.ok) throw new Error("Failed to fetch sitemap");

        const sitemapText = await sitemapRes.text();
        const urls = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

        if (urls.length === 0) return { success: false, message: "No URLs found" };

        const response = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                host: new URL(SITE_URL).hostname,
                key: env.INDEXNOW_KEY,
                keyLocation: `${SITE_URL}/${env.INDEXNOW_KEY}.txt`,
                urlList: urls.slice(0, 10000)
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`IndexNow failed: ${response.status} ${errorText}`);
        }

        return { success: true, count: urls.length };
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
}
