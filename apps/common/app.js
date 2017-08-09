define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster');

	var app = {
		name: 'common',

		subModules: [ 'accountAncestors'
			    , 'accountBrowser'
			    , 'buyNumbers'
			    , 'buyDevices'
			    , 'callerId'
			    , 'e911'
			    , 'failover'
			    , 'blacklist'
			    , 'numbers'
			    , 'port'
			    , 'chooseModel'
			    , 'servicePlanDetails'
			    , 'ringingDurationControl'
			    , 'carrierSelector'
			    , 'numberRegextern'
			    , 'numberPrepend'
			    , 'numberSelector'
			    , 'monsterListing'
		],

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'de-DE': { customCss: false },
			'dk-DK': { customCss: false },
			'it-IT': { customCss: false },
			'nl-NL': { customCss: false },
			'ro-RO': { customCss: false },
			'fr-FR': { customCss: false },
			'ru-RU': { customCss: false },
			'pt-PT': { customCss: false },
			'zh-CN': { customCss: false },
			'es-ES': { customCss: false }
		},

		requests: {},
		subscribe: {},

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
		}
	};

	return app;
});
