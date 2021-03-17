import { html, Hybrids, store, UpdateFunctionWithMethods } from "hybrids"
import { discoverCell, LevelModel, Level, flagCell, Visibility, uncoverMines } from "~stores/Level"
import { reset } from "~styles"
import Banner from "~comp/Banner"
import Timer from "~comp/Timer"
import GridCell from "~comp/GridCell"

function leftClick(x: number, y: number) {
	return async function (host: GameHTML & HTMLElement) {
		let lose
		switch (host.state) {
			case "ready":
				host.state = "playing"
				lose = await discoverCell(x, y)
				break
			case "playing":
				lose = await discoverCell(x, y)
				break
		}
		if (lose) {
			host.state = "lost"
			await uncoverMines()
		}
		if (host.level.isGameWon) {
			host.state = "won"
			await uncoverMines()
		}
	}
}

function rightClick(x: number, y: number) {
	return async function (host: GameHTML & HTMLElement, e: MouseEvent) {
		e.preventDefault()
		switch (host.state) {
			case "ready":
				host.state = "playing"
				await flagCell(x, y)
				break
			case "playing":
				await flagCell(x, y)
				break
		}
		if (host.level.isGameWon) host.state = "won"
	}
}

type GameHTML = {
	level: Level
	cells: UpdateFunctionWithMethods<GameHTML>[]
	duration: number
	state: "ready" | "playing" | "won" | "lost"
	timerId: number
	banner: UpdateFunctionWithMethods<GameHTML>
}

const GameHTML: Hybrids<GameHTML> = {
	level: store(LevelModel),
	duration: 0,
	timerId: -1,
	state: {
		observe(host, cur, prev) {
			if (prev == "ready" && cur == "playing") {
				let before = Date.now()
				host.timerId = setInterval(() => {
					host.duration += Date.now() - before
					before = Date.now()
				})
			} else if (prev == "playing") clearInterval(host.timerId)
		},
		connect(host) {
			host.state = "ready"
		},
	},
	cells({ level: { cells }, state }) {
		return cells.map(cell => {
			const visible = cell.visibility == Visibility.Visible
			return html`<ds-cell
				onclick=${leftClick(cell.x, cell.y)}
				oncontextmenu=${rightClick(cell.x, cell.y)}
				cell=${cell}
				won=${state == "won"}
				lost=${state == "lost"}
			></ds-cell>`
		})
	},
	banner: ({ state }) => (["won", "lost"].includes(state) ? html`<ds-banner state=${state}></ds-banner>` : html``),
	render: ({ level, cells, duration, banner }) =>
		html`<ds-timer duration=${duration}></ds-timer>
			<div
				id="grid"
				style=${{
					gridTemplateColumns: `repeat(${level.width}, auto)`,
					gridTemplateRows: `repeat(${level.height}, auto)`,
				}}
			>
				${cells} ${banner}
			</div>
			<style>
				:host {
					margin: auto;
				}
				#grid {
					display: grid;
					border: 1px solid #999;
					position: relative;
				}
			</style>`
			.style(reset)
			.define({ dsTimer: Timer, dsBanner: Banner, dsCell: GridCell }),
}

export default GameHTML
