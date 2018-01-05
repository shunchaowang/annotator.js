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
            type:"dropdown",
            name:"Drug2: ",
            id:"Drug2",
            options:[],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Relationship: ",
            id:"relationship",
            html: "table",
            options:["Toxicity","interact with","inhibits","substrate of","has metabolite","controls formation of","inhibition constant"],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"Method: ",
            id:"method",
            html: "table",
            options:["DDI clinical trial", "Phenotype clinical study", "Case Report", "Statement", "Experiment"],
            optionsID:[]
        }
      ]
};

//Data - Number of Participants Form

var context2 = {

  questions: [
  {
    type:"quote",
    name:"Quote: ",
    id:"participantsQuote",
    options:[],
    optionsID:[]
  },
  {
    type: "input",
    name: "Number of Participants: ",
    id: "participants"
  },
  {
    type: "input",
    name: "Total/Course/Cycle No: ",
    id: "participantsTotal"
  },
  {
    type: "input",
    name: "Male/Female: ",
    id: "participantsMale/participantsFemale"
  },  
  {
    type:"space",
    html: "table",
    name:""
  },
  {
    type: "input",
    name: "Race: ",
    id: "participantsRace"
  },
  {
    type: "input",
    name: "Median Age: ",
    id: "participantsMedianAge"
  },
  {
    type:"space",
    html: "table",
    name:""
  },
  {
    type: "input",
    name: "Tumor Type: ",
    id: "participantsTumorType"
  },
  {
    type: "input",
    name: "Cancer Stage: ",
    id: "participantsCancerStage"
  },
  ]
};


//Data - Dose 1 form

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
            name: "Dose: ",
            id: "drug1Dose"
        },
        {
            type:"dropdown",
            name:"Formulation: ",
            id:"drug1Formulation",
            options:["UNK","Oral","IV","transdermal", "IM"],
            optionsID:[]
        },
        {
            type: "input",
            name: "Duration in days: ",
            id: "drug1Duration"
        },
        {
            type:"dropdown",
            name:"Regimens:  ",
            id:"drug1Regimens",
            options:["UNK","SD","QD","BID", "TID", "QID", "Q12", "Q8", "Q6", "Daily"],
            optionsID:[]
        },
        {
            type: "input",
            name: "Maximum tolerated dose:  ",
            id: "drug1ToleratedDose"
        }
    ]
};


//Data - Dose 2 form

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
            name: "Dose: ",
            id: "drug2Dose"
        },
        {
            type:"dropdown",
            name:"Formulation: ",
            id:"drug2Formulation",
            options:["UNK","Oral","IV","transdermal", "IM"],
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
            options:["UNK","SD","QD","BID", "TID", "QID", "Q12", "Q8", "Q6", "Daily"],
            optionsID:[]
        },
        {
            type: "input",
            name: "Maximum tolerated dose: ",
            id: "drug2ToleratedDose"
        }
    ]
};


//Data - Radiotherapy Form

var context5 = {

  questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"radiotherapyQuote",
            options:[],
            optionsID:[]
        },
        {
            type:"dropdown",
            name:"is radiotherapy: ",
            id:"radiotherapy",
            options:["Yes", "No"],
            optionsID:[]
        }

    ]
};

//Data -Toxicity Form

var context6 = {

    questions: [
    {
        type: "quote",
        name: "Qoute: ",
        id: "toxicityQuote",
        options:[],
        optionsID:[]
    },
    {
        type: "input",
        name: "Toxicity criteria: ",
        id: "toxicityCriteria"
    },
    {
        type: "button",
        name: "add",
        id: "toxicityTable"
    },
    {
        type:"theader",
        name:"Toxicity",
        id:"toxicity",
        html:"table"
    },
    {
        type:"theader",
        name:"Grade",
        id:"grade",
        html:"table"
    },
    {
        type:"theader",
        name:"Frequency",
        id:"frequency",
        html:"table"
    },
    {
        type:"theader",
        name:"Death",
        id:"death",
        html:"table"
    },
    {
        type:"theader",
        name:"Withdrawal",
        id:"withdrawal",
        html:"table"
    },
    {
        type:"space",
        html: "table",
        name:""
    },
    {
        input:"text",
        id:"toxicity",
        html:"table"
    },
    {
        input:"text",
        id:"grade",
        html:"table"
    },
    {
        input:"text",
        id:"frequency",
        html:"table"
    },
    {
        input:"text",
        id:"death",
        html:"table"
    },
    {
        input:"text",
        id:"withdrawal",
        html:"table"
    }

    ]
};


