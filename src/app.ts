import { define, html, Hybrids, UpdateFunctionWithMethods } from "hybrids"
import { reset } from "~styles"
import Menu, { StartEvent } from "~comp/Menu"
import Game from "~comp/GameCanvas"
import { TrapColor } from "~logic/Minesweeper"

const dev = import.meta.env.MODE == "development"

function start(host: App & HTMLElement, e: StartEvent) {
	host.state = "playing"
	host.width = e.detail.width
	host.height = e.detail.height
	host.difficulty = e.detail.difficulty
	host.colors = e.detail.colors
}

function goBack(host: App) {
	host.state = "menu"
}

type App = {
	state: "menu" | "playing"
	curEl: UpdateFunctionWithMethods<App>
	width: number
	height: number
	difficulty: number
	colors: TrapColor[]
}

const App: Hybrids<App> = {
	state: !dev ? "playing" : "menu",
	width: 30,
	height: 20,
	difficulty: 0.1,
	colors: [TrapColor.Red, TrapColor.Yellow, TrapColor.Green],
	curEl({ state, width, height, difficulty, colors }) {
		switch (state) {
			case "menu":
				return html`<ds-menu onstart=${start}></ds-menu>`.define({ dsMenu: Menu })
			case "playing":
				return html`<ds-game
					width=${width}
					height=${height}
					difficulty=${difficulty}
					colors=${colors}
					onback=${goBack}
				></ds-game>`.define({
					dsGame: Game,
				})
			default:
				return html`<p class="error">Invalid State</p>`
		}
	},
	render: ({ curEl }) =>
		html`<main>${curEl}</main>
			<style>
				main {
					width: 100%;
					height: 100%;
					display: flex;
					flex-direction: column;
				}
				.error {
					font-size: 4rem;
					color: red;
					margin: auto;
				}
			</style>`.style(reset),
}

define("ds-app", App)
