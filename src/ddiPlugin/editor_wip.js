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
//var ddiEditor = exports.ddiEditor = Editor.extend({
var ddiEditor = exports.ddiEditor = Widget.extend({

    constructor: function (options) {
        Widget.call(this, options);
        var editorSelf = this;
        this.fields = [];
        this.annotation = {};
        console.log("[INFO] ddieditor - constructor");

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

                        //add N/A to object metabolite drop down list
                        /*$('#object-metabolite').append($('<option>', {
                            value: "N/A",
                            text: "N/A"
                        }));
                        //add drugs to object metabolite
                        var distinctDrug = new Set();
                        for (var i = 0; i < allHighlightedDrug.length; i++) {
                            // if (!distinctDrug.has(allHighlightedDrug[i].toLowerCase())) {
                            //     distinctDrug.add(allHighlightedDrug[i].toLowerCase());
                            if (!distinctDrug.has(allHighlightedDrug[i])) {
                                distinctDrug.add(allHighlightedDrug[i]);
                                $('#object-metabolite').append($('<option>', {
                                    value: allHighlightedDrug[i],
                                    text: allHighlightedDrug[i]
                                }));
                            }
                        }*/

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
                            //parent compound
                            /*var drug1PC = claim.qualifiedBy.drug1PC;
                            var drug2PC = claim.qualifiedBy.drug2PC;
                            var isEnan = false;
                            var isMeta = false;
                            if (drug1PC != null) {
                                if (drug1PC.includes("|")) {
                                    isEnan = true;
                                    isMeta = true;
                                } else if (drug1PC === "enantiomer") {
                                    isEnan = true;
                                } else if (drug1PC === "metabolite") {
                                    isMeta = true;
                                }
                            }
                            if (isEnan) {
                                $('#drug1enantiomer').prop('checked', true);
                            }
                            if (isMeta) {
                                $('#drug1metabolite').prop('checked', true);
                            }
                            isEnan = false;
                            isMeta = false;*/

                if (claim.method == "Phenotype clinical study" || claim.method == "DDI clinical trial" || claim.method == "Case Report" || claim.method == "Statement" || claim.method == "Experiment") {
                    (claim.qualifiedBy.relationship == "Toxicity" || claim.qualifiedBy.relationship == "inhibits" || claim.qualifiedBy.relationship == "substrate of" || claim.qualifiedBy.relationship == "has metabolite" || claim.qualifiedBy.relationship == "controls formation of" || claim.qualifiedBy.relationship == "inhibition constant");
                }

                /*if (claim.method == "Phenotype clinical study") {
                //Method: (Phenotype: substrate of, inhibit)

                if (claim.qualifiedBy.relationship == "inhibits" || claim.qualifiedBy.relationship == "substrate of") {
                    showSingleDrugForClaim();
                    loadEnzymeForClaim(claim.qualifiedBy);

                                    $("#relationship option[value = 'interact with']").attr('disabled', 'disabled');
                                    $("#relationship option[value = 'interact with']").hide();
                                    if ($("#relationship option:selected").text() == "interact with") {
                    $("#relationship option:selected").prop("selected", false);
                                    }
                }

                } /*else if (claim.method == "Statement") {
                //Method: (Statement: interact with, inhibits, substrate of)

                if (claim.qualifiedBy.relationship == "inhibits" || claim.qualifiedBy.relationship == "substrate of") {
                    showSingleDrugForClaim();
                    loadEnzymeForClaim(claim.qualifiedBy);

                } else if (claim.qualifiedBy.relationship == "interact with") {
                    loadPrecipitantForClaim(claim.qualifiedBy);
                }

                // Claim statement and negation
                                /*$('#negation-label').parent().show();
                                $('#negationdiv').parent().show();

                                if (claim.negation == "Yes")
                                    $('input[name=negation][value=Yes]').prop('checked', true);
                                else if (claim.negation == "No")
                                    $('input[name=negation][value=No]').prop('checked', true);*/


               /* }*/ /*else if (claim.method == "DDI clinical trial") {
                //Method: (DDI clinical trial: interact with, inhibits, substrate of)

                if (claim.qualifiedBy.relationship == "inhibits" || claim.qualifiedBy.relationship == "substrate of") {
                    loadPrecipitantForClaim(claim.qualifiedBy);
                    loadEnzymeForClaim(claim.qualifiedBy);

                } else if (claim.qualifiedBy.relationship == "interact with") {
                    loadPrecipitantForClaim(claim.qualifiedBy);
                }

                } else if (claim.method == "Case Report") {
                //Method: (Case Report: interact with)

                if (claim.qualifiedBy.relationship == "interact with") {
                    loadPrecipitantForClaim(claim.qualifiedBy);

                    $("#relationship option[value = 'inhibits']").attr('disabled', 'disabled');
                    $("#relationship option[value = 'inhibits']").hide();
                    $("#relationship option[value = 'substrate of']").attr('disabled', 'disabled');
                    $("#relationship option[value = 'substrate of']").hide();
                                    if ($("#relationship option:selected").text() == "inhibits" || $("#relationship option:selected").text() == "substrate of") {
                    $("#relationship option:selected").prop("selected", false);
                                    }
                }

                } else if (claim.method == "Experiment") {
                //Method: (Experiment: inhibits, substrate of, has metabolite, controls formation of, inhibition constant)
                var relation = claim.qualifiedBy.relationship
                if (relation == "inhibits" || relation == "substrate of" || relation == "controls formation of" || relation == "inhibition constant") {
                    loadEnzymeForClaim(claim.qualifiedBy);
                }
                loadPrecipitantForClaim(claim.qualifiedBy);

                                $("#relationship option").removeAttr('disabled');
                                $("#relationship option").show();
                                $("#relationship option[value = 'interact with']").attr('disabled', 'disabled');
                                $("#relationship option[value = 'interact with']").hide();
                                if ($("#relationship option:selected").text() == "interact with") {
                                    $("#relationship option:selected").prop("selected", false);
                                    $("#relationship option[value='inhibits']").prop("selected", true);
                                }

                loadObjectMetabolateForClaim(distinctDrug, claim.qualifiedBy);
                }

                            //parent compound
                            /*if (!$('#drug2').parent().is(':hidden')) {
                                if (drug2PC != null) {
                                    if (drug2PC.includes("|")) {
                                        isEnan = true;
                                        isMeta = true;
                                    } else if (drug2PC === "enantiomer") {
                                        isEnan = true;
                                    } else if (drug2PC === "metabolite") {
                                        isMeta = true;
                                    }
                                }
                                if (isEnan) {
                                    $('#drug2enantiomer').prop('checked', true);
                                }
                                if (isMeta) {
                                    $('#drug2metabolite').prop('checked', true);
                                }
                            }*/
                        }

            //loadRjectedFieldsForClaim(annotation.rejected);

                    } else { // if editing data, then update claim label and drug names to data fields nav
                        //extract highlight drug from text
                        var allHighlightedDrug = [];
                        var anns = annotations.slice();
                        for (var i = 0, len = anns.length; i < len; i++) {
                            if (anns[i].annotationType == "DrugMention") {
                                allHighlightedDrug.push(anns[i].argues.hasTarget.hasSelector.exact);
                            }
                        }

                        // load MP list of data
                        if (annotation.argues.supportsBy.length > 0 && currDataNum !== "") {
                            var loadData = annotation.argues.supportsBy[currDataNum];

                            // clean material : participants, dose1, dose2...
                            cleanDataForm();
                            //Load data form
                            if (annotation.argues.method == "DDI clinical trial" || annotation.argues.method == "Phenotype clinical study" || annotation.argues.method == "Case Report" || annotation.argues.method == "Statement" || annotation.argues.method == "Experiment") {
                                loadDataItemFromAnnotation(loadData, allHighlightedDrug);
                            }
                            
                            /*if (annotation.argues.method == "Experiment") {
                                loadDataItemFromAnnotation(loadData, allHighlightedDrug);
                                //loadExperimentFromAnnotation(loadData, annotation.argues.qualifiedBy.relationship);
                            } else if (annotation.argues.method != "Case Report") {
                                loadDataItemFromAnnotation(loadData, allHighlightedDrug);
                            } else {
                                if (loadData != undefined) {
                                    loadDipsFromAnnotation(loadData);
                                } else {
                                    $("#author-total").val('NA');
                                }
                            }*/

                            var drug1doseLabel = claim.qualifiedBy.drug1 + " Dose : ";
                            var drug2doseLabel = claim.qualifiedBy.drug2 + " Dose : ";

                            /*if (claim.qualifiedBy.relationship == "interact with") {
                                if (claim.qualifiedBy.precipitant == "drug1")
                                    drug1doseLabel += " (precipitant)";
                                else if (claim.qualifiedBy.precipitant == "drug2")
                                    drug2doseLabel += " (precipitant)";
                            }*/

                            $("#drug1-dose-switch-btn").html(drug1doseLabel);
                            $("#drug2-dose-switch-btn").html(drug2doseLabel);
                            $("#drug1Dose-label").html(drug1doseLabel);
                            $("#drug2Dose-label").html(drug2doseLabel);
                            $("#claim-label-data-editor").html("<strong>Claim: </strong>" + claim.label.replace(/\_/g,' '));
                            //loadUnchangedMode();
                            postDataForm(currFormType);
                        }

                        showSaveButton(currFormType);
                    }
                    delete annotation.childNodes;
                },

                submit:function (field, annotation) {

                    if (currFormType == "claim"){

                        console.log("[editor.js] ddieditor submit claim");
                        annotation.annotationType = "DDI";

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
                            var qualifiedBy = {drug1 : "", drug2 : "", relationship : "" }; //enzyme : "", precipitant : ""};
            }
                        qualifiedBy.relationship = $('#relationship option:selected').text();

                        //parent compound - drug1
                        /*var isEnantiomer = $('#drug1enantiomer').is(':checked');
                        var isMetabolite = $('#drug1metabolite').is(':checked');
                        if (isEnantiomer && isMetabolite) {
                            qualifiedBy.drug1PC = "enantiomer|metabolite";
                        } else if (isMetabolite) {
                            qualifiedBy.drug1PC = "metabolite";
                        } else if (isEnantiomer) {
                            qualifiedBy.drug1PC = "enantiomer";
                        } else {
                            qualifiedBy.drug1PC = "";
                        }*/

            // TODO: refactoring by method/relationship
            // single drug
                        if ((qualifiedBy.relationship == "Toxicity" || qualifiedBy.relationship == "inhibits" || qualifiedBy.relationship == "substrate of" || qualifiedBy.relationship == "has metabolite" || qualifiedBy.relationship == "controls formation of" || qualifiedBy.relationship == "inhibition constant") && (method == "DDI clinical trial" || method == "Phenotype clinical study" || method == "Case Report" || method == "Experiment")) {
                            qualifiedBy.drug1 = $('#Drug1 option:selected').text();
                            qualifiedBy.drug2 = $('#Drug2 option:selected').text();
                            qualifiedBy.drug1ID = $('#Drug1 option:selected').val();
                            qualifiedBy.drug2ID = $('#Drug2 option:selected').val();
                        }
                        /*if ((qualifiedBy.relationship == "inhibits" || qualifiedBy.relationship == "substrate of") && (method == "Phenotype clinical study" || method == "Statement")) {
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
                            //parent compound - drug2
                            isEnantiomer = $('#drug2enantiomer').is(':checked');
                            isMetabolite = $('#drug2metabolite').is(':checked');
                            if (isEnantiomer && isMetabolite) {
                                qualifiedBy.drug2PC = "enantiomer|metabolite";
                            } else if (isMetabolite) {
                                qualifiedBy.drug2PC = "metabolite";
                            } else if (isEnantiomer) {
                                qualifiedBy.drug2PC = "enantiomer";
                            } else {
                                qualifiedBy.drug2PC = "";
                            }
                        }*/

                        //Method: Statement, DDI clinical trial, Phenotype clinical study, Case Report, Experiment
            var relation = qualifiedBy.relationship;
            /*if (method == "Statement") {
                // statement negation
                            var negationVal = $("input[name=negation]:checked").val();
                            annotation.argues.negation = negationVal;
                if (relation == "interact with") {
                qualifiedBy.precipitant = $("input[name=precipitant]:checked").val();
                } else if (relation == "inhibits" || relation == "substrate of") {
                qualifiedBy.enzyme = $('#enzyme option:selected').text();
                }

            } else if (method == "DDI clinical trial") {
                            qualifiedBy.precipitant = $("input[name=precipitant]:checked").val();
                            if (relation == "inhibits" || relation == "substrate of") {
                qualifiedBy.enzyme = $('#enzyme option:selected').text();
                }

            } else if (method == "Phenotype clinical study") {
                qualifiedBy.enzyme = $('#enzyme option:selected').text();

            } else if (method == "Case Report") {
                            qualifiedBy.precipitant = $("input[name=precipitant]:checked").val();

            } else if (method == "Experiment") {
                if (relation == "inhibits" || relation == "substrate of" || relation == "controls formation of" || relation == "inhibition constant") {
                qualifiedBy.enzyme = $('#enzyme option:selected').text();
                }
                            qualifiedBy.precipitant = $("input[name=precipitant]:checked").val();
                            qualifiedBy.objectMetabolite = $('#object-metabolite option:selected').text();
            }*/


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

                        /*var rejectedEvidence = $('#rejected-evidence').is(':checked');
                        var rejectReason  = $('#reject-reason').val() + "|" + $('#reject-reason-comment').val();
                        if (rejectedEvidence) {
                            annotation.rejected = {reason: rejectReason};
                        } else {
                            annotation.rejected = null;
                        }

                        if (annotation.argues.supportsBy == null)
                            annotation.argues.supportsBy = [];*/

            // submit data form
                    } else if (currFormType != "claim" && currAnnotationId != null) {
                        if (annotation.argues.supportsBy.length == 0) {
                            var data = {type : "mp:data", toxicity : {}, deathwithdrawal : {}, radiotherapy : {},  supportsBy : {type : "mp:method", supportsBy : {type : "mp:material", participants : {}, drug1Dose : {}, drug2Dose: {}}}};
                            annotation.argues.supportsBy.push(data);
                        }

                        console.log("ddieditor update data & material - num: " + currDataNum);

                        var mpData = annotation.argues.supportsBy[currDataNum];

                        // Evidence relationship
                        //mpData.evRelationship = $("input[name=evRelationship]:checked").val();

                        // MP add data-method-material
                        var partTmp = mpData.supportsBy.supportsBy.participants;
                        var partN = $('#participants').val();
                        var partTotal = $('#participantsTotal').val();
                        var partM = $('#participantsMale').val();
                        var partF = $('#participantsFemale').val();
                        var partRace = $('#participantsRace').val();
                        var partMA = $('#participantsMedianAge').val();
                        var partT = $('#participantsTumorType').val();
                        var partC = $('#participantsCancerStage').val();

                        if ((partN != "") && (partTotal != "") && (partM != "") && (partF != "") && (partRace != "") && (partMA != "") && (partT != "") && (partC != "")) {


                            partTmp.value = partN;
                            partTmp.total = partTotal;
                            partTmp.male = partM;
                            partTmp.female = partF;
                            partTmp.race = partRace;
                            partTmp.medianAge = partMA;
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

                        var radiotherapyR = $("#radiotherapy option:selected").text();

                        if (radiotherapyR != "") {

                            mpData.radiotherapy.r = radiotherapyR;

                            if (mpData.radiotherapy.ranges == null) {
                                mpData.radiotherapy.ranges = cachedOARanges;
                            }
                            if (mpData.radiotherapy.hasTarget == null) {
                                mpData.radiotherapy.hasTarget = cachedOATarget;
                            }
                        } else {
                            console.log("[WARNING] radiotherapy required fields not filled!");
                        }


                        // mpData toxicity


                        var toxicitytoxicityCriteria = $('#toxicityCriteria').val();
                        var toxicityToxicity1 = $('#toxicity1').val();
                        var toxicityGrade1 = $('#grade1').val();
                        var toxicityFrequency1 = $('#frequency1').val();
                        var toxicityDeath1 = $('#death1').val();
                        var toxicityWithdrawal1 = $('#withdrawal1').val();
                        var toxicityToxicity2 = $('#toxicity2').val();
                        var toxicityGrade2 = $('#grade2').val();
                        var toxicityFrequency2 = $('#frequency2').val();
                        var toxicityDeath2 = $('#death2').val();
                        var toxicityWithdrawal2 = $('#withdrawal2').val();
                        var toxicityToxicity3 = $('#toxicity3').val();
                        var toxicityGrade3 = $('#grade3').val();
                        var toxicityFrequency3 = $('#frequency3').val();
                        var toxicityDeath3 = $('#death3').val();
                        var toxicityWithdrawal3 = $('#withdrawal3').val();
                        var toxicityToxicity4 = $('#toxicity4').val();
                        var toxicityGrade4 = $('#grade4').val();
                        var toxicityFrequency4 = $('#frequency4').val();
                        var toxicityDeath4 = $('#death4').val();
                        var toxicityWithdrawal4 = $('#withdrawal4').val();
                        var toxicityToxicity5 = $('#toxicity5').val();
                        var toxicityGrade5 = $('#grade5').val();
                        var toxicityFrequency5 = $('#frequency5').val();
                        var toxicityDeath5 = $('#death5').val();
                        var toxicityWithdrawal5 = $('#withdrawal5').val();
                        var toxicityToxicity6 = $('#toxicity6').val();
                        var toxicityGrade6 = $('#grade6').val();
                        var toxicityFrequency6 = $('#frequency6').val();
                        var toxicityDeath6 = $('#death6').val();
                        var toxicityWithdrawal6 = $('#withdrawal6').val();
                        var toxicityToxicity7 = $('#toxicity7').val();
                        var toxicityGrade7 = $('#grade7').val();
                        var toxicityFrequency7 = $('#frequency7').val();
                        var toxicityDeath7 = $('#death7').val();
                        var toxicityWithdrawal7 = $('#withdrawal7').val();
                        var toxicityToxicity8 = $('#toxicity8').val();
                        var toxicityGrade8 = $('#grade8').val();
                        var toxicityFrequency8 = $('#frequency8').val();
                        var toxicityDeath8 = $('#death8').val();
                        var toxicityWithdrawal8 = $('#withdrawal8').val();
                        var toxicityToxicity9 = $('#toxicity9').val();
                        var toxicityGrade9 = $('#grade9').val();
                        var toxicityFrequency9 = $('#frequency9').val();
                        var toxicityDeath9 = $('#death9').val();
                        var toxicityWithdrawal9 = $('#withdrawal9').val();
                        var toxicityToxicity10 = $('#toxicity10').val();
                        var toxicityGrade10 = $('#grade10').val();
                        var toxicityFrequency10 = $('#frequency10').val();
                        var toxicityDeath10 = $('#death10').val();
                        var toxicityWithdrawal10 = $('#withdrawal10').val();

                        if (toxicitytoxicityCriteria != "" && toxicityToxicity1 != "" && toxicityGrade1 != "" && toxicityFrequency1 != "" && toxicityDeath1 != "" && toxicityWithdrawal1 != "" && toxicityToxicity2 != "" && toxicityGrade2 != "" && toxicityFrequency2 != "" && toxicityDeath2 != "" && toxicityWithdrawal2 != "" && toxicityToxicity3 != "" && toxicityGrade3 != "" && toxicityFrequency3 != "" && toxicityDeath3 != "" && toxicityWithdrawal3 != "" &&
                            toxicityToxicity4 != "" && toxicityGrade4 != "" && toxicityFrequency4 != "" && toxicityDeath4 != "" && toxicityWithdrawal4 != "" && toxicityToxicity5 != "" && toxicityGrade5 != "" && toxicityFrequency5 != "" && toxicityDeath5 != "" && toxicityWithdrawal5 != "" && 
                            toxicityToxicity6 != "" && toxicityGrade6 != "" && toxicityFrequency6 != "" && toxicityDeath6 != "" && toxicityWithdrawal6 != "" && toxicityToxicity7 != "" && toxicityGrade7 != "" && toxicityFrequency7 != "" && toxicityDeath7 != "" && toxicityWithdrawal7 != "" && 
                            toxicityToxicity8 != "" && toxicityGrade8 != "" && toxicityFrequency8 != "" && toxicityDeath8!= "" && toxicityWithdrawal8 != "" && toxicityToxicity9 != "" && toxicityGrade9!= "" && toxicityFrequency9 != "" && toxicityDeath9 != "" && toxicityWithdrawal9 != "" &&
                            toxicityToxicity10 != "" && toxicityGrade10 != "" && toxicityFrequency10 != "" && toxicityDeath10 != "" && toxicityWithdrawal10 != "") {

                            mpData.toxicity.toxicityCriteria = toxicitytoxicityCriteria;
                            mpData.toxicity.Toxicity1 = toxicityToxicity1;
                            mpData.toxicity.grade1 = toxicityGrade1;
                            mpData.toxicity.frequency1 = toxicityFrequency1;
                            mpData.toxicity.death1 = toxicityDeath1;
                            mpData.toxicity.withdrawal1 = toxicityWithdrawal1;
                            mpData.toxicity.Toxicity2 = toxicityToxicity2;
                            mpData.toxicity.grade2 = toxicityGrade2;
                            mpData.toxicity.frequency2 = toxicityFrequency2;
                            mpData.toxicity.death2 = toxicityDeath2;
                            mpData.toxicity.withdrawal2 = toxicityWithdrawal2;
                            mpData.toxicity.Toxicity3 = toxicityToxicity3;
                            mpData.toxicity.grade3 = toxicityGrade3;
                            mpData.toxicity.frequency3 = toxicityFrequency3;
                            mpData.toxicity.death3 = toxicityDeath3;
                            mpData.toxicity.withdrawal3 = toxicityWithdrawal3;
                            mpData.toxicity.Toxicity4 = toxicityToxicity4;
                            mpData.toxicity.grade4 = toxicityGrade4;
                            mpData.toxicity.frequency4 = toxicityFrequency4;
                            mpData.toxicity.death4 = toxicityDeath4;
                            mpData.toxicity.withdrawal4 = toxicityWithdrawal4;
                            mpData.toxicity.Toxicity5 = toxicityToxicity5;
                            mpData.toxicity.grade5 = toxicityGrade5;
                            mpData.toxicity.frequency5 = toxicityFrequency5;
                            mpData.toxicity.death5 = toxicityDeath5;
                            mpData.toxicity.withdrawal5 = toxicityWithdrawal5;
                            mpData.toxicity.Toxicity6 = toxicityToxicity6;
                            mpData.toxicity.grade6 = toxicityGrade6;
                            mpData.toxicity.frequency6 = toxicityFrequency6;
                            mpData.toxicity.death6 = toxicityDeath6;
                            mpData.toxicity.withdrawal6 = toxicityWithdrawal6;
                            mpData.toxicity.Toxicity7 = toxicityToxicity7;
                            mpData.toxicity.grade7 = toxicityGrade7;
                            mpData.toxicity.frequency7 = toxicityFrequency7;
                            mpData.toxicity.death7 = toxicityDeath7;
                            mpData.toxicity.withdrawal7 = toxicityWithdrawal7;
                            mpData.toxicity.Toxicity8 = toxicityToxicity8;
                            mpData.toxicity.grade8 = toxicityGrade8;
                            mpData.toxicity.frequency8 = toxicityFrequency8;
                            mpData.toxicity.death8 = toxicityDeath8;
                            mpData.toxicity.withdrawal8 = toxicityWithdrawal8;
                            mpData.toxicity.Toxicity9 = toxicityToxicity9;
                            mpData.toxicity.grade9 = toxicityGrade9;
                            mpData.toxicity.frequency9 = toxicityFrequency9;
                            mpData.toxicity.death9 = toxicityDeath9;
                            mpData.toxicity.withdrawal9 = toxicityWithdrawal9;
                            mpData.toxicity.Toxicity10 = toxicityToxicity10;
                            mpData.toxicity.grade10 = toxicityGrade10;
                            mpData.toxicity.frequency10 = toxicityFrequency10;
                            mpData.toxicity.death10 = toxicityDeath10;
                            mpData.toxicity.withdrawal10 = toxicityWithdrawal10;


                            if (mpData.toxicity.ranges == null) {
                                mpData.toxicity.ranges = cachedOARanges;
                            }
                            if (mpData.toxicity.hasTarget == null) {
                                mpData.toxicity.hasTarget = cachedOATarget;
                            }
                        } else {
                            console.log("[WARNING] toxicity required fields not filled!");
                        }


                        //mpData death/withrawal

                        var deathwithdrawalDeathFrequency = $('#deathFrequency').val();
                        var deathwithdrawalWithdrawalFrequency = $('#withdrawalFrequency').val();

                        if (deathwithdrawalDeathFrequency != "" && deathwithdrawalWithdrawalFrequency != "") {

                            mpData.deathwithdrawal.deathFrequency = deathwithdrawalDeathFrequency;
                            mpData.deathwithdrawal.withdrawalFrequency = deathwithdrawalWithdrawalFrequency;

                            if (mpData.deathwithdrawal.ranges == null) {
                                mpData.deathwithdrawal.ranges = cachedOARanges;
                            }
                            if (mpData.deathwithdrawal.hasTarget == null) {
                                mpData.deathwithdrawal.hasTarget = cachedOATarget;
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
        console.log("ddieditor - submitNotClose called");
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
        
        if (method == 'DDI clinical trial' || method == 'Phenotype clinical study' || method == 'Case Report' || method == 'Experiment' || method == 'Statement') {
            if (relationship == 'Toxicity' || relationship == 'inhibits' || relationship == 'substrate of' || relationship == 'has metabolite of' || relationship == 'controls formation of' || relationship == 'inhibition constant') {
               if (!this._isListboxFilled($('#Drug1')[0], true)
                valid =false;
            }
        }
        
        /*if (method == 'Statement') {
        if (relationship == 'interact with') {
            if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#Drug2')[0], true)) || (!this._isRatioButtonFilled('precipitant')))
            valid = false;
        } else if (relationship == 'inhibits' || relationship == 'substrate of') {
            if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#enzyme')[0], false)))
            valid = false;
        }
        } else if (method == 'DDI clinical trial') {
        if (relationship == 'interact with') {
            if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#Drug2')[0], true)) || (!this._isRatioButtonFilled('precipitant')))
            valid = false;
        } else if (relationship == 'inhibits' || relationship == 'substrate of') {
            if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#Drug2')[0], true)) || (!this._isRatioButtonFilled('precipitant')) || (!this._isListboxFilled($('#enzyme')[0], false)))
            valid = false;
        }
        } else if (method == 'Case Report') {
        if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#Drug2')[0], true)))
            valid = false;
        } else if (method == 'Phenotype clinical study') {
        if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#enzyme')[0], false)))
            valid = false;
        } else if (method == 'Experiment') {
        if (relationship == 'inhibits' || relationship == 'substrate of') {
            if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#enzyme')[0], false)))
            valid = false;
        } else if (relationship == 'has metabolite') {
            if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#object-metabolite')[0], false)))
            valid = false;
        } else if (relationship == 'controls formation of') {
            if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#object-metabolite')[0], false)) || (!this._isListboxFilled($('#enzyme')[0], false)))
            valid = false;
        } else if (relationship == 'inhibition constant') {
            if ((!this._isListboxFilled($('#Drug1')[0], true)) || (!this._isListboxFilled($('#enzyme')[0], false)))
            valid = false;
        }
        }*/
    } else { //validate data form
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

        console.log("ddieditor - _onDeleteClick:")
        if (this.annotation.annotationType == "DDI") {
            console.log(this.annotation);

            preventEventDefault(event);
            this.options.onDelete(this.annotation);
            undrawCurrhighlighter();
        }

        // reset unsave status
        unsaved = false
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


//load dips from annotation
/*function loadDipsFromAnnotation(loadData) {
    //1.load reviewer info
    if (loadData.reviewer != undefined && loadData.reviewer.length != 0) {
        var reviewerTmp = loadData.reviewer;
        $('input[name=dips-reviewer][value="'+ reviewerTmp.reviewer +'"]').prop('checked', true);
        if(reviewerTmp.date != undefined) {
            $('#datepicker').val(reviewerTmp.date);
        }
        if (reviewerTmp.reviewer == "Author") {
            $('#author-lackscore').show();
            $('#author-lackscore-label').show();
            if (reviewerTmp.lackInfo != undefined && reviewerTmp.lackInfo) {
                $('#author-lackscore').prop("checked", true);
                $('#author-total').show();
                $('#author-total-label').show();
                $('#author-total').val(reviewerTmp.total);
            } else {
                $("#author-total").val('NA');
            }
        }
    } else {
        $("#author-total").val('NA');
    }

    //2. dose1 & dose2
    if (loadData.supportsBy.supportsBy.drug1Dose != null) {
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
        if (loadData.supportsBy.supportsBy.drug1Dose.hasTarget != null) {
            $('#dose1quote').html(loadData.supportsBy.supportsBy.drug1Dose.hasTarget.hasSelector.exact || '');
        } else {
            if (cachedOATarget.hasSelector != null)
                $('#dose1quote').html(cachedOATarget.hasSelector.exact || '');
            else
                $('#dose1quote').html('');
        }
    }
    if (loadData.supportsBy.supportsBy.drug2Dose != null) {
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
        if (loadData.supportsBy.supportsBy.drug2Dose.hasTarget != null) {
            $('#dose2quote').html(loadData.supportsBy.supportsBy.drug2Dose.hasTarget.hasSelector.exact || '');
        } else {
            if (cachedOATarget.hasSelector != null)
                $('#dose2quote').html(cachedOATarget.hasSelector.exact || '');
            else
                $('#dose2quote').html('');
        }
    }
    //3. dips questions
    if (loadData.dips != null) {
        for (var i = 1; i <= 10; i++) {
            if (loadData.dips["q" + i] != null && loadData.dips["q" + i] != "") {
                //console.log(i + ":" + loadData.dips["q" + i]);
                $('input[name=dips-q' + i + '][value="' + loadData.dips["q"+i] + '"]').prop('checked', true);
            }
        }
    }
}*/

// load one experiment item from mp annotation
/*function loadExperimentFromAnnotation(loadData, relationship) {
    //change "precipitant" or "inhibit" based on relationship
    if (relationship == "inhibits") {
        $('#nav-rateWith-btn').text("Metabolite Rate With Precipitant");
        $('#nav-rateWithout-btn').text("Metabolite Rate Without Precipitant");
        $('#rateWithVal-label').text("Metabolite rate with precipitant (µL/min/mg): ");
        $('#rateWithoutVal-label').text("Metabolite rate without precipitant (µL/min/mg): ");
    } else if (relationship == "substrate of"){
        $('#nav-rateWith-btn').text("Metabolite Rate With Inhibition");
        $('#nav-rateWithout-btn').text("Metabolite Rate Without Inhibition");
        $('#rateWithVal-label').text("Metabolite rate with inhibition (µL/min/mg): ");
        $('#rateWithoutVal-label').text("Metabolite rate without inhibition (µL/min/mg): ");
    }

    if (loadData.cellSystem != null && loadData.cellSystem.hasTarget != null) {
        $('#cellSystemquote').html(loadData.cellSystem.hasTarget.hasSelector.exact || '');
        $("#cellSystem").val(loadData.cellSystem.value);
    } else {
        if (cachedOATarget.hasSelector != null)
            $('#cellSystemquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#cellSystemquote').html('');
    }

    if (loadData.metaboliteRateWith != null && loadData.metaboliteRateWith.hasTarget != null) {
        $('#rateWithquote').html(loadData.metaboliteRateWith.hasTarget.hasSelector.exact || '');
        $("#rateWithVal").val(loadData.metaboliteRateWith.value);
    } else {
        if (cachedOATarget.hasSelector != null)
            $('#rateWithquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#rateWithquote').html('');
    }

    if (loadData.metaboliteRateWithout != null && loadData.metaboliteRateWithout.hasTarget != null) {
        $('#rateWithoutquote').html(loadData.metaboliteRateWithout.hasTarget.hasSelector.exact || '');
        $("#rateWithoutVal").val(loadData.metaboliteRateWithout.value);
    } else {
        if (cachedOATarget.hasSelector != null)
            $('#rateWithoutquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#rateWithoutquote').html('');
    }

    if (loadData.measurement != null) {
        var mTypes = ["cl", "vmax", "km", "ki", "inhibition", "kinact", "ic50"];
        for (var i = 0; i < mTypes.length; i++) {
            var mType = mTypes[i];

            if (loadData.measurement[mType] == null || loadData.measurement[mType].hasTarget == null) {
                //quote context can be used multiple times
                if (cachedOATarget.hasSelector != null)
                    $('#'+mType+'quote').html(cachedOATarget.hasSelector.exact || '');
                else
                    $('#'+mType+'quote').html('');
            } else {
                //quote
                $('#'+mType+'quote').html(loadData.measurement[mType].hasTarget.hasSelector.exact || '');
                if (loadData.measurement[mType].value == "unchanged") {
                    //unchanged
                    $('#'+mType+'-unchanged-checkbox').prop("checked", true);
                } else {
                    //value
                    $("#"+mType+"Value").val(loadData.measurement[mType].value);
                    //unit - some options are added by users
                    if (loadData.measurement[mType].unit != null) {
                        var tempval = loadData.measurement[mType].unit;
                        if ($('#'+mType+'Unit option[value = \"'+tempval+'\"]').length == 0) {
                            $('#'+mType+'Unit').append($('<option>', {
                                value: tempval,
                                text: tempval
                            }));
                        }
                    }
                    $("#"+mType+"Unit").val(loadData.measurement[mType].unit);
                }
            }
        }
    }

    // evidence relationship
    if (loadData.evRelationship == "refutes")
        $('input[name=evRelationship][value=refutes]').prop('checked', true);
    else if (loadData.evRelationship == "supports")
        $('input[name=evRelationship][value=supports]').prop('checked', true);

    // questions for dictating method type
    if (loadData.grouprandom == "yes")
        $('input[name=grouprandom][value=yes]').prop('checked', true);
    else if (loadData.grouprandom == "no")
        $('input[name=grouprandom][value=no]').prop('checked', true);
    if (loadData.parallelgroup == "yes")
        $('input[name=parallelgroup][value=yes]').prop('checked', true);
    else if (loadData.parallelgroup == "no")
        $('input[name=parallelgroup][value=no]').prop('checked', true);

    if (annotation.argues.method != null) {
        $("#evidencetype-method > option").each(function () {
            if (this.value === annotation.argues.method) $(this).prop('selected', true);
        });
    }
}*/

// load one data item from mp annotation

function loadDataItemFromAnnotation(loadData, allHighlightedDrug) {

    // load mp material field
    $("#participants").val(loadData.supportsBy.supportsBy.participants.value);
    $('#participantsTotal').val(loadData.supportsBy.supportsBy.participants.total);
    $('#participantsMale').val(loadData.supportsBy.supportsBy.participants.male);
    $('#participantsFemale').val(loadData.supportsBy.supportsBy.participants.female);
    $('#participantsRace').val(loadData.supportsBy.supportsBy.participants.race);
    $('#participantsMedianAge').val(loadData.supportsBy.supportsBy.participants.medianAge);
    $('#participantsTumorType').val(loadData.supportsBy.supportsBy.participants.tumorType);
    $('#participantsCancerStage').val(loadData.supportsBy.supportsBy.participants.cancerStage);

    if (loadData.supportsBy.supportsBy.participants.hasTarget != null) {
        $('#participantsquote').html(loadData.supportsBy.supportsBy.participants.hasTarget.hasSelector.exact || '');
    } else {
        if (cachedOATarget.hasSelector != null)
            $('#participantsquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#participantsquote').html('');
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
            if (this.value === loadData.radiotherapy.r) {
                $(this).prop('selected', true);
            }
        });
    if (loadData.radiotherapy.hasTarget != null) {

        $('#radiotherapyquote').html(loadData.radiotherapy.hasTarget.hasSelector.exact || '');
    }
    else {

        if (cachedOATarget.hasSelector != null)
            $('#radiotherapyquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#radiotherapyquote').html('');
    }

    // load toxicity Data

    $('#toxicityCriteria').val(loadData.toxicity.toxicityCriteria);
    $('#toxicity1').val(loadData.toxicity.Toxicity1);
    $('#grade1').val(loadData.toxicity.grade1);
    $('#frequency1').val(loadData.toxicity.frequency1);
    $('#death1').val(loadData.toxicity.death1);
    $('#withdrawal1').val(loadData.toxicity.withdrawal1);
    $('#toxicity2').val(loadData.toxicity.Toxicity2);
    $('#grade2').val(loadData.toxicity.grade2);
    $('#frequency2').val(loadData.toxicity.frequency2);
    $('#death2').val(loadData.toxicity.death2);
    $('#withdrawal2').val(loadData.toxicity.withdrawal2);
    $('#toxicity3').val(loadData.toxicity.Toxicity3);
    $('#grade3').val(loadData.toxicity.grade3);
    $('#frequency3').val(loadData.toxicity.frequency3);
    $('#death3').val(loadData.toxicity.death3);
    $('#withdrawal3').val(loadData.toxicity.withdrawal3);
    $('#toxicity4').val(loadData.toxicity.Toxicity4);
    $('#grade4').val(loadData.toxicity.grade4);
    $('#frequency4').val(loadData.toxicity.frequency4);
    $('#death4').val(loadData.toxicity.death4);
    $('#withdrawal4').val(loadData.toxicity.withdrawal4);
    $('#toxicity5').val(loadData.toxicity.Toxicity5);
    $('#grade5').val(loadData.toxicity.grade5);
    $('#frequency5').val(loadData.toxicity.frequency5);
    $('#death5').val(loadData.toxicity.death5);
    $('#withdrawal5').val(loadData.toxicity.withdrawal5);
    $('#toxicity6').val(loadData.toxicity.Toxicity6);
    $('#grade6').val(loadData.toxicity.grade6);
    $('#frequency6').val(loadData.toxicity.frequency6);
    $('#death6').val(loadData.toxicity.death6);
    $('#withdrawal6').val(loadData.toxicity.withdrawal6);
    $('#toxicity7').val(loadData.toxicity.Toxicity7);
    $('#grade7').val(loadData.toxicity.grade7);
    $('#frequency7').val(loadData.toxicity.frequency7);
    $('#death7').val(loadData.toxicity.death7);
    $('#withdrawal7').val(loadData.toxicity.withdrawal7);
    $('#toxicity8').val(loadData.toxicity.Toxicity8);
    $('#grade8').val(loadData.toxicity.grade8);
    $('#frequency8').val(loadData.toxicity.frequency8);
    $('#death8').val(loadData.toxicity.death8);
    $('#withdrawal8').val(loadData.toxicity.withdrawal8);
    $('#toxicity9').val(loadData.toxicity.Toxicity9);
    $('#grade9').val(loadData.toxicity.grade9);
    $('#frequency9').val(loadData.toxicity.frequency9);
    $('#death9').val(loadData.toxicity.death9);
    $('#withdrawal9').val(loadData.toxicity.withdrawal9);
    $('#toxicity10').val(loadData.toxicity.Toxicity10);
    $('#grade10').val(loadData.toxicity.grade10);
    $('#frequency10').val(loadData.toxicity.frequency10);
    $('#death10').val(loadData.toxicity.death10);
    $('#withdrawal10').val(loadData.toxicity.withdrawal10);

    /*$('#toxicityCriteria').val(loadData.toxicity.toxicityCriteria);
    $('#toxicity').map(function(){return $(this).val(loadData.toxicity.Toxicity);});
    $('#grade').map(function(){return $(this).val(loadData.toxicity.grade);});
    $('#frequency').map(function(){return $(this).val(loadData.toxicity.frequency);});
    $('#death').map(function(){return $(this).val(loadData.toxicity.death);});
    $('#withdrawal').map(function(){return $(this).val(loadData.toxicity.Toxicity);});*/

    if (loadData.toxicity.hasTarget != null) {
        $('#toxicityquote').html(loadData.toxicity.hasTarget.hasSelector.exact || '');
    } else {
        if (cachedOATarget.hasSelector != null)
            $('#toxicityquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#toxicityquote').html('');
    }

    // load Death/Withdrawal frequency
    $("#deathFrequency").val(loadData.deathwithdrawal.deathFrequency);
    $("#withdrawalFrequency").val(loadData.deathwithdrawal.withdrawalFrequency);

    if (loadData.deathwithdrawal.hasTarget != null) {
        $('#deathwithdrawalquote').html(loadData.deathwithdrawal.hasTarget.hasSelector.exact || '');
    }
    else {
        if (cachedOATarget.hasSelector != null)
            $('#deathwithdrawalquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#deathwithdrawalquote').html('');
    }
}
/*function loadDataItemFromAnnotation(loadData, allHighlightedDrug) {

    // load mp material field
    $("#participants").val(loadData.supportsBy.supportsBy.participants.value);
    if (loadData.supportsBy.supportsBy.participants.hasTarget != null) {
        $('#participantsquote').html(loadData.supportsBy.supportsBy.participants.hasTarget.hasSelector.exact || '');
    }
    else {
        if (cachedOATarget.hasSelector != null)
            $('#participantsquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#participantsquote').html('');
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
    if (loadData.supportsBy.supportsBy.drug2Dose.hasTarget != null) {
        $('#dose2quote').html(loadData.supportsBy.supportsBy.drug2Dose.hasTarget.hasSelector.exact || '');
    }
    else {
        if (cachedOATarget.hasSelector != null)
            $('#dose2quote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#dose2quote').html('');
    }
    //data - phenotype
    //load quote
    var exact = '';
    if (loadData.supportsBy.supportsBy.phenotype != null && loadData.supportsBy.supportsBy.phenotype.hasTarget != null) {
        exact = (loadData.supportsBy.supportsBy.phenotype.hasTarget.hasSelector.exact || '');
    } else if (cachedOATarget.hasSelector != null) {
        exact = (cachedOATarget.hasSelector.exact || '');
    }
    $('#phenotypequote').html(exact);
    //generate maker drug dropdown list
    var markerDrugList = [];
    for (var i = 0; i < allHighlightedDrug.length; i++) {
        if (exact.indexOf(allHighlightedDrug[i]) != -1) {
            markerDrugList.push(allHighlightedDrug[i]);
        }
    }
    $('#markerDrug').append($('<option>', {
        value: 'UNK',
        text: 'UNK'
    }));
    for (var i = 0; i < markerDrugList.length; i++) {
        $('#markerDrug').append($('<option>', {
            value: markerDrugList[i],
            text: markerDrugList[i]
        }));
    }
    if (loadData.supportsBy.supportsBy.phenotype != null) {

        var phenotypeType = loadData.supportsBy.supportsBy.phenotype;
        //load value
        //widget show or hide
        $('input[name=phenotypeGenre][value="'+ phenotypeType.type +'"]').prop('checked', true);
        if (phenotypeType.type == "Genotype") {
            $("#geneFamily > option").each(function () {
                if (this.value === loadData.supportsBy.supportsBy.phenotype.typeVal) {
                    $(this).prop('selected', true);
                }
            });
            $('#geneFamily').show();
            $('#geneFamily-label').show();
            $('#markerDrug').hide();
            $('#markerDrug-label').hide();
        } else if (phenotypeType.type == "Drug Phenotype"){
            $("#markerDrug > option").each(function () {
                if (this.value === loadData.supportsBy.supportsBy.phenotype.typeVal) {
                    $(this).prop('selected', true);
                }
            });
            $('#geneFamily').hide();
            $('#geneFamily-label').hide();
            $('#markerDrug').show();
            $('#markerDrug-label').show();
        } else {
            $('#geneFamily').hide();
            $('#geneFamily-label').hide();
            $('#markerDrug').hide();
            $('#markerDrug-label').hide();
        }
        $('input[name=phenotypeMetabolizer][value="'+ phenotypeType.metabolizer +'"]').prop('checked', true);
        $('input[name=phenotypePopulation][value="'+ phenotypeType.population +'"]').prop('checked', true);
    }


    // load mp data fields

    // evidence relationship
    if (loadData.evRelationship == "refutes")
        $('input[name=evRelationship][value=refutes]').prop('checked', true);
    else if (loadData.evRelationship == "supports")
        $('input[name=evRelationship][value=supports]').prop('checked', true);

    // questions for dictating method type
    if (loadData.grouprandom == "yes")
        $('input[name=grouprandom][value=yes]').prop('checked', true);
    else if (loadData.grouprandom == "no")
        $('input[name=grouprandom][value=no]').prop('checked', true);
    if (loadData.parallelgroup == "yes")
        $('input[name=parallelgroup][value=yes]').prop('checked', true);
    else if (loadData.parallelgroup == "no")
        $('input[name=parallelgroup][value=no]').prop('checked', true);

    if (annotation.argues.method != null) {
        $("#evidencetype-method > option").each(function () {
            if (this.value === annotation.argues.method) $(this).prop('selected', true);
        });
    }


    // AUC: if unchanged then mark on checkbox, else load auc
    if (loadData.auc.value == "unchanged") {
        $('#auc-unchanged-checkbox').prop("checked", true);
    } else {
        $("#auc").val(loadData.auc.value);
        $("#aucType > option").each(function () {
            if (this.value === loadData.auc.type) {
                $(this).prop('selected', true);
            }
        });
        $("#aucDirection > option").each(function () {
            if (this.value === loadData.auc.direction) {
                $(this).prop('selected', true);
            }
        });
    }
    if (loadData.auc.hasTarget != null) {
        $('#aucquote').html(loadData.auc.hasTarget.hasSelector.exact || '');
    }
    else {
        if (cachedOATarget.hasSelector != null)
            $('#aucquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#aucquote').html('');
    }


    // CMAX: if unchanged then mark on checkbox, else load cmax
    if (loadData.cmax.value == "unchanged") {
        $('#cmax-unchanged-checkbox').prop("checked", true);
    } else {
        $("#cmax").val(loadData.cmax.value);
        $("#cmaxType > option").each(function () {
            if (this.value === loadData.cmax.type) {
                $(this).prop('selected', true);
            }
        });
        $("#cmaxDirection > option").each(function () {
            if (this.value === loadData.cmax.direction) {
                $(this).prop('selected', true);
            }
        });
    }
    if (loadData.cmax.hasTarget != null) {
        $('#cmaxquote').html(loadData.cmax.hasTarget.hasSelector.exact || '');
    }
    else {
        if (cachedOATarget.hasSelector != null)
            $('#cmaxquote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#cmaxquote').html('');
    }

    // CLEARANCE: if unchanged then mark on checkbox, else load clearance
    if (loadData.clearance.value == "unchanged") {
        $('#clearance-unchanged-checkbox').prop("checked", true);
    } else {
        $("#clearance").val(loadData.clearance.value);
        $("#clearanceType > option").each(function () {
            if (this.value === loadData.clearance.type) {
                $(this).prop('selected', true);
            }
        });
        $("#clearanceDirection > option").each(function () {
            if (this.value === loadData.clearance.direction) {
                $(this).prop('selected', true);
            }
        });
    }
    if (loadData.clearance.hasTarget != null) {
        $('#clearancequote').html(loadData.clearance.hasTarget.hasSelector.exact || '');
    }
    else {
        if (cachedOATarget.hasSelector != null)
            $('#clearancequote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#clearancequote').html('');
    }

    // HALFLIFE: if unchanged then mark on checkbox, else load halflife
    if (loadData.halflife.value == "unchanged") {
        $('#halflife-unchanged-checkbox').prop("checked", true);
    } else {
        $("#halflife").val(loadData.halflife.value);
        $("#halflifeType > option").each(function () {
            if (this.value === loadData.halflife.type) {
                $(this).prop('selected', true);
            }
        });
        $("#halflifeDirection > option").each(function () {
            if (this.value === loadData.halflife.direction) {
                $(this).prop('selected', true);
            }
        });
    }
    if (loadData.halflife.hasTarget != null) {
        $('#halflifequote').html(loadData.halflife.hasTarget.hasSelector.exact || '');
    }
    else {
        if (cachedOATarget.hasSelector != null)
            $('#halflifequote').html(cachedOATarget.hasSelector.exact || '');
        else
            $('#halflifequote').html('');
    }
}*/

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
/*function postDataForm(targetField) {

    console.log("ddieditor - postDataForm: " + targetField);
    $("#mp-claim-form").hide();

    // field name and actual div id mapping
    var fieldM = {"reviewer":"reviewer", "evRelationship":"evRelationship", "participants":"participants", "dose1":"drug1Dose", "dose2":"drug2Dose", "phenotype":"phenotype", "auc":"auc", "cmax":"cmax", "clearance":"clearance", "halflife":"halflife", "studytype":"studytype",
    "q1":"q1", "q2":"q2", "q3":"q3", "q4":"q4", "q5":"q5", "q6":"q6", "q7":"q7", "q8":"q8", "q9":"q9", "q10":"q10", "cellSystem":"cellSystem", "rateWith":"rateWithVal", "rateWithout":"rateWithoutVal", "cl":"cl", "vmax":"vmax", "km":"km", "ki":"ki", "inhibition":"inhibition",
    "kinact":"kinact", "ic50":"ic50"};
    var showDeleteBtn = false;

    for (var field in fieldM) {
        var dataid = "mp-data-form-"+field;
        var fieldVal = "";
        if (field === targetField) {
            $("#"+dataid).show();  // show specific data form
            // inspect that is target form has value filled

            if (field == "evRelationship" || field =="studytype") { // when field is radio button
                fieldVal = $("input[name="+field+"]:checked").val();
            } else if (field == "auc" || field == "cmax" || field == "clearance" || field == "halflife") { // when field is checkbox
                $("#mp-data-nav").show();
                if ($('#' + field + '-unchanged-checkbox').is(':checked'))
                    showDeleteBtn = true;
                fieldVal = $("#" + fieldM[field]).val();
            } else if (currAnnotation.argues.method == "Case Report"){
                $("#mp-dips-nav").show();
                fieldVal = $("#dips-" + fieldM[field]).val();
            } else if (field == "cl" || field == "vmax" || field == "km" || field == "ki" || field == "inhibition" || field == "kinact" || field == "ic50") {
                if ($('#' + field + '-unchanged-checkbox').is(':checked'))
                    showDeleteBtn = true;
                experimentNav();
                fieldVal = $("#" + fieldM[field] + "Value").val();
            } else if (currAnnotation.argues.method == "Experiment"){
                experimentNav();
                fieldVal = $("#" + fieldM[field]).val();
            }  else if (field == "phenotype"){ // when field is text input
                $("#mp-data-nav").show();
                fieldVal = $("#" + fieldM[field] + "Genre").val();
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
}*/

function postDataForm(targetField) {

    console.log("mpeditor - postDataForm: " + targetField);
    $("#mp-claim-form").hide();

    // field name and actual div id mapping
    var fieldM = {"participants":"participants", "dose1":"drug1Dose", "dose2":"drug2Dose", "radiotherapy":"radiotherapy", "toxicity":"toxicity", "deathwithdrawal":"deathwithdrawal"};
    var showDeleteBtn = false;

    for (var field in fieldM) {
        var dataid = "mp-data-form-"+field;
        var fieldVal = "";
        if (field === targetField) {
            $("#"+dataid).show();  // show specific data form
            // inspect that is target form has value filled

            if (field == "radiotherapy" || field =="toxicity" || field == "deathwithdrawal") {
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

function experimentNav() {
    var withRateLabel = $("#withRate-label").text();
    var withoutRateLabel = $("#withoutRate-label").text();
    $("#nav-rateWith-btn").text(withRateLabel);
    if (withoutRateLabel == "") {
        $("#nav-rateWithout-btn").hide();
        $("#rateWithoutArrow").hide();
    } else {
        $("#nav-rateWithout-btn").text(withoutRateLabel);
        $("#nav-rateWithout-btn").show();
        $("#rateWithoutArrow").show();
    }
    $("#mp-experiment-nav").show();

}

//initial load unchanged mode
//fields allowed: auc, cmax, clearance, halflife
function loadUnchangedMode() {
    var fields = ["auc", "cmax", "clearance", "halflife"];
    for (var i = 0; i < fields.length; i++) {
        if ($('#' + fields[i] + '-unchanged-checkbox').is(':checked')) {
            $('#'+fields[i]).attr('disabled', true);
            $('#'+fields[i]+'Type').attr('disabled', true);
            $('#'+fields[i]+'Direction').attr('disabled', true);
        } else {
            $('#'+fields[i]).attr('disabled', false);
            $('#'+fields[i]+'Type').attr('disabled', false);
            $('#'+fields[i]+'Direction').attr('disabled', false);
        }
    }

    var fields = ["cl", "vmax", "km", "ki", "inhibition", "kinact", "ic50"];
    for (var i = 0; i < fields.length; i++) {
        if ($('#' + fields[i] + '-unchanged-checkbox').is(':checked')) {
            $('#'+fields[i]+'Unit').attr('disabled', true);
            $('#'+fields[i]+'Value').attr('disabled', true);
        } else {
            $('#'+fields[i]+'Unit').attr('disabled', false);
            $('#'+fields[i]+'Value').attr('disabled', false);
        }
    }
}

// clean all value of claim form
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

    var allDataFields = ["#participants", "#participantsTotal", "#participantsMale", "#participantsFemale", "#participantsRace", "#participantsMedianAge", "#participantsTumorType", "#participantsCancerStage", "#drug1Dose", "#drug1Duration", "#drug1Formulation", "#drug1Regimens", "#drug1ToleratedDose", "#drug2Dose", "#drug2Duration", "#drug2Formulation", "#drug2Regimens", "#drug2ToleratedDose", "#radiotherapy",
    "#toxicityCriteria", "#toxicity1", "#grade1", "#frequency1", "#death1", "#withdrawal1", "#toxicity2", "#grade2", "#frequency2", "#death2", "#withdrawal2", "#toxicity3", "#grade3", "#frequency3", "#death3", "#withdrawal3","#toxicity4", "#grade4", "#frequency4", "#death4", "#withdrawal4",
    "#toxicity5", "#grade5", "#frequency5", "#death5", "#withdrawal5", "#toxicity6", "#grade6", "#frequency6", "#death6", "#withdrawal6", "#toxicity7", "#grade7", "#frequency7", "#death7", "#withdrawal7", "#toxicity8", "#grade8", "#frequency8", "#death8", "#withdrawal8",
    "#toxicity9", "#grade9", "#frequency9", "#death9", "#withdrawal9", "#toxicity10", "#grade10", "#frequency10", "#death10", "#withdrawal10", "#deathFrequency", "#withdrawalFrequency"];
    for (var i = 0; i < allDataFields.length; i++) {
        $(allDataFields[i]).css("background-color", "");
    }

    //clean material
    $("#participants").val('');
    $('#participantsTotal').val('');
    $('#participantsMale').val('');
    $('#participantsFemale').val('');
    $('#participantsRace').val('');
    $('#participantsMedianAge').val('');
    $('#participantsTumorType').val('');
    $('#participantsCancerStage').val('');
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


    $("#radiotherapy")[0].selectedIndex = -1;

    $('#toxicityCriteria').val('');
    $('#toxicity1').val('');
    $('#grade1').val('');
    $('#frequency1').val('');
    $('#death1').val('');
    $('#withdrawal1').val('');
    $('#toxicity2').val('');
    $('#grade2').val('');
    $('#frequency2').val('');
    $('#death2').val('');
    $('#withdrawal2').val('');
    $('#toxicity3').val('');
    $('#grade3').val('');
    $('#frequency3').val('');
    $('#death3').val('');
    $('#withdrawal3').val('');
    $('#toxicity4').val('');
    $('#grade4').val('');
    $('#frequency4').val('');
    $('#death4').val('');
    $('#withdrawal4').val('');
    $('#toxicity5').val('');
    $('#grade5').val('');
    $('#frequency5').val('');
    $('#death5').val('');
    $('#withdrawal5').val('');
    $('#toxicity6').val('');
    $('#grade6').val('');
    $('#frequency6').val('');
    $('#death6').val('');
    $('#withdrawal6').val('');
    $('#toxicity7').val('');
    $('#grade7').val('');
    $('#frequency7').val('');
    $('#death7').val('');
    $('#withdrawal7').val('');
    $('#toxicity8').val('');
    $('#grade8').val('');
    $('#frequency8').val('');
    $('#death8').val('');
    $('#withdrawal8').val('');
    $('#toxicity9').val('');
    $('#grade9').val('');
    $('#frequency9').val('');
    $('#death9').val('');
    $('#withdrawal9').val('');
    $('#toxicity10').val('');
    $('#grade10').val('');
    $('#frequency10').val('');
    $('#death10').val('');
    $('#withdrawal10').val('');



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

// generate claim label based on method and relationship, drug, enzyme, metabolite information comes from qualifiers list
// if precipitant is not available, use drug 1 as precipitant by default (however, precipitant suppose to provide)
// return claim label

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

/* //PDF plugin
    var prevNode = null;
    var goodChild; // good child means drug highlights with new parent node
    var indexDict = {}; //hashmap<drugName, drugIndex>
    var drugMap = {}; //hashmap<nodeID, nodeTextContent>, used in combining two drugs
    var combines = []; //used in combining two drugs

    for (var qi = 0; qi < childrenInQuote.length; qi++) {
        var tempContent = $(childrenInQuote[qi]).text().trim();

        // if parent node is hl or currhl, then move up to parent
        while(childrenInQuote[qi].parentNode.className=="annotator-hl" || childrenInQuote[qi].parentNode.className=="annotator-currhl") {
            childrenInQuote[qi]= childrenInQuote[qi].parentNode;
        }

        // if previous node and current node having the same parent, then skip. else, add current node to quote
        if (!childrenInQuote[qi].isEqualNode(prevNode)) {
            prevNode = childrenInQuote[qi];
            goodChild = prevNode.cloneNode(true);
            goodChild.innerHTML = tempContent;

            //change drugMention elements' id to "drugName-drugIndex", e.g. terazosin-0
            if (goodChild.getAttribute("name") == "annotator-hl") {
                if (tempContent in indexDict) {
                    indexDict[tempContent] = indexDict[tempContent] + 1;
                    goodChild.id = tempContent + "_" + indexDict[tempContent];
                    list.push(tempContent);
                    listid.push(indexDict[tempContent]);
                } else {
                    indexDict[tempContent] = 0;
                    goodChild.id = tempContent + "_" + indexDict[tempContent];
                    list.push(tempContent);
                    listid.push(indexDict[tempContent]);
                }
                //fing two drugs which need to combine
                if (prevNode.id in drugMap && drugMap[prevNode.id] != tempContent) {
                    combines.push(drugMap[prevNode.id]); //section1.drugname
                    combines.push(indexDict[drugMap[prevNode.id]]); //section1.drugid
                    combines.push(tempContent); //section2.drugname
                    combines.push(0); //section2.drugid
                } else {
                    drugMap[prevNode.id] = tempContent;
                }
                */
    p.innerHTML = processedText;

    return p;
}

// submit dips score into store
function submitDipsScore(dipsTmp) {
    if (dipsTmp == null) {
        dipsTmp = {"q1":"","q2":"","q3":"","q4":"","q5":"","q6":"","q7":"","q8":"","q9":"","q10":""};
    }
    for (var i = 1; i <= 10; i++) {
        var qValue = $('input[name=dips-q' + i + ']:checked').val();
        if (qValue != "") {
            dipsTmp["q" + i] = qValue;
        } else {
            dipsTmp["q" + i] = "";
        }
    }
}

// calculator for dips score
function calculateDips(annotation) {
    var total = 0;
    var dipsTmp = annotation.argues.supportsBy[currDataNum].dips;
    //score of every question
    var scoreList = [
        {
            Yes: 1, No: -1, NA: 0
        },
        {
            Yes: 1, No: -1, UNK: 0
        },
        {
            Yes: 1, No: -1, "UNK/NA": 0
        },
        {
            Yes: 1, No: -1, "UNK/NA": 0
        },
        {
            Yes: 1, No: -2, NA: 0
        },
        {
            Yes: 2, No: -1, "UNK/NA": 0
        },
        {
            Yes: -1, No: 1, "UNK/NA": 0
        },
        {
            Yes: 1, No: 0, "UNK/NA": 0
        },
        {
            Yes: 1, No: 0, NA: 0
        },
        {
            Yes: 1, No: -1, NA: 0
        }
    ];
    if (dipsTmp != null) {
        for (var i = 1; i <= 10; i++) {
            if (dipsTmp['q'+i] != null && dipsTmp['q'+i] != "") {
                var curr = dipsTmp['q'+i];
                total += scoreList[i-1][curr];
            } else {
                //not all questions are answered
                return;
            }
        }

    /* //PDF plugin
    }
    //combine two drugs (1. change nodeID in quote, 2. change list & listid)
    if (combines.length > 0) {
        var tempid = combines[0] + "_" + combines[1];
        var newContent = combines[0] + combines[2];
        p.innerHTML = p.innerHTML.replace(tempid, newContent + "_0");
        tempid = "\"" + combines[2] + "_" + combines[3] + "\"";
        p.innerHTML = p.innerHTML.replace(tempid, "\"" + newContent + "_0\"");
        list.push(newContent);
        listid.push(0);
    }
    return p;*/
        annotation.argues.supportsBy[currDataNum].reviewer.total = total;
        //console.log(total);
    }
    return;
}

//disable dips questions input
function freezeQuestions() {
    //document.getElementById('mp-dips-tb').style.pointerEvents = 'auto';
    $('.dipsQuestion').prop('disabled', true);
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

// On claim form, show enzyme widget and load value if applicable
// qualifier: claim.qualifiedBy
function loadEnzymeForClaim(qualifier) {
    $("#enzyme").show();
    $("#enzymesection1").show();
    $('#enzyme option').each(function () {
    if (this.value == qualifier.enzyme) {
            $(this).prop('selected', true);
    } else {
            $(this).prop('selected', false);
    }
    });
}

// On claim form, show precipitant radio buttons for drug1 and drug2 and load value if applicable
// qualifier: claim.qualifiedBy
function loadPrecipitantForClaim(qualifier) {
    console.log("editor.js: load Precipitant for claim - " + qualifier.precipitant);

    $('input[type=radio][name=precipitant]').parent().show();
    $('.precipitantLabel').parent().show();
    if (qualifier.precipitant == "drug1")
    $('input[name=precipitant][id=drug1precipitant]').prop('checked', true);
    else if (qualifier.precipitant == "drug2")
    $('input[name=precipitant][id=drug2precipitant]').prop('checked', true);
    else
    console.log("precipitant information not avaliable");
}

// On Claim form, show object metabolite and load value if applicable
// distinctDrug: distinct drugs set
// qualifier: claim.qualifiedBy
function loadObjectMetabolateForClaim(distinctDrug, qualifier) {
    $('#object-metabolite').parent().show();
    $('#object-metabolite-label').parent().show();
    if (qualifier.objectMetabolite != null) {
        // if (!distinctDrug.has(qualifier.objectMetabolite.toLowerCase()) && qualifier.objectMetabolite.toLowerCase() != "n/a") {
        if (!distinctDrug.has(qualifier.objectMetabolite) && qualifier.objectMetabolite.toLowerCase() != "n/a") {
            $('#object-metabolite').append($('<option>', {
                value: qualifier.objectMetabolite,
                text: qualifier.objectMetabolite
            }));
        }
        $("#object-metabolite").val(qualifier.objectMetabolite);
    }
}

// On claim form, hide 2nd drug label, listbox, parent compound checkboxes, rename drug1 label
function showSingleDrugForClaim() {
    $("#Drug1-label").html("Drug: ");
    $("#Drug2-label").parent().hide();
    $("#Drug2").parent().hide();
    $('input[type=radio][name=precipitant]').parent().hide();
    $('.precipitantLabel').parent().hide();
    $("#drug2enantiomerLabel").parent().hide();
    $("#drug2enantiomer").parent().hide();
    $("#drug2metaboliteLabel").parent().hide();
    $("#drug2metabolite").parent().hide();
}


// On claim form, show reject fields
// rejected: annotation.rejected
function loadRjectedFieldsForClaim(rejected) {

    //show reject reason when reject checked
    if (rejected == null || rejected == undefined) {
        $('#reject-reason').hide();
        $('#reject-reason-comment').hide();
        $('#reject-reason-label').hide();
        $('#reject-reason-comment-label').hide();
    } else {
        $('#rejected-evidence').prop('checked', true);
        $('#reject-reason').show();
        $('#reject-reason-label').show();
        $('#reject-reason-comment').show();
        $('#reject-reason-comment-label').show();
        var comment = true;
        var rejectReason = rejected.reason.split('|');
        $('#reject-reason > option').each(function () {
            if (this.value == rejectReason[0]) {
                $(this).prop('selected', true);
            } else {
                $(this).prop('selected', false);
            }
        });
        $('#reject-reason-comment').val(rejectReason[1]);
    }
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