'use strict'

const PORT = process.env.PORT || 8080

let server = require('restify-loader')({
	dir: __dirname,
	name: 'cuid',
	version: '1.0.0',
	// raven: {
	// 	context: {
	// 		ENV: process.env.ENVIRONMENT || "localhost"
	// 	},
	// 	DSN: process.env.SENTRY_DSN || 'DSN_KEY',
	// },
}, {
	foo: 'bar'
})


// Listen for connections:
server.listen(PORT, () => {
	console.log(`Listening to port: ${PORT}`)
})