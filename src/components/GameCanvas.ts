import { html, Hybrids } from "hybrids"
import { buttons, reset as resetCSS } from "~styles"
import { querySelectorProp, randInt } from "~utils"

function drawGrid({ width, height, cellSize, ctx }: GameCanvas) {
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

function drawCells({ width, height, cellSize, ctx, grid }: GameCanvas) {
	ctx.save()
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"
	ctx.font = `${Math.floor(0.6 * cellSize)}px sans-serif`
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const cell = get(grid, x, y)
			switch (cell?.[VIS]) {
				case Visibility.Flagged:
				case Visibility.Hidden:
					ctx.fillStyle = "#ccc"
					ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
					break
				case Visibility.Visible:
					switch (cell?.[MINE]) {
						case 0: // nothing
							break
						case 9:
							ctx.fillStyle = "red"
							ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
							ctx.fillText("💣", (x + 0.5) * cellSize, (y + 0.6) * cellSize)
							break
						default:
							ctx.fillStyle = colors[cell?.[MINE] ?? 9]
							ctx.fillText(cell?.[MINE] + "", (x + 0.5) * cellSize, (y + 0.5) * cellSize)
							break
					}
					break
			}
		}
	}
	ctx.restore()
}

function render(host: GameCanvas) {
	host.ctx.clearRect(0, 0, host.width * host.cellSize, host.height * host.cellSize)
	drawCells(host)
	drawGrid(host)
}

const colors = ["white", "#0eff1e", "#12d2ff", "#1489ff", "#1641ff", "#3618ff", "#7f1bff", "#c71dff", "#ff1ff1", "red"]

function setCell(grid: Grid, x: number, y: number, cell: Cell) {
	if (!grid[x]) grid[x] = []
	grid[x][y] = cell
	return grid
}

function setCellVisibility(grid: Grid, x: number, y: number, visibility: Visibility) {
	const cell = get(grid, x, y)
	cell && (cell[VIS] = visibility)
}

function get(grid: Grid, x: number, y: number): Cell | undefined {
	return grid[x]?.[y]
}

function makeGrid({ width = 30, height = 20, difficulty = 0.1 } = {}) {
	const grid: Grid = []
	let nbMines = Math.ceil(width * height * difficulty)

	do {
		const x = randInt(0, width),
			y = randInt(0, height)
		if (get(grid, x, y)) continue
		setCell(grid, x, y, [x, y, Visibility.Hidden, 9])
		nbMines--
	} while (nbMines > 0)

	for (let x = 0; x < width; x++) {
		if (!grid[x]) grid[x] = []
		for (let y = 0; y < height; y++) {
			if (grid[x][y]) continue
			const mine =
				(get(grid, x + 1, y + 1)?.[MINE] == 9 ? 1 : 0) +
				(get(grid, x + 1, y)?.[MINE] == 9 ? 1 : 0) +
				(get(grid, x + 1, y - 1)?.[MINE] == 9 ? 1 : 0) +
				(get(grid, x - 1, y + 1)?.[MINE] == 9 ? 1 : 0) +
				(get(grid, x - 1, y)?.[MINE] == 9 ? 1 : 0) +
				(get(grid, x - 1, y - 1)?.[MINE] == 9 ? 1 : 0) +
				(get(grid, x, y + 1)?.[MINE] == 9 ? 1 : 0) +
				(get(grid, x, y - 1)?.[MINE] == 9 ? 1 : 0)
			grid[x][y] = [x, y, Visibility.Hidden, mine]
		}
	}

	return grid
}

function discoverCell(host: GameCanvas, x: number, y: number) {
	const { grid } = host,
		cell = get(grid, x, y)

	switch (cell?.[VIS]) {
		case Visibility.Visible:
		// return uncoverNext(x, y, level)
		case Visibility.Hidden:
			return uncoverFrom(host, x, y)
		default:
			return false
	}
}

function uncoverFrom({ grid, width, height }: GameCanvas, x: number, y: number) {
	const cell = get(grid, x, y)

	if (cell?.[MINE]) setCellVisibility(grid, x, y, Visibility.Visible)
	else {
		const toCheck = new Set<string>(),
			toUncover = new Set<string>()

		function id(x: number, y: number) {
			return x + " " + y
		}

		toCheck.add(id(x, y))

		toCheck.forEach(pos => {
			const [x, y] = pos.split(" ").map(n => parseInt(n)),
				cell = get(grid, x, y)

			if (cell?.[VIS] == Visibility.Hidden) toUncover.add(pos)
			if (cell?.[MINE] || x < 0 || y < 0 || x >= width || y >= height) return

			toCheck.add(id(x + 1, y + 1))
			toCheck.add(id(x, y + 1))
			toCheck.add(id(x - 1, y + 1))
			toCheck.add(id(x + 1, y - 1))
			toCheck.add(id(x, y - 1))
			toCheck.add(id(x - 1, y - 1))
			toCheck.add(id(x + 1, y))
			toCheck.add(id(x - 1, y))
		})

		toUncover.forEach(pos => {
			const [x, y] = pos.split(" ").map(n => parseInt(n))
			setCellVisibility(grid, x, y, Visibility.Visible)
		})
	}
}

function reset(host: GameCanvas) {
	host.grid = makeGrid(host)
	render(host)
}

function handleClick(host: GameCanvas, e: MouseEvent) {
	const { offsetX, offsetY } = e,
		{ cellSize } = host,
		x = Math.floor(offsetX / cellSize),
		y = Math.floor(offsetY / cellSize)
	discoverCell(host, x, y)
	render(host)
}

enum Visibility {
	Hidden,
	Visible,
	Flagged,
}

const X = 0,
	Y = 1,
	VIS = 2,
	MINE = 3
type Cell = [number, number, Visibility, number]

type Grid = {
	[x: number]: {
		[y: number]: Cell
	}
}

type GameCanvas = {
	width: number
	height: number
	cellSize: number
	canvas: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
	grid: Grid
}

const GameCanvas: Hybrids<GameCanvas> = {
	width: 30,
	height: 20,
	cellSize: 30,
	canvas: querySelectorProp("canvas"),
	ctx: {
		get: ({ canvas }) => canvas.getContext("2d") as CanvasRenderingContext2D,
		connect: render,
	},
	grid: makeGrid(),
	render: ({ width, height, cellSize }) =>
		html`<canvas width=${width * cellSize} height=${height * cellSize} onclick=${handleClick}></canvas>
			<div id="controls">
				<label for="rng-width">Width - ${cellSize}</label>
				<input
					id="rng-width"
					type="range"
					min="10"
					max="50"
					defaultValue=${width}
					oninput=${html.set("width")}
				/>
				<label for="rng-height">Height - ${height}</label>
				<input
					id="rng-height"
					type="range"
					min="10"
					max="50"
					defaultValue=${height}
					oninput=${html.set("height")}
				/>
				<label for="rng-cellsize">Cell Size - ${cellSize}px</label>
				<input
					id="rng-cellsize"
					type="range"
					min="1"
					max="50"
					defaultValue=${cellSize}
					oninput=${html.set("cellSize")}
				/>
				<button type="button" onclick=${reset} class="btn">Reset</button>
			</div>
			<style>
				:host {
					margin: auto;
				}
				canvas {
					border: 1px solid black;
				}
				#controls {
					position: absolute;
					top: 0;
					left: 0;
					background: #333;
					color: white;
					display: flex;
					flex-direction: column;
					gap: 1rem;
					padding: 1rem;
				}
				button {
					align-self: center;
				}
			</style>`
			.style(resetCSS)
			.style(buttons),
}

export default GameCanvas
