define(function(require){
	var $ = require('jquery'),
		monster = require('monster');

	var app = {
		name: 'numbers',

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
                        'de-DE': { customCss: false },
                        'dk-DK': { customCss: false },
                        'it-IT': { customCss: false },
                        'fr-FR': { customCss: false },
                        'ro-RO': { customCss: false },
                        'ru-RU': { customCss: false },
                        'es-ES': { customCss: false },
                        'nl-NL': { customCss: false },
                        'pt-PT': { customCss: false },
                        'zh-CN': { customCss: false },
                        'es-ES': { customCss: false }
		},

		requests: {
		},

		subscribe: {
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(parent){
			var self = this,
				parent = parent || $('#monster-content');

			var numberManager = $(monster.template(self, 'app'));

			monster.pub('common.numbers.render', {
				container: numberManager,
				callbackAfterRender: function(numberControl) {
					parent
						.empty()
						.append(numberControl);
				}
			});
		},
	};

	return app;
});

