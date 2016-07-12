"use strict";

var Handlebars = require('handlebars');
var extend = require('backbone-extend-standalone');
var Template = function(){console.log("success");};
var $ = require('jquery');

// JSON fields configuration
// Claim form
var context1 = {
    questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"quote",
            options:[],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Drug1: ",
            id:"Drug1",
            options:[],
            optionsID:[]
        },
        {
            type:"radiobutton",
            name:"Precipitant: ",
            classname: "precipitant",
            id:"drug1precipitant",
            options:["drug1"],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Relationship: ",
            id:"relationship",
            options:["interact with","inhibits","substrate of"],
            optionsID:["r0","r1","r2"]
        },
        {
            type:"dropdown",
            name:"Method: ",
            id:"method",
            options:["UNK","DDI clinical trial"],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Drug2: ",
            id:"Drug2",
            options:[],
            optionsID:[]
        },
        {
            type:"radiobutton",
            name:"Precipitant: ",
            classname: "precipitant",
            id:"drug2precipitant",
            options:["drug2"],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Enzyme: ",
            id:"enzyme",
            options:["UNK","cyp1a1","cyp1a2","cyp1b1","cyp2a6","cyp2a13","cyp2b6","cyp2c8","cyp2c9","cyp2c19","cyp2d6","cyp2e1","cyp2j2","cyp3a4","cyp3a5","cyp4a11","cyp2c8","cyp2c9","cyp2c19"],
            optionsID:[]
        },
        {
            type:"space",
            name:""
        }
    ]
};

// Data - Number of participants form
var context2 = {
    questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"participantsquote",
            options:[],
            optionsID:[]
        },
        {
            type: "input",
            name: "Number of Participants: ",
            id: "participants"
        }
    ]
};

// Data - Drug 1 dosage form
var context3 = {
    questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"dose1quote",
            options:[],
            optionsID:[]
        },
        {
            type: "input",
            name: "Dose in MG: ",
            id: "drug1Dose"
        },
        {
            type:"dropdown",
            name:"Formulation: ",
            id:"drug1Formulation",
            options:["UNK","Oral","IV","transdermal"],
            optionsID:[]
        },
        {
            type: "input",
            name: "Duration in days: ",
            id: "drug1Duration"
        },
        {
            type:"dropdown",
            name:"Regimens: ",
            id:"drug1Regimens",
            options:["UNK","SD","QD","BID", "TID", "QID", "Q12", "Q8", "Q6", "Daily"],
            optionsID:[]
        }
    ]
};

// Data - Drug 2 dosage form
var context4 = {
    questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"dose2quote",
            options:[],
            optionsID:[]
        },
        {
            type: "input",
            name: "Dose in MG: ",
            id: "drug2Dose"
        },
        {
            type:"dropdown",
            name:"Formulation: ",
            id:"drug2Formulation",
            options:["UNK","Oral","IV","transdermal"],
            optionsID:[]
        },
        {
            type: "input",
            name: "Duration in days: ",
            id: "drug2Duration"
        },
        {
            type:"dropdown",
            name:"Regimens: ",
            id:"drug2Regimens",
            options:["UNK","SD","QD","BID", "TID", "QID", "Q22", "Q8", "Q6", "Daily"],
            optionsID:[]
        }
    ]
};


// Data - AUC form
var context5 = {
    questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"aucquote",
            options:[],
            optionsID:[]
        },
        {
            type:"checkbox",
            name:"unchanged: ",
            id:"auc-unchanged-checkbox",
            value: "aucunchanged"
        },
        {
            type: "input",
            name: "AUC ratio: ",
            id: "auc"
        },
        {
            type:"dropdown",
            name:"Type: ",
            id:"aucType",
            options:["UNK","percent","fold"],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Direction: ",
            id:"aucDirection",
            options:["UNK","increase","decrease"],
            optionsID:[]
        }
    ]
};

// Data - CMAX form
var context6 = {
    questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"cmaxquote",
            options:[],
            optionsID:[]
        },
        {
            type: "input",
            name: "CMAX: ",
            id: "cmax"
        },
        {
            type:"dropdown",
            name:"Type: ",
            id:"cmaxType",
            options:["UNK","percent","fold"],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Direction: ",
            id:"cmaxDirection",
            options:["UNK","increase","decrease"],
            optionsID:[]
        },
        {
            type:"checkbox",
            name:"unchanged: ",
            id:"cmax-unchanged-checkbox",
            value: "cmaxunchanged"
        }
    ]
};


