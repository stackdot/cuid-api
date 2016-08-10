
'use strict';

const Route = require('restify-loader/route')
const lodash = require('lodash')
const CronJob = require('cron').CronJob

module.exports = class Jobs extends Route {

	init(){
		this.addListeners()
	}

	
	addListeners(){

		let self = this
		this.debug('added listeners'.info);

		// Get all jobs:
		this.server.get({
			url: '/v1/jobs',
			validation: {
				queries: {
					limit: {
						isRequired: false,
						min: 1, max: 100
					},
					offset: {
						isRequired: false,
						min: 1, max: 1000
					}
				}
			}
		}, this.getJobs.bind( this ))


		// Get single job:
		this.server.get({
			url: '/v1/jobs/:id',
			validation: {
				resources: {
					id: {
						isRequired: true
					}
				}
			}
		}, this.middleware.jobs.getJob( self.schemas ), this.getJob.bind( this ))


		// Create new job:
		this.server.post({
			url: '/v1/jobs',
			validation: {
				resources: self.jobValidator()
			}
		}, this.postJob.bind( this ))


		// Update a job:
		this.server.put({
			url: '/v1/jobs/:id',
			validation: {
				resources: self.jobValidator( true )
			}
		}, this.middleware.jobs.getJob( self.schemas ), this.updateJob.bind( this ))


	}


	// Validation schema for POSTS / PUTS
	jobValidator( isUpdating = false ){
		let vals = {
			name: {
				isRequired: true,
			},
			attempts: {
				isRequired: false,
				isNumeric: true
			},
			priority: {
				isRequired: false,
				isIn: [ 'low', 'normal', 'medium', 'high', 'critical' ]
			},
			ttl: {
				isRequired: false,
				isNumeric: true
			},
			cron: {
				isRequired: true,
				is: function( key ){
					try {
						new CronJob( this.req.params[key], () => {
							return true
						})
					} catch( e ){
						return true
					}
				}
			},
			environment_vars: {
				required: false,
			},
			enabled: {
				isRequired: false,
				isBoolean: true
			},
			meta: {
				isRequired: false
			}
		}
		// If we are updating nothing is required, since 
		// we may only be senting 1 thing to update:
		if(isUpdating) lodash.each( vals, ( val, key ) => vals[key].isRequired = false ) 
		return vals
	}


	// Create a new job:
	// TODO: Add new job to the CRON scheduler
	postJob( req, res, next ){
		let Job = new this.schemas.job( req.params )
		Job.save(( err ) => {
			if(err) return next( err )
			this._events.emit( 'newJob', Job )
			res.send( Job )
		})
	}


	// Update a job:
	// TODO: Update the CRON scheduler cron
	updateJob( req, res, next ){
		let safeParams = lodash.pick( req.params, [
			'name',
			'description',
			'enabled',
			'cron',
			'environment_vars',
			'meta',
			'priority',
			'ttl',
			'attempts'
		])
		lodash.each( safeParams, ( value, param ) => req.job.set( param, value ) )
		req.job.save(( err ) => {
			if(err) return next( err )
			res.send( req.job )	
		})
	}


	// Get all jobs:
	getJobs( req, res, next ) {
		let search = this.schemas.job.find({})
		if(req.params.offset)
			search.offset( req.params.offset )
		if(req.params.limit)
			search.limit( req.params.limit )
		search.exec(( err, job ) => {
			if( err ) return next( err )
			res.send( job )
		})
	}


	// Get a specific job:
	getJob( req, res, next ){
		res.send( req.job )
	}

}


