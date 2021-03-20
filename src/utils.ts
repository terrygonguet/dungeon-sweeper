import { Descriptor } from "hybrids"

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

export function pickRandom<T>(arr: T[]) {
	return arr[randInt(0, arr.length)]
}

export function modWrap(a: number, b: number) {
	return (a + Math.ceil(-a / b) * b) % b
}

export function noopTag(strings: TemplateStringsArray, ...args: any[]) {
	return strings.reduce((acc, cur, i) => acc + cur + (args[i] ?? ""), "")
}

export function querySelectorProp<E, V>(query: string): Descriptor<E, V> {
	return {
		get(host: any) {
			const target = host.render()
			return target?.querySelector(query) as V
		},
	}
}

export function observedProp<E, V>(initial: V, observe: (host: E, value: V, lastVal: V) => void): Descriptor<E, V> {
	return {
		get: (_, value) => value ?? initial,
		set: (_, value) => value,
		observe,
	}
}
