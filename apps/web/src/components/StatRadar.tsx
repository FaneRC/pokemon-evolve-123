import type { PokemonRecord } from "../types/recommendation";

const KEYS = [
	"hp",
	"attack",
	"defense",
	"special_attack",
	"special_defense",
	"speed"
] as const;

type Props = {
	current: PokemonRecord;
	next: PokemonRecord;
};

const val = (n: number | null): number => n ?? 0;

export function StatRadar({ current, next }: Props) {
	return (
		<table className="stats-table">
			<thead>
				<tr>
					<th>Stat</th>
					<th>{current.pokemon}</th>
					<th>{next.pokemon}</th>
					<th>Delta</th>
				</tr>
			</thead>
			<tbody>
				{KEYS.map((key) => {
					const left = val(current[key]);
					const right = val(next[key]);
					const delta = right - left;
					const bar = Math.min(100, Math.max(0, right));
					return (
						<tr key={key}>
							<td>{key.replace("_", " ")}</td>
							<td>{left}</td>
							<td>
								{right}
								<div className="bar-track" aria-hidden="true">
									<div className="bar-fill" style={{ width: `${bar}%` }} />
								</div>
							</td>
							<td className={delta >= 0 ? "delta-up" : "delta-down"}>{delta >= 0 ? `+${delta}` : `${delta}`}</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}