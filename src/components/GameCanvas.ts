import { html, Hybrids, property } from "hybrids"
import { reset as resetCSS } from "~styles"
import { clamp, querySelectorProp } from "~utils"
import {
	Cell,
	countTraps,
	discoverCell,
	flagCell,
	get,
	Grid,
	isGameWon,
	makeGrid,
	TrapColor,
	uncoverAllMines,
	Visibility,
} from "~logic/Minesweeper"
import Banner from "~comp/Banner"
import Timer from "~comp/Timer"

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

function drawCells(host: GameCanvas) {
	const { width, height, cellSize, ctx, grid, state } = host
	switch (state) {
		case "initial":
			ctx.save()
			ctx.fillStyle = "#ccc"
			ctx.fillRect(0, 0, width * cellSize, height * cellSize)
			ctx.restore()
			break
		default:
			ctx.save()
			ctx.textAlign = "center"
			ctx.textBaseline = "middle"
			ctx.font = `${Math.floor(0.6 * cellSize)}px sans-serif`
			for (let x = 0; x < width; x++) {
				for (let y = 0; y < height; y++) {
					const cell = get(grid, x, y)
					switch (cell?.visibility) {
						case Visibility.YellowFlag:
							ctx.fillStyle = "khaki"
							ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
							ctx.fillText("🚩", (x + 0.5) * cellSize, (y + 0.6) * cellSize)
							break
						case Visibility.RedFlag:
							ctx.fillStyle = "lightpink"
							ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
							ctx.fillText("🚩", (x + 0.5) * cellSize, (y + 0.6) * cellSize)
							break
						case Visibility.Hidden:
							ctx.fillStyle = "#ccc"
							ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
							break
						case Visibility.Visible:
							drawCell(host, cell)
							break
					}
				}
			}
			ctx.restore()
			break
	}
}

function drawCell({ ctx, state, cellSize }: GameCanvas, cell: Cell) {
	const { x, y } = cell
	switch (cell.type) {
		case "mine":
			ctx.fillStyle = state == "won" ? "lightgreen" : cell.color
			ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
			ctx.fillText("💣", (x + 0.5) * cellSize, (y + 0.6) * cellSize)
			break
		case "empty":
			let i = 0
			const positions = setups[countTraps(cell.proximity)]
			for (const [color, n] of cell.proximity) {
				ctx.fillStyle = color
				for (let j = 0; j < n; j++) {
					ctx.beginPath()
					ctx.arc(
						(x + positions[i]) * cellSize,
						(y + positions[i + 1]) * cellSize,
						0.13 * cellSize,
						0,
						2 * Math.PI,
					)
					i += 2
					ctx.fill()
				}
			}
			break
	}
}

function render(host: GameCanvas) {
	host.ctx.clearRect(0, 0, host.width * host.cellSize, host.height * host.cellSize)
	drawCells(host)
	drawGrid(host)
}

const setups = [
	[],
	[0.5, 0.5],
	[0.8, 0.2, 0.2, 0.8],
	[0.8, 0.2, 0.2, 0.8, 0.5, 0.5],
	[0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.8, 0.8],
	[0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.8, 0.8, 0.5, 0.5],
	[0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.8, 0.8, 0.2, 0.5, 0.8, 0.5],
	[0.2, 0.33, 0.2, 0.66, 0.5, 0.2, 0.5, 0.5, 0.5, 0.8, 0.8, 0.33, 0.8, 0.66],
	[0.2, 0.2, 0.8, 0.2, 0.2, 0.8, 0.8, 0.8, 0.2, 0.5, 0.8, 0.5, 0.5, 0.33, 0.5, 0.66],
]

function handleLeftClick(host: GameCanvas, e: MouseEvent) {
	const { offsetX, offsetY } = e,
		{ cellSize, state } = host,
		x = Math.floor(offsetX / cellSize),
		y = Math.floor(offsetY / cellSize)

	switch (state) {
		case "initial":
			host.grid = makeGrid(host, x, y)
			if (discoverCell(host, x, y, () => render(host))) host.state = "lost"
			else host.state = "playing"
			break
		case "playing":
			if (discoverCell(host, x, y, () => render(host))) host.state = "lost"
			if (isGameWon(host.grid)) host.state = "won"
			break
	}

	if (host.state == "won" || host.state == "lost") {
		uncoverAllMines(host.grid)
	}

	render(host)
}

function handleRightClick(host: GameCanvas, e: MouseEvent) {
	e.preventDefault()

	const { offsetX, offsetY } = e,
		{ cellSize, state } = host,
		x = Math.floor(offsetX / cellSize),
		y = Math.floor(offsetY / cellSize)

	switch (state) {
		case "initial":
			host.state = "playing"
			host.grid = makeGrid(host, x, y)
		case "playing":
			flagCell(host.grid, x, y)
			if (isGameWon(host.grid)) host.state = "won"
			break
	}

	if (host.state == "won" || host.state == "lost") {
		uncoverAllMines(host.grid)
	}

	render(host)
}

function handleWheel(host: GameCanvas, e: WheelEvent) {
	e.preventDefault()
	host.cellSize = clamp(host.cellSize - Math.sign(e.deltaY) * 2, 7, 50)
	render(host)
}

type GameCanvas = {
	width: number
	height: number
	cellSize: number
	difficulty: number
	canvas: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
	grid: Grid
	state: "initial" | "playing" | "won" | "lost"
	timeoutId: number
	duration: number
}

const GameCanvas: Hybrids<GameCanvas> = {
	width: 30,
	height: 20,
	cellSize: property(30, host => {
		const cb = handleWheel.bind(undefined, host)
		window.addEventListener("wheel", cb, { passive: false })
		return () => window.removeEventListener("wheel", cb)
	}),
	difficulty: 0.1,
	canvas: querySelectorProp("canvas"),
	ctx: {
		get: ({ canvas }) => canvas.getContext("2d") as CanvasRenderingContext2D,
		connect: host => void setTimeout(render.bind(undefined, host), 15),
	},
	grid: null,
	state: {
		observe(host, value, oldValue) {
			if (value == "playing" && oldValue == "initial") {
				let before = Date.now()
				host.timeoutId = setInterval(() => {
					host.duration += Date.now() - before
					before = Date.now()
				}, 1000)
				host.duration = 1
			} else if (oldValue == "playing") {
				clearInterval(host.timeoutId)
			}
		},
		connect(host) {
			host.state = "initial"
		},
	},
	timeoutId: -1,
	duration: 0,
	render: ({ width, height, cellSize, duration, state }) =>
		html`<ds-timer duration=${duration}></ds-timer>
			<canvas
				width=${width * cellSize}
				height=${height * cellSize}
				onclick=${handleLeftClick}
				oncontextmenu=${handleRightClick}
			></canvas>
			${["won", "lost"].includes(state) && html`<ds-banner state=${state}></ds-banner>`}
			<style>
				:host {
					margin: auto;
					position: relative;
				}
				canvas {
					border: 1px solid black;
				}
			</style>`
			.style(resetCSS)
			.define({ dsTimer: Timer, dsBanner: Banner }),
}

export default GameCanvas
