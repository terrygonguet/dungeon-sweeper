import { noopTag as css } from "~utils"

export const buttons = css`
	.btn {
		padding: 0.25rem 1.5rem;
		cursor: pointer;
		transition-property: background-color, color;
		transition-duration: 0.3s;
		transition-timing-function: ease-in-out;
		font-weight: 700;
		font-size: 1.25rem;
		text-transform: uppercase;
		border: 1px solid transparent;
		text-align: center;
		color: white;
		background: #e6007e;
	}

	.btn:hover {
		background: #ff4daf;
	}
`
