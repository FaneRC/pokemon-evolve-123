export const normalizeName = (value: string): string => {
	return value
		.normalize("NFKD")
		.replace(/[^a-zA-Z0-9\s-]/g, "")
		.replace(/[_-]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();
};

export const parseOptionalNumber = (value: string | undefined): number | null => {
	if (value === undefined) {
		return null;
	}
	const normalized = value.trim();
	if (!normalized || normalized.toUpperCase() === "NA") {
		return null;
	}
	const result = Number(normalized);
	return Number.isFinite(result) ? result : null;
};

export const parseOptionalString = (value: string | undefined): string | null => {
	if (value === undefined) {
		return null;
	}
	const normalized = value.trim();
	if (!normalized || normalized.toUpperCase() === "NA") {
		return null;
	}
	return normalized;
};

export const toDisplayValue = (value: number | null): string => {
	return value === null ? "NA" : `${value}`;
};