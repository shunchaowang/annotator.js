"use strict";
var Widget = require('./../ui/widget').Widget;
var util = require('../util');
var Template = require('./template').Template;
var $ = util.$;
var Range = require('xpath-range').Range;
var _t = util.gettext;
var Promise = util.Promise;
var NS = "annotator-editor";

// bring storage in
var HttpStorage = require('../storage').HttpStorage;

// storage query options 
var queryOptStr = '{"emulateHTTP":false,"emulateJSON":false,"headers":{},"prefix":"' + config.protocal + '://' + config.apache2.host + ':' + config.apache2.port + '/annotatorstore","urls":{"create":"/annotations","update":"/annotations/{id}","destroy":"/annotations/{id}","search":"/search"}}';

// id returns an identifier unique within this session
var id = (function () {
    var counter;
    counter = -1;
    return function () {
        return counter += 1;
    };
}());



// preventEventDefault prevents an event's default, but handles the condition
// that the event is null or doesn't have a preventDefault function.
function preventEventDefault(event) {
    if (typeof event !== 'undefined' &&
        event !== null &&
        typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
}


// Public: Creates an element for editing annotations.
//var mpEditor = exports.mpEditor = Editor.extend({
var ddiEditor = exports.ddiEditor = Widget.extend({

    constructor: function (options) {
        Widget.call(this, options);
        var editorSelf = this;
        this.fields = [];
        this.annotation = {};
        console.log("[INFO] mpeditor - constructor");

        if (this.options.defaultFields) {

            this.addField({
                load: function (field, annotation, annotations) {               

                    var claim = annotation.argues;

                    // load MP Claim
                    if(currFormType == "claim"){
                        
                        // clean claim editor
                        cleanClaimForm();
                
                        //--------------generate quote-----------------
                        var childrenInQuote = $(".annotator-currhl"); // when highlighting in red, get all text nodes by class name annotator-currhl
                        var quoteobject = $("<div id='quotearea'/>"); // quote area as DOM obj

                        //find drugs which only be highlighted in this claim
                        var list = []; //store drug name in this quote
                        var listid = []; //store corresponding drug index in this quote


                        //----------------generate drug dropdown list---------------
                        var flag = 0;
                        //check drug list
                        var allHighlightedDrug = [];
                        var anns = annotations.slice();

                        for (var i = 0, len = anns.length; i < len; i++) {
                            if (anns[i].annotationType == "DrugMention") {

                                allHighlightedDrug.push(anns[i].argues.hasTarget.hasSelector.exact);
                            }
                        }

                        var quoteDiv = generateQuote(annotation.argues.hasTarget.hasSelector.exact, allHighlightedDrug, list, listid);
                        $(quoteobject).append(quoteDiv);
                        var quotecontent = $(quoteobject).html();
                        $('#quote').append(quoteobject);

                        //check if drug in store (case sensitive)
                        for(var i=0;i<list.length;i++) {
                            if(allHighlightedDrug.indexOf(list[i].trim())==-1) {
                                list.splice(i, 1);
                                listid.splice(i,1);
                            }
                        }

                        //add N/A to drug2 drop down list
                        $('#Drug2').append($('<option>', {
                            value: "N/A",
                            text: "N/A"
                        }));

                        //add drugs to drug1 and drug2 drop down list
                        var index = 0;
                        for (var i = 0, len = list.length; i < len; i++) {
                            // avoid replacing span itself add to dropdown box
                            $('#Drug1').append($('<option>', {
                                value: list[i] + "_" + listid[i],
                                text: list[i]
                            }));
                            $('#Drug2').append($('<option>', {
                                value: list[i] + "_" + listid[i],
                                text: list[i]
                            }));
                            flag = flag + 1;
                        }
                        if (claim.qualifiedBy != undefined) {
                            if (!list.includes(claim.qualifiedBy.drug1) && claim.qualifiedBy.drug1 != undefined) {
                                $('#Drug1').append($('<option>', {
                                    value: claim.qualifiedBy.drug1 + "_0",
                                    text: claim.qualifiedBy.drug1
                                }));
                            }
                            if (!list.includes(claim.qualifiedBy.drug2) && claim.qualifiedBy.drug2 != "N/A" && claim.qualifiedBy.drug2 != undefined) {
                                $('#Drug2').append($('<option>', {
                                    value: claim.qualifiedBy.drug2 + "_0",
                                    text: claim.qualifiedBy.drug2
                                }));
                            }
                        }

                        $("#Drug1")[0].selectedIndex = 0;
                        $("#Drug2")[0].selectedIndex = 0;


                        // load method
                        if (claim.method != null) {
                            $("#method > option").each(function () {
                                if (this.value === claim.method) $(this).prop('selected', true);
                            });
                        }
                       
                        if(claim.qualifiedBy!=undefined) {

                            loadDrugsForClaim(claim.qualifiedBy);
                        }

                        var drug1 = $('#Drug1 option:selected').text();
                        var drug2 = $('#Drug2 option:selected').text();
                        var drug1ID;
                        var drug1Index;
                        if ($("#Drug1")[0].selectedIndex != -1) {
                            drug1ID = $('#Drug1 option:selected').val();
                            drug1Index = drug1ID == undefined ? 0 : parseInt(drug1ID.split("_")[1]);
                        } else {
                            drug1 = "";
                        }

                        //initial & load: add currHighlight to quote
                        var drug2ID;
                        var drug2Index;

                        if ($("#Drug2")[0].selectedIndex != -1) {
                            drug2ID = $('#Drug2 option:selected').val();
                            drug2Index = drug2ID == undefined ? 0 : parseInt(drug2ID.split("_")[1]);
                        } else {
                            drug2 = "";
                        }

                        function findIndex(string, old, no) {
                            var i = 0;
                            var pos = -1;
                            while(i <= no && (pos = string.indexOf(old, pos + 1)) != -1) {
                                i++;
                            }
                            return pos;
                        }
                        function replaceIndex(string, at, old, repl) {
                            return string.replace(new RegExp(old, 'g'), function(match, i) {
                                if( i === at ) return repl;
                                return match;
                            });
                        }
                        drug1Index = drug1 == "" ? -1 : findIndex(quotecontent, drug1, drug1Index);
                        drug2Index = drug2 == "" ? drug1Index : findIndex(quotecontent, drug2, drug2Index);
                        var drug1End = drug1Index + drug1.length;
                        var drug2End = drug2Index + drug2.length;
                        if (drug1Index != -1 && drug2Index != -1) {
                            if ((drug1Index <= drug2Index && drug1End >= drug2Index) || (drug2Index <= drug1Index && drug2End >= drug1Index)) {
                                var end = Math.max(drug1End, drug2End);
                                var start = Math.min(drug1Index, drug2Index);
                                quotecontent = quotecontent.substring(0, start) + "<span class=\"highlightdrug\">" + quotecontent.substring(start, end) + "</span>" + quotecontent.substring(end, quotecontent.length);
                            } else {
                                if (drug1Index <= drug2Index) {
                                    quotecontent = quotecontent.substring(0, drug1Index) + "<span class=\"highlightdrug\">" + drug1 + "</span>" +
                                                    quotecontent.substring(drug1End, drug2Index) + "<span class=\"highlightdrug\">" + drug2 + "</span>" +
                                                    quotecontent.substring(drug2End, quotecontent.length);
                                } else {
                                    quotecontent = quotecontent.substring(0, drug2Index) + "<span class=\"highlightdrug\">" + drug2 + "</span>" +
                                                    quotecontent.substring(drug2End, drug1Index) + "<span class=\"highlightdrug\">" + drug1 + "</span>" +
                                                    quotecontent.substring(drug1End, quotecontent.length);
                                }
                            }
                        } else if (drug1Index != -1) {
                            quotecontent = quotecontent.substring(0, drug1Index) + "<span class=\"highlightdrug\">" + drug1 + "</span>" +
                            quotecontent.substring(drug1End, quotecontent.length);
                        } else if (drug2Index != -1) {
                            quotecontent = quotecontent.substring(0, drug2Index) + "<span class=\"highlightdrug\">" + drug2 + "</span>" +
                            quotecontent.substring(drug2End, quotecontent.length);
                        }

                        $(quoteobject).html(quotecontent);
                        $('#quote').append(quoteobject);

                        // highlight drug selections on text quote
                        if (claim.qualifiedBy != null) {
                            // console.log(claim.qualifiedBy.relationship);
                            // Claim relationship, precipitant and enzyme
                            $('#relationship > option').each(function () {
                                if (this.value == claim.qualifiedBy.relationship) {
                                    $(this).prop('selected', true);
                                } else {
                                    $(this).prop('selected', false);
                                }
                            });

                        var allHighlightedDrug = [];
                        var anns = annotations.slice();
                        for (var i = 0, len = anns.length; i < len; i++) {
                            if (anns[i].annotationType == "DrugMention") {
                                
                                allHighlightedDrug.push(anns[i].argues.hasTarget.hasSelector.exact);
                            }

                        // load MP list of data

                        if (annotation.argues.supportsBy.length > 0 && currDataNum !== "") {                     
                            var loadData = annotation.argues.supportsBy[currDataNum];

                            // clean material : participants, dose1, dose2...
                            cleanDataForm();
                            //Load data form
                            
                            if (annotation.argues.method != null) {

                                loadDataItemFromAnnotation(loadData, allHighlightedDrug);
                            }
                            
                        
                            $("#drug1-dose-switch-btn").html(drug1doseLabel);
                            $("#drug2-dose-switch-btn").html(drug2doseLabel);
                            $("#drug1Dose-label").html(drug1doseLabel);
                            $("#drug2Dose-label").html(drug2doseLabel);
                            $("#claim-label-data-editor").html("<strong>Claim: </strong>" + claim.label.replace(/\_/g,' '));
                            
                            postDataForm(currFormType);
                        }

                        showSaveButton(currFormType);
                    }                     
                    delete annotation.childNodes;
                }

            }
        },   
                submit:function (field, annotation) {

                    if (currFormType == "claim"){

                        console.log("[editor.js] mpeditor submit claim");                       
                        annotation.annotationType = "MP";

                        // MP method - keep with claim
                        annotation.argues.method = $('#method option:selected').text();   

                        var method = annotation.argues.method
                     
                        // MP argues claim, claim qualified by ?s ?p ?o
                        if (annotation.argues.qualifiedBy != null) {
                            var qualifiedBy = annotation.argues.qualifiedBy;
                            //dose info needs to follow drug, if users make a switch in the claim editor
                            var supportsBys = annotation.argues.supportsBy;
                            var allrelationOfDose = [];
                            for (var i = 0; i < supportsBys.length; i++) {
                                var relationOfDose = {};
                                var supportsBy = supportsBys[i].supportsBy.supportsBy;
                                if (supportsBy.drug1Dose != null) {
                                    relationOfDose[qualifiedBy.drug1] = supportsBy.drug1Dose;
                                }
                                if (supportsBy.drug2Dose != null) {
                                    relationOfDose[qualifiedBy.drug2] = supportsBy.drug2Dose;
                                }
                                allrelationOfDose.push(relationOfDose);
                            }
                        } else {
                            
                            var qualifiedBy = {drug1 : "", drug2 : "", relationship : ""};
                        }
                        qualifiedBy.relationship = $('#relationship option:selected').text();


                        // TODO: refactoring by method/relationship
                        // single drug 
                        if ((qualifiedBy.relationship == 'Toxicity' || qualifiedBy.relationship == 'interact with' || qualifiedBy.relationship == 'inhibits' || qualifiedBy.relationship == 'substrate of' || qualifiedBy.relationship == 'inhibition constant' || qualifiedBy.relationship == 'controls formation of' || qualifiedBy.relationship == 'has metabolite') && (method == 'Statement' || method == 'Case Report' || method == 'DDI clinical trial' || method == 'Experiment' || method == 'Phenotype clinical study')) {
                            qualifiedBy.drug1 = $('#Drug1 option:selected').text();
                            qualifiedBy.drug1ID = $('#Drug1 option:selected').val();
                            qualifiedBy.drug2 = "";
                            qualifiedBy.drug2ID = "";
                            qualifiedBy.drug2PC = "";           
                        } else {
                        // two drugs
                            qualifiedBy.drug1 = $('#Drug1 option:selected').text();
                            qualifiedBy.drug2 = $('#Drug2 option:selected').text();
                            qualifiedBy.drug1ID = $('#Drug1 option:selected').val();
                            qualifiedBy.drug2ID = $('#Drug2 option:selected').val();
                        }

                        //Method: Statement, DDI clinical trial, Phenotype clinical study, Case Report, Experiment

                        //relation of drug and drugDose
                        if (annotation.argues.supportsBy.length != 0) {  //has data or material
                            for (var i = 0; i < allrelationOfDose.length; i++) {
                                if (qualifiedBy.drug1 in allrelationOfDose[i]) {
                                    supportsBys[i].supportsBy.supportsBy.drug1Dose = allrelationOfDose[i][qualifiedBy.drug1];
                                } else {
                                    supportsBys[i].supportsBy.supportsBy.drug1Dose = {};
                                }
                                if (qualifiedBy.drug2 in allrelationOfDose[i]) {
                                    supportsBys[i].supportsBy.supportsBy.drug2Dose = allrelationOfDose[i][qualifiedBy.drug2];
                                } else {
                                    supportsBys[i].supportsBy.supportsBy.drug2Dose = {};
                                }
                            }
                        }
                        
                        var claimLabel = generateClaimLabel(annotation.argues.method, qualifiedBy);

                        annotation.argues.qualifiedBy = qualifiedBy;
                        annotation.argues.type = "mp:claim";
                        annotation.argues.label = claimLabel;
                        
                        if (annotation.argues.supportsBy == null)
                            annotation.argues.supportsBy = [];        


                      // submit data form
                    } else if (currFormType != "claim" && currAnnotationId != null) { 
                        if (annotation.argues.supportsBy.length == 0) {
                            var data = {type : "mp:data", toxicity : {}, death : {}, radiotherapy : {},  supportsBy : {type : "mp:method", supportsBy : {type : "mp:material", participants : {}, drug1Dose : {}, drug2Dose: {}}}};
                            annotation.argues.supportsBy.push(data);
                        }

                        console.log("ddieditor update data & material - num: " + currDataNum);

                        var mpData = annotation.argues.supportsBy[currDataNum];
                        
                        

                        // MP add data-method-material - participants, dose1 and dose2;
                        var partTmp = mpData.supportsBy.supportsBy.participants;
                        var partN = $('#participants').val().trim();
                        var partTotal = $('#participantsTotal').val();
                        var partMF = $('#participantsMale/participantsFemale').val();
                        var partRace = $('#participantsRace').val();
                        var partM = $('#participantsMedianAge').val();
                        var partT = $('#participantsTumorType').text();
                        var partC = $('#participantsCancerStage').text();

                        if ((partN != "") && (partTotal != "") && (partM/F != "") && (partRace != "") && (partM != "") && (partT != "") && (partC != "")) {


                            partTmp.value = partN;
                            partTmp.total = partTotal;
                            partTmp.malefemale = partMF;
                            partTmp.race = partRace;
                            partTmp.medianAge = partM;
                            partTmp.tumorType = partT;
                            partTmp.cancerStage = partC;

                            if (partTmp.ranges == null) {
                                partTmp.ranges = cachedOARanges;
                            }
                            if (partTmp.hasTarget == null) {
                                partTmp.hasTarget = cachedOATarget;
                            }
                            mpData.supportsBy.supportsBy.participants = partTmp;  
                        }

                        var dose1Tmp = mpData.supportsBy.supportsBy.drug1Dose;
                        var drug1V = $('#drug1Dose').val();
                        var drug1F = $('#drug1Formulation option:selected').text();
                        var drug1D = $('#drug1Duration').val();
                        var drug1R = $('#drug1Regimens option:selected').text();
                        var drug1M = $('#drug1ToleratedDose').val();

                        if ((drug1V != "") && (drug1D != "") && (drug1F != "") && (drug1R != "") && (drug1M != "")) {
                                     
                            dose1Tmp.value = drug1V;
                            dose1Tmp.formulation = drug1F;
                            dose1Tmp.duration = drug1D;
                            dose1Tmp.regimens = drug1R;
                            dose1Tmp.toleratedDose = drug1M;

                            if (dose1Tmp.ranges == null) {
                                dose1Tmp.ranges = cachedOARanges;
                            }
                            if (dose1Tmp.hasTarget == null) {
                                dose1Tmp.hasTarget = cachedOATarget;
                            }
                            mpData.supportsBy.supportsBy.drug1Dose = dose1Tmp;    
                        }

                        //material: dose2
                        var dose2Tmp = mpData.supportsBy.supportsBy.drug2Dose;
                        console.log(dose2Tmp);
                        var drug2V = $('#drug2Dose').val();
                        var drug2F = $('#drug2Formulation option:selected').text();
                        var drug2D = $('#drug2Duration').val();
                        var drug2R = $('#drug2Regimens option:selected').text();
                        var drug2M = $('#drug2ToleratedDose').val();

                        if ((drug2V != "") && (drug2D != "") && (drug2F != "") && (drug2R != "") && (drug2M != "")) {
                                     
                            dose2Tmp.value = drug2V;
                            dose2Tmp.formulation = drug2F;
                            dose2Tmp.duration = drug2D;
                            dose2Tmp.regimens = drug2R;
                            dose2Tmp.toleratedDose = drug2M;

                            if (dose2Tmp.ranges == null) {
                                dose2Tmp.ranges = cachedOARanges;
                            }
                            if (dose2Tmp.hasTarget == null) {
                                dose2Tmp.hasTarget = cachedOATarget;
                            }
                            mpData.supportsBy.supportsBy.drug2Dose = dose2Tmp;   
                        }

                        // radiotherapy
                        
                        mpData.radiotherapy = $("#radiotherapy option:selected").text();
                        if (mpData.radiotherapy.ranges == null) {
                                mpData.radiotherapy.ranges = cachedOARanges;
                            }
                            if (mpData.radiotherapy.hasTarget == null) {
                                mpData.radiotherapy.hasTarget = cachedOATarget;
                            } else {
                            console.log("[WARNING] radiotherapy required fields not filled!");
                        }         


                        // mpData toxicity 


                        var toxicityCriteria = $('#toxicityCriteria').text();
                        var toxicityToxicity = $('#toxicity').text();
                        var toxicityGrade = $('#grade').text();
                        var toxicityFrequency = $('#frequency').val().trim();
                        var toxicityDeath = $('#death').val().trim();
                        var toxicityWithdrawal = $('#withdrawal').val().trim();

                        if (toxicityCriteria != "" && toxicityToxicity != "" && toxicityGrade != "" && toxicityFrequency != "" && toxicityDeath != "" && toxicityWithdrawal != "") {

                            mpData.toxicity.criteria = toxicityCriteria;
                            mpData.toxicity.Toxicity = toxicityToxicity;
                            mpData.toxicity.grade = toxicityGrade;
                            mpData.toxicity.frequency = toxicityFrequency;
                            mpData.toxicity.death = toxicityDeath;
                            mpData.toxicity.withdrawal = toxicityWithdrawal;
                        

                            if (mpData.toxicity.ranges == null) {
                                mpData.toxicity.ranges = cachedOARanges;
                            }
                            if (mpData.toxicity.hasTarget == null) {
                                mpData.toxicity.hasTarget = cachedOATarget;
                            }
                        } else {
                            console.log("[WARNING] toxicity required fields not filled!");
                        }                        


                        
                        
                        var deathDeathFrequency = $('#deathFrequency').val().trim();
                        var deathWithdrawalFrequency = $('#withdrawalFrequency').val().trim();

                        if (DWdeathFrequency != "" && DWwithdrawalFrequency != "") {

                            mpData.death.deathFrequency = deathDeathFrequency;
                            mpData.death.withdrawalFrequency = deathWithdrawalFrequency;

                            if (mpData.death.ranges == null) {
                                mpData.death.ranges = cachedOARanges;
                            }
                            if (mpData.death.hasTarget == null) {
                                mpData.death.hasTarget = cachedOATarget;
                            }                           
                        } else {
                            console.log("[WARNING] death/withdrawal required fields not filled!");
                        }                

                        annotation.argues.supportsBy[currDataNum] = mpData;
                    }
                }                
            });            
        }
        
        var self = this;
        
        this.element
            .on("submit." + NS, 'form', function (e) {
                self._onFormSubmit(e);
            })
            .on("click." + NS, '.annotator-save', function (e) {
                if (self._onFormValid(e)) {
                    self._onSaveClick(e);
                }
            })
            .on("click." + NS, '.annotator-save-close', function (e) {
                if (self._onFormValid(e)) {
                    self._onSaveCloseClick(e);
                    self.hide();
                }
            })
            .on("click." + NS, '.annotator-delete', function (e) {
                self._onDeleteClick(e);
            })
            .on("click." + NS, '.annotator-cancel', function (e) {
                self._onCancelClick(e);
            })
            .on("mouseover." + NS, '.annotator-cancel', function (e) {
                self._onCancelMouseover(e);
            })
            .on("keydown." + NS, 'textarea', function (e) {
                self._onTextareaKeydown(e);
            });
    },



    destroy: function () {
        this.element.off("." + NS);
        Widget.prototype.destroy.call(this);
    },

    // Public: Show the editor.
    //
    // position - An Object specifying the position in which to show the editor
    //            (optional).
    //
    // Examples
    //
    //   editor.show()
    //   editor.hide()
    //   editor.show({top: '100px', left: '80px'})
    //
    // Returns nothing.
    show: function (position) {

        //if (typeof position !== 'undefined' && position !== null) {
        if (typeof position !== 'undefined') {
            this.element.css({
                //top: position.top,
                //left: position.left
                bottom:50,
                right:100
            });
        }

        this.element
            .find('.annotator-save')
            .addClass(this.classes.focus);

        Widget.prototype.show.call(this);

        // give main textarea focus
        this.element.find(":input:first").focus();

        this._setupDraggables();
    },

    // Public: Load an annotation into the editor and display it.
    //
    // annotation - An annotation Object to display for editing.
    // position - An Object specifying the position in which to show the editor
    //            (optional).
    //
    // Returns a Promise that is resolved when the editor is submitted, or
    // rejected if editing is cancelled.
    load: function (position, annotation) {
        this.annotation = annotation;

        var claim = annotation.argues;        

        if(claim.hasTarget.hasSelector.exact.length>1600){
            alert("[INFO] Exceeding max lengh of text 1600!");
            $('.btn-success').click();
            this.cancel();
        }
        
        var annotations = [];
        if(getURLParameter("sourceURL")==null)
            var sourceURL = getURLParameter("file").trim();
        else
            var sourceURL = getURLParameter("sourceURL").trim();
        var source = sourceURL.replace(/[\/\\\-\:\.]/g, "")

        var queryObj = JSON.parse('{"uri":"'+source+'"}');

        var annhost = config.apache2.host;

        // call apache for request annotator store
        var storage = new HttpStorage(JSON.parse(queryOptStr));

        var self = this;
        storage.query(queryObj)
            .then(function(data){
                //filter druglist by selected userEmails
                for (var i = 0; i < data.results.length; i++) {
                    var ann = data.results[i];
                    if (userEmails.has(ann.email)) {
                        annotations.push(ann);
                    }
                }

                for (var i = 0, len = self.fields.length; i < len; i++) {
                    var field = self.fields[i];
                    field.load(field.element, self.annotation,annotations);
                }
            });
        
        var self = this;
        return new Promise(function (resolve, reject) {
            self.dfd = {resolve: resolve, reject: reject};
            self.show(position);
        });

    },

    // Public: Submits the editor and saves any changes made to the annotation.
    //
    // Returns nothing.
    submit: function () {
        console.log("ddieditor - submit called");

        for (var i = 0, len = this.fields.length; i < len; i++) {
            var field = this.fields[i];
            console.log(this.annotation);
            field.submit(field.element, this.annotation);
        }

        // clean cached text selection
        isTextSelected = false;
        cachedOATarget = "";
        cachedOARanges = "";
        //TODO: do I need delete above snippet

        if (typeof this.dfd !== 'undefined' && this.dfd !== null) {
            this.dfd.resolve();
        }
        undrawCurrhighlighter();
        this.hide();
    },
    // Public: Submits the editor and saves any changes made to the annotation.
    //
    // Returns nothing.
    submitNotClose: function () {
        console.log("mpeditor - submitNotClose called");
        for (var i = 0, len = this.fields.length; i < len; i++) {
            var field = this.fields[i];

            field.submit(field.element, this.annotation);
        }

        if (typeof this.dfd !== 'undefined' && this.dfd !== null) {
            this.dfd.resolve();
        }
        showEditor();
        app.annotations.update(this.annotation);
    },


    // Public: Submits the editor and delete specific data field to the annotation.
    // @input: data field from currFormType
    // Returns nothing.
    // deleteDataSubmit: function (currFormType) {
    // },
    
    // Public: Cancels the editing process, discarding any edits made to the
    // annotation.
    //
    // Returns itself.
    cancel: function () {  

        if (typeof this.dfd !== 'undefined' && this.dfd !== null) {
            this.dfd.reject('editing cancelled');

            // clean editor status
            currFormType = "";
        }
        undrawCurrhighlighter();
        this.hide();
        showAnnTable();
    },

    // Public: Adds an additional form field to the editor. Callbacks can be
    // provided to update the view and anotations on load and submission.
    //
    // options - An options Object. Options are as follows:
    //           id     - A unique id for the form element will also be set as
    //                    the "for" attribute of a label if there is one.
    //                    (default: "annotator-field-{number}")
    //           type   - Input type String. One of "input", "textarea",
    //                    "checkbox", "select" (default: "input")
    //           label  - Label to display either in a label Element or as
    //                    placeholder text depending on the type. (default: "")
    //           load   - Callback Function called when the editor is loaded
    //                    with a new annotation. Receives the field <li> element
    //                    and the annotation to be loaded.
    //           submit - Callback Function called when the editor is submitted.
    //                    Receives the field <li> element and the annotation to
    //                    be updated.

    // Returns the created <li> Element.
    addField: function (options) {
        var field = $.extend({
            id: 'annotator-field-' + id(),
            type: 'input',
            label: '',
            load: function () {},
            submit: function () {}
        }, options);

        var input = null,
            element = $('<li class="annotator-item" />');

        field.element = element[0];

        if (field.type === 'textarea') {
            input = $('<textarea />');
        } else if (field.type === 'checkbox') {
            input = $('<input type="checkbox" />');
        } else if (field.type === 'input') {
            input = $('<input />');
        } else if (field.type === 'select') {
            input = $('<select />');
        } else if (field.type === 'div') {
            input = $('<div class = "quoteborder" />');
        }

        element.append(input);

        input.attr({
            id: field.id,
            placeholder: field.label
        });


        if (field.type === 'div') {
            input.attr({
                html: field.label
            });
        }

        if (field.type === 'checkbox') {
            element.addClass('annotator-checkbox');
            element.append($('<label />', {
                'for': field.id,
                'html': field.label
            }));
        }

        this.element.find('ul:first').append(element);
        this.fields.push(field);

        return field.element;
    },

    checkOrientation: function () {
        Widget.prototype.checkOrientation.call(this);

        var list = this.element.find('ul').first();
        var controls = this.element.find('.annotator-controls1');
        var tabs = this.element.find('#tabs');
        controls.insertAfter(tabs);
        /*if (this.element.hasClass(this.classes.invert.y)) {
         controls.insertBefore(list);
         } else if (controls.is(':first-child')) {
         controls.insertAfter(list);
         }*/

        return this;
    },

    /**
    Claim and Data Form Validation: check the fields is not empty
    Event callback: called when a user clicks the editor's save button
    Returns Boolean: True if form valid, otherwise False  
    **/
    _onFormValid: function (event) {
        preventEventDefault(event);
    console.log("editor.js: form validation");
        var valid = true;

    if (currFormType == 'claim') { // validate claim form       
            var method = $('#method option:selected').text();
            var relationship = $('#relationship option:selected').text();

        if (method == 'Statement' || method == 'Case Report' || method == 'DDI clinical trial' || method == 'Experiment' || method == 'Phenotype clinical study' ) {

            if (relationship == 'Toxicity' || relationship == 'interact with' || relationship == 'inhibits' || relationship == 'substrate of' || relationship == 'inhibition constant' || relationship == 'controls formation of' || relationship == 'has metabolite') {
                if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#Drug2')[0], true)))

                    valid = false;
        }
        }
    } else { 

        //validate data form

        var fields = $("#mp-data-form-" + currFormType).children();
            //data form validation rule
        for(var i = 0; i < fields.length; i++) {
        var ns = fields[i].tagName;
        //unchanged checkbox
        if (fields[i].type == "checkbox") {
                    if ($(fields[i]).is(":checked")) {
            return valid;
                    }
        //input box
        } else if (ns == "INPUT" && fields[i].style.display != 'none') {
            if (!this._isInputBoxFilled(fields[i]))
            valid = false
        //select box
        } else if (ns == "SELECT") {
            if(!this._isListboxFilled(fields[i], true))
            valid = false;
        }
        }
        }

        // reset unsave status
        unsaved = false;
        if(!valid) {
            $('.form-validation-alert').show();
        } else {
            $('.form-validation-alert').hide();
        }
        return valid;
    },

    // validate if drop down listbox selected
    // field: listbox JS object
    // allowedDefault: False for not allowing select first option as default (ex. UNK in some cases)
    // return boolean: true if listbox selected, otherwise return false
    _isListboxFilled: function(field, allowedDefault) {
    if (field.selectedIndex == -1 || (field.selectedIndex == 0 && !allowedDefault)) {
        $(field).css("background-color", "#f9dcd9");
        return false;
    } else {
        $(field).css("background-color", "");
        return true;
    }
    },

    // validate if input box filled
    // return boolean: true if input box filled, otherwise return false
    _isInputBoxFilled: function(field) {
    if (field.value.trim() == "") {
        $(field).css("background-color", "#f9dcd9");
        return false;
    } else {
        $(field).css("background-color", "");
        return true;
    }
    },

    // validate if ratio button group filled
    _isRatioButtonFilled: function(name) {
    if (!$("input[name='" + name + "']:checked").val()) {
        $("input[name='" + name + "']:checked").css("background-color", "#f9dcd9");
        return false;   
    } else {
        $("input[name='" + name + "']:checked").css("background-color", "");
        return true;
    }
    }, 

    // Event callback: called when a user clicks the editor form (by pressing
    // return, for example).
    //
    // Returns nothing
    _onFormSubmit: function (event) {
        preventEventDefault(event);
        this.submit();
    },

    // Event callback: called when a user clicks the editor's save and close button.
    //
    // Returns nothing
    _onSaveCloseClick: function (event) {

        preventEventDefault(event);
        showAnnTable();    
        this.submit();

        // clean cached text selection
        isTextSelected = false;
        cachedOATarget = "";
        cachedOARanges = ""; 

        // reset unsave status
        unsaved = false;

        // clean editor status
        currFormType = "";
    },
    // Event callback: called when a user clicks the editor's save button.
    //
    // Returns nothing
    _onSaveClick: function (event) {
        preventEventDefault(event);
        this.submitNotClose();

        // reset unsave status
        unsaved = false;
    },

    // Event callback: called when a user clicks the editor's delete button.
    //
    // Returns nothing
    // if it's data form, delete current data
    // if claim form, delete claim and data
    _onDeleteClick: function (event) {

        console.log("mpeditor - _onDeleteClick:")
        console.log(this.annotation);

        preventEventDefault(event);
        this.options.onDelete(this.annotation);
        undrawCurrhighlighter();

        // reset unsave status
        unsaved = false;
    },

    // Event callback: called when a user clicks the editor's cancel button.
    //
    // Returns nothing
    _onCancelClick: function (event) {

        // clean cached text selection
        isTextSelected = false;
        cachedOATarget = "";
        cachedOARanges = "";      

        // reset unsave status
        unsaved = false;

        preventEventDefault(event);
        this.cancel();
    },

    // Event callback: called when a user mouses over the editor's cancel
    // button.
    //
    // Returns nothing
    _onCancelMouseover: function () {
        this.element
            .find('.' + this.classes.focus)
            .removeClass(this.classes.focus);
    },

    // Event callback: listens for the following special keypresses.
    // - escape: Hides the editor
    // - enter:  Submits the editor
    //
    // event - A keydown Event object.
    //
    // Returns nothing
    _onTextareaKeydown: function (event) {
        if (event.which === 27) {
            // "Escape" key => abort.
            this.cancel();
        } else if (event.which === 13 && !event.shiftKey) {
            // If "return" was pressed without the shift key, we're done.
            this.submit();
        }
    },

    // Sets up mouse events for resizing and dragging the editor window.
    //
    // Returns nothing.
    _setupDraggables: function () {
        if (typeof this._resizer !== 'undefined' && this._resizer !== null) {
            this._resizer.destroy();
        }
        if (typeof this._mover !== 'undefined' && this._mover !== null) {
            this._mover.destroy();
        }

        this.element.find('.annotator-resize').remove();

        // Find the first/last item element depending on orientation
        var cornerItem;
        if (this.element.hasClass(this.classes.invert.y)) {
            cornerItem = this.element.find('.annotator-item:last');
        } else {
            cornerItem = this.element.find('.annotator-item:first');
        }

        /*if (cornerItem) {
            $('<span class="annotator-resize"></span>').appendTo(cornerItem);
        }*/

        //var controls = this.element.find('.annotator-controls')[0];
 /*        var   textarea = this.element.find('textarea:first')[0],
            resizeHandle = this.element.find('.annotator-resize')[0],
            self = this;

        this._resizer = resizer(textarea, resizeHandle, {
            invertedX: function () {
                return self.element.hasClass(self.classes.invert.x);
            },
            invertedY: function () {
                return self.element.hasClass(self.classes.invert.y);
            }
        });
*/
        //this._mover = mover(this.element[0], controls);
    }
});


ddiEditor.template = Template.content;

// Configuration options
ddiEditor.options = {
    // Add the default field(s) to the editor.
    defaultFields: true,
    appendTo: '.mpeditorsection',
    // Callback, called when the user clicks the delete button for an
    // annotation.
    onDelete: function () {}
};

// dragTracker is a function which allows a callback to track changes made to
// the position of a draggable "handle" element.
//
// handle - A DOM element to make draggable
// callback - Callback function
//
// Callback arguments:
//
// delta - An Object with two properties, "x" and "y", denoting the amount the
//         mouse has moved since the last (tracked) call.
//
// Callback returns: Boolean indicating whether to track the last movement. If
// the movement is not tracked, then the amount the mouse has moved will be
// accumulated and passed to the next mousemove event.
//
var dragTracker = exports.dragTracker = function dragTracker(handle, callback) {
    var lastPos = null,
        throttled = false;

    // Event handler for mousemove
    function mouseMove(e) {
        if (throttled || lastPos === null) {
            return;
        }

        var delta = {
            //y: e.pageY - lastPos.top,
            //x: e.pageX - lastPos.left
            y:200,
            x:200
        };
        //console.log(e.pageX);

        var trackLastMove = true;
        // The callback function can return false to indicate that the tracker
        // shouldn't keep updating the last position. This can be used to
        // implement "walls" beyond which (for example) resizing has no effect.
        if (typeof callback === 'function') {
            trackLastMove = callback(delta);
        }

        if (trackLastMove !== false) {
            lastPos = {
                //top: e.pageY,
                //left: e.pageX
                top:200,
                left:200
            };
        }

        // Throttle repeated mousemove events
        throttled = true;
        setTimeout(function () { throttled = false; }, 1000 / 60);
    }


    // Event handler for mouseup
    function mouseUp() {
        lastPos = null;
        $(handle.ownerDocument)
            .off('mouseup', mouseUp)
            .off('mousemove', mouseMove);
    }

    // Event handler for mousedown -- starts drag tracking
    function mouseDown(e) {
        if (e.target !== handle) {
            return;
        }

        lastPos = {
            //top: e.pageY,
            //left: e.pageX
            top:200,
            left:200
        };

        $(handle.ownerDocument)
            .on('mouseup', mouseUp)
            .on('mousemove', mouseMove);

        e.preventDefault();
    }

    // Public: turn off drag tracking for this dragTracker object.
    function destroy() {
        $(handle).off('mousedown', mouseDown);
    }

    $(handle).on('mousedown', mouseDown);

    return {destroy: destroy};
};


// resizer is a component that uses a dragTracker under the hood to track the
// dragging of a handle element, using that motion to resize another element.
//
// element - DOM Element to resize
// handle - DOM Element to use as a resize handle
// options - Object of options.
//
// Available options:
//
// invertedX - If this option is defined as a function, and that function
//             returns a truthy value, the horizontal sense of the drag will be
//             inverted. Useful if the drag handle is at the left of the
//             element, and so dragging left means "grow the element"
// invertedY - If this option is defined as a function, and that function
//             returns a truthy value, the vertical sense of the drag will be
//             inverted. Useful if the drag handle is at the bottom of the
//             element, and so dragging down means "grow the element"
var resizer = exports.resizer = function resizer(element, handle, options) {
    var $el = $(element);
    if (typeof options === 'undefined' || options === null) {
        options = {};
    }

    // Translate the delta supplied by dragTracker into a delta that takes
    // account of the invertedX and invertedY callbacks if defined.
    function translate(delta) {
        var directionX = 1,
            directionY = -1;

        if (typeof options.invertedX === 'function' && options.invertedX()) {
            directionX = -1;
        }
        if (typeof options.invertedY === 'function' && options.invertedY()) {
            directionY = 1;
        }

        return {
            x: delta.x * directionX,
            y: delta.y * directionY
        };
    }

    // Callback for dragTracker
    function resize(delta) {
        var height = $el.height(),
            width = $el.width(),
            translated = translate(delta);

        if (Math.abs(translated.x) > 0) {
            $el.width(width + translated.x);
        }
        if (Math.abs(translated.y) > 0) {
            $el.height(height + translated.y);
        }

        // Did the element dimensions actually change? If not, then we've
        // reached the minimum size, and we shouldn't track
        var didChange = ($el.height() !== height || $el.width() !== width);
        return didChange;
    }

    // We return the dragTracker object in order to expose its methods.
    return dragTracker(handle, resize);
};


// mover is a component that uses a dragTracker under the hood to track the
// dragging of a handle element, using that motion to move another element.
//
// element - DOM Element to move
// handle - DOM Element to use as a move handle
//
var mover = exports.mover = function mover(element, handle) {
    function move(delta) {
        $(element).css({
            top: parseInt($(element).css('top'), 10) + delta.y,
            left: parseInt($(element).css('left'), 10) + delta.x
        });
    }

    // We return the dragTracker object in order to expose its methods.
    return dragTracker(handle, move);
};


// load one data item from mp annotation

function loadDataItemFromAnnotation(loadData, allHighlightedDrug) {

    // load mp material field  
    $("#participants").val(loadData.supportsBy.supportsBy.participants.value);
    $('#participantsTotal').val(loadData.supportsBy.supportsBy.participants.total);
    $('#participantsMale/participantsFemale').val(loadData.supportsBy.supportsBy.participants.malefemale);
    $('#participantsRace').val(loadData.supportsBy.supportsBy.participants.race);
    $('#participantsMedianAge').val(loadData.supportsBy.supportsBy.participants.medianAge);
    $('#participantsTumorType').text(loadData.supportsBy.supportsBy.participants.tumorType);
    $('#participantsCancerStage').text(loadData.supportsBy.supportsBy.participants.cancerStage);
     
    if (loadData.supportsBy.supportsBy.participants.hasTarget != null) {
        $('#participantsQuote').html(loadData.supportsBy.supportsBy.participants.hasTarget.hasSelector.exact || '');
    } else {
        if (cachedOATarget.hasSelector != null)
            $('#participantsQuote').html(cachedOATarget.hasSelector.exact || '');          
        else 
            $('#participantsQuote').html('');         
    }

    $("#drug1Dose").val(loadData.supportsBy.supportsBy.drug1Dose.value);
    $("#drug1Duration").val(loadData.supportsBy.supportsBy.drug1Dose.duration);
    $("#drug1Formulation > option").each(function () {
        if (this.value === loadData.supportsBy.supportsBy.drug1Dose.formulation) {
            $(this).prop('selected', true);                                       
        }
    });

    $("#drug1Regimens > option").each(function () {
        if (this.value === loadData.supportsBy.supportsBy.drug1Dose.regimens) {
            $(this).prop('selected', true);                                                  
        }
    });

    $("#drug1ToleratedDose").val(loadData.supportsBy.supportsBy.drug1Dose.toleratedDose);

    if (loadData.supportsBy.supportsBy.drug1Dose.hasTarget != null) {
        $('#dose1quote').html(loadData.supportsBy.supportsBy.drug1Dose.hasTarget.hasSelector.exact || '');       
    } 
    else {
        if (cachedOATarget.hasSelector != null)
            $('#dose1quote').html(cachedOATarget.hasSelector.exact || '');       
        else
            $('#dose1quote').html('');
    }
    //data - dose2
    $("#drug2Dose").val(loadData.supportsBy.supportsBy.drug2Dose.value);
    $("#drug2Duration").val(loadData.supportsBy.supportsBy.drug2Dose.duration);
    $("#drug2Formulation > option").each(function () {
        if (this.value === loadData.supportsBy.supportsBy.drug2Dose.formulation) {
            $(this).prop('selected', true);                                                  
        }
    });

    $("#drug2Regimens > option").each(function () {
        if (this.value === loadData.supportsBy.supportsBy.drug2Dose.regimens) {
            $(this).prop('selected', true);                                                  
        }
    });
    
    $("#drug2ToleratedDose").val(loadData.supportsBy.supportsBy.drug2Dose.toleratedDose);

    if (loadData.supportsBy.supportsBy.drug2Dose.hasTarget != null) {
        
        $('#dose2quote').html(loadData.supportsBy.supportsBy.drug2Dose.hasTarget.hasSelector.exact || '');     
    } 
    else {
        
        if (cachedOATarget.hasSelector != null)
            $('#dose2quote').html(cachedOATarget.hasSelector.exact || '');       
        else 
            $('#dose2quote').html('');                      
    }  


    // load mp data fields

    // radiotherapy
    $("#radiotherapy > option").each(function () {
            if (this.value === loadData.radiotherapy.Radiotherapy) {
                $(this).prop('selected', true);                                                  
            }
        });
    if (loadData.radiotherapy.hasTarget != null) {
        
        $('#radiotherapy').html(loadData.radiotherapy.hasTarget.hasSelector.exact || ''); 
    } 
    else {
        
        if (cachedOATarget.hasSelector != null)
            $('#radiotherapyQuote').html(cachedOATarget.hasSelector.exact || '');       
        else 
            $('#radiotherapyQuote').html('');                        
    }      

    // load toxicity Data

    $('#toxicityCriteria').text(loadData.toxicity.toxicityCriteria);
    $('#toxicity').text(loadData.toxicity.Toxicity);
    $('#grade').text(loadData.toxicity.grade);
    $('#frequency').val(loadData.toxicity.frequency);
    $('#death').val(loadData.toxicity.death);
    $('#withdrawal').val(loadData.toxicity.withdrawal);

    if (loadData.toxicity.hasTarget != null) {
        $('#toxicityQuote').html(loadData.death.hasTarget.hasSelector.exact || ''); 
    } else {
        if (cachedOATarget.hasSelector != null)
            $('#toxicityQuote').html(cachedOATarget.hasSelector.exact || '');       
        else
            $('#toxicityQuote').html('');              
    }                 

    // load Death/Withdrawal frequency 
    $("#deathFrequency").val(loadData.death.deathFrequency);
    $("#withdrawalFrequency").val(loadData.death.withdrawalFrequency);
    
    if (loadData.death.hasTarget != null) {
        $('#death/withdrawalQuote').html(loadData.death.hasTarget.hasSelector.exact || ''); 
    }
    else {
        if (cachedOATarget.hasSelector != null)
            $('#death/withdrawalQuote').html(cachedOATarget.hasSelector.exact || '');       
        else
            $('#death/withdrawalQuote').html('');              
    }                       
}

function showSaveButton(field) {
    $(".annotator-save").hide();
    if (field != "evRelationship" && field != "studytype") {
        $(".annotator-save").show();
    } 
}


/** post process data form (
    1.show current data form and hide others. 
    2.show delete button if there are value been load. 
    3.hide nav list for ev relationship and study type data form)
**/

function postDataForm(targetField) {

    console.log("mpeditor - postDataForm: " + targetField);
    $("#mp-claim-form").hide();

    // field name and actual div id mapping
    var fieldM = {"participants":"participants", "dose1":"drug1Dose", "dose2":"drug2Dose", "radiotherapy":"radiotherapy", "toxicity":"toxicity", "death":"death"};
    var showDeleteBtn = false;

    for (var field in fieldM) {       
        var dataid = "mp-data-form-"+field;
        var fieldVal = "";
        if (field === targetField) {
            $("#"+dataid).show();  // show specific data form 
            // inspect that is target form has value filled 

            if (field == "radiotherapy" || field =="toxicity" || field == "death") { 
                $("#mp-data-nav").show();                 
                fieldVal = $("#" + fieldM[field]).val();
            }  else { // when field is text input
                $("#mp-data-nav").show();
                fieldVal = $("#" + fieldM[field]).val();
            }
                
            if (fieldVal !=null && fieldVal != "")
                $("#annotator-delete").show();
            else if (showDeleteBtn)
                $("#annotator-delete").show();
            else 
                $("#annotator-delete").hide();
            focusOnDataField(targetField);
        }                        
        else {
            cleanFocusOnDataField(field);
            $("#"+dataid).hide();
        }
    }
}




function cleanClaimForm() {
    console.log("[editor.js] clean claim form");
    // clean form validation format
    $('.form-validation-alert').hide();

    var allClaimFields = ["#Drug1", "#Drug2"];
    for (var i = 0; i < allClaimFields.length; i++) {
        $(allClaimFields[i]).css("background-color", "");
    }

    $("#quote").empty();
    // Method
    $("#method")[0].selectedIndex = 0;

    // Relationship
    $("#relationship option").removeAttr('disabled');
    $("#relationship option").show();
    $("#relationship")[0].selectedIndex = 0;
}

// clean all value of data form
function cleanDataForm() {
    //clean form validation format
    $(".form-validation-alert").hide();

    var allDataFields = ["#participants", "#participantsTotal", "#participantsMale/participantsFemale", "#participantsRace", "#participantsMedianAge", "#participantsTumorType", "#participantsCancerStage", "#drug1Dose", "#drug1Duration", "#drug1Formulation", "#drug1Regimens", "#drug1ToleratedDose", "#drug2Dose", "#drug2Duration", "#drug2Formulation", "#drug2Regimens", "#drug2ToleratedDose", "#radiotherapy", "#toxicityCriteria", "#toxicity", "#grade", "#frequency", "#death", "#withdrawal", "#deathFrequency", "#withdrawalFrequency"];
    for (var i = 0; i < allDataFields.length; i++) {
        $(allDataFields[i]).css("background-color", "");
    }

    //clean material
    $("#participants").val('');
    $('#participantsTotal').val('');
    $('#participantsMale/participantsFemale').val('');
    $('#participantsRace').val('');
    $('#participantsMedianAge').val('');
    $('#participantsTumorType').text('');
    $('#participantsCancerStage').text('');
    $("#drug1Dose").val('');
    $("#drug1Duration").val('');
    $("#drug1Formulation")[0].selectedIndex = -1;
    $("#drug1Regimens")[0].selectedIndex = -1;
    $("#drug1ToleratedDose").val('');
    $("#drug2Dose").val('');
    $("#drug2Duration").val('');
    $("#drug2Formulation")[0].selectedIndex = -1;
    $("#drug2Regimens")[0].selectedIndex = -1;
    $("#drug2ToleratedDose").val('');

    // clean data : toxicity, radiotherapy, death/withdrawal.

    $('#toxicityCriteria').text('');
    $('#toxicity').text('');
    $('#grade').text('');
    $('#frequency').val('');
    $('#death').val('');
    $('#withdrawal').val('');

    $("#radiotherapy")[0].selectedIndex = -1;

    $('#deathFrequency').val('');
    $('#withdrawalFrequency').val('');

}

// return not-none child node 
function moveToChildNode(parent) {
    // move to most inner span node
    while (parent.childNodes.length > 0) {
        var innerNode = null;
        // find inner span that not none 
        for (var j=0; j<parent.childNodes.length; j++) {
            if (parent.childNodes[j].textContent != "") {
                innerNode = parent.childNodes[j];
                break;
            }
        }
        if (innerNode != null) 
            parent = innerNode;  
        else 
            break;
    }
    return parent;
}


function generateClaimLabel(method, qualifiers) {
    
    var claimLabel = "";
    
    if (method == 'Statement' || method == 'Case Report' || method == 'DDI clinical trial' || method == 'Experiment' || method == 'Phenotype clinical study') {
        if (qualifiers.relationship == 'Toxicity' || qualifiers.relationship == 'interact with' || qualifiers.relationship == 'inhibits' || qualifiers.relationship == 'substrate of' || qualifiers.relationship == 'inhibition constant' || qualifiers.relationship == 'controls formation of' || qualifiers.relationship == 'has metabolite') {
            
            claimLabel = qualifiers.drug1 + "_" + qualifiers.relationship + "_" + qualifiers.drug2;
        }
    }

return claimLabel;

}


// inputs: text of current highlights
// return quote content as list of DOM node, drugList, drugListID
function generateQuote(highlightText, drugList, list, listid) {
    var drugIndexList = []; // use to store drug entries
    var processedText = ""; // use to store highlightText with added span

    //DrugEntry class
    function DrugEntry (drugName, drugStart, drugNo) {
        this.drugName = drugName;
        this.drugStart = drugStart; //indexOf(), start offset of first character
        this.drugEnd = drugStart + drugName.length - 1; //end offset of last character
        this.drugNo = drugNo; //No. of drug(1, 2, 3..)
    }
    //build drug index array
    for (var i = 0; i < drugList.length; i++) {
        var index = -1;
        var no = 0;
        while((index = highlightText.indexOf(drugList[i], index + 1)) != -1) {
            drugIndexList.push(new DrugEntry(drugList[i], index, no++));
        }
    }
    //sort drugIndexList by drugStart offset
    drugIndexList.sort(function(a, b) {
        return a.drugStart - b.drugStart;
    });

    //generate items in drop down list
    for (var i = 0; i < drugIndexList.length; i++) {
        list.push(drugIndexList[i].drugName);
        listid.push(drugIndexList[i].drugNo);
    }

    //generate highlight span intervals
    var intervals = [];
    for (var i = 0; i < drugIndexList.length; i++) {
        var start = drugIndexList[i].drugStart;
        var end = drugIndexList[i].drugEnd;
        while (i + 1 < drugIndexList.length && drugIndexList[i+1].drugStart < end) { //nextStart < currEnd --> has overlap
            //end = max(currEnd, nextEnd)
            end = Math.max(end, drugIndexList[i+1].drugEnd);
            i++;
        }
        //console.log(start + ":" + end);
        intervals.push({
            start: start,
            end: end
        });
    }
    
    //add span to text
    var pos = 0;
    for (var i = 0; i < intervals.length; i++) {
        //plain text
        var temp = highlightText.substring(pos, intervals[i].start);

        //add span
        temp += "<span class='annotator-hl' >";
        temp += highlightText.substring(intervals[i].start, intervals[i].end + 1);
        temp += "</span>";
        processedText += temp;
        pos = intervals[i].end + 1;
    }
    if (pos < highlightText.length) {
        processedText += highlightText.substring(pos, highlightText.length);
    }
    var p = document.createElement("p");

    p.innerHTML = processedText;
    
    return p;
}



function getCurrentDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
    var today = mm+'/'+dd+'/'+yyyy;
    return today;
}


// On claim form, load drug1 and drug2 information
// qualifier: claim.qualifiedBy
function loadDrugsForClaim(qualifier) {

    var existFlag = false; // if annotation has drugID info for drug 1
    $("#Drug1 > option").each(function () {
        if (this.value === qualifier.drug1ID) {
            $(this).prop('selected', true);
            existFlag = true;
        }
    });
    
    //highlight by drug 1 name when drugID not available from annotation
    if (!existFlag && qualifier.drug1 != undefined) {
        $("#Drug1").val(qualifier.drug1 + "_0");
    }
    
    existFlag = false; // if annotation has drugID info for drug 2
    $('#Drug2 > option').each(function () {
        if (this.value === qualifier.drug2ID) {
            $(this).prop('selected', true);
            existFlag = true;
        }
    });
    
    //highlight by drug 2 name when drugID not available from annotation
    if (!existFlag && qualifier.drug2 != undefined) {
        $("#Drug2").val(qualifier.drug2 + "_0");
    }
}