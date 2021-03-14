import { html, Hybrids } from "hybrids"
import { reset } from "~styles"

type Timer = {
	duration: number
}

const Timer: Hybrids<Timer> = {
	duration: 0,
	render({ duration }) {
		const s = Math.round(duration / 1000),
			min = Math.floor(s / 60) + "",
			sec = (s % 60) + ""
		return html`<p class="timer">
				${duration ? min.padStart(2, "0") + ":" + sec.padStart(2, "0") : "Ready to start!"}
			</p>
			<style>
				.timer {
					font-size: 1.5rem;
					text-align: center;
					margin-bottom: 0.5rem;
					font-family: monospace;
				}
			</style>`.style(reset)
	},
}

export default Timer