//Data - Death / Withdrawal Form



var context7 = {

  questions: [
        {
            type:"quote",
            name:"Quote: ",
            id:"death/withdrawalQuote",
            options:[],
            optionsID:[]
        },
        {
            type: "input",
            name: "Death frequency: ",
            id: "deathFrequency"
        },
        {
            type: "input",
            name: "Withdrawal frequency: ",
            id: "withdrawalFrequency"
        }
    ]
};


// Template for Claim form.

Handlebars.registerHelper('buildFormClaim', function(items, options) {
    var out = "";

    if (items[0].type == "quote") {
        
        out += "<div id='" + items[0].id + "' class='claimquoteborder'></div>";
    }

    for (var i = 1, l=items.length; i<l; i++) {

      if (items[i].type=="dropdown") {

        out = out + "&nbsp;&nbsp;&nbsp;&nbsp;<strong id = '" + items[i].id + "-label'>" + items[i].name +"</strong>&nbsp;&nbsp;";

        if (items[i].name == "Drug1: ") {

            out = out + "<select style='width:140px;height:90px;' id='" + items[i].id + "'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";


        } else if (items[i].name == "Drug2: ") {

            out = out + "<select style='width:140px;height:90px;' id='" + items[i].id + "'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            
        } else {

            out = out + "<select style='width:120px;height:40px;' id='" + items[i].id + "'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        }



        for(var j = 0, sl = items[i].options.length; j<sl; j++) {

          if (items[i].optionsID.length==0)

            out = out + "<option value='" + items[i].options[j] + "'>" + items[i].options[j] + "</option>";

          else

           out = out + "<option id='" + items[i].optionsID[j] + "' value='" + items[i].options[j] + "'>" + items[i].options[j] + "</option>";

       }

       out = out + "</select>";

       if (items[i].id == "Drug1" || items[i].id == "Drug2") {

        out += "<input style='width:140px;height:60px;display:none;float:left;' type='text' id='"+items[i].id+"-input'>";

        out += "<img id='edit" + items[i].id + "' src='img/edit-button.png' style='margin-right:10px;margin-top:5px;width:16px;height:16px;'>";

        out += "<img id='commit" + items[i].id + "' src='img/check.png' style='margin-right:10px;margin-top:5px;width:16px;height:16px;display:none;'>";

      }


    }

  }

  return out;

});


//Template for Dose1, Dose2, Radiotherapy, Death/withdrawal 


Handlebars.registerHelper('buildFormData', function(items, options) {
    var out = "";
    
    for(var i=0, l=items.length; i<l; i++) {
        
        if (items[i].type == "quote") {
            out += "<div id='" + items[i].id + "' class='dataquoteborder'></div>";
        }
        else {

            if(((i)%5==0))

                out = out + "</br></br>";

            if (items[i].type == "input") {

                out += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong id='"+ items[i].id +"-label'>" + items[i].name +"</strong>";
                out += "<input style='width:60px; height:20px;' type='text' id='"+items[i].id+"'>";
            }

            else if (items[i].type=="dropdown") {

                out += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong id='"+ items[i].id +"-label'>" + items[i].name +"</strong>";

                out = out + "<select id='" + items[i].id + "'>";


                for(var j = 0, sl = items[i].options.length; j<sl; j++) {

                    if(items[i].optionsID.length==0)

                        out = out + "<option value='" + items[i].options[j] + "'>" + items[i].options[j] + "</option>";

                else

                  out = out + "<option id='" + items[i].optionsID[j] + "' value='" + items[i].options[j] + "'>" + items[i].options[j] + "</option>";
                }

            }
            out = out + "</select>";

            if (items[i].newline == "yes")
                    out += "<br>";
            else if (items[i].newline == "no")
                out += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";



        }
  }


  return out;



});


//Participants template


Handlebars.registerHelper('buildFormParticipantsData', function(items, options) {
    var out = "";
    for(var i=0, l=items.length; i<l; i++) {
        if (items[i].type == "quote") {
            out += "<div id='" + items[i].id + "' class='dataquoteborder'></div>";
        }

        out += "<table id ='participants-tab'>";

        for (var i = 1, l=items.length; i<l; i++) {

          if (items[i].type == "input") {

            if (((i)%4==0))
              out = out + "<tr>";
            if (items[i].name == "Number of Participants: ") {

              out += "<td width='40%'><strong id ='"+ items[i].id +"-label'>" + items[i].name + "</strong>";
              out += "<input style='width:50px; height:20px;' type='text' id='"+items[i].id+"'>" + "</td>";
            }

            else if (items[i].name == "Total/Course/Cycle No: ") {

              out += "<td width='35%'><strong id ='"+ items[i].id +"-label'>" + items[i].name + "</strong>";
              out += "<input style='width:50px; height:20px;' type='text' id='"+items[i].id+"'>" + "</td>";
            }

            else if (items[i].name == "Male/Female: ") {

              out += "<td><strong id ='"+ items[i].id +"-label'>" + items[i].name + "</strong>";
              out += "<input style='width:50px; height:20px;' type='text' id='participantsMale'>" + " / " + "<input style='width:50px; height:20px;' type='text' id='participantsFemale'>" + "</td>";

            }

            if (((i+1)%4==0))
              out = out + "</tr>";

            if (((i)%7==0))
              out = out + "<tr>";

            if (items[i].name == "Race: ") {

              out += "<td width='40%'><strong id ='"+ items[i].id +"-label'>" + items[i].name + "</strong>";
              out += "<input style='width:50px; height:20px;' type='text' id='"+items[i].id+"'>" + "</td>";
            }

            if (items[i].name == "Median Age: ") {

              out += "<td><strong id ='"+ items[i].id +"-label'>" + items[i].name + "</strong>";
              out += "<input style='width:50px; height:20px;' type='text' id='"+items[i].id+"'>" + "</td>";
            }

            if (((i+1)%7==0))
              out = out + "</tr>";

            if (((i)%10==0))
              out = out + "<tr>";

            if (items[i].name == "Tumor Type: ") {

              out += "<td width='40%'><strong id ='"+ items[i].id +"-label'>" + items[i].name + "</strong>";
              out += "<input style='width:50px; height:20px;' type='text' id='"+items[i].id+"'>" + "</td>";
            }

            if (items[i].name == "Cancer Stage: ") {

              out += "<td><strong id ='"+ items[i].id +"-label'>" + items[i].name + "</strong>";
              out += "<input style='width:50px; height:20px;' type='text' id='"+items[i].id+"'>" + "</td>" + "</tr>";
            }

          }


        }

        out += "</table>";
  }

  return out;

});



// Drug Toxicity template.


function addRow() {

    var table = document.getElementById("toxicity-tab");
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);


    var cell1 = row.insertCell(0);
    cell1.style = "border: 1px solid black";
    var element1 = document.createElement("input");
    element1.type = "text";
    element1.id = "toxicity";
    cell1.appendChild(element1);

    var cell2 = row.insertCell(1);
    cell2.style = "border: 1px solid black";
    cell2.width = "250";
    var element2 = document.createElement("input");
    element2.type = "text";
    element2.id = "grade";
    element2.style = "width:250px";
    cell2.appendChild(element2);

    var cell3 = row.insertCell(2);
    cell3.style = "border: 1px solid black";
    var element3 = document.createElement("input");
    element3.type = "text";
    element3.id = "frequency";
    cell3.appendChild(element3);

    var cell4 = row.insertCell(3);
    cell4.style = "border: 1px solid black";
    var element4 = document.createElement("input");
    element4.type = "text";
    element4.id = "death";
    cell4.appendChild(element4);

    var cell5 = row.insertCell(4);
    cell5.style = "border: 1px solid black";
    var element5 = document.createElement("input");
    element5.type = "text";
    element5.id = "withdrawal";
    cell5.appendChild(element5);
};





