var _ = require('underscore');
var Events = require('backbone-events');
var dom = require('dom');

var HyperboneForm = function( control ){

  this.control = control;
  this.refs = {};

  if(control){

    this.html = dom( document.createDocumentFragment() ).append(this.traverse( this.control, 'form' ));    

  }

	return this;

};

var validElements = ["fieldset", "legend", "input", "textarea", "select", "optgroup", "option", "button", "datalist", "keygen", "output"];

HyperboneForm.prototype = {

	form : function( control, options ){



	},

	traverse : function( node, name ){

		var frag = (name ? dom('<'+ name +'></' + name + '>') :  dom( document.createDocumentFragment() ) );

		var attr = node.models || node.attributes;

		_.each(attr, function(obj,name){

           if(_.isObject(obj) && _.indexOf(validElements, name) !== -1){

               frag.append( this.traverse(obj, name) );

           }else if(_.isObject(obj)){ // any other object we recurse with a document fragment not a node

               frag.append( this.traverse(obj) );

           }else if(name==="_text"){

               frag.append( dom( document.createTextNode(obj) ) );

           }else if(name!=="_label"){

              if(name==="name"){
                
                if(!this.refs[obj]){
                  this.refs[obj] = {
                    models : [],
                    partials : frag
                  };

                }else{

                    this.refs[obj].partials.els.push(frag.els[0]);
                }
                
                this.refs[obj].models.push( node );
              }

              frag.attr(name, obj);

           }

		}, this);

		return frag;

	},

  models : function( name ){

    if(this.refs[name]){

      if(this.refs[name].models.length === 1){

        return this.refs[name].models[0];

      }else{

        return this.refs[name].models;

      }

    }

    return this;
  },

  partials : function( name ){

    if(this.refs[name]){

      if(this.refs[name].partials.length === 1){

        return this.refs[name].partials[0];

      }else{

        return this.refs[name].partials;

      }

    }

    return this;

  }

};

module.exports.HyperboneForm = HyperboneForm;