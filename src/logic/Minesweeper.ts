import { modWrap, pickRandom, randInt } from "~utils"

export enum Visibility {
	Hidden,
	Visible,
	RedFlag = "lightpink",
	YellowFlag = "khaki",
	BlueFlag = "cornflowerblue",
	GreenFlag = "darkseagreen",
}

export enum TrapColor {
	Red = "red",
	Yellow = "goldenrod",
	Blue = "royalblue",
	Green = "limegreen",
}

type EmptyCell = {
	type: "empty"
	x: number
	y: number
	proximity: Map<TrapColor, number>
	visibility: Visibility
}

type MineCell = {
	type: "mine"
	x: number
	y: number
	color: TrapColor
	visibility: Visibility
}

export type Cell = EmptyCell | MineCell

export type Grid = {
	width: number
	height: number
	[x: number]: {
		[y: number]: Cell
	}
}

const flagVisibilities = new Set([Visibility.RedFlag, Visibility.YellowFlag, Visibility.BlueFlag, Visibility.GreenFlag])
export function isFlag(visibility: Visibility) {
	return flagVisibilities.has(visibility)
}

export function set(grid: Grid, x: number, y: number, cell: Cell) {
	if (!grid[x]) grid[x] = {}
	grid[x][y] = cell
	return grid
}

export function get(grid: Grid, x: number, y: number): Cell | undefined {
	return grid[x]?.[y]
}

export function countTraps(proximity: Map<TrapColor, number>) {
	return Array.from(proximity.values()).reduce((acc, cur) => acc + cur, 0)
}

type MakeGridOptions = {
	width?: number | undefined
	height?: number | undefined
	difficulty?: number | undefined
	colors?: TrapColor[] | undefined
}

function _makeGrid({
	width = 30,
	height = 20,
	difficulty = 0.1,
	colors = [TrapColor.Red, TrapColor.Yellow, TrapColor.Blue, TrapColor.Green],
} = {}) {
	const grid: Grid = { width, height }
	let nbMines = Math.ceil(width * height * difficulty)

	do {
		const x = randInt(0, width),
			y = randInt(0, height)
		if (get(grid, x, y)) continue
		set(grid, x, y, {
			type: "mine",
			x,
			y,
			color: pickRandom(colors),
			visibility: Visibility.Hidden,
		})
		nbMines--
	} while (nbMines > 0)

	for (let x = 0; x < width; x++) {
		if (!grid[x]) grid[x] = {}
		for (let y = 0; y < height; y++) {
			if (grid[x][y]) continue
			const neighbours = [
					get(grid, x + 1, y + 1),
					get(grid, x + 1, y),
					get(grid, x + 1, y - 1),
					get(grid, x - 1, y + 1),
					get(grid, x - 1, y),
					get(grid, x - 1, y - 1),
					get(grid, x, y + 1),
					get(grid, x, y - 1),
				].filter(Boolean) as Cell[],
				proximity = new Map<TrapColor, number>()
			neighbours.forEach(
				cell => cell.type == "mine" && proximity.set(cell.color, (proximity.get(cell.color) ?? 0) + 1),
			)
			grid[x][y] = { type: "empty", x, y, proximity, visibility: Visibility.Hidden }
		}
	}

	return grid
}

export function makeGrid(options: MakeGridOptions, x: number, y: number) {
	let grid
	do {
		grid = _makeGrid(options)
	} while (get(grid, x, y)?.type == "mine")
	return grid
}

type StepCallback = (cells: Cell[]) => void

export function discoverCell(
	host: { grid: Grid; width: number; height: number },
	x: number,
	y: number,
	onStep: StepCallback = () => {},
) {
	const { grid } = host,
		cell = get(grid, x, y)

	switch (cell?.visibility) {
		case Visibility.Visible:
			return uncoverNextTo(host, x, y, onStep)
		case Visibility.Hidden:
			return uncoverFrom(host, x, y, onStep)
		default:
			return false
	}
}

