import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

import type { PokemonRecord } from "../types/pokemon.js";
import { parseOptionalNumber, parseOptionalString } from "../utils/normalize.js";

type CsvRow = Record<string, string>;

const CSV_FILE = path.resolve(process.cwd(), "src/data/pokemon.csv");

let cache: PokemonRecord[] | null = null;

export const loadPokemon = (): PokemonRecord[] => {
	if (cache) {
		return cache;
	}

	const raw = fs.readFileSync(CSV_FILE, "utf8");
	const rows = parse(raw, {
		columns: true,
		skip_empty_lines: true,
		trim: true
	}) as CsvRow[];

	cache = rows
		.map((row) => {
			const id = parseOptionalNumber(row.id);
			const pokemon = parseOptionalString(row.pokemon);
			if (id === null || pokemon === null) {
				return null;
			}
			return {
				id,
				pokemon,
				evolves_from_species_id: parseOptionalNumber(row.evolves_from_species_id),
				evolution_chain_id: parseOptionalNumber(row.evolution_chain_id),
				hp: parseOptionalNumber(row.hp),
				attack: parseOptionalNumber(row.attack),
				defense: parseOptionalNumber(row.defense),
				special_attack: parseOptionalNumber(row.special_attack),
				special_defense: parseOptionalNumber(row.special_defense),
				speed: parseOptionalNumber(row.speed),
				type_1: parseOptionalString(row.type_1),
				type_2: parseOptionalString(row.type_2),
				ability_1: parseOptionalString(row.ability_1),
				ability_2: parseOptionalString(row.ability_2),
				ability_hidden: parseOptionalString(row.ability_hidden)
			} satisfies PokemonRecord;
		})
		.filter((item): item is PokemonRecord => item !== null);

	return cache;
};