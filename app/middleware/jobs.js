

module.exports = {

	getJob( schemas, param = 'id' ){
		return ( req, res, next ) => {
			schemas.job.findOne({ _id: req.params[ param ] }).exec(( err, job ) => {
				if(err) return next( err )
				req.job = job
				next()
			})
		}
	},


	getHistory( schemas, param = 'historyId', selectLogs = false ){
		return ( req, res, next ) => {
			let query = schemas.history.findOne({ _id: req.params[ param ] })
			if( selectLogs == true )
				query = query.select('+logs')
			query.exec(( err, history ) => {
				if(err) return next( err )
				req.history = history
				next()
			})
		}
	}


}
