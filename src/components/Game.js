import { html, store } from "hybrids"
import { discoverCell, Level } from "~stores"
import { reset } from "~styles"

/**
 * @typedef {Object} Game
 * @property {import("src/types").LevelModel} level
 * @property {Object} gridStyle
 * @property {import("hybrids").UpdateFunctionWithMethods<Game>[]} cells
 * @property {import("hybrids").UpdateFunctionWithMethods<Game>} timer
 * @property {number} duration
 * @property {"ready" | "playing" | "won" | "lost"} state
 * @property {number} timerId
 */

/**
 * @param {number} i
 */
function click(i) {
	return (
		/**
		 * @param {Game} host
		 */
		async function (host) {
			let cell
			switch (host.state) {
				case "ready":
					host.state = "playing"
					cell = await discoverCell(i)
					break
				case "playing":
					cell = await discoverCell(i)
					break
			}
			if (cell == 9) host.state = "lost"
			if (host.level.isGameWon) host.state = "won"
		}
	)
}

/**
 * @param {number} n
 */
function cellLabel(n) {
	switch (n) {
		case 0:
			return ""
		case 9:
			return "💣"
		default:
			return n
	}
}

/** @type {import("hybrids").Hybrids<Game>} */
const Game = {
	level: store(Level),
	duration: 0,
	timerId: -1,
	state: {
		observe(host, cur, prev) {
			if (prev == "ready" && cur == "playing") {
				let before = Date.now()
				host.timerId = setInterval(() => {
					host.duration += Date.now() - before
					before = Date.now()
				})
			} else if (prev == "playing") clearInterval(host.timerId)
		},
		connect(host) {
			host.state = "ready"
		},
	},
	gridStyle({ level }) {
		return {
			gridTemplateColumns: `repeat(${level.width}, auto)`,
			gridTemplateRows: `repeat(${level.height}, auto)`,
		}
	},
	cells({ level }) {
		const { width, height, mines, visibility } = level
		return Array(width * height)
			.fill()
			.map(
				(_, i) =>
					html`<button
						onclick=${click(i)}
						class=${{ cell: true, ["cell-" + mines[i]]: visibility[i], visible: visibility[i] }}
					>
						${visibility[i] && cellLabel(mines[i])}
					</button>`,
			)
	},
	timer({ duration }) {
		if (duration) {
			const s = Math.round(duration / 1000),
				min = Math.floor(s / 60) + "",
				sec = (s % 60) + ""
			return html`<p class="timer">${min.padStart(2, "0")}:${sec.padStart(2, "0")}</p>`
		} else return html`<p class="timer">Ready to start!</p>`
	},
	render: ({ level: { width, height }, gridStyle, cells, timer, state }) =>
		html`${timer}
			<div id="grid" style=${gridStyle}>
				${cells} ${state == "lost" && html`<div class="banner lost-banner">You lost...</div>`}
				${state == "won" && html`<div class="banner won-banner">You won!</div>`}
			</div>
			<style>
				:host {
					margin: auto;
				}
				#grid {
					display: grid;
					border: 1px solid #999;
					border-collapse: collapse;
					position: relative;
				}
				.cell {
					border: 1px solid #999;
					height: 1.7rem;
					width: 1.7rem;
					background: #ccc;
					transition: background-color 100ms ease-out;
				}
				.cell:hover {
					background: #eee;
				}
				.timer {
					font-size: 1.5rem;
					text-align: center;
					margin-bottom: 0.5rem;
					font-family: monospace;
				}
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
				.lost-banner {
					background: red;
				}
				.won-banner {
					background: lightgreen;
				}
				.visible {
					background: white;
				}
				.cell-1 {
					color: #0eff1e;
				}
				.cell-2 {
					color: #12d2ff;
				}
				.cell-3 {
					color: #1489ff;
				}
				.cell-4 {
					color: #1641ff;
				}
				.cell-5 {
					color: #3618ff;
				}
				.cell-6 {
					color: #7f1bff;
				}
				.cell-7 {
					color: #c71dff;
				}
				.cell-8 {
					color: #ff1ff1;
				}
				.cell-9 {
					background: red;
				}
			</style>`.style(reset),
}

export default Game
