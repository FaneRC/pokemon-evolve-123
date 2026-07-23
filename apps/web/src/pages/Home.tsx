import { useState } from "react";

import { LoadingState } from "../components/LoadingState";
import { PokemonSearch } from "../components/PokemonSearch";
import { RecommendationCard } from "../components/RecommendationCard";
import { useRecommendation } from "../hooks/useRecommendation";
import type { RecommendationMode, Role } from "../types/recommendation";

export function Home() {
	const [pokemonName, setPokemonName] = useState("Eevee");
	const [mode, setMode] = useState<RecommendationMode>("raw");
	const [role, setRole] = useState<Role>("physicalAttacker");
	const { data, loading, error, run } = useRecommendation();

	return (
		<main className="app-shell">
			<header>
				<h1>Should I Evolve This Pokemon?</h1>
				<p>Choose a Pokemon and compare its next evolution option(s) with clear tradeoffs.</p>
			</header>

			<section className="controls" aria-label="Recommendation controls">
				<PokemonSearch value={pokemonName} onSelect={setPokemonName} />

				<label>
					Recommendation mode
					<select value={mode} onChange={(event) => setMode(event.target.value as RecommendationMode)}>
						<option value="raw">Raw Stats Mode</option>
						<option value="role">Role-Based Mode</option>
						<option value="typeAware">Type/Ability-Aware Mode</option>
					</select>
				</label>

				<label>
					Role
					<select
						value={role}
						disabled={mode !== "role"}
						onChange={(event) => setRole(event.target.value as Role)}
					>
						<option value="physicalAttacker">Physical attacker</option>
						<option value="specialAttacker">Special attacker</option>
						<option value="tank">Tank</option>
						<option value="speed">Speed</option>
					</select>
				</label>

				<button type="button" onClick={() => run(pokemonName, mode, mode === "role" ? role : null)}>
					Get recommendation
				</button>
			</section>

			{loading ? <LoadingState /> : null}
			{error ? <p className="error">{error}</p> : null}
			{data ? <RecommendationCard result={data} /> : null}
		</main>
	);
}