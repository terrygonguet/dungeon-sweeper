/**
 * @template T
 * @param {HTMLElement & T} host
 * @param {Event} e
 */
export function preventDefault(host, e) {
	e.preventDefault()
}

/**
 * @template T
 * @param {HTMLElement & T} host
 * @param {Event} e
 */
export function stopPropagation(host, e) {
	e.stopPropagation()
}

/**
 * @param {number} n
 * @param {number} min
 * @param {number} max
 */
export function clamp(n, min, max) {
	return Math.max(Math.min(n, max), min)
}
