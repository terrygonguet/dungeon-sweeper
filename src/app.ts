import { define, html, Hybrids, UpdateFunctionWithMethods } from "hybrids"
import { reset } from "~styles"
import Menu from "~comp/Menu"
import Game from "~comp/Game"
import { setLevelDimensions } from "~stores/Level"

const dev = import.meta.env.MODE == "development"

if (dev) setLevelDimensions().then(level => dev && console.log(level))

type App = {
	state: "menu" | "playing" | "won" | "lost"
	curEl: UpdateFunctionWithMethods<App>
}

function start(host: App & HTMLElement) {
	host.state = "playing"
}

const App: Hybrids<App> = {
	state: dev ? "playing" : "menu",
	curEl({ state }) {
		switch (state) {
			case "menu":
				return html`<ds-menu onstart=${start}></ds-menu>`.define({ dsMenu: Menu })
			case "playing":
				return html`<ds-game></ds-game>`.define({ dsGame: Game })
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
