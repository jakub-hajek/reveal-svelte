import { flavors } from '@catppuccin/palette';

const mocha = flavors.mocha.colors;

export const theme = {
	base: mocha.base.hex,
	surface0: mocha.surface0.hex,
	surface1: mocha.surface1.hex,
	surface2: mocha.surface2.hex,
	overlay0: mocha.overlay0.hex,
	overlay1: mocha.overlay1.hex,
	overlay2: mocha.overlay2.hex,
	text: mocha.text.hex,
	subtext0: mocha.subtext0.hex,
	subtext1: mocha.subtext1.hex,
	rosewater: mocha.rosewater.hex,
	flamingo: mocha.flamingo.hex,
	pink: mocha.pink.hex,
	mauve: mocha.mauve.hex,
	red: mocha.red.hex,
	maroon: mocha.maroon.hex,
	peach: mocha.peach.hex,
	yellow: mocha.yellow.hex,
	green: mocha.green.hex,
	teal: mocha.teal.hex,
	sky: mocha.sky.hex,
	sapphire: mocha.sapphire.hex,
	blue: mocha.blue.hex,
	lavender: mocha.lavender.hex
} as const;

export type ThemeColor = keyof typeof theme;
