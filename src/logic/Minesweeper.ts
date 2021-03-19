import { randInt } from "~utils"

export enum Visibility {
	Hidden,
	Visible,
	Flagged,
}

export type Cell = {
	x: number
	y: number
	mine: number
	visibility: Visibility
}

export type Grid = {
	width: number
	height: number
	[x: number]: {
		[y: number]: Cell
	}
}

export function setCell(grid: Grid, x: number, y: number, cell: Cell) {
	if (!grid[x]) grid[x] = []
	grid[x][y] = cell
	return grid
}

export function setCellVisibility(grid: Grid, x: number, y: number, visibility: Visibility) {
	const cell = get(grid, x, y)
	if (cell) cell.visibility = visibility
}

export function get(grid: Grid, x: number, y: number): Cell | undefined {
	return grid[x]?.[y]
}

function _makeGrid({ width = 30, height = 20, difficulty = 0.1 } = {}) {
	const grid: Grid = { width, height }
	let nbMines = Math.ceil(width * height * difficulty)

	do {
		const x = randInt(0, width),
			y = randInt(0, height)
		if (get(grid, x, y)) continue
		setCell(grid, x, y, { x, y, mine: 9, visibility: Visibility.Hidden })
		nbMines--
	} while (nbMines > 0)

	for (let x = 0; x < width; x++) {
		if (!grid[x]) grid[x] = {}
		for (let y = 0; y < height; y++) {
			if (grid[x][y]) continue
			const mine =
				(get(grid, x + 1, y + 1)?.mine == 9 ? 1 : 0) +
				(get(grid, x + 1, y)?.mine == 9 ? 1 : 0) +
				(get(grid, x + 1, y - 1)?.mine == 9 ? 1 : 0) +
				(get(grid, x - 1, y + 1)?.mine == 9 ? 1 : 0) +
				(get(grid, x - 1, y)?.mine == 9 ? 1 : 0) +
				(get(grid, x - 1, y - 1)?.mine == 9 ? 1 : 0) +
				(get(grid, x, y + 1)?.mine == 9 ? 1 : 0) +
				(get(grid, x, y - 1)?.mine == 9 ? 1 : 0)
			grid[x][y] = { x, y, mine, visibility: Visibility.Hidden }
		}
	}

	return grid
}

export function makeGrid(params: { width: number; height: number; difficulty: number }, x: number, y: number) {
	let grid
	do {
		grid = _makeGrid(params)
	} while (get(grid, x, y)?.mine == 9)
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

export function uncoverFrom(
	{ grid, width, height }: { grid: Grid; width: number; height: number },
	x: number,
	y: number,
	onStep: StepCallback,
) {
	const cell = get(grid, x, y)

	if (cell?.mine) {
		setCellVisibility(grid, x, y, Visibility.Visible)
		onStep([cell])
	} else {
		const toCheck = new Set<Cell>()

		function step() {
			const toUncover = new Set<Cell>()

			for (const cell of Array.from(toCheck)) {
				if (!cell) continue
				const { x, y } = cell
				if (cell?.visibility == Visibility.Hidden) toUncover.add(cell)
				if (cell?.mine || x < 0 || y < 0 || x >= width || y >= height) continue

				toCheck.add(get(grid, x + 1, y + 1) as Cell)
				toCheck.add(get(grid, x - 1, y + 1) as Cell)
				toCheck.add(get(grid, x + 1, y - 1) as Cell)
				toCheck.add(get(grid, x - 1, y - 1) as Cell)
				toCheck.add(get(grid, x, y + 1) as Cell)
				toCheck.add(get(grid, x, y - 1) as Cell)
				toCheck.add(get(grid, x + 1, y) as Cell)
				toCheck.add(get(grid, x - 1, y) as Cell)
			}

			toUncover.forEach(cell => (cell.visibility = Visibility.Visible))
			if (toUncover.size > 0) {
				setTimeout(step, 50)
				onStep(Array.from(toUncover))
			}
		}

		toCheck.add(cell as Cell)
		step()
	}

	return cell?.mine == 9
}

export function uncoverNextTo(
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
		nbFlagged = neighbours.reduce((acc, cur) => acc + (cur?.visibility == Visibility.Flagged ? 1 : 0), 0)

	if (nbFlagged != cell?.mine) return cell?.mine == 9

	const results = neighbours
		.filter(cell => cell.visibility != Visibility.Flagged)
		.map(({ x, y }) => uncoverFrom(host, x, y, onStep))

	return results.some(Boolean)
}

export function isGameWon(grid: Grid) {
	for (let x = 0; x < grid.width; x++) {
		for (let y = 0; y < grid.height; y++) {
			const cell = grid[x][y]
			if (cell.mine != 9 && cell.visibility != Visibility.Visible) return false
		}
	}
	return true
}

export function uncoverAllMines(grid: Grid) {
	for (let x = 0; x < grid.width; x++) {
		for (let y = 0; y < grid.height; y++) {
			const cell = grid[x][y]
			if (cell.mine == 9) cell.visibility = Visibility.Visible
		}
	}
}

export function flagCell(grid: Grid, x: number, y: number) {
	const cell = get(grid, x, y)
	switch (cell?.visibility) {
		case Visibility.Flagged:
			cell.visibility = Visibility.Hidden
			break
		case Visibility.Hidden:
			cell.visibility = Visibility.Flagged
			break
	}
}
