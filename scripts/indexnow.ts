
import { config } from "dotenv";

config({ path: ".env.local" });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agnxi.com";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

if (!INDEXNOW_KEY) {
    throw new Error("INDEXNOW_KEY environment variable is not set");
}

async function main() {
    console.log(`🚀 Starting IndexNow submission for ${SITE_URL}`);

    try {
        // 1. Fetch URLs from sitemap
        console.log("Fetching sitemap...");
        const sitemapRes = await fetch(`${SITE_URL}/sitemap.xml`);
        if (!sitemapRes.ok) throw new Error("Failed to fetch sitemap");

        const sitemapText = await sitemapRes.text();
        const urls = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

        if (urls.length === 0) {
            console.log("No URLs found in sitemap.");
            return;
        }

        console.log(`Found ${urls.length} URLs.`);

        // 2. Submit to IndexNow
        const response = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                host: new URL(SITE_URL).hostname,
                key: INDEXNOW_KEY,
                keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
                urlList: urls.slice(0, 10000) // Limit per request
            })
        });

        if (response.ok) {
            console.log("✅ IndexNow submission successful!");
        } else {
            console.error("❌ Submission failed:", response.status, await response.text());
        }

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

main();
