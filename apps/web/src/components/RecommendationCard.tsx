import type { RecommendationResult } from "../types/recommendation";
import { StatRadar } from "./StatRadar";

type Props = {
	result: RecommendationResult;
};

export function RecommendationCard({ result }: Props) {
	return (
		<section className="result-card" aria-live="polite">
			<h2>{result.decision}</h2>
			<p>{result.explanation}</p>
			<p className="confidence">Confidence: {result.confidence}/100</p>

			<h3>Evolution chain</h3>
			<p>{result.chain.map((item) => item.pokemon).join(" -> ")}</p>

			{result.options.length === 0 ? <p>No further evolution options.</p> : null}

			{result.options.map((option) => (
				<article key={option.pokemon.id} className="option-card">
					<h4>Option: {option.pokemon.pokemon}</h4>
					<p>Weighted score: {option.weightedGain.toFixed(1)} | Confidence: {option.confidence}</p>
					<StatRadar current={result.current} next={option.pokemon} />
					<ul>
						{option.reasoning.map((line) => (
							<li key={line}>{line}</li>
						))}
					</ul>
				</article>
			))}
		</section>
	);
}