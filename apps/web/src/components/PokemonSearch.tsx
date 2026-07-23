import { useEffect, useState } from "react";

import { searchPokemon } from "../services/apiClient";
import type { PokemonLite } from "../types/recommendation";

type Props = {
	value: string;
	onSelect: (name: string) => void;
};

export function PokemonSearch({ value, onSelect }: Props) {
	const [query, setQuery] = useState(value);
	const [results, setResults] = useState<PokemonLite[]>([]);
	const [queried, setQueried] = useState(false);

	useEffect(() => {
		setQuery(value);
	}, [value]);

	useEffect(() => {
		const controller = new AbortController();
		const expectedQuery = query.trim();
		const handle = setTimeout(async () => {
			if (!expectedQuery) {
				setResults([]);
				setQueried(false);
				return;
			}
			try {
				const response = await searchPokemon(expectedQuery, controller.signal);
				const stillCurrent = expectedQuery === query.trim();
				if (stillCurrent) {
					setResults(response);
					setQueried(true);
				}
			} catch {
				if (!controller.signal.aborted) {
					setResults([]);
					setQueried(true);
				}
			}
		}, 180);
		return () => {
			clearTimeout(handle);
			controller.abort();
		};
	}, [query]);

	return (
		<div className="search">
			<label htmlFor="pokemon-search">Pokemon</label>
			<input
				id="pokemon-search"
				value={query}
				placeholder="Start typing a Pokemon name"
				onChange={(event) => {
					const next = event.target.value;
					setQuery(next);
					onSelect(next);
				}}
				autoComplete="off"
			/>
			{results.length > 0 ? (
				<ul className="suggestions" aria-label="Pokemon suggestions">
					{results.map((item) => (
						<li key={item.id}>
							<button
								type="button"
								onClick={() => {
									setQuery(item.pokemon);
									onSelect(item.pokemon);
									setResults([]);
								}}
							>
								{item.pokemon}
							</button>
						</li>
					))}
				</ul>
			) : null}
			{queried && results.length === 0 ? <p className="hint">No matching Pokemon in dataset.</p> : null}
		</div>
	);
}