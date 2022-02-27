// <pre><nowiki>
(function () {
    var responses = {},
        inline = false,
        indentation = ":",
        templateName = "",
        defaultPrompt = "",
        requestResolved = false,
        srhVersion = "1.0.0";

    $(document).ready(function () {
        mw.loader.using(['mediawiki.util'], function () {
            console.log('Loaded stewResponseHelper v' + srhVersion);
            
            // show shortcuts if not editing
            if (!mw.config.get('wgEditMessage')) {
                mw.util.addPortletLink('p-navigation', mw.config.get('wgServer') + '/wiki/Steward requests/Global', 'SRG', 'srh-srg');
                pageMods();
                return;
            }

            setResponses();

            for (var response in responses) {
                var id = responses[response].id || responses[response].code.replace(/\W/g, '');
                mw.util.addPortletLink('p-navigation', 'javascript:', "(" + response + ")", "srh-" + id, responses[response].summary);
                $("#srh-" + id).click({
                    response: responses[response]
                }, respondFn);
            }
        });
    });

    function pageMods() {
        if (/Steward_requests\/Global/.test(mw.config.get('wgPageName'))) {
            // Add permalink to request to all "CA" links
            try {
                var caSpans = $("li span[title='CentralAuth']");
                caSpans.each(function() {
                    var caLink = $(this)[0].firstChild;
                    var currentRev = mw.config.get('wgCurRevisionId');
                    var reportHeader = false;

                    // Ewwww
                    if ($(this).closest('ul').parent()[0].localName == "td") {
                        reportHeader = $(this).closest('table').prevAll('h3')[0];
                    } else {
                        reportHeader = $(this).closest('ul').prevAll('h3')[0];
                    }

                    if (reportHeader) {
                        var reportName = $(reportHeader)[0].firstChild.id;
                        var lockReason = '[[Special:Permalink/' + currentRev + '#' + reportName + ']]';
                        caLink.href = caLink.href + '?wpReason=' + lockReason;
                    }
                });
            } catch (error) {
                console.error(error);
            }
        } else if (/Special:CentralAuth/.test(mw.config.get('wgPageName'))) {
            // Auto-fill wpReason
            try {
                if (getURLParams('wpReason')) {
                    $('input[name=wpReason]').val(getURLParams('wpReason'));
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    // https://stackoverflow.com/a/26744533
    function getURLParams(k) {
        var p = {};
        location.href.replace(
            /[?&]+([^=&]+)=([^&]*)/gi,
            function(s, k, v) {
                p[k] = v;
            }
        );
        return k?p[k]:p;
    }

    function setResponses() {
        if (/Steward_requests\/Global/.test(mw.config.get('wgPageName'))) {
            indentation = ":";
            inline = true;
            hasStatus = true;
            responses = {
                "Done": {
                    code: "done",
                    summary: "Done",
                    requestResolved: true
                },
                "Not Done": {
                    code: "notdone",
                    summary: "Not Done",
                    prompt: "Reason:",
                    requestResolved: false
                }
            };
        }
    }

    function respondFn(e) {
        var response = e.data.response;
        var code = response.code,
            comment = "",
            value = "",
            value2 = "";

        if (code.indexOf("$1") !== -1) {
            value = prompt((response.prompt ? response.prompt : defaultPrompt) +
                (response.valueRequired ? '' : " (optional, hit OK to omit)"));
            if (value === null) return false;
            code = code.replace('$1', value);

            if (code.indexOf("$2") !== -1) {
                value2 = prompt(response.prompt2 + (response.value2Required ? '' : " (optional, hit OK to omit)"));
                if (value2 === null) return false;
                code = code.replace('$2', value2);
            }
        } else if (response.prompt) {
            value = prompt(response.prompt + " (optional, hit OK to omit)");
            if (value === null) return false;
            if (value.length) comment = " " + value;
        }

        var $textarea = $("#wpTextbox1");
        var currentText = $textarea.val();
        var responseStr = indentation + "{{" + (templateName ? templateName + "|" : "") + code.replace(/\|$/, '') + "}}" + comment + " ~~~~";

        if (inline) {
            var caretPos = $textarea.textSelection('getCaretPosition');
            $textarea.val(currentText.substring(0, caretPos) + responseStr + currentText.substring(caretPos));
        } else {
            $textarea.val(currentText + responseStr);
        }

        if (hasStatus) {
            if (response.requestResolved) {
                $textarea.val($textarea.val().replace(/{{status\|?}}/ig, '{{Status|Done}}'));
            } else {
                $textarea.val($textarea.val().replace(/{{status\|?}}/ig, '{{Status|Not done}}'));
            }
        }

        if (response.summary.indexOf('$1') !== -1) {
            response.summary = response.summary.replace('$1', value.trim());

            if (response.summary.indexOf('$2') !== -1) {
                response.summary = response.summary.replace('$2', value2.trim());
            }
        } else {
            response.summary = response.summary + " " + value.trim();
        }
        $("#wpSummary").val($("#wpSummary").val() + response.summary + " (using [[User:TheresNoTime/stewResponseHelper|stewResponseHelper]])");
    }
}());
// </nowiki></pre>
