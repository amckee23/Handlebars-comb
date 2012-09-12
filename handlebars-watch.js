/*
* NODE.JS file to 'watch' the specified directory and create handlebar templates
* from elements with id'd begining with:  templatePrefix;
*
* This should:
* Create precompiled Template
* Remove templating from source
* Include new template file in the souce
*
* This will NOT
* Run the template on load instead the user should run:
* $(<ELEMENT>).html(precompiled(data));
* Where precompiled is the variable name of the template created by this script
*
* NOTE:
* All templates should be contained within an element with ID = <templatePrefix>
* REQUIRES:
* npm install watch
* npm install yui
* npm install jsdom
*
* KTHXBI
*/

var HANDLEBARCOMB = HANDLEBARCOMB || { };

//Program wide settings
HANDLEBARCOMB.PARAMS = {
	dirToWatch : './www',
	templatePrefix : 'template',
	fileTypesToMonitor : '.html',
	//jQueryLocation : 'http://code.jquery.com/jquery-1.7.min.js',
	jQueryLocation : './www/js/vendor/jquery/jquery.min.js',
	templateExtension : ".js",
	templateOutputDirectory : "www/js/templates/",
	sourceOutputDirectory : "www/source/"
};

var fs = require("fs");
var watch = require('watch');
var Handlebars = require('yui/handlebars').Handlebars;
var jsdom = require("jsdom");

 //NOTE this currently fires on ALL file changes
 //Modify to only fire on the file types to monitor and remove the conditional
 watch.createMonitor(HANDLEBARCOMB.PARAMS.dirToWatch, function (monitor) {
    monitor.files[HANDLEBARCOMB.PARAMS.fileTypesToMonitor];

    monitor.on("changed", function (file, curr, prev) {
    if (file.indexOf(HANDLEBARCOMB.PARAMS.fileTypesToMonitor) != -1 && file.indexOf(HANDLEBARCOMB.PARAMS.sourceOutputDirectory) == -1) {
		HANDLEBARCOMB.readHTML(file);
	}

    });
  });


 /*
 * Read html file from source as ascii and use jsdom to create a DOM with jquery included
 */
 HANDLEBARCOMB.readHTML = function(file) {
	console.log('Change in file ' + file);
	fs.readFile(file, 'ascii', function (err, data) {
		if (err) throw err;
		jsdom.env(data, [HANDLEBARCOMB.PARAMS.jQueryLocation], function(errors, window) {
			HANDLEBARCOMB.processTemplate(window, file);
		});
	});
 };

 /*
 * Use the YUI version of Handlebars to precompile the template
 */
 HANDLEBARCOMB.createTemplate = function(string) {
	return Handlebars.precompile(string);
 };

 /*
 * Create the precompiled template and update source file
 */
 HANDLEBARCOMB.processTemplate = function(window, file) {
	window.$( 'div[id^="' + HANDLEBARCOMB.PARAMS.templatePrefix + '"]').each(function(index){
		var element = window.$(this);
		var parent = element.parent();
		var template = HANDLEBARCOMB.createTemplate(element.html());
		//TODO THIS VAR SHOULD BE UNIQUE AND ALSO REPLICATIBLE IE
		//SHOULD USE THE ID OF THE ELEMENT BEING CONVERTED TO A TEMPLATE
		template = "var precompiled = " + template;
		var templatename = element.attr('id') + HANDLEBARCOMB.PARAMS.templateExtension;
		HANDLEBARCOMB.writeTemplate(templatename, template);
		//TODO ADD SCript include here
		var head = window.document.getElementsByTagName('head')[0];
		console.log(head);
		head.appendChild("<script src='" + HANDLEBARCOMB.PARAMS.templateOutputDirectory + templatename + ".js'></script>");
		var source = window.document.innerHTML;
		HANDLEBARCOMB.writeSource(HANDLEBARCOMB.getFileName(file), source);
	});
 };

 /*
 * Write the precompiled template to file
 */
 HANDLEBARCOMB.writeTemplate = function(templatename, string) {
	fs.writeFile(HANDLEBARCOMB.PARAMS.templateOutputDirectory+templatename, string, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("New Template Created : " + HANDLEBARCOMB.PARAMS.templateOutputDirectory + templatename);
    }
});
 };

/*
* Write the updated Source html page without the template to file
*/
HANDLEBARCOMB.writeSource = function(filename, string) {
	fs.writeFile(HANDLEBARCOMB.PARAMS.sourceOutputDirectory+filename, string, function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log("new HTML source page created : " + HANDLEBARCOMB.PARAMS.sourceOutputDirectory + filename);
		}
	});
};

/*
* Get the last part of the path from the input file
* This should be the file name
*/
HANDLEBARCOMB.getFileName = function(path) {
	var fileNameIndex = path.lastIndexOf("/") + 1;
	return path.substr(fileNameIndex);
};