Handlebars.registerHelper('buildFormToxicityData', function(items, options) {
    var out = "";
    for(var i=0, l=items.length; i<l; i++) {
        if (items[i].type == "quote") {
            out += "<div id='" + items[i].id + "' class='dataquoteborder'></div>";
        }
        else {

            if (items[i].type == "input") { 

                out += "&nbsp;&nbsp;<strong id='"+ items[i].id +"-label'>" + items[i].name +"</strong>";
                out += "<input style='width:150px; height:30px;' type='text' id='"+items[i].id+"'>";

            }

            else if (items[i].type == "button") {
              
              out += "<button onclick='addRow();' style='float: right; width:80px; height:30px;' id= "+ items[i].id + ">" + items[i].name + "</button> </br> </br> </br>";

              
            }

            else {

                out += "<table id ='toxicity-tab' align = 'center' style = 'border-collapse: collapse; border: 1px solid black;'>";

                out += "<col width = '100'>" + "<col width = '250'>" + "<col width = '100'>" + "<col width = '100'>" +"<col width = '100'>";

                for (var i = 1, l=items.length; i<l; i++) {

                    if (items[i].html == "table") {

                        if (((i)%8==0))

                            out = out + "<tr>";

                        if (items[i].type == "theader") {

                            out += "<td style = 'border: 1px solid black; color: white;' bgcolor='LightGray;' align = 'center'><strong id ='"+ items[i].id +"-label'>" + items[i].name + "</strong></td>";
                            //out += "<td><input type='text' id='"+items[i].id+"'>" + "</td>";

                        }
                        if(((i+1)%8==0))
                            out = out + "</tr>";

                        if(((i-1)%7==6))
                           out = out + "<tr id = 'toxicity-data'>";

                        if (items[i].input == "text") {

                            if (items[i].id != "grade") {

                                out += "<td style = 'border: 1px solid black;'><input type='text' id='"+items[i].id+"'>" + "</td>";
                            } else if (items[i].id == "grade") {

                                out += "<td style = 'border: 1px solid black;'><input style = 'width:250px;' type='text' id='"+items[i].id+"'>" + "</td>";
                            }

                          


                        }
                        if(((i)%7==0))
                            out = out + "</tr>";

                        
                    }
                    
                    }

                out += "</table>";
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

source = "{{#buildFormParticipantsData questions}}{{/buildFormParticipantsData}}";
template = Handlebars.compile(source);
var form2 = template(context2);

// Data - Dose 1

source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form3 = template(context3);

// Data - Dose 2

source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form4 = template(context4);

// Data - Radiotherapy

source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form5 = template(context5);

// Data - Toxicity

source = "{{#buildFormToxicityData questions}}{{/buildFormToxicityData}}";
template = Handlebars.compile(source);
var form6 = template(context6);

// Data - Death/withdrawal

source = "{{#buildFormData questions}}{{/buildFormData}}";
template = Handlebars.compile(source);
var form7 = template(context7);


Template.content = [

    // '<div class="annotator-outer annotator-editor annotator-invert-y annotator-invert-x">',
    // '<form class="annotator-widget">',   // editor is not widget
    '<form class="annotator-editor-form">',
    // '<ul class="annotator-listing"></ul>',
    // '<div class="annotationbody" style="margin-left:35px;margin-right:0px;height:100%;line-height:200%;margin-top:0px;overflow-y: hidden">',
    '<div class="annotationbody" style="margin-left:20px;margin-right:20px;height:100%;margin-top:0px;overflow-y: hidden">',
    '<div id="tabs">',
    '<div id="tabs-1" style="margin-bottom:0px;">',

    // current claim label
    '<div id="claim-label-data-editor" style="display: none;"></div>',

    // links 
    '<div id="mp-data-nav" style="display: none;">',
    //'<button id="nav-evRelationship-btn" type="button" onclick="switchDataForm(\'evRelationship\')" >Ev relationship</button> &nbsp;->&nbsp;',
    '<button id="nav-participants-btn" type="button" onclick="switchDataForm(\'participants\')" >Participants</button> &nbsp;&nbsp;->&nbsp;&nbsp;',
    '<button id="nav-dose1-btn" type="button" onclick="switchDataForm(\'dose1\')" >Dose 1 </button> &nbsp;&nbsp;->&nbsp;&nbsp;',
    '<button id="nav-dose2-btn" type="button" onclick="switchDataForm(\'dose2\')" >Dose 2 </button>&nbsp;&nbsp;->&nbsp;&nbsp;',
    '<button id="nav-radiotherapy-btn" type="button" onclick="switchDataForm(\'radiotherapy\')" >Radiotherapy</button>&nbsp;&nbsp;->&nbsp;&nbsp;',
    '<button id="nav-toxicity-btn" type="button" onclick="switchDataForm(\'toxicity\')" >Toxicity</button> &nbsp;&nbsp;->&nbsp;&nbsp;',
    '<button id="nav-death/withdrawal-btn" type="button" onclick="switchDataForm(\'death/withdrawal\')" >Death/Withdrawal</button> &nbsp;&nbsp;->&nbsp;&nbsp;',
    '</div>',

    // Claim form
    '<div id="mp-claim-form" style="display: none;">',
    form1,
    '</div>',
    
    // Data & material - Num of Participants
    '<div id="mp-data-form-participants" style="margin-top:7px;margin-buttom:7px;margin-left:25px;display: none;">',
    form2,
    '</div>',

    // Data & material - Drug1 Dosage
    '<div id="mp-data-form-dose1" style="margin-top:7px;margin-buttom:7px;margin-left:25px;display: none;">',
    form3,
    '</div>',

    // Data & material - Drug2 Dosage
    '<div id="mp-data-form-dose2" style="margin-top:7px;margin-buttom:7px;margin-left:25px;display: none;">',
    form4,
    '</div>',

    // Data & material - Radiotherapy
    '<div id="mp-data-form-radiotherpay" style="margin-top:7px;margin-buttom:7px;margin-left:25px;display: none;">',
    form5,
    '</div>',

    // Data & material - Toxicity
    '<div id="mp-data-form-toxicity" style="margin-top:7px;margin-buttom:7px;margin-left:25px;display: none;">',
    form6,
    '</div>',

    // Data & material - Death/Withdrawal
    '<div id="mp-data-form-death/withdrawal" style="margin-top:7px;margin-buttom:7px;margin-left:25px;display: none;">',
    form7,
    '</div>',

    '</div>',
    '</div>',
    '</div>',
    '    <div class="annotator-controls1">',
    '     <button class="annotator-cancel" onclick="exitEditorToAnnTable()" id="annotator-cancel">Cancel</button>',
    '     <button class="annotator-delete" id="annotator-delete">Delete</button>',
    '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
    '     <button class="annotator-save annotator-focus">Save</button>',
    '     <button class="annotator-save-close" id="annotator-save-close">Save and Close</button>',
    '    </div>',
    '<div class="form-validation-alert" style="display: none;">',
    '   <strong>Error submitting the form!</strong> Please complete all the red fields.',
    '</div>',
    '  </form>',
    // '</div>'
].join('\n');


Template.extend = extend;
exports.Template = Template;
