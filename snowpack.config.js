// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
	mount: {
		src: "/",
		static: "/",
	},
	alias: {
		"~styles": "./src/styles",
		"~comp": "./src/components",
		"~stores": "./src/stores",
		"~logic": "./src/logic",
		"~utils": "./src/utils.js",
	},
	plugins: ["@snowpack/plugin-postcss"],
	packageOptions: {
		/* ... */
	},
	devOptions: {
		port: 8080,
		open: "none",
	},
	buildOptions: {
		/* ... */
	},
}
