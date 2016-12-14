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
var queryOptStr = '{"emulateHTTP":false,"emulateJSON":false,"headers":{},"prefix":"http://' + config.apache2.host + ':' + config.apache2.port + '/annotatorstore","urls":{"create":"/annotations","update":"/annotations/{id}","destroy":"/annotations/{id}","search":"/search"}}';

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
var mpEditor = exports.mpEditor = Widget.extend({

    constructor: function (options) {
        Widget.call(this, options);
        var editorSelf = this;
        this.fields = [];
        this.annotation = {};
        console.log("[INFO] mpeditor - constructor");

        if (this.options.defaultFields) {

            this.addField({
                load: function (field, annotation, annotations) {               
                    console.log(">>>>>>>load editor<<<<<<<");
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
                        
                        if (flag < 2) {
                            unsaved = false;
                            alert("please highlight two different drugs in the text span you selected!");
                            editorSelf.cancel();
                            $('.btn-success').click();
                        }

                        // load method
                        if (claim.method != null) {
                            $("#method > option").each(function () {
                                if (this.value === claim.method) $(this).prop('selected', true);
                            });
                        }
                       
                        if(claim.qualifiedBy!=undefined) {
                            //load fields from annotation.claim
                            var existFlag = false; // if elasticsearch store has drugID info
                            $("#Drug1 > option").each(function () {
                                if (this.value === claim.qualifiedBy.drug1ID) {
                                    $(this).prop('selected', true);
                                    existFlag = true;
                                }
                            });
                            //highlight by drugname when store lacks drugID
                            if (!existFlag) {
                                $("#Drug1").val(claim.qualifiedBy.drug1 + "_0");
                            }
                            existFlag = false;
                            $('#Drug2 > option').each(function () {
                                if (this.value === claim.qualifiedBy.drug2ID) {
                                    $(this).prop('selected', true);
                                    existFlag = true;
                                }
                            });
                            //highlight by drugname when store lacks drugID
                            if (!existFlag) {
                                $("#Drug2").val(claim.qualifiedBy.drug2 + "_0");
                            }
                        }

                        var drug1 = $('#Drug1 option:selected').text();
                        var drug2 = $('#Drug2 option:selected').text();
                        var drug1ID = $('#Drug1 option:selected').val();

                        //initial & load: add currHighlight to quote
                        var drug1Index = parseInt(drug1ID.split("_")[1]);
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
                        drug1Index = findIndex(quotecontent, drug1, drug1Index);
                        drug2Index = drug2 == "" ? drug1Index : findIndex(quotecontent, drug2, drug2Index);
                        var drug1End = drug1Index + drug1.length;
                        var drug2End = drug2Index + drug2.length;
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
                        //console.log(quotecontent);
                        $(quoteobject).html(quotecontent);
                        $('#quote').append(quoteobject);

                        // highlight drug selections on text quote
                        if (claim.qualifiedBy != null) {
                            console.log(claim.qualifiedBy.relationship);
                            // Claim relationship, precipitant and enzyme
                            $('#relationship > option').each(function () {
                                if (this.value == claim.qualifiedBy.relationship) {
                                    $(this).prop('selected', true);
                                }
                                else {
                                    $(this).prop('selected', false);
                                }
                            });
                            // show enzyme if relationship is inhibits/substrate of
                            // show precipitant if relationship is interact with 
                            if(claim.qualifiedBy.relationship == "inhibits" || claim.qualifiedBy.relationship == "substrate of")
                            {
                                if (claim.method == "Phenotype clinical study" || claim.method == "statement") {
                                    $("#Drug1-label").html("Drug: ");
                                    $("#Drug2-label").parent().hide();
                                    $("#Drug2").parent().hide();
                                }
                                $("#enzyme").show();
                                $("#enzymesection1").show();

                                $('#enzyme option').each(function () {
                                    if (this.value == claim.qualifiedBy.enzyme) {
                                        $(this).prop('selected', true);            
                                    } else {
                                        $(this).prop('selected', false);
                                    }
                                });

                                $('input[type=radio][name=precipitant]').parent().hide();
                                $('.precipitantLabel').parent().hide();
                                
                            } else if (claim.qualifiedBy.relationship == "interact with") {                                    
                                $('input[type=radio][name=precipitant]').parent().show();
                                $('.precipitantLabel').parent().show();
                                if (claim.qualifiedBy.precipitant == "drug1")
                                    $('input[name=precipitant][id=drug1precipitant]').prop('checked', true);
                                else if (claim.qualifiedBy.precipitant == "drug2")
                                    $('input[name=precipitant][id=drug2precipitant]').prop('checked', true);      
                                else 
                                    console.log("precipitant information not avaliable");
                            }

                            //Method: (phenotype: substrate of, inhibit)
                            if (claim.method == "Phenotype clinical study") {
                                $("#relationship option[value = 'interact with']").attr('disabled', 'disabled');
                                $("#relationship option[value = 'interact with']").hide();
                                if ($("#relationship option:selected").text() == "interact with") {
                                    $("#relationship option:selected").prop("selected", false);
                                }
                            }
                            //Method: (case report: interact with)
                            if (claim.method == "Case Report") {
                                $("#relationship option[value = 'inhibits']").attr('disabled', 'disabled');
                                $("#relationship option[value = 'inhibits']").hide();
                                $("#relationship option[value = 'substrate of']").attr('disabled', 'disabled');
                                $("#relationship option[value = 'substrate of']").hide();
                                if ($("#relationship option:selected").text() == "inhibits" || $("#relationship option:selected").text() == "substrate of") {
                                    $("#relationship option:selected").prop("selected", false);
                                }
                            }

                            // Claim statement and negation
                            if (claim.method == "statement") {
                                $('#negation-label').show();
                                $('#negationdiv').show();

                                if (claim.negation == "supports")
                                    $('input[name=negation][value=supports]').prop('checked', true);                                   
                                else if (claim.negation == "refutes")
                                    $('input[name=negation][value=refutes]').prop('checked', true);
                                
                            }

                        }

                        //show reject reason when reject checked
                            if (annotation.rejected == null || annotation.rejected == undefined) {
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
                                var rejectReason = annotation.rejected.reason.split('|');
                                $('#reject-reason > option').each(function () {
                                    if (this.value == rejectReason[0]) {
                                        $(this).prop('selected', true);
                                    } else {
                                        $(this).prop('selected', false);
                                    }
                                });
                                $('#reject-reason-comment').val(rejectReason[1]);
                            } 
                        
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
                            if (annotation.argues.method != "Case Report") {
                                loadDataItemFromAnnotation(loadData, allHighlightedDrug);
                            } else {
                                loadDipsFromAnnotation(loadData);
                            }
                            
                            var drug1doseLabel = claim.qualifiedBy.drug1 + " Dose in MG: ";
                            var drug2doseLabel = claim.qualifiedBy.drug2 + " Dose in MG: ";
                            
                            if (claim.qualifiedBy.relationship == "interact with") {
                                if (claim.qualifiedBy.precipitant == "drug1")
                                    drug1doseLabel += " (precipitant)";                                
                                else if (claim.qualifiedBy.precipitant == "drug2")
                                    drug2doseLabel += " (precipitant)";                                
                            }
                        
                            $("#drug1-dose-switch-btn").html(drug1doseLabel);
                            $("#drug2-dose-switch-btn").html(drug2doseLabel);
                            $("#drug1Dose-label").html(drug1doseLabel);
                            $("#drug2Dose-label").html(drug2doseLabel);
                            $("#claim-label-data-editor").html("<strong>Claim: </strong>" + claim.label.replace(/\_/g,' '));
                            loadUnchangedMode();
                            postDataForm(currFormType);
                        }
                    }                     
                    delete annotation.childNodes;
                },
                
                submit:function (field, annotation) {

                    if (currFormType == "claim"){

                        console.log("mpeditor submit claim");

                        // MP Claim
                        var methodTemp = $('#method option:selected').text();
                        var relationTemp = $('#relationship option:selected').text();
                        if (!((relationTemp == 'inhibits' || relationTemp == 'substrate of') && methodTemp == 'Phenotype clinical study')) {
                            if($('#Drug1 option:selected').text()==$('#Drug2 option:selected').text()){
                                unsaved = false;
                                alert("Should highlight two different drugs.");
                                editorSelf.cancel();                            
                                $('.btn-success').click();
                            }
                        }
                        
                        annotation.annotationType = "MP";

                        // MP method - keep with claim
                        annotation.argues.method = $('#method option:selected').text();   

                        // When method is statement, submit negation
                        if (annotation.argues.method == "statement") {
                            var negationVal = $("input[name=negation]:checked").val();
                            annotation.argues.negation = negationVal;
                        }
                     
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
                            var qualifiedBy = {drug1 : "", drug2 : "", relationship : "", enzyme : "", precipitant : ""};                    
                        }
                        qualifiedBy.relationship = $('#relationship option:selected').text();

                        if ((qualifiedBy.relationship == "inhibits" || qualifiedBy.relationship == "substrate of") && (annotation.argues.method == "Phenotype clinical study")) {
                            qualifiedBy.drug1 = $('#Drug1 option:selected').text();
                            qualifiedBy.drug1ID = $('#Drug1 option:selected').val();
                            qualifiedBy.drug2 = "";
                            qualifiedBy.drug2ID = "";
                        } else {
                            qualifiedBy.drug1 = $('#Drug1 option:selected').text();
                            qualifiedBy.drug2 = $('#Drug2 option:selected').text();
                            qualifiedBy.drug1ID = $('#Drug1 option:selected').val();
                            qualifiedBy.drug2ID = $('#Drug2 option:selected').val();
                        }
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
                        
                        if(qualifiedBy.relationship == "inhibits" || qualifiedBy.relationship == "substrate of") {
                            qualifiedBy.enzyme = $('#enzyme option:selected').text();
                        }  else if (qualifiedBy.relationship == "interact with") {                           
                            qualifiedBy.precipitant = $("input[name=precipitant]:checked").val();
                        }

                        var claimStatement = "";
                        if ((qualifiedBy.relationship == "inhibits" || qualifiedBy.relationship == "substrate of") && (annotation.argues.method == "Phenotype clinical study" || annotation.argues.method == "statement")) {
                            claimStatement = qualifiedBy.drug1 + "_" + qualifiedBy.relationship + "_" + qualifiedBy.enzyme;
                        } else {
                            claimStatement = qualifiedBy.drug1 + "_" + qualifiedBy.relationship + "_" + qualifiedBy.drug2;
                        }

                        annotation.argues.qualifiedBy = qualifiedBy;
                        annotation.argues.type = "mp:claim";
                        annotation.argues.label = claimStatement;
                        
                        var rejectedEvidence = $('#rejected-evidence').is(':checked');
                        var rejectReason  = $('#reject-reason').val() + "|" + $('#reject-reason-comment').val();
                        if (rejectedEvidence) {
                            annotation.rejected = {reason: rejectReason};
                        } else {
                            annotation.rejected = null;
                        }

                        if (annotation.argues.supportsBy == null)
                            annotation.argues.supportsBy = [];                  

                    } else if (currFormType != "claim" && currAnnotationId != null) { 
                        if (annotation.argues.supportsBy.length == 0) {
                            var data = {type : "mp:data", evRelationship: "", auc : {}, cmax : {}, clearance : {}, halflife : {}, reviewer: {}, dips: {}, supportsBy : {type : "mp:method", supportsBy : {type : "mp:material", participants : {}, drug1Dose : {}, drug2Dose: {}, phenotype: {}}}, grouprandom: "", parallelgroup: ""};
                            annotation.argues.supportsBy.push(data);
                        }

                        console.log("mpeditor update data & material - num: " + currDataNum);

                        var mpData = annotation.argues.supportsBy[currDataNum];
                        // Evidence relationship
                        mpData.evRelationship = $("input[name=evRelationship]:checked").val();

                        // MP add data-method-material 
                        var partTmp = mpData.supportsBy.supportsBy.participants;
                        if ($('#participants').val().trim() != "" &&  partTmp.value != $('#participants').val()) {                            
                            partTmp.value = $('#participants').val();

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
                        if ((drug1V != "") && (drug1D != "") && (drug1F != "") && (drug1R != "")) {
                                     
                            dose1Tmp.value = drug1V;
                            dose1Tmp.formulation = drug1F;
                            dose1Tmp.duration = drug1D;
                            dose1Tmp.regimens = drug1R;

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
                        if ((drug2V != "") && (drug2D != "") && (drug2F != "") && (drug2R != "")) {
                                     
                            dose2Tmp.value = drug2V;
                            dose2Tmp.formulation = drug2F;
                            dose2Tmp.duration = drug2D;
                            dose2Tmp.regimens = drug2R;

                            if (dose2Tmp.ranges == null) {
                                dose2Tmp.ranges = cachedOARanges;
                            }
                            if (dose2Tmp.hasTarget == null) {
                                dose2Tmp.hasTarget = cachedOATarget;
                            }
                            mpData.supportsBy.supportsBy.drug2Dose = dose2Tmp;   
                        }

                        // when method is case report
                        if (annotation.argues.method == "Case Report") {
                            //reviewer
                            var reviewerTmp = mpData.reviewer;
                            var reviewerValue = $("input[name=dips-reviewer]:checked").val();
                            if (reviewerValue != "") {
                                reviewerTmp.reviewer = reviewerValue;
                                reviewerTmp.date = $('#datepicker').val().trim();
                                if (reviewerValue == "Author") {
                                    reviewerTmp.lackInfo = $("#author-lackscore").is(':checked');
                                    reviewerTmp.total = $("#author-total").val().trim();
                                }
                            }
                            mpData.reviewer = reviewerTmp;

                            //dips question
                            submitDipsScore(mpData.dips);
                        }

                        //material: phenotype
                        var phenotypeTmp = mpData.supportsBy.supportsBy.phenotype;
                        var type = $("input[name=phenotypeGenre]:checked").val();
                        if (type != "" && type != undefined) {
                            if (type == "Genotype") {
                                phenotypeTmp.typeVal = $('#geneFamily option:selected').text();
                            } else {
                                phenotypeTmp.typeVal = $('#markerDrug option:selected').text();
                            }
                            phenotypeTmp.type = type;
                            phenotypeTmp.metabolizer = $("input[name=phenotypeMetabolizer]:checked").val();
                            phenotypeTmp.population = $("input[name=phenotypePopulation]:checked").val();
                            if (phenotypeTmp.ranges == null) {
                                phenotypeTmp.ranges = cachedOARanges;
                            }
                            if (phenotypeTmp.hasTarget == null) {
                                phenotypeTmp.hasTarget = cachedOATarget;
                            }
                            mpData.supportsBy.supportsBy.phenotype = phenotypeTmp;
                        }


                        mpData.grouprandom = $("input[name=grouprandom]:checked").val();  
                        mpData.parallelgroup = $("input[name=parallelgroup]:checked").val();

                        var aucUnchanged = $('#auc-unchanged-checkbox').is(':checked');
                        var aucValue = $('#auc').val().trim();
                        var aucType = $('#aucType option:selected').text();
                        var aucDirection = $('#aucDirection option:selected').text();

                        if (aucUnchanged || (aucValue != "" && aucType != "" && aucDirection != "")) {
                            if (aucUnchanged) {
                                mpData.auc.value = "unchanged";            
                                mpData.auc.type = "";
                                mpData.auc.direction = "";      
                            }
                            else {
                                mpData.auc.value = aucValue;
                                mpData.auc.type = aucType;
                                mpData.auc.direction = aucDirection;      
                            }

                            if (mpData.auc.ranges == null) {
                                mpData.auc.ranges = cachedOARanges;
                            }
                            if (mpData.auc.hasTarget == null) {
                                mpData.auc.hasTarget = cachedOATarget;
                            }
                        } else {
                            console.log("[WARNING] auc required fields not filled!");
                        }                        

                        var cmaxUnchanged = $('#cmax-unchanged-checkbox').is(':checked');
                        var cmaxValue = $('#cmax').val().trim();
                        var cmaxType = $('#cmaxType option:selected').text();
                        var cmaxDirection = $('#cmaxDirection option:selected').text();

                        if (cmaxUnchanged || (cmaxValue != "" && cmaxType != "" && cmaxDirection != "")) {
                            if (cmaxUnchanged) {
                                mpData.cmax.value = "unchanged";            
                                mpData.cmax.type = "";
                                mpData.cmax.direction = "";      
                            }
                            else {
                                mpData.cmax.value = cmaxValue;
                                mpData.cmax.type = cmaxType;
                                mpData.cmax.direction = cmaxDirection;      
                            }

                            if (mpData.cmax.ranges == null) {
                                mpData.cmax.ranges = cachedOARanges;
                            }
                            if (mpData.cmax.hasTarget == null) {
                                mpData.cmax.hasTarget = cachedOATarget;
                            }                            
                        } else {
                            console.log("[WARNING] cmax required fields not filled!");
                        }                


                        var clearanceUnchanged = $('#clearance-unchanged-checkbox').is(':checked');
                        var clearanceValue = $('#clearance').val().trim();
                        var clearanceType = $('#clearanceType option:selected').text();
                        var clearanceDirection = $('#clearanceDirection option:selected').text();

                        if (clearanceUnchanged || (clearanceValue != "" && clearanceType != "" && clearanceDirection != "")) {
                            if (clearanceUnchanged) {
                                mpData.clearance.value = "unchanged";            
                                mpData.clearance.type = "";
                                mpData.clearance.direction = "";      
                            }
                            else {
                                mpData.clearance.value = clearanceValue;
                                mpData.clearance.type = clearanceType;
                                mpData.clearance.direction = clearanceDirection; 
                            }

                            if (mpData.clearance.ranges == null) {
                                mpData.clearance.ranges = cachedOARanges;
                            }
                            if (mpData.clearance.hasTarget == null) {
                                mpData.clearance.hasTarget = cachedOATarget;
                            }                                  
                        } else {
                            console.log("[WARNING] clearance required fields not filled!");
                        }                


                        var halflifeUnchanged = $('#halflife-unchanged-checkbox').is(':checked');
                        var halflifeValue = $('#halflife').val().trim();
                        var halflifeType = $('#halflifeType option:selected').text();
                        var halflifeDirection = $('#halflifeDirection option:selected').text();

                        if (halflifeUnchanged || (halflifeValue != "" && halflifeType != "" && halflifeDirection != "")) {
                            if (halflifeUnchanged) {
                                mpData.halflife.value = "unchanged";            
                                mpData.halflife.type = "";
                                mpData.halflife.direction = "";      
                            }
                            else {
                                mpData.halflife.value = halflifeValue;
                                mpData.halflife.type = halflifeType;
                                mpData.halflife.direction = halflifeDirection;      
                            } 

                            if (mpData.halflife.ranges == null) {
                                mpData.halflife.ranges = cachedOARanges;
                            }
                            if (mpData.halflife.hasTarget == null) {
                                mpData.halflife.hasTarget = cachedOATarget;
                            }                           
                        } else {
                            console.log("[WARNING] halflife required fields not filled!");
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

        var annhost = config.annotator.host;

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
        console.log("mpeditor - submit called");

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
    Form Validation: check the field is not empty
    Event callback: called when a user clicks the editor's save button
    Returns noting
    **/
    _onFormValid: function (event) {
        preventEventDefault(event);

        //valid data form
        var fields = $("#mp-data-form-" + currFormType).children();
        console.log(">>>>>>>form validation<<<<<<<<");
        //data form validation rule
        var valid = true;
        for(var i = 0; i < fields.length; i++) {
            var ns = fields[i].tagName;
            //unchanged checkbox
            if (fields[i].type == "checkbox") {
                if ($(fields[i]).is(":checked")) {
                    return valid;
                }
            //input box
            } else if (ns == "INPUT") {
                if (fields[i].value.trim() == "") {
                    $(fields[i]).css("background-color", "#f9dcd9");
                    //$("#" + fields[i].id + "-label").css("color", "red");
                    valid = false;
                } else {
                    $(fields[i]).css("background-color", "");
                    //$("#" + fields[i].id + "-label").css("color", "black");
                }
            //select box
            } else if (ns == "SELECT") {
                if (fields[i].selectedIndex == -1) {
                    $(fields[i]).css("background-color", "#f9dcd9");
                    //$("#" + fields[i].id + "-label").css("color", "red");
                    valid = false;
                } else {
                    $(fields[i]).css("background-color", "");
                    //$("#" + fields[i].id + "-label").css("color", "black");
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


mpEditor.template = Template.content;

// Configuration options
mpEditor.options = {
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
function loadDipsFromAnnotation(loadData) {
    //1.load reviewer info
    if (loadData.reviewer != null) {
        var reviewerTmp = loadData.reviewer;
        $('input[name=dips-reviewer][value="'+ reviewerTmp.reviewer +'"]').prop('checked', true);
        $('#datepicker').val(reviewerTmp.date);
        if (reviewerTmp.reviewer == "Author") {
            $('#author-lackscore').show();
            $('#author-lackscore-label').show();
            if (reviewerTmp.lackInfo) {
                $('#author-lackscore').prop("checked", true);
                $('#author-total').show();
                $('#author-total-label').show();
                $('#author-total').val(reviewerTmp.total);
            }
        }
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
            if (loadData.dips["q" + i] != null) {
                console.log(i + ":" + loadData.dips["q" + i]);
                $('input[name=dips-q' + i + '][value=' + loadData.dips["q"+i] + ']').prop('checked', true);
            }
        }
    }
}


// load one data item from mp annotation
function loadDataItemFromAnnotation(loadData, allHighlightedDrug) {

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
    var fieldM = {"reviewer":"reviewer", "evRelationship":"evRelationship", "participants":"participants", "dose1":"drug1Dose", "dose2":"drug2Dose", "phenotype":"phenotype", "auc":"auc", "cmax":"cmax", "clearance":"clearance", "halflife":"halflife", "studytype":"studytype",
    "q1":"q1", "q2":"q2", "q3":"q3", "q4":"q4", "q5":"q5", "q6":"q6", "q7":"q7", "q8":"q8", "q9":"q9", "q10":"q10"};
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
            } else if (currAnnotation.argues.method == "Case Report"){ // when field is text input
                $("#mp-dips-nav").show();
                fieldVal = $("#" + fieldM[field]).val();
            }  else { // when field is text input
                $("#mp-data-nav").show();
                fieldVal = $("#" + fieldM[field]).val();
            }
            //console.log(fieldVal);
                
            if (fieldVal !=null && fieldVal != "")
                $("#annotator-delete").show();
            else if (showDeleteBtn)
                $("#annotator-delete").show();
            else 
                $("#annotator-delete").hide();
        }                        
        else {
            cleanFocusOnDataField(field);
            $("#"+dataid).hide();
        }
    }
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
}

// clean all value of claim form
function cleanClaimForm() {

    $("#quote").empty();
    $("#method")[0].selectedIndex = 0;
    $("#relationship option[value = 'interact with']").removeAttr('disabled');
    $("#relationship option[value = 'interact with']").show();
    $("#relationship")[0].selectedIndex = 0;
    
    $("#enzyme")[0].selectedIndex = 0;
    $("#enzyme").hide();
    $("#enzymesection1").hide();
    
    $('input[type=radio][name=precipitant]').show();
    $('.precipitantLabel').show();
    $('input[name=precipitant][id=drug1precipitant]').prop('checked', false);
    $('input[name=precipitant][id=drug2precipitant]').prop('checked', false);

    $('#negationdiv').hide();
    $('#negation-label').hide();
    $('input[name=negation]').prop('checked', false);

    
    $('#Drug1 option').remove();
    $('#Drug2 option').remove();

    $("#Drug1-label").html("Drug1: ");
    $("#Drug2-label").parent().show();
    $("#Drug2").parent().show(); 

    $('#rejected-evidence').prop('checked', false);
    $('#reject-reason-comment').val('');
    $('#reject-reason')[0].selectedIndex = 0;
}

// clean all value of data form
function cleanDataForm() {
    //clean form validation format
    $(".form-validation-alert").hide();
    var allDataFields = ["#participants", "#drug1Dose", "#drug1Duration", "#drug1Formulation", "#drug1Regimens", "#drug2Dose", "#drug2Duration", "#drug2Formulation", "#drug2Regimens", "#auc", "#aucType", "#aucDirection", "#cmax", "#cmaxType", "#cmaxDirection", "#clearance", "#clearanceType", "#clearanceDirection", "#halflife", "#halflifeType", "#halflifeDirection"];
    for (var i = 0; i < allDataFields.length; i++) {
        $(allDataFields[i]).css("background-color", "");
    }

    //clean reviewer
    $('#dips-reviewer').attr('checked',false);
    $("#datepicker").val('');
    $("#author-lackscore").hide();
    $("#author-lackscore-label").hide();
    $("#author-total").hide();
    $("#author-total-label").hide();

    //clean questionList
    for (var i = 1; i <= 10; i++) {
        $('input[name=dips-q' + i + ']').prop('checked', false);
    }

    //clean material
    $("#participants").val('');
    $("#drug1Dose").val('');
    $("#drug1Duration").val('');
    $("#drug1Formulation")[0].selectedIndex = -1;
    $("#drug1Regimens")[0].selectedIndex = -1;
    $("#drug2Dose").val('');
    $("#drug2Duration").val('');
    $("#drug2Formulation")[0].selectedIndex = -1;
    $("#drug2Regimens")[0].selectedIndex = -1;
    $('input[name=phenotypeGenre]').prop('checked', false);
    $('input[name=phenotypeMetabolizer]').prop('checked', false);
    $('input[name=phenotypePopulation]').prop('checked', false);
    $('#geneFamily')[0].selectedIndex = 0;
    $('#markerDrug option').remove();

    // clean data : auc, cmax, cl, half life
    $("#auc").val('');
    $("#aucType")[0].selectedIndex = -1;
    $("#aucDirection")[0].selectedIndex = -1;
    $('#auc-unchanged-checkbox').attr('checked',false);

    $("#cmax").val('');
    $("#cmaxType")[0].selectedIndex = -1;
    $("#cmaxDirection")[0].selectedIndex = -1;
    $('#cmax-unchanged-checkbox').attr('checked',false);
    
    $("#clearance").val('');
    $("#clearanceType")[0].selectedIndex = -1;
    $("#clearanceDirection")[0].selectedIndex = -1;
    $('#clearance-unchanged-checkbox').attr('checked',false);
    
    $("#halflife").val('');
    $("#halflifeType")[0].selectedIndex = -1;
    $("#halflifeDirection")[0].selectedIndex = -1;
    $('#halflife-unchanged-checkbox').attr('checked',false);
    
    // clean evidence relationship
    $('input[name=evRelationship]').prop('checked', false);
    
    // study type questions
    $('input[name=grouprandom]').prop('checked', false);
    $('input[name=parallelgroup]').prop('checked', false);    
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
        processedText += temp;
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

//submit dips score into store
function submitDipsScore(dipsTmp) {
    for (var i = 1; i <= 10; i++) {
        var qValue = $('input[name=dips-q' + i + ']:checked').val();
        if (qValue != "") {
            dipsTmp["q" + i] = qValue;
        }
    }
}
