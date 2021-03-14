import { html, Hybrids } from "hybrids"
import { reset } from "~styles"

type Banner = {
	state: "won" | "lost"
}

const Banner: Hybrids<Banner> = {
	state: "won",
	render: ({ state }) =>
		html`<div class=${["banner", state]}>${state == "won" ? "You won!" : "You lost..."}</div>
			<style>
				.banner {
					font-size: 2.5rem;
					font-weight: bold;
					text-align: center;
					padding: 1rem;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					width: 100%;
				}
				.lost.banner {
					background: rgba(255, 0, 0, 0.7);
				}
				.won.banner {
					background: rgba(14, 255, 30, 0.7);
				}
			</style>`.style(reset),
}

export default Banner
