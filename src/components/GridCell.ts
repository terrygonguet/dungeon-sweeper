import { html, Hybrids } from "hybrids"
import { Cell, Visibility } from "~stores/Level"
import { reset } from "~styles"

function cellLabel({ mine, visibility }: Cell) {
	switch (visibility) {
		case Visibility.Visible:
			switch (mine) {
				case 0:
					return ""
				case 9:
					return "💣"
				default:
					return mine
			}
		case Visibility.Flagged:
			return "🚩"
		case Visibility.Hidden:
			return ""
	}
}

function cellColor({ mine }: Cell) {
	return ["#0eff1e", "#12d2ff", "#1489ff", "#1641ff", "#3618ff", "#7f1bff", "#c71dff", "#ff1ff1"][mine - 1]
}

type GridCell = {
	cell: Cell
	visible: boolean
	won: boolean
	lost: boolean
}

const GridCell: Hybrids<GridCell> = {
	cell: null,
	won: false,
	lost: false,
	visible: ({ cell }) => cell.visibility == Visibility.Visible,
	render: ({ cell, visible, lost, won }) =>
		html`<button
				class=${{
					cell: true,
					["cell-" + cell.mine]: visible,
					visible: visible,
					won,
					lost,
				}}
				style=${{ color: cellColor(cell) }}
			>
				${cellLabel(cell)}
			</button>
			<style>
				:host {
					line-height: 0;
				}
				.cell {
					border: 1px solid #999;
					height: 1.7rem;
					width: 1.7rem;
					background: #ccc;
					transition: background-color 100ms ease-out;
					outline: none;
				}
				.cell:hover {
					background: #eee;
				}
				.cell-9.won {
					background: lightgreen;
				}
				.cell-9.lost {
					background: red;
				}
				.visible {
					background: white;
				}
			</style>`.style(reset),
}

export default GridCell
