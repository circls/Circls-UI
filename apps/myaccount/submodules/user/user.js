define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		chosen = require('chosen'),
		monster = require('monster'),
		language = require('monster-language'),
		quickcalldevice = require('monster-quickcalldevice'),
		timezone = require('monster-timezone');

	var user = {

		subscribe: {
			'myaccount.user.renderContent': '_userRenderContent'
		},

		_userRenderContent: function(args) {
			var self = this;

			self.callApi({
				resource: 'user.get',
				data: {
					accountId: monster.apps.auth.originalAccount.id,
					userId: self.userId
				},
				success: function(data, status) {
					var data = { user: data.data };
						if(typeof data.user.quickcalldevice == "string" && typeof monster.apps.auth.currentUser.devices[data.user.quickcalldevice] == "object")
							data.quickcallDevice = monster.apps.auth.currentUser.devices[data.user.quickcalldevice].name;
						userTemplate = $(monster.template(self, 'user-layout', data));

					self.userBindingEvents(userTemplate, data);

                                        monster.ui.tooltips(userTemplate);
					monster.pub('myaccount.renderSubmodule', userTemplate);

					if ( typeof args.callback === 'function') {
						args.callback(userTemplate);
					}
				}
			});
		},

		userBindingEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#user_timezone'), data.user.timezone||'inherit', {inherit: self.i18n.active().defaultTimezone});
			template.find('#user_timezone').chosen({ search_contains: true, width: '220px' });

			monster.ui.showPasswordStrength(template.find('#password'));

			language.populateDropdown(template.find('#user_language'), data.user.language||'inherit', {inherit: self.i18n.active().defaultLanguage});
			template.find('#user_language').chosen({ search_contains: true, width: '220px' });

			quickcalldevice.populateDropdown(template.find('#user_quickcalldevice'), data.user.quickcalldevice||'inherit', {inherit: self.i18n.active().defaultquickcalldevice});
			template.find('#user_quickcalldevice').chosen({ search_contains: true, width: '220px' });

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		}
	};

	return user;
});