// Data - Clearance form
var context7 = {
    questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"clearancequote",
            options:[],
            optionsID:[]
        },
        {
            type: "input",
            name: "Clearance: ",
            id: "clearance"
        },
        {
            type:"dropdown",
            name:"Type: ",
            id:"clearanceType",
            options:["UNK","percent","fold"],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Direction: ",
            id:"clearanceDirection",
            options:["UNK","increase","decrease"],
            optionsID:[]
        },
        {
            type:"checkbox",
            name:"unchanged: ",
            id:"clearance-unchanged-checkbox",
            value: "clearanceunchanged"
        }
    ]
};



// Data - half life form
var context8 = {
    questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"halflifequote",
            options:[],
            optionsID:[]
        },
        {
            type: "input",
            name: "Half life: ",
            id: "halflife"
        },
        {
            type:"dropdown",
            name:"Type: ",
            id:"halflifeType",
            options:["UNK","percent","fold"],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Direction: ",
            id:"halflifeDirection",
            options:["UNK","increase","decrease"],
            optionsID:[]
        },
        {
            type:"checkbox",
            name:"unchanged: ",
            id:"halflife-unchanged-checkbox",
            value: "halflifeunchanged"
        }
    ]
};


// Data - evidence supports or refutes
var context9 = {
    questions: [
        {
            type:"radiobutton",
            name:"Evidence: ",
            classname: "evRelationship",
            id:"evRelationship",
            options:["supports","refutes"],
            optionsID:[]
        }
    ]
};

// handlerbar - build form1 function
// @inputs: JSON config - context1
// @outputs: form1 in html
Handlebars.registerHelper('buildFormClaim', function(items, options) {
    var out = "";
    if (items[0].type == "quote") {
        // <strong>" + items[0].name +"</strong> 
        out += "<div id='" + items[0].id + "' class='claimquoteborder' ></div><br><br>";
    }
    out += "<table class='clear-user-agent-styles'>";
    for (var i = 1, l=items.length; i<l; i++) {
        
        if (((i)%5==0))
            out = out + "<tr>";
            
        if (items[i].id == "enzyme") 
            out += "<td><strong id='enzymesection1'>" + items[i].name +"</strong></td><td>";
        else if (items[i].id == "drug1precipitant" || items[i].id == "drug2precipitant") 
            out += "<td><strong class='precipitantLabel'>" + items[i].name +"</strong></td><td>"
        else 
            out = out + "<td><strong>" + items[i].name +"</strong></td><td>";
        
        if (items[i].type=="radiobutton") {
            for (var j = 0, sl = items[i].options.length; j < sl; j++)
                out = out + "<input type='radio' name='" + items[i].classname + "' id='" + items[i].id + "' value='" + items[i].options[j] + "'></input>";            
        } 
        else if (items[i].type=="dropdown") {
            out = out + "<select id='" + items[i].id + "'>";
            for(var j = 0, sl = items[i].options.length; j<sl; j++) {
                if (items[i].optionsID.length==0)
                    out = out + "<option value='" + items[i].options[j] + "'>" + items[i].options[j] + "</option>";
                else
                    out = out + "<option id='" + items[i].optionsID[j] + "' value='" + items[i].options[j] + "'>" + items[i].options[j] + "</option>";
            }
            out = out + "</select>";
        } 
        else if (items[i].type=="textarea") {
            out = out + "<textarea id='" + items[i].id + "' class='" + items[i].id + "'></textarea>";
        }
        
        out = out + "</td>";

        if(((i+1)%5==0))
            out = out + "</tr>";
    }
    out +="</table>";
    
    return out;
});

Handlebars.registerHelper('buildFormData', function(items, options) {
    var out = "";
    for(var i=0, l=items.length; i<l; i++) {
        if (items[i].type == "quote") {
            // <strong>" + items[i].name +"</strong>
            out += "<br><div id='" + items[i].id + "' class='dataquoteborder'></div><br>";
        }
        else {
            out += "&nbsp;&nbsp;<strong id='"+ items[i].id +"-label'>" + items[i].name +"</strong>";
            if(items[i].type=="text")
                out += "<strong id='"+items[i].id+"'></strong><br>";
            else if(items[i].type=="input")
                out += "<input style='width:30px;' type='text' id='"+items[i].id+"'>";
            else if (items[i].type=="dropdown") {
                out = out + "<select id='" + items[i].id + "'>";
                for(var j = 0, sl = items[i].options.length; j<sl; j++) {
                    if(items[i].optionsID.length==0)
                        out = out + "<option value='" + items[i].options[j] + "'>" + items[i].options[j] + "</option>";
                    else
                        out = out + "<option id='" + items[i].optionsID[j] + "' value='" + items[i].options[j] + "'>" + items[i].options[j] + "</option>";
                }
                out = out + "</select>";
            }
            else if (items[i].type=="radiobutton") {
                for (var j = 0, sl = items[i].options.length; j < sl; j++)
                    out = out + "&nbsp;&nbsp;<input type='radio' name='" + items[i].classname + "' id='" + items[i].id + "' value='" + items[i].options[j] + "'>"+items[i].options[j]+"</input>";            
            } 
            else if (items[i].type=="checkbox") {
                out += "<input type='checkbox' id='" + items[i].id + "' value='" + items[i].value + "'></input>";                    
            }
        }
    }
    return out;
});


