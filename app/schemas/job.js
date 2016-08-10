
let mongoose 	= require('mongoose')
let Schema 		= mongoose.Schema
let ObjectId 	= Schema.Types.ObjectId

module.exports = mongoose.model('Job', new Schema({

	name: {
		type: String,
		required: true
	},
	description: String,
	enabled: {
		type: Boolean,
		required: true,
		index: true,
		default: true
	},
	cron: {
		type: String,
		required: true
	},
	environment_vars: {},
	meta: {},
	type: {
		type: String,
		default: 'docker'
	},
	timezone: {
		type: String,
		default: 'America/New_York'
	},
	priority: {
		type: String,
		default: 'normal'
	},
	attempts: {
		type: Number,
		default: 3
	},
	ttl: {
		type: Number,
		default: -1
	},
	created: {
		type: Date,
		default: Date.now
	}

}))
