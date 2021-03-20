import { html, Hybrids, property } from "hybrids"
import { reset as resetCSS } from "~styles"
import { clamp, preventDefault, querySelectorProp, noopTag as css } from "~utils"
import {
	Cell,
	countTraps,
	discoverCell,
	flagCell,
	flagOrToggleCell,
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
import ResponsiveControls, { Tool, ToolChangeEvent, ZoomEvent } from "~comp/ResponsiveControls"

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
						case Visibility.Hidden:
							ctx.fillStyle = "#ccc"
							ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
							break
						case Visibility.Visible:
							drawCell(host, cell)
							break
						default:
							ctx.fillStyle = cell?.visibility ?? "#ccc"
							ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
							ctx.fillText("🚩", (x + 0.5) * cellSize, (y + 0.6) * cellSize)
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

function handleMouseUp(host: GameCanvas, e: MouseEvent) {
	switch (e.button) {
		case 0: // Left mouse
			handleLeftClick(host, e)
			break
		case 1: // Middle mouse
			handleRightClick(host, e, true)
			break
		case 2: // Right mouse
			handleRightClick(host, e)
			break
	}
}

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

function handleRightClick(host: GameCanvas, e: MouseEvent, reverse = false) {
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
			flagCell(host.grid, x, y, reverse)
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
	zoom(host, Math.sign(e.deltaY) * 2)
}

function handleZoom(host: GameCanvas, e: ZoomEvent) {
	zoom(host, e.detail.delta)
}

function handleToolChange(host: GameCanvas, e: ToolChangeEvent) {
	host.tool = e.detail.tool
}

function handleTouchStart(host: GameCanvas, e: TouchEvent) {
	host.touchState = "down"
}

function handleTouchMove(host: GameCanvas, e: TouchEvent) {
	host.touchState = "moving"
}

function handleTouchEnd(host: GameCanvas, e: TouchEvent) {
	const touch = e.changedTouches.item(0)
	if (!touch) return
	const { cellSize, state, touchState, tool } = host,
		{ target, clientX, clientY } = touch,
		{ top, left } = (target as HTMLElement).getBoundingClientRect(),
		x = Math.floor((clientX - left) / cellSize),
		y = Math.floor((clientY - top) / cellSize)

	switch (touchState) {
		case "down":
			host.touchState = "initial"
			e.preventDefault()
			break
		case "moving":
			return (host.touchState = "initial")
	}

	switch (tool) {
		case "pointer":
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
			break
		default:
			switch (state) {
				case "initial":
					host.state = "playing"
					host.grid = makeGrid(host, x, y)
				case "playing":
					flagOrToggleCell(host.grid, x, y, tool as Visibility)
					if (isGameWon(host.grid)) host.state = "won"
					break
			}
			break
	}

	if (host.state == "won" || host.state == "lost") {
		uncoverAllMines(host.grid)
	}

	render(host)
}

function zoom(host: GameCanvas, delta: number) {
	host.cellSize = clamp(host.cellSize - delta, 7, 50)
	render(host)
}

const style = css`
	:host {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	#container {
		overflow: auto;
		margin: auto;
		max-width: 100%;
	}
	canvas {
		border: 1px solid black;
	}

	@media screen and (min-width: 768px) {
		:host {
			display: block;
			margin: auto;
			height: auto;
		}
	}
`

type GameCanvas = {
	width: number
	height: number
	difficulty: number
	colors: TrapColor[]
	cellSize: number
	canvas: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
	grid: Grid
	state: "initial" | "playing" | "won" | "lost"
	timeoutId: number
	duration: number
	tool: Tool
	touchState: "initial" | "down" | "moving"
}

const GameCanvas: Hybrids<GameCanvas> = {
	width: 30,
	height: 20,
	difficulty: 0.1,
	colors: [TrapColor.Red, TrapColor.Yellow, TrapColor.Green],
	cellSize: property(innerWidth >= 768 ? 30 : 20, host => {
		const cb = handleWheel.bind(undefined, host)
		window.addEventListener("wheel", cb, { passive: false })
		return () => window.removeEventListener("wheel", cb)
	}),
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
	tool: "pointer",
	touchState: "initial",
	render: ({ width, height, cellSize, duration, state, tool }) =>
		html`<ds-timer duration=${duration}></ds-timer>
			<div id="container">
				<canvas
					width=${width * cellSize}
					height=${height * cellSize}
					onmouseup=${handleMouseUp}
					oncontextmenu=${preventDefault}
					ontouchstart=${handleTouchStart}
					ontouchmove=${handleTouchMove}
					ontouchend=${handleTouchEnd}
				></canvas>
			</div>
			${["won", "lost"].includes(state) && html`<ds-banner state=${state}></ds-banner>`}
			<ds-responsive-controls
				tool=${tool}
				onzoom=${handleZoom}
				ontoolchange=${handleToolChange}
			></ds-responsive-controls>`
			.style(resetCSS, style)
			.define({ dsTimer: Timer, dsBanner: Banner, dsResponsiveControls: ResponsiveControls }),
}

export default GameCanvas
