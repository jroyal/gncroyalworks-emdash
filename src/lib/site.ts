import type { TaxonomyTerm } from "emdash";

export const ETSY_SHOP_URL = "https://www.etsy.com/shop/GNCRoyalWorks";

export function flattenTerms(terms?: TaxonomyTerm[] | null): TaxonomyTerm[] {
	if (!terms) return [];
	return terms.flatMap((term) => [term, ...flattenTerms(term.children)]);
}

export function getTermLabels(terms?: TaxonomyTerm[] | null): string[] {
	return (terms ?? []).map((term) => term.label);
}

export function getPrimaryTermLabel(
	terms?: TaxonomyTerm[] | null,
): string | null {
	return terms?.[0]?.label ?? null;
}
