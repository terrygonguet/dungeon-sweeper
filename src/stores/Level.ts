import { Model, store } from "hybrids"

export type Level = {
	width: number
	height: number
	mines: number[]
	visibility: boolean[]
	isGameWon: boolean
}

export const LevelModel: Model<Level> = {
	width: 0,
	height: 0,
	mines: [0],
	visibility: [false],
	isGameWon({ mines, visibility }: any) {
		return mines.every((c: number, i: number) => (c == 9 ? !visibility[i] : visibility[i]))
	},
}

export function setLevelDimensions({ width = 30, height = 15, difficulty = 0.1 } = {}) {
	const map = Array(width * height).fill(0)
	const visibility = Array(width * height).fill(false)
	let nbMines = Math.floor(width * height * difficulty)

	do {
		const i = Math.floor(Math.random() * width * height)
		if (map[i] == 9) continue
		map[i] = 9
		nbMines--
	} while (nbMines > 0)

	function isMine(x: number, y: number) {
		if (x < 0 || y < 0 || x >= width || y >= height) return 0
		else return map[x + y * width] == 9 ? 1 : 0
	}

	const mines = map.map((c, i) => {
		if (c != 0) return c
		const x = i % width,
			y = Math.floor(i / width)
		return (
			isMine(x + 1, y + 1) +
			isMine(x, y + 1) +
			isMine(x - 1, y + 1) +
			isMine(x + 1, y - 1) +
			isMine(x, y - 1) +
			isMine(x - 1, y - 1) +
			isMine(x + 1, y) +
			isMine(x - 1, y)
		)
	})

	return store.set(LevelModel, { width, height, mines, visibility })
}

export async function discoverCell(i: number) {
	const level = store.get(LevelModel)

	if (level.visibility[i]) return level.mines[i]

	const { mines, visibility, width, height } = level
	const toCheck = new Set<number>()
	const toUncover = new Set<number>()

	toCheck.add(i)

	toCheck.forEach(i => {
		if (i < 0 || i >= width * height || visibility[i]) return
		toUncover.add(i)
		if (mines[i]) return
		const x = i % width,
			y = Math.floor(i / width)
		if (x < width - 1) {
			toCheck.add(x + y * width + 1)
			y < height - 1 && toCheck.add(x + y * width + width + 1)
			y > 0 && toCheck.add(x + y * width - width + 1)
		}
		x > 0 && toCheck.add(x + y * width - 1)
		if (y < height - 1) {
			toCheck.add(x + y * width + width)
			x > 0 && toCheck.add(x + y * width - 1 + width)
			x < width - 1 && toCheck.add(x + y * width + width + 1)
		}
		y > 0 && toCheck.add(x + y * width - width)
	})

	await store.set(LevelModel, { ...level, visibility: visibility.map((c, i) => (toUncover.has(i) ? true : c)) })

	return level.mines[i]
}
