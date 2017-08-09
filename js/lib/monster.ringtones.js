define(function(require) {

	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var emergencydialplan = {
		list: {
                        "4131": { regiodialplan: '4131', country: "Schweiz", region: "31", dial_plan: '{"^[1-9]\\\\d{6}$": { "description": "Regional",       "prefix": "+4131"   },   "(?:^\\\\+?41|^0041|^0)((?:[1-9][0-9])\\\\d{7})$": {       "description": "National",       "prefix": "+41"   },   "(?:^\\\\+?41|^0041|^0)((?:86)\\\\d{10})$": {       "description": "National-VM", "prefix": "+41" }, "^(112|117|118|145|1414)$": { "description": "CH-Service", "prefix": "+41" }, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "CH-International",  "prefix": "+" }}' },
                        "4133": { regiodialplan: '4133', country: "Schweiz", region: "33", dial_plan: '{"^[1-9]\\\\d{6}$": { "description": "Regional",       "prefix": "+4133"   },   "(?:^\\\\+?41|^0041|^0)((?:[1-9][0-9])\\\\d{7})$": {       "description": "National",       "prefix": "+41"   },   "(?:^\\\\+?41|^0041|^0)((?:86)\\\\d{10})$": {       "description": "National-VM", "prefix": "+41" }, "^(112|117|118|145|1414)$": { "description": "CH-Service", "prefix": "+41" }, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "CH-International",  "prefix": "+" }}' },
                        "4152": { regiodialplan: '4152', country: "Schweiz", region: "52", dial_plan: '{"^[1-9]\\\\d{6}$": { "description": "Regional",       "prefix": "+4152"   },   "(?:^\\\\+?41|^0041|^0)((?:[1-9][0-9])\\\\d{7})$": {       "description": "National",       "prefix": "+41"   },   "(?:^\\\\+?41|^0041|^0)((?:86)\\\\d{10})$": {       "description": "National-VM", "prefix": "+41" }, "^(112|117|118|145|1414)$": { "description": "CH-Service", "prefix": "+41" }, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "CH-International",  "prefix": "+" }}' },
                        "4143": { regiodialplan: '4143', country: "Schweiz", region: "43", dial_plan: '{"^[1-9]\\\\d{6}$": { "description": "Regional",       "prefix": "+4143"   },   "(?:^\\\\+?41|^0041|^0)((?:[1-9][0-9])\\\\d{7})$": {       "description": "National",       "prefix": "+41"   },   "(?:^\\\\+?41|^0041|^0)((?:86)\\\\d{10})$": {       "description": "National-VM", "prefix": "+41" }, "^(112|117|118|145|1414)$": { "description": "CH-Service", "prefix": "+41" }, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "CH-International",  "prefix": "+" }}' },
                        "4144": { regiodialplan: '4144', country: "Schweiz", region: "44", dial_plan: '{"^[1-9]\\\\d{6}$": { "description": "Regional",       "prefix": "+4144"   },   "(?:^\\\\+?41|^0041|^0)((?:[1-9][0-9])\\\\d{7})$": {       "description": "National",       "prefix": "+41"   },   "(?:^\\\\+?41|^0041|^0)((?:86)\\\\d{10})$": {       "description": "National-VM", "prefix": "+41" }, "^(112|117|118|145|1414)$": { "description": "CH-Service", "prefix": "+41" }, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "CH-International",  "prefix": "+" }}' },
                        "4155": { regiodialplan: '4155', country: "Schweiz", region: "55", dial_plan: '{"^[1-9]\\\\d{6}$": { "description": "Regional",       "prefix": "+4155"   },   "(?:^\\\\+?41|^0041|^0)((?:[1-9][0-9])\\\\d{7})$": {       "description": "National",       "prefix": "+41"   },   "(?:^\\\\+?41|^0041|^0)((?:86)\\\\d{10})$": {       "description": "National-VM", "prefix": "+41" }, "^(112|117|118|145|1414)$": { "description": "CH-Service", "prefix": "+41" }, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "CH-International",  "prefix": "+" }}' },
                        "4156": { regiodialplan: '4156', country: "Schweiz", region: "56", dial_plan: '{"^[1-9]\\\\d{6}$": { "description": "Regional",       "prefix": "+4156"   },   "(?:^\\\\+?41|^0041|^0)((?:[1-9][0-9])\\\\d{7})$": {       "description": "National",       "prefix": "+41"   },   "(?:^\\\\+?41|^0041|^0)((?:86)\\\\d{10})$": {       "description": "National-VM", "prefix": "+41" }, "^(112|117|118|145|1414)$": { "description": "CH-Service", "prefix": "+41" }, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "CH-International",  "prefix": "+" }}' },
                        "4127": { regiodialplan: '4127', country: "Schweiz", region: "27", dial_plan: '{"^[1-9]\\\\d{6}$": { "description": "Regional",       "prefix": "+4127"   },   "(?:^\\\\+?41|^0041|^0)((?:[1-9][0-9])\\\\d{7})$": {       "description": "National",       "prefix": "+41"   },   "(?:^\\\\+?41|^0041|^0)((?:86)\\\\d{10})$": {       "description": "National-VM", "prefix": "+41" }, "^(112|117|118|145|1414)$": { "description": "CH-Service", "prefix": "+41" }, "(?:^\\\\+|^00|^000|^0000)([1-9][1-9]\\\\d*)$": { "description": "CH-International",  "prefix": "+" }}' }
                },
		populateDropdown: function(dropdown, _selected) {
			var self = this, selected = _selected;

			$.each(self.list, function(i, data) {
				if(selected == data.regiodialplan) {
					dropdown.append("<option value='" + data.regiodialplan + "' SELECTED>'" + data.country + ' - ' + data.region  + '</option>');
				}
				else {
					dropdown.append("'<option value='" + data.regiodialplan + "'>" + data.country + ' - ' + data.region  + '</option>');
				}
			});
                }
        };
	return emergencydialplan;
});
