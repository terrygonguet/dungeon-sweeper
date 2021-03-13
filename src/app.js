import { define, html, store } from "hybrids"
import { reset } from "~styles"
import Menu from "~comp/Menu"
import Game from "~comp/Game"
import { setLevelDimensions } from "~stores"

const dev = import.meta.env.MODE == "development"

if (dev) setLevelDimensions()

/**
 * @typedef {Object} App
 * @property {"menu" | "playing" | "won" | "lost"} state
 * @property {import("hybrids").UpdateFunctionWithMethods<App>} curEl
 */

/**
 * @param {App & HTMLElement} host
 */
function start(host) {
	host.state = "playing"
}

/** @type {import("hybrids").Hybrids<App>} */
const App = {
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
