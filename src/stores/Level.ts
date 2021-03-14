import { Model, store } from "hybrids"
import { randInt } from "../utils"

enum Visibility {
	Hidden,
	Visible,
	Flagged,
}

export type Level = {
	width: number
	height: number
	cells: Cell[]
	isGameWon: boolean
}

export type Cell = {
	x: number
	y: number
	visibility: Visibility
	mine: number
}

export const CellModel: Model<Cell> = {
	id: true,
	x: -1,
	y: -1,
	visibility: Visibility.Hidden,
	mine: 0,
}

export const LevelModel: Model<Level> = {
	width: 0,
	height: 0,
	cells: [CellModel],
	isGameWon({ cells }: Level) {
		return cells.every(({ mine, visibility }) =>
			mine == 9 ? isFlaggedOrHidden(visibility) : isVisible(visibility),
		)
	},
}

export function isFlaggedOrHidden(visibility?: Visibility) {
	return visibility == Visibility.Hidden || visibility == Visibility.Flagged
}

export function isVisible(visibility?: Visibility) {
	return visibility == Visibility.Visible
}

function makeGet(cells: Cell[]) {
	return function get(x: number, y: number) {
		return cells.find(cell => cell.x == x && cell.y == y)
	}
}

export function setLevelDimensions({ width = 30, height = 15, difficulty = 0.1 } = {}) {
	let nbMines = Math.floor(width * height * difficulty)
	const cells: Cell[] = [],
		get = makeGet(cells)

	function isMine(x: number, y: number) {
		return get(x, y)?.mine == 9 ? 1 : 0
	}

	do {
		const x = randInt(0, width),
			y = randInt(0, height)
		if (get(x, y)) continue
		cells.push({ mine: 9, visibility: Visibility.Hidden, x, y })
		nbMines--
	} while (nbMines > 0)

	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			if (get(x, y)) continue
			const n =
				isMine(x + 1, y + 1) +
				isMine(x, y + 1) +
				isMine(x - 1, y + 1) +
				isMine(x + 1, y - 1) +
				isMine(x, y - 1) +
				isMine(x - 1, y - 1) +
				isMine(x + 1, y) +
				isMine(x - 1, y)
			cells.push({ mine: n, visibility: Visibility.Hidden, x, y })
		}
	}

	cells.sort((a, b) => (a.y == b.y ? a.x - b.x : a.y - b.y))

	return store.set(LevelModel, { width, height, cells })
}

export async function discoverCell(x: number, y: number) {
	const level = store.get(LevelModel),
		{ cells, width, height } = level,
		get = makeGet(cells),
		cell = get(x, y)

	if (isVisible(cell?.visibility)) return cell?.mine

	const toCheck = new Set<string>()
	const toUncover = new Set<string>()

	function id(x: number, y: number) {
		return x + " " + y
	}

	toCheck.add(id(x, y))

	toCheck.forEach(pos => {
		const [x, y] = pos.split(" ").map(n => parseInt(n))
		toUncover.add(pos)
		if (get(x, y)?.mine || x < 0 || y < 0 || x >= width || y >= height) return
		toCheck.add(id(x + 1, y + 1))
		toCheck.add(id(x, y + 1))
		toCheck.add(id(x - 1, y + 1))
		toCheck.add(id(x + 1, y - 1))
		toCheck.add(id(x, y - 1))
		toCheck.add(id(x - 1, y - 1))
		toCheck.add(id(x + 1, y))
		toCheck.add(id(x - 1, y))
	})

	await store.set(LevelModel, {
		...level,
		cells: cells.map(cell =>
			toUncover.has(id(cell.x, cell.y)) ? { ...cell, visibility: Visibility.Visible } : cell,
		),
	})

	return cell?.mine
}
