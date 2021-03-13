import { Model } from "hybrids"

type Level = {
	width: number
	height: number
	mines: number[]
	visibility: boolean[]
	isGameWon: boolean
}

type LevelModel = Model<Level>
