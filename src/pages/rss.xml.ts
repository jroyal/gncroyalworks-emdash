import type { APIRoute } from "astro";
import { getEmDashCollection, getSiteSettings } from "emdash";

export const GET: APIRoute = async ({ site, url }) => {
	const siteUrl = site?.toString() || url.origin;
	const settings = await getSiteSettings();
	const siteTitle = settings?.title || "GNCRoyalWorks";
	const siteDescription =
		settings?.tagline || "Handmade leatherwork in Katy, Texas";

	const { entries: pieces } = await getEmDashCollection("pieces", {
		orderBy: { published_at: "desc" },
		limit: 20,
	});

	const items = pieces
		.map((piece) => {
			if (!piece.data.publishedAt) return null;
			const pubDate = piece.data.publishedAt.toUTCString();

			const pieceUrl = `${siteUrl}/finished-work/${piece.id}`;
			const title = escapeXml(piece.data.title || "Untitled");
			const description = escapeXml(piece.data.summary || "");

			return `    <item>
      <title>${title}</title>
      <link>${pieceUrl}</link>
      <guid isPermaLink="true">${pieceUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
		})
		.filter(Boolean)
		.join("\n");

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <description>${escapeXml(siteDescription)}</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};

const XML_ESCAPE_PATTERNS = [
	[/&/g, "&amp;"],
	[/</g, "&lt;"],
	[/>/g, "&gt;"],
	[/"/g, "&quot;"],
	[/'/g, "&apos;"],
] as const;

function escapeXml(str: string): string {
	let result = str;
	for (const [pattern, replacement] of XML_ESCAPE_PATTERNS) {
		result = result.replace(pattern, replacement);
	}
	return result;
}
