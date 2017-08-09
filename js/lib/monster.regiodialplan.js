define(function(require) {

	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	if(! monster.apps.auth.currentUser.language) monster.apps.auth.currentUser.language = "en-US";

	var dialplan = {};
	dialplan.regional = {
		list: {
                        "1": { regiodialplan: '1', localcode: "1", state: "United States", descript: ""+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].dialplan.diallocal +" 214 456 2234", dial_plan: '{"(?:^\\\\+?1?)(\\\\d{10})$": { "description": "National", "prefix": "+1"}, "(?:^\\\\+|^011)([2-9][1-9]\\\\d*)$": { "description": "International",  "prefix": "+" }}' },
                        "27": { regiodialplan: '27', localcode: "27", state: "South Africa", descript: ""+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].dialplan.diallocal +" 011 624 24 24", dial_plan: '{"(?:^\\\\+?27|^0027|^0)((?:[1-9][0-9])\\\\d{7})$": { "description": "National", "prefix": "+27"}, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "International",  "prefix": "+" }}' },
              },
		populateDropdown: function(dropdown, _selected) {
			var self = this, selected = _selected;

			$.each(self.list, function(i, data) {
				if(selected == data.regiodialplan) {
					dropdown.append("<option value='" + data.regiodialplan + "' SELECTED>" + data.state + ' - ' + data.descript  + ' - ' + data.localcode +  '</option>');
				}
				else {
					dropdown.append("'<option value='" + data.regiodialplan + "'>" + data.state + ' - ' + data.descript  + ' - ' + data.localcode +  '</option>');
				}
			});
                }
        };
	dialplan.emergency = {
		list: {
		    "911": { emergencydialplan: '911', localcode: "911", state: "United States", descript: "911 "+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.police +""+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.hospital +"", dial_plan: '{"^911": { "description": "'+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.police + ' United States", "prefix": "", "suffix": ""}}' },
       		"933": { emergencydialplan: '933', localcode: "933", state: "United States", descript: "933 "+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.police +""+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.hospital +"", dial_plan: '{"^(933)$": { "description": "'+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.police + ' United States", "prefix": "", "suffix": ""}}' },
       		"27": { emergencydialplan: '27', localcode: "27", state: "South Africa", descript: "10111 "+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.police +""+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.hospital +"", dial_plan: '{"^1011": { "description": "'+ monster.apps.core.data.i18n[monster.apps.auth.currentUser.language].emergencyplan.police + ' South Africa", "prefix": "", "suffix": ""}}' },

                },



		populateDropdown: function(dropdown, _selected) {
			var self = this, selected = _selected;

			$.each(self.list, function(i, data) {
				if(selected == data.emergencydialplan) {
					dropdown.append("<option value='" + data.emergencydialplan + "' SELECTED>" + data.state + ' - ' + data.descript  + ' - ' + data.localcode + '</option>');
				}
				else {
					dropdown.append("'<option value='" + data.emergencydialplan + "'>" + data.state + ' - ' + data.descript  + ' - ' + data.localcode +  '</option>');
				}
			});
                }
        };

        var plan = {}; plans = {};
        $.each(dialplan.regional.list, function(i, plan) {
            if(('state' in plan) && ('descript' in plan)) {
                plans[plan.regiodialplan] = plan.localcode + " - " + plan.descript;
            }
        });
        monster.apps.auth.regiodiallocal = plans;

        var plan = {}; plans = {};
        $.each(dialplan.emergency.list, function(i, plan) {
            if(('state' in plan) && ('descript' in plan)) {
                plans[plan.emergencydialplan] = plan.descript;
            }
        });
        monster.apps.auth.emergencydiallocal = plans;

        return dialplan;
});
