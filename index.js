/* @flow */

var fs = require("fs")
var path = require("path")
var express = require("express")
var jade = require("jade")
var uuid = require("uuid")

module.exports = function(pathToWorkingDir){
	var app = express()
	app.locals.path = pathToWorkingDir
	app.locals.config = require(path.resolve(app.locals.path, "config.js"))

	if(app.locals.config.template){
		var templatePath = path.resolve(app.locals.path, app.locals.config.template)
		fs.exists(templatePath, function (exists) {
			if (exists){
				app.locals.templatePath = templatePath
			}
		});
	}



	app.use(express.static(app.locals.path))


	app.locals.slides = {}
	app.locals.less = ""
	for(var key in app.locals.config.tags){
		var tag = app.locals.config.tags[key]

		var slidePath = path.resolve(__dirname, pathToWorkingDir, tag)
		var slideConfig = require(path.resolve(slidePath, "config.js"))

		var slide = require(slideConfig.npmName)(slidePath)
		slide.locals.uuid = "p" + uuid.v4().replace(/[^a-zA-Z0-9]/g, '')
		app.locals.less += " #" + slide.locals.uuid + " { " + slide.less() + " } "
		app.use("/slide/" + slide.locals.uuid, slide)
		app.locals.slides[key] = slide
	}


	// this function provides the HTML code, which one will be displayed to the page
	app.html = function(userConfig) {
		var selectedSlides = []
		for(var i = 0; i < userConfig.tags.length; i++){
			var tag = userConfig.tags[i]
			var slide = app.locals.slides[tag]
			if(slide != undefined){
				selectedSlides.push(slide)
			}
		}

		return jade.compileFile(app.locals.templatePath ? app.locals.templatePath : path.resolve(__dirname + "/views/template.jade"))({
			selectedSlides: selectedSlides
		})
	}

	// here we can return LESS css, which will only effect the page HTML code
	app.less = function(){
		return app.locals.less
	}


	return app
}
