"use strict";

var Widget = require('./../ui/widget').Widget,
    util = require('../util');

var $ = util.$;
var _t = util.gettext;

var NS = 'annotator-addermp';


// Adder shows and hides an annotation adder button that can be clicked on to
// create an annotation.
var mpAdder = Widget.extend({

    constructor: function (options) {
        Widget.call(this, options);

        this.ignoreMouseup = false;
        this.annotation = null;

        this.onCreate = this.options.onCreate;

        var self = this;
        this.element

        // MP: add menu for create claim and add data

        // .on("click." + NS, 'button', function (e) {
        //     self._onClick(e);
        // })
            .on("click." + NS, 'li', function (e) {
                self._onClick(e);
            })
        // .on("mousedown." + NS, 'button', function (e) {
        //     self._onMousedown(e);
        // });
            .on("mousedown." + NS, 'li', function (e) {
                self._onMousedown(e);
            });

        this.document = this.element[0].ownerDocument;
        $(this.document.body).on("mouseup." + NS, function (e) {
            self._onMouseup(e);
        });
    },

    destroy: function () {
        this.element.off("." + NS);
        $(this.document.body).off("." + NS);
        Widget.prototype.destroy.call(this);
    },

    // Public: Load an annotation and show the adder.
    //
    // annotation - An annotation Object to load.
    // position - An Object specifying the position in which to show the editor
    //            (optional).
    //
    // If the user clicks on the adder with an annotation loaded, the onCreate
    // handler will be called. In this way, the adder can serve as an
    // intermediary step between making a selection and creating an annotation.
    //
    // Returns nothing.
    load: function (annotation, position) {
        this.annotation = annotation;
        this.show(position);
    },

    // Public: Show the adder.
    //
    // position - An Object specifying the position in which to show the editor
    //            (optional).
    //
    // Examples
    //
    //   adder.show()
    //   adder.hide()
    //   adder.show({top: '100px', left: '80px'})
    //
    // Returns nothing.
    show: function (position) {
        if (typeof position !== 'undefined' && position !== null) {
            this.element.css({
                top: position.top,

                // avoid overlapping with drug mention editor
                left: position.left + 35
            });
        }
        Widget.prototype.show.call(this);
    },

    // Event callback: called when the mouse button is depressed on the adder.
    //
    // event - A mousedown Event object
    //
    // Returns nothing.
    _onMousedown: function (event) {
        // Do nothing for right-clicks, middle-clicks, etc.
        if (event.which > 1) {
            return;
        }
        event.preventDefault();
        // Prevent the selection code from firing when the mouse button is
        // released
        this.ignoreMouseup = true;
    },

    // Event callback: called when the mouse button is released
    //
    // event - A mouseup Event object
    //
    // Returns nothing.
    _onMouseup: function (event) {
        // Do nothing for right-clicks, middle-clicks, etc.
        if (event.which > 1) {
            return;
        }

        // Prevent the selection code from firing when the ignoreMouseup flag is
        // set
        if (this.ignoreMouseup) {
            event.stopImmediatePropagation();
        }
    },

    // Event callback: called when the adder is clicked. The click event is used
    // as well as the mousedown so that we get the :active state on the adder
    // when clicked.
    //
    // event - A mousedown Event object
    //
    // Returns nothing.
    _onClick: function (event) {

        console.log("mp adder: _onclick called");
        // close MP menu after click action 
        $('.mp-main-menu').hide();

        // Do nothing for right-clicks, middle-clicks, etc.
        if (event.which > 1) {
            return;
        }
        event.preventDefault();

        // Hide the MP adder
        this.hide();
        // Hide drug mention adder and DDI adder
        $('.annotator-adderhl').removeClass().addClass('annotator-adderhl annotator-hide');
        $('.annotator-adderddi').removeClass().addClass('annotator-adderhl annotator-hide');

        this.ignoreMouseup = false;

        // Create a new annotation

        if (this.annotation !== null && typeof this.onCreate === 'function') {
            this.annotation.annotationType = "MP";
            this.onCreate(this.annotation, event);
        }
    }
});


mpAdder.template = [
    '<div class="annotator-addermp annotator-hide">',
    //'<button type="button" title="MP" onclick="showright(),editorload()">' + _t('Annotate') + '</button>', 

    // MP: add menu for create claim and add data
    '<button class="mp-menu-btn" type="button">' + _t('Annotate') + '</button>',
    '<ul class="mp-main-menu" style="display: none;">',
    '<li class="mp-main-menu-1" onclick="showright(),editorload()">',
    'create claim',
    '</li>',
    '<li class="mp-main-menu-2">',
    'add data for',
    '<ul class="mp-sub-menu-2" style="display: none;">',
    '<li><a href="#">claim1</a></li>',
    '<li><a href="#">claim2</a></li>',
    '<li><a href="#">claim3</a></li>',
    '</ul>',
    '</li>',
    '</ul>',


    '</div>'
].join('\n');

// Configuration options
mpAdder.options = {
    // Callback, called when the user clicks the adder when an
    // annotation is loaded.
    onCreate: null
};

exports.mpAdder = mpAdder;

