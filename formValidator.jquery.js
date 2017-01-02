$(document).ready(function (e) {
    detectSubmitForms();
});

function detectSubmitForms() {
    $('.submitForm').each(function (i, elem) {
        handleClickSubmit(elem);
    });
}

function handleClickSubmit(elem) {
    var oForm;
    $(elem).on("click", function (e) {
        e.preventDefault();
        var dataOptions = $(this).attr('data-options');
        var options = JSON.parse(dataOptions);
        oForm = $(this).formValidator(options);
    });
}

(function ($) {
    // formValidator plugin definition
    $.fn.formValidator = function (options) {
        // console.log('options', options);

        var opts = options;
        var jsonReturn = {};
        var jsonDatas = {};
        var jsonTemp = {};
        var jsonContainer = {};
        var jsonErrors = {};

        function getForms() {
            var formIds = (opts.formIds).split(',');
            // console.log('formIds', formIds);
            var oForm = null;
            var isValid = true;

            $(formIds).each(function (i, elem) {
                //oForm = $("#" + elem);
                isValid = validateForm("#" + elem);
                if (isValid) {
                    jsonTemp = createNestedJson("#" + elem);
                    jsonContainer["module"] = opts.entitymodule;
                    jsonContainer["type"] = opts.entitytype;
                    jsonContainer["datas"] = JSON.stringify(jsonTemp);
                    sendForm("#" + elem, jsonContainer);
                }

                //console.log('jsonContainer', jsonContainer);

            });
        }

        function sendForm(sFormId, jsonContainer) {
            var jsonToSend = JSON.stringify(jsonContainer);
            var oForm = $(sFormId);
            var dataRequest = $(oForm).attr('data-request');

            var jqxhr = $.ajax({
                url: dataRequest,
                context: document.body,
                data: jsonToSend,
                contentType: "application/json",
                dataType: "json",
                method: "POST",
                beforeSend: function (xhr) {
                    $(this).loader({ "loadingText": "Processing..." });
                }
            })
              .done(function (data) {
                  jsonReturn = data;
              })
              .fail(function (data) {
                  jsonReturn = data;
              })
              .always(function (data) {
                  $(this).loader.close();

                  if (jsonReturn.d.ErrorMessage !== null && jsonReturn.d.ErrorMessage !== "") {
                      jsonErrors["ajaxReturn"] = jsonReturn.d.ErrorMessage;
                      //console.log('jsonErrors', jsonErrors);
                      displayErrors(oForm);
                      helpers.ScrollTo(oForm, function () { }, 500);
                  }
                  else {
                      if (jsonReturn.d.Data !== null) {
                          manageJsonReturn(jsonReturn.d.Data);
                      }
                  }
              });
        }

        function displayErrors(oForm) {
            var oGlobalErrorMessages = $('<p />', {
                class: 'globalErrorMessages'
            });
            var str = "";
            $.each(jsonErrors, function (k, v) {
                str += v;
            });
            $(oGlobalErrorMessages).html(str);
            $(oForm).prepend(oGlobalErrorMessages);
        }

        function validateForm(oForm) {
            var isValid = true;

            resetErrors(oForm);

            $(oForm + ' :input').each(function (i, item) {
                var field = $(this);
                var fieldId = $(field).attr('id');
                var fieldName = field.attr("name");
                var fieldValidation = field.attr("data-fv-validation");
                var sLabel = $('label[for="' + fieldId + '"]').text();

                switch (fieldValidation) {
                    case "mustMatch":
                        {
                            if ((field.val()).isNullOrWhiteSpace()) {
                                //console.log("value notNull sLabel:", sLabel);
                                //parentItem.classList.add("error");
                                //errorItem.innerHTML = "The field " + sLabel + " cannot be null";
                                //sAllErrorMessages += "The field " + sLabel + " cannot be null <br />";
                                //isValid = false;
                            } else {
                                var fieldMatchName = $(field).attr('data-fv-match');
                                var fieldToMatch = document.getElementsByName(fieldMatchName)[0];
                                var fieldMatchLabel = fieldToMatch.getAttribute('placeholder');

                                if (($(field).val()) != $(fieldToMatch).val()) {
                                    $(field).closest('.formField').addClass("error");
                                    //errorItem.innerHTML = "The field " + sLabel + " must match with:" + fieldMatchLabel;
                                    jsonErrors[fieldName] = "The field " + sLabel + " must match with:" + fieldMatchLabel + "<br />";
                                    isValid = false;
                                }
                            }
                        }
                        break;
                    case "notNull":
                        {
                            if (($(field).val()).isNullOrWhiteSpace()) {
                                $(field).closest('.formField').addClass("error");
                                //errorItem.innerHTML = "The field " + sLabel + " cannot be null";
                                jsonErrors[fieldName] = "The field " + sLabel + " cannot be null <br />";
                                isValid = false;
                            }
                        }
                        break;
                    case "email":
                        {
                            if (!($(field).val()).isEmailValid()) {
                                $(field).closest('.formField').addClass("error");
                                //errorItem.innerHTML = "The field " + sLabel + " is not a valid email";
                                jsonErrors[fieldName] = "The field " + sLabel + " is not a valid email <br />";
                                isValid = false;
                            }
                        }
                        break;
                    case "emailornull":
                        {
                            if (!($(field).val()).isEmailValidOrNull()) {
                                $(field).closest('.formField').addClass("error");
                                //errorItem.innerHTML = "The field " + sLabel + " is not a valid email";
                                jsonErrors[fieldName] = "The field " + sLabel + " is not a valid email <br />";
                                isValid = false;
                            }
                        }
                        break;
                    case "date":
                        {
                            if (!($(field).val()).isDateValidOrNull()) {
                                $(field).closest('.formField').addClass("error");
                                jsonErrors[fieldName] = "The field " + sLabel + " is not a valid date format <br />";
                                isValid = false;
                            }
                            //console.log('data-fv-validation: ', 'date');
                            //console.log("value date:", oAllRequiredFields[i].value);
                        }
                        break;
                    case "phone":
                        {
                            //console.log('data-fv-validation: ', 'phone');
                            //console.log("value phone:", oAllRequiredFields[i].value);
                        }
                        break;
                    case "atLeastOneNotNull":
                        {
                            //console.log('data-fv-validation: ', 'atLeastOneNotNull');
                            //console.log("value atLeastOneNotNull:", oAllRequiredFields[i].value);
                        }
                        break;
                    case "number":
                        {
                            if (isNaN($(field).val()) || ($(field).val()).isNullOrWhiteSpace()) {
                                $(field).closest('.formField').addClass("error");
                                //errorItem.innerHTML = "The field " + sLabel + " is not a number";
                                jsonErrors[fieldName] = "The field " + sLabel + " is not a number <br />";
                                isValid = false;
                            }
                        }
                        break;
                }
            }); /* end .each() */

            if (!isValid) displayErrors(oForm);
            return isValid;
        }

        /* 
    {
     "module": "Core", 
     "type": "Login",
     "datas": [{
        "login":"hideo2801@gmail.com",
        "password":"testze",
        "rememberme":"false"
      },
      {
        "login":"hideo2801@gmail.com",
        "password":"testze",
        "rememberme":"false"
      }]
    }
    */
        function createNestedJson(oForm) {
            //jsonDatas["formId"] = $(oForm).attr('id');
            $(oForm + ' :input').each(function (i, item) {
                var field = $(this);

                var tag = field.prop("tagName").toLowerCase();
                var fieldName = field.attr("name");

                if (tag == "input") {
                    var fieldType = field.attr("type");
                    if (fieldType != "submit") {
                        switch (fieldType) {
                            case "radio":
                                if ($(field).is(':checked')) jsonDatas[fieldName] = field.val();
                                break;
                            case "checkbox":
                                if ($(field).is(':checked')) jsonDatas[fieldName] = field.val();
                                break;
                            default:
                                jsonDatas[fieldName] = field.val();
                                break;
                        }
                    }
                } else {
                    jsonDatas[fieldName] = field.val();
                }

            });

            // console.log("jsonDatas", jsonDatas);

            return jsonDatas;

        }

        function resetErrors(oForm) {
            $(oForm).find('.error').removeClass('error');
            $(oForm).find('.globalErrorMessages').remove();
        }

        /************************************************
         ** Manage json return form the server
         ************************************************/
        function manageJsonReturn(d) {
            if (d.redirectUrl !== null && d.redirectUrl !== undefined) {
                if (d.redirectUrl === "") {
                    if (helpers.QueryString.ReturnUrl == "/Logout.aspx" || ((helpers.QueryString) === null && (helpers.QueryString.ReturnUrl) === null)) {
                        window.location.href = "/";
                    }
                    else {
                        window.location.href = helpers.QueryString.ReturnUrl;
                    }
                }
                else {
                    if (d.redirectUrl === "#") {
                        window.location.reload();
                    }
                    else {
                        window.location.href = d.redirectUrl;
                    }
                }
            }
        }

        getForms();

        return this;

    };
})(jQuery);
