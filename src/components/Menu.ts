import { html, Hybrids } from "hybrids"
import { TrapColor } from "~logic/Minesweeper"
import { setLevelDimensions } from "~stores/Level"
import { buttons, reset, selects } from "~styles"
import { observedProp, querySelectorProp, noopTag as css } from "~utils"

export type StartEvent = CustomEvent<{ width: number; height: number; difficulty: number; colors: TrapColor[] }>

async function start(host: Menu & HTMLElement, e: Event) {
	e.preventDefault()
	await setLevelDimensions(host)
	host.dispatchEvent(
		new CustomEvent("start", {
			detail: {
				width: host.width,
				height: host.height,
				difficulty: host.difficulty,
				colors: host.colors,
			},
		}) as StartEvent,
	)
}

function render(host: Menu) {
	const { width, height, ctx } = host,
		cellSize = 15
	ctx.save()
	ctx.beginPath()
	ctx.strokeStyle = "#999"
	for (let x = 1; x < width; x++) {
		ctx.moveTo(x * cellSize + 0.5, 0)
		ctx.lineTo(x * cellSize + 0.5, height * cellSize)
	}
	for (let y = 1; y < height; y++) {
		ctx.moveTo(0, y * cellSize + 0.5)
		ctx.lineTo(width * cellSize, y * cellSize + 0.5)
	}
	ctx.stroke()
	ctx.restore()
}

type Menu = {
	width: number
	height: number
	difficulty: number
	colors: TrapColor[]
	redTrap: boolean
	yellowTrap: boolean
	greenTrap: boolean
	blueTrap: boolean
	canvas: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
}

const style = css`
	:host {
		height: 100%;
		width: 100%;
		display: grid;
		justify-items: center;
		align-items: center;
		grid-template-rows: 1fr;
	}
	form {
		display: flex;
		flex-direction: column;
		max-width: 25rem;
		width: 100%;
		height: 100%;
		padding: 1rem;
	}
	.label {
		font-weight: 300;
		font-size: 1.125rem;
		margin-top: 1rem;
		margin-bottom: 0;
	}
	ol {
		margin: 1rem 0 0 0;
		padding: 0;
		list-style-type: none;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}
	li > label {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
	}
	input[type="checkbox"] {
		display: none;
	}
	.mine {
		background-color: #ccc;
		border: 1px solid black;
		width: 30px;
		height: 30px;
		text-align: center;
	}
	input[type="checkbox"]:checked + .mine {
		background-color: var(--color);
	}
	canvas {
		display: none;
		border: 1px solid black;
	}
	.btn {
		margin-top: auto;
		align-self: center;
	}
	#lower {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	#lower p {
		margin: 0.5rem 0;
	}
	#lower a {
		color: #e6007e;
		transition: all 0.3s ease-in-out;
	}
	#lower a:hover {
		text-decoration: underline;
		color: #ff4daf;
	}

	@media screen and (min-width: 768px) {
		:host {
			grid-template-rows: 1fr 1fr;
		}
		canvas {
			display: block;
		}
		.btn {
			margin-top: 1rem;
		}
	}
`

const Menu: Hybrids<Menu> = {
	width: observedProp(30, render),
	height: observedProp(15, render),
	difficulty: 0.1,
	redTrap: true,
	yellowTrap: true,
	greenTrap: true,
	blueTrap: false,
	colors: ({ redTrap, yellowTrap, greenTrap, blueTrap }) =>
		[
			redTrap && TrapColor.Red,
			yellowTrap && TrapColor.Yellow,
			greenTrap && TrapColor.Green,
			blueTrap && TrapColor.Blue,
		].filter(Boolean) as TrapColor[],
	canvas: querySelectorProp("canvas"),
	ctx: {
		get: ({ canvas }) => canvas.getContext("2d") as CanvasRenderingContext2D,
		connect: render,
	},
	render: ({ width, height, difficulty, redTrap, yellowTrap, greenTrap, blueTrap }) =>
		html`<form onsubmit=${start}>
				<label class="label" for="txb-width">Width - ${width}</label>
				<input
					id="txb-width"
					type="range"
					min="10"
					max="50"
					defaultValue=${width}
					onchange=${html.set("width")}
					oninput=${html.set("width")}
				/>
				<label class="label" for="txb-height">Height - ${height}</label>
				<input
					id="txb-height"
					type="range"
					min="10"
					max="30"
					defaultValue=${height}
					onchange=${html.set("height")}
					oninput=${html.set("height")}
				/>
				<label class="label" for="ddl-difficulty">Difficulty</label>
				<select class="select" id="txb-difficulty" value=${difficulty} onchange=${html.set("difficulty")}>
					<option value="0.1">Easy</option>
					<option value="0.2">Medium</option>
					<option value="0.3">Hard</option>
				</select>
				<p class="label">Mine colors</p>
				<ol>
					<li>
						<label>
							<input type="checkbox" checked=${redTrap} onchange=${html.set("redTrap")} />
							<span class="mine" style="--color: ${TrapColor.Red}">💣</span>
						</label>
					</li>
					<li>
						<label>
							<input type="checkbox" checked=${yellowTrap} onchange=${html.set("yellowTrap")} />
							<span class="mine" style="--color: ${TrapColor.Yellow}">💣</span>
						</label>
					</li>
					<li>
						<label>
							<input type="checkbox" checked=${greenTrap} onchange=${html.set("greenTrap")} />
							<span class="mine" style="--color: ${TrapColor.Green}">💣</span>
						</label>
					</li>
					<li>
						<label>
							<input type="checkbox" checked=${blueTrap} onchange=${html.set("blueTrap")} />
							<span class="mine" style="--color: ${TrapColor.Blue}">💣</span>
						</label>
					</li>
				</ol>
				<button class="btn">Start!</button>
			</form>
			<div id="lower">
				<canvas class="canvas" width=${width * 15} height=${height * 15}></canvas>
				<p>
					Made by <a href="https://terry.gonguet.com/" target="_blank">Terry Gonguet</a> in a weekend in 2021.
				</p>
			</div>`.style(reset, buttons, selects, style),
}

export default Menu
