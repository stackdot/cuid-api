

module.exports = {

	getJob( schemas, param = 'id' ){
		return ( req, res, next ) => {
			schemas.job.findOne({ _id: req.params[ param ] }).exec(( err, job ) => {
				if(err) return next( err )
				req.job = job
				next()
			})
		}
	}

}