function uncoverFrom(
	{ grid, width, height }: { grid: Grid; width: number; height: number },
	x: number,
	y: number,
	onStep: StepCallback,
) {
	const cell = get(grid, x, y)
	if (!cell || cell.visibility == Visibility.Visible) return

	if (cell.type == "empty" && cell.proximity.size > 0) {
		cell.visibility = Visibility.Visible
		onStep([cell])
	} else {
		const toCheck = new Set<Cell>()

		function step() {
			const toUncover = new Set<Cell>()

			for (const cell of Array.from(toCheck)) {
				if (!cell) continue
				const { x, y } = cell
				if (cell.visibility == Visibility.Hidden) toUncover.add(cell)
				if (cell.type == "mine" || cell.proximity.size > 0 || x < 0 || y < 0 || x >= width || y >= height)
					continue

				toCheck.add(get(grid, x + 1, y + 1) as Cell)
				toCheck.add(get(grid, x - 1, y + 1) as Cell)
				toCheck.add(get(grid, x + 1, y - 1) as Cell)
				toCheck.add(get(grid, x - 1, y - 1) as Cell)
				toCheck.add(get(grid, x, y + 1) as Cell)
				toCheck.add(get(grid, x, y - 1) as Cell)
				toCheck.add(get(grid, x + 1, y) as Cell)
				toCheck.add(get(grid, x - 1, y) as Cell)
			}

			if (toUncover.size > 0) {
				toUncover.forEach(cell => (cell.visibility = Visibility.Visible))
				setTimeout(step, 50)
				onStep(Array.from(toUncover))
			}
		}

		toCheck.add(cell)
		step()
	}

	return cell?.type == "mine"
}

function uncoverNextTo(
	host: { grid: Grid; width: number; height: number },
	x: number,
	y: number,
	onStep: StepCallback,
) {
	const { grid } = host,
		cell = get(grid, x, y),
		neighbours = [
			get(grid, x + 1, y + 1),
			get(grid, x, y + 1),
			get(grid, x - 1, y + 1),
			get(grid, x + 1, y - 1),
			get(grid, x, y - 1),
			get(grid, x - 1, y - 1),
			get(grid, x + 1, y),
			get(grid, x - 1, y),
		].filter(Boolean) as Cell[],
		nbFlagged = neighbours.reduce((acc, cur) => acc + (isFlag(cur.visibility) ? 1 : 0), 0),
		nbTraps = cell?.type == "empty" ? countTraps(cell.proximity) : -1

	if (nbFlagged != nbTraps) return cell?.type == "mine"

	const results = neighbours
		.filter(cell => !isFlag(cell.visibility))
		.map(({ x, y }) => uncoverFrom(host, x, y, onStep))

	return results.some(Boolean)
}

export const trapFlagMap = new Map([
	[TrapColor.Red, Visibility.RedFlag],
	[TrapColor.Yellow, Visibility.YellowFlag],
	[TrapColor.Blue, Visibility.BlueFlag],
	[TrapColor.Green, Visibility.GreenFlag],
])
export function isGameWon(grid: Grid) {
	for (let x = 0; x < grid.width; x++) {
		for (let y = 0; y < grid.height; y++) {
			const cell = grid[x][y]
			switch (cell.type) {
				case "empty":
					if (cell.visibility != Visibility.Visible) return false
					continue
				case "mine":
					if (trapFlagMap.get(cell.color) != cell.visibility) return false
					continue
			}
		}
	}
	return true
}

export function uncoverAllMines(grid: Grid) {
	for (let x = 0; x < grid.width; x++) {
		for (let y = 0; y < grid.height; y++) {
			const cell = grid[x][y]
			if (cell.type == "mine") cell.visibility = Visibility.Visible
		}
	}
}

const nextFlagMap = [
	Visibility.Hidden,
	Visibility.RedFlag,
	Visibility.YellowFlag,
	Visibility.BlueFlag,
	Visibility.GreenFlag,
]
export function flagCell(grid: Grid, x: number, y: number, reverse = false) {
	const cell = get(grid, x, y)
	if (!cell || cell.visibility == Visibility.Visible) return
	const i = nextFlagMap.indexOf(cell?.visibility)
	cell.visibility = nextFlagMap[modWrap(i + (reverse ? -1 : 1), nextFlagMap.length)]
}

export function flagOrToggleCell(grid: Grid, x: number, y: number, visibility: Visibility) {
	const cell = get(grid, x, y)
	if (!cell || cell.visibility == Visibility.Visible) return
	if (cell.visibility == visibility) cell.visibility = Visibility.Hidden
	else cell.visibility = visibility
}
