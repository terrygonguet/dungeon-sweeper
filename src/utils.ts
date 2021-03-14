export function preventDefault<T>(host: T & HTMLElement, e: Event) {
	e.preventDefault()
}

export function stopPropagation<T>(host: T & HTMLElement, e: Event) {
	e.stopPropagation()
}

export function clamp(n: number, min: number, max: number) {
	return Math.max(Math.min(n, max), min)
}

export function randInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min)) + min
}
