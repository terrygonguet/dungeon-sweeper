import { html, Hybrids } from "hybrids"
import { setLevelDimensions } from "~stores/Level"
import { buttons, reset } from "~styles"

type Menu = {
	width: number
	height: number
	difficulty: number
	gridStyle: Object
}

export type StartEvent = CustomEvent<{ width: number; height: number; difficulty: number }>

async function start(host: Menu & HTMLElement, e: Event) {
	e.preventDefault()
	await setLevelDimensions(host)
	host.dispatchEvent(
		new CustomEvent("start", {
			detail: {
				width: host.width,
				height: host.height,
				difficulty: host.difficulty,
			},
		}),
	)
}

const Menu: Hybrids<Menu> = {
	width: 30,
	height: 15,
	difficulty: 0.1,
	gridStyle({ width, height }) {
		return {
			gridTemplateColumns: `repeat(${width}, auto)`,
			gridTemplateRows: `repeat(${height}, auto)`,
		}
	},
	render: ({ width, height, gridStyle, difficulty }) =>
		html`<form onsubmit=${start}>
				<label for="txb-width">Width - ${width}</label>
				<input
					id="txb-width"
					type="range"
					min="10"
					max="50"
					defaultValue=${width}
					onchange=${html.set("width")}
					oninput=${html.set("width")}
				/>
				<label for="txb-height">Height - ${height}</label>
				<input
					id="txb-height"
					type="range"
					min="10"
					max="30"
					defaultValue=${height}
					onchange=${html.set("height")}
					oninput=${html.set("height")}
				/>
				<label for="ddl-difficulty">Difficulty</label>
				<select id="txb-difficulty" value=${difficulty} onchange=${html.set("difficulty")}>
					<option value="0.1">Easy</option>
					<option value="0.2">Medium</option>
					<option value="0.3">Hard</option>
				</select>
				<button class="btn">Start!</button>
			</form>
			<div id="grid" style="${gridStyle}">
				${Array(width * height)
					.fill(0)
					.map(() => html`<div class="cell"></div>`)}
			</div>
			<style>
				:host {
					height: 100%;
					width: 100%;
					display: grid;
					justify-items: center;
					align-items: center;
					grid-template-rows: 1fr 1fr;
				}
				form {
					display: flex;
					flex-direction: column;
				}
				label {
					font-weight: 300;
					font-size: 1.125rem;
					margin-top: 1rem;
				}
				input {
					width: 25rem;
				}
				#grid {
					display: grid;
					border-top: 1px solid black;
					border-left: 1px solid black;
				}
				.cell {
					border-right: 1px solid black;
					border-bottom: 1px solid black;
					height: 1.1rem;
					width: 1.1rem;
				}
				.btn {
					margin-top: 1rem;
					align-self: center;
				}
			</style>`
			.style(reset)
			.style(buttons),
}

export default Menu
