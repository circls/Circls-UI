define(function(require) {

	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var ttsvoice = {
			list: {
                                    "femaleenUS": { voice: "female/en-US", trans: "English US" },
                                    "femalezhCN": { voice: "female/zh-CN", trans: "中國 CN" },
                                    "femalejaJP": { voice: "female/ja-JP", trans: "日本人 JP" },
                                    "femalekoKR": { voice: "female/ko-KR", trans: "한국의 KR" },
                                    "femaledaDK": { voice: "female/da-DK", trans: "Danske DK" },
                                    "femaledeDE": { voice: "female/de-DE", trans: "Deutsch DE" },
                                    "femalecaES": { voice: "female/ca-ES", trans: "Español ES" },
                                    "femalefiFI": { voice: "female/fi-FI", trans: "Suomi FI" },
                                    "femalefrFR": { voice: "female/fr-FR", trans: "Français FR" },
                                    "femaleitIT": { voice: "female/it-IT", trans: "Italiano IT" },
                                    "femalenbNO": { voice: "female/nb-NO", trans: "Norsk NO" },
                                    "femalenlNL": { voice: "female/nl-NL", trans: "Nederlandse NL" },
                                    "femaleplPL": { voice: "female/pl-PL", trans: "Polskie PL" },
                                    "femaleptBR": { voice: "female/pt-BR", trans: "Português BR" },
                                    "femaleptPT": { voice: "female/pt-PT", trans: "Português PT" },
                                    "femaleruRU": { voice: "female/ru-RU", trans: "Pусский RU" },
                                    "femalesvSE": { voice: "female/sv-SE", trans: "Svenska SE" },
                                    "femalehuHU": { voice: "female/hu-HU", trans: "Magyar HU" },
                                    "femalecsCZ": { voice: "female/cs-CZ", trans: "čeština CS" },
                                    "femaletrTR": { voice: "female/tr-TR", trans: "Türk TR" }
                },
		populateDropdown: function(dropdown, _selected) {
			var self = this, selected = _selected;

			$.each(self.list, function(i, data) {
				if(selected == data.voice) {
					dropdown.append('<option value="' + data.voice + '" SELECTED>' + data.trans + '</option>');
				}
				else {
					dropdown.append('<option value="' + data.voice + '">' + data.trans + '</option>');
				}
			});
                }
        };
	return ttsvoice;
});