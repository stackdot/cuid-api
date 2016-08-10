
let mongoose 	= require('mongoose')
let Schema 		= mongoose.Schema
let ObjectId 	= Schema.Types.ObjectId

module.exports = mongoose.model('History', new Schema({

	job: {
		type: ObjectId,
		ref: 'Job',
		index: true
	},
	kueJob: {
		type: Number,
		index: true,
		unique: true,
		required: true
	},
	logs: [],
	data: {},
	meta: {},
	state: String,
	created_at: Date,
	promote_at: Date,
	updated_at: Date,
	failed_at: Date,
	started_at: Date,
	raw: {
		type: Schema.Types.Mixed,
		select: false
	},
	created: {
		type: Date,
		default: Date.now
	}

}))
