var ioModel = require('../index.js');
var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

describe("suite", function(){

	describe("Environment", function(){

		it("Environment", function(){

			should.exist(ioModel);
			should.exist(ioModel.Model);

		});

	});

	describe("Loading Hypermedia", function(){

		var Model = ioModel.Model;

		it("Can load a hypermedia object from a remote service", function( done ){

			var model = new Model().url('/test-one.json');

			model.on('sync', function(){

				expect(model.get('name')).to.equal('The resource name');
				done();

			}).fetch();

		});

		it("Can reload a hypermedia object from a remote service", function( done ){

			var model = new Model().url('/test-one.json');

			var count = 0;

			model.on('sync', function(model, res){

				count++;

				if(count == 1){

					expect(model).to.equal(model);
					expect(res.body).to.be.ok;

					expect(model.get('name')).to.equal('The resource name');
					// change 'self.href' for the model...
					model.url('/test-one-second.json');
					model.fetch();

				} else if(count == 2){

					expect(model.get('name')).to.equal('Changed resource name');
					done();

				}

			});

			model.fetch();

		});

		it("Fires a sync-error request with status code when the request fails", function( done ){

			var model = new Model().url('/test-for-404');

			model.on('sync-error', function(err, res){

				expect(err).to.equal(404)
				expect(res.body.detail).to.equal('The resource cannot be found');
				done();

			});

			model.fetch();

		});

		it("Deals with ETags correctly", function( done ){

			var model = new Model().url('/etag-test.json');

			// make sure the browser running the tests doesn't try to 
			// help out here. 
			model.__etag = "NOTTHECORRECTETAG";

			var count = 0;

			model.on('sync', function(model, res){

				count++;

				if(count == 1){
				
					expect(model.__etag).to.equal('12341234');
					expect(model.get('name')).to.equal('The resource name');
					// fetch again. Should return a 304.
					model.fetch();

				} else if(count == 2){

					expect(res.status).to.equal(304);
					expect(model.get('name')).to.equal('The resource name');
					done();

				}

			});

			model.fetch();			

		});

	});

	describe("executing commands", function(){

		var Model = ioModel.Model;

		it("Can execute a POST command with form encoding with a callback", function( done ){

			var model = new Model({

				_commands : {
					"post-test": {
						method : 'POST',
						href : "/resource-with-post-endpoint",
						encoding : "x-www-form-urlencoded",
						properties : {
							name : "Test",
							test : [
								"a",
								"b"
							]
						}
					}
				}

			}).url('/test-one.json');

			model.on('sync', function(model, res){

				expect(model.get('name')).to.equal('The resource name');

				model.execute('post-test', function(err, res){

					expect(res.status).to.equal(201);
					expect(res.header.location).to.equal('/new-resource.json');
					expect(res.body.name).to.equal('Test');
					expect(res.body.test).to.deep.equal(['a', 'b']); 
					done();

				});

			}); 

			model.fetch();

		});

		it("Can execute a POST command with JSON encoding with a callback", function( done ){

			var model = new Model({

				_commands : {
					"post-test": {
						method : 'POST',
						href : "/resource-with-post-endpoint",
						properties : {
							name : "Test",
							test : [
								"a",
								"b"
							]
						}
					}
				}

			}).url('/test-one.json');

			model.on('sync', function(model, res){

				expect(model.get('name')).to.equal('The resource name');

				model.execute('post-test', function(err, res){

					expect(res.status).to.equal(201);
					expect(res.header.location).to.equal('/new-resource.json');
					expect(res.body.name).to.equal('Test');
					expect(res.body.test).to.deep.equal(['a', 'b']); 
					done();

				});

			}); 

			model.fetch();

		});

		it("Can execute a command with JSON encoding and automatically resync", function( done ){

			var model = new Model({

				name : "The resource name",
				_commands : {
					"put-test": {
						method : 'PUT',
						href : "/put-endpoint",
						properties : {
							name : "Test",
							test : [
								"a",
								"b"
							]
						}
					}
				}

			}).url('/test-one-second.json');

			model.on('sync', function(model, res){

				expect(model.get('name')).to.equal('Changed resource name');
				done();

			}); 

			model.execute('put-test');

		});

		it("can deal with html-checkbox types, exhibiting correct behaviour", function( done ){

			var model = new Model({

				name : "The resource name",
				_commands : {
					"put-test": {
						method : 'POST',
						href : "/resource-with-checkbox-property",
						properties : {
							test : true,
						},
						schema : {
							test : {
								type : "html-checkbox",

								value : "non-default-true-value"
							}
						}
					}
				}

			}).url('/test-one-second.json');

			model.execute('put-test', function(err, res){

				expect(res.body.test).to.equal("non-default-true-value");

				model.setCommandProperty('put-test.test', false);

				model.execute('put-test', function(err, res){

					expect(res.body.test).to.equal('');

					model.setCommandProperty('put-test.test', false);

					done();

				});

			});

		});

	});

});