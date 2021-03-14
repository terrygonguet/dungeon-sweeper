import { html, Hybrids, store, UpdateFunctionWithMethods } from "hybrids"
import { discoverCell, LevelModel, Level, isVisible } from "~stores/Level"
import { reset } from "~styles"

type Game = {
	level: Level
	gridStyle: Object
	cells: UpdateFunctionWithMethods<Game>[]
	timer: UpdateFunctionWithMethods<Game>
	duration: number
	state: "ready" | "playing" | "won" | "lost"
	timerId: number
}

function click(x: number, y: number) {
	return async function (host: Game & HTMLElement) {
		let cell
		switch (host.state) {
			case "ready":
				host.state = "playing"
				cell = await discoverCell(x, y)
				break
			case "playing":
				cell = await discoverCell(x, y)
				break
		}
		if (cell == 9) host.state = "lost"
		if (host.level.isGameWon) host.state = "won"
	}
}

function cellLabel(n: number) {
	switch (n) {
		case 0:
			return ""
		case 9:
			return "💣"
		default:
			return n
	}
}

const Game: Hybrids<Game> = {
	level: store(LevelModel),
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
	cells({ level: { cells } }) {
		return cells.map((cell, i) => {
			const visible = isVisible(cell.visibility)
			return html`<button
				onclick=${click(cell.x, cell.y)}
				class=${{
					cell: true,
					["cell-" + cell.mine]: visible,
					visible: visible,
				}}
			>
				${visible && cellLabel(cell.mine)}
			</button>`
		})
	},
	timer({ duration }) {
		if (duration) {
			const s = Math.round(duration / 1000),
				min = Math.floor(s / 60) + "",
				sec = (s % 60) + ""
			return html`<p class="timer">${min.padStart(2, "0")}:${sec.padStart(2, "0")}</p>`
		} else return html`<p class="timer">Ready to start!</p>`
	},
	render: ({ gridStyle, cells, timer, state }) =>
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
