
'use strict';

const Route = require('restify-loader/route');

module.exports = class Jobs extends Route {

	init(){
		console.log = this.debug;
		this.addListeners();
	}

	
	addListeners(){
		this.server.get({
			url: '/v1/jobs',
			validation: {
				resources: {
					limit: {
						isRequired: false,
						min: 1,
						max: 100
					},
					offset: {
						isRequired: false,
						min: 1,
						max: 100
					}
				}
			}
		}, this.getJobs.bind( this ));
	}


	getJobs( req, res, next ) {
		console.log('get jobs');
		res.send( 200 );
	}

}