import { html, Hybrids } from "hybrids"
import { TrapColor, trapFlagMap, Visibility } from "~logic/Minesweeper"
import { reset } from "~styles"
import { noopTag as css, observedProp } from "~utils"

export type ZoomEvent = CustomEvent<{ delta: number }>

export type ToolChangeEvent = CustomEvent<{ tool: Tool }>

export type Tool = Visibility | "pointer"

function zoomIn(host: ResponsiveControls & HTMLElement, e: Event) {
	host.dispatchEvent(new CustomEvent("zoom", { detail: { delta: -5 } }) as ZoomEvent)
}

function zoomOut(host: ResponsiveControls & HTMLElement, e: Event) {
	host.dispatchEvent(new CustomEvent("zoom", { detail: { delta: 5 } }) as ZoomEvent)
}

function handleToolChange(tool: Tool) {
	return function (host: ResponsiveControls & HTMLElement, e: Event) {
		host.dispatchEvent(new CustomEvent("toolchange", { detail: { tool } }))
	}
}

const style = css`
	:host {
		padding: 1rem;
		display: flex;
		justify-content: space-evenly;
		align-items: center;
	}
	.icon-btn {
		padding: 0.5rem;
	}
	.icon {
		height: 1.5rem;
	}
	.flag {
		background-color: var(--color);
		height: 2.5rem;
		width: 2.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 9999px;
		border: 3px solid transparent;
	}
	.selected {
		border-color: black;
	}
	input[type="radio"] {
		display: none;
	}

	@media screen and (min-width: 768px) {
		:host {
			display: none;
		}
	}
`

type ResponsiveControls = {
	colors: TrapColor[]
	tool: Tool
}

const ResponsiveControls: Hybrids<ResponsiveControls> = {
	colors: [TrapColor.Red, TrapColor.Yellow, TrapColor.Green, TrapColor.Blue],
	tool: "pointer",
	render: ({ colors, tool }) =>
		html`
			<button class="icon-btn" onclick=${zoomIn}>
				<img src="svg/zoom-in.svg" class="icon" alt="zoom in icon" />
			</button>
			<button class="icon-btn" onclick=${zoomOut}>
				<img src="svg/zoom-out.svg" class="icon" alt="zoom out icon" />
			</button>
			<label class=${{ flag: "flag", selected: tool == "pointer" }} style="--color: #ccc">
				<input
					type="radio"
					value="pointer"
					checked=${tool == "pointer"}
					name="tool"
					onchange=${handleToolChange("pointer")}
				/>
				<img src="svg/target.svg" class="icon" alt="target icon" />
			</label>
			${colors.map(color => {
				const vis = trapFlagMap.get(color)
				return html`<label class=${{ flag: "flag", selected: tool == vis }} style="--color: ${vis}">
					<input
						type="radio"
						checked=${tool == vis}
						name="tool"
						onchange=${handleToolChange(vis ?? "pointer")}
					/>🚩
				</label>`
			})}
		`.style(reset, style),
}

export default ResponsiveControls