// Claim
var source = "{{#buildFormClaim questions}}{{/buildFormClaim}}";
var template = Handlebars.compile(source);
var form1 = template(context1);

// Data - number of participants
source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form2 = template(context2);

// Data - dosage 1
source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form3 = template(context3);

// Data - dosage 2
source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form4 = template(context4);

// Data - auc
source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form5 = template(context5);

// Data - cmax
source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form6 = template(context6);

// Data - cl
source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form7 = template(context7);

// Data - half life
source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form8 = template(context8);

// Data - evidence relationship
source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form9 = template(context9);


Template.content = [

    '<div class="annotator-outer annotator-editor annotator-invert-y annotator-invert-x">',
    '<form class="annotator-widget">',
    // '<ul class="annotator-listing"></ul>',

    '<div class="annotationbody" style="margin-left:35px;margin-right:0px;height:100%;line-height:200%;margin-top:0px;overflow-y: hidden">',
    '<div id="tabs">',
    '<div id="tabs-1" style="margin-bottom:0px;">',

    // '<div id="quote" class="quoteborder" style="display: none;">',

    // current claim label
    '<div id="claim-label-data-editor" style="display: none;"></div>',

    // links 
    '<div id="mp-data-nav" style="display: none;">',
    '<button type="button" onclick="switchDataForm(\'evRelationship\')" >Ev relationship</button> &nbsp;->&nbsp;',
    '<button type="button" onclick="switchDataForm(\'participants\')" >Participants</button> &nbsp;->&nbsp;',
    '<button id="drug1-dose-switch-btn" type="button" onclick="switchDataForm(\'dose1\')" >Drug 1 Dose</button> &nbsp;->&nbsp;',
    '<button id="drug2-dose-switch-btn" type="button" onclick="switchDataForm(\'dose2\')" >Drug 2 Dose</button>&nbsp;->&nbsp;',    
    '<button type="button" onclick="switchDataForm(\'auc\')" >Auc ratio</button> &nbsp;->&nbsp;',
    '<button type="button" onclick="switchDataForm(\'cmax\')" >Cmax</button> &nbsp;->&nbsp;',
    '<button type="button" onclick="switchDataForm(\'clearance\')" >Clearance</button> &nbsp;->&nbsp;',
    '<button type="button" onclick="switchDataForm(\'halflife\')" >Half-life</button>',
    '</div>',

    // Claim form
    '<div id="mp-claim-form" style="margin-top:10px;margin-left:15px;display: none;">',
    form1,
    '</div>',
    
    // Data & material - Num of Participants
    '<div id="mp-data-form-participants" style="margin-top:7px;margin-left:25px;display: none;">',
    form2,
    '</div>',

    // Data & material - Drug1 Dosage
    '<div id="mp-data-form-dose1" style="margin-top:7px;margin-left:25px;display: none;">',
    form3,
    '</div>',

    // Data & material - Drug2 Dosage
    '<div id="mp-data-form-dose2" style="margin-top:7px;margin-left:25px;display: none;">',
    form4,
    '</div>',

    // Data & material - AUC
    '<div id="mp-data-form-auc" style="margin-top:7px;margin-left:25px;display: none;">',
    form5,
    '</div>',

    // Data & material - CMAX
    '<div id="mp-data-form-cmax" style="margin-top:7px;margin-left:25px;display: none;">',
    form6,
    '</div>',

    // Data & material - Clearance
    '<div id="mp-data-form-clearance" style="margin-top:7px;margin-left:25px;display: none;">',
    form7,
    '</div>',

    // Data & material - half life
    '<div id="mp-data-form-halflife" style="margin-top:7px;margin-left:25px;display: none;">',
    form8,
    '</div>',

    // Data & material - evidence relationship
    '<div id="mp-data-form-evRelationship" style="margin-top:7px;margin-left:25px;display: none;">',
    form9,
    '</div>',
    
    '</div>',
    '</div>',
    '</div>',
    '    <div class="annotator-controls1">',
    '     <br><a href="#cancel" class="annotator-cancel" onclick="showrightbyvalue()" id="annotator-cancel">Cancel</a>',
    '     <a href="#delete" class="annotator-delete" id="annotator-delete">Delete</a>',
    '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
    '     <a href="#save" class="annotator-save annotator-focus">Save</a>',
    '     <a href="#save-close" class="annotator-save-close" id="annotator-save-close">Save and Close</a>',
  '    </div>',
    '  </form>',
    '</div>'
].join('\n');


Template.extend = extend;
exports.Template = Template;
