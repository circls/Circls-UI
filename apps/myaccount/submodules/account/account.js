define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		language = require('monster-language'),
		timezone = require('monster-timezone'),
		quickcalldevice = require('monster-quickcalldevice'),
		dialplan = require('monster-regiodialplan');

	var account = {

		subscribe: {
			'myaccount.account.renderContent': '_accountRenderContent'
		},

		_accountRenderContent: function(args){
			var self = this;

			self.accountGetData(function(data) {

                                if(monster.apps.auth.originalAccount.is_reseller == true && monster.apps.auth.currentUser.priv_level == 'admin' && monster.apps.auth.currentUser.enabled == true && monster.apps.auth.originalAccount.superduper_admin == true)
                                    data.is_superadminreseller = true;
                                if(monster.apps.auth.originalAccount.is_reseller == true && monster.apps.auth.currentUser.priv_level == 'admin' && monster.apps.auth.currentUser.enabled == true)
                                    data.is_adminreseller = true;

                                if(typeof data.account.provision == "object" && typeof data.devices == "object") {
                                    if(typeof data.account.provision.keytemplate == "string") {
                                    $.each(data.devices, function(i, dev) {
                                        if(dev.device_type == 'sip_device')
                                        if(data.account.provision.keytemplate == dev.id) {
                                                data.keytemplate = dev.name;
                                        }
                                    });
                                    }
				};

                                // regiodialplan
                                if(typeof data.account.regiodialplan == "string" && typeof monster.apps.auth.regiodiallocal[data.account.regiodialplan] == "string")
                                        data.regiodialplanlocal = monster.apps.auth.regiodiallocal[data.account.regiodialplan];

                                // emergencydialplan
                                if(typeof data.account.emergencyplan == "string" && typeof monster.apps.auth.emergencydiallocal[data.account.emergencyplan] == "string")
                                        data.emergencydialplanlocal = monster.apps.auth.emergencydiallocal[data.account.emergencyplan];

				data.fraud.per24h = parseFloat(data.fraud.per24h).toFixed(3);
				var accountTemplate = $(monster.template(self, 'account-layout', data));

                                monster.ui.tooltips(accountTemplate);

				self.accountBindEvents(accountTemplate, data);
				monster.pub('myaccount.renderSubmodule', accountTemplate);
				args.callback && args.callback(accountTemplate);
			});
		},

                devicesDropdown: function(data, dropdown, _selected) {
                        self = this;
                        selected = _selected;
                                $.each(data.devices, function(i, dev) {
                                        if(dev.device_type == 'sip_device')
                                        if(selected == dev.id) {
                                                dropdown.append('<option value="' + dev.id + '" SELECTED>' + dev.name + '</option>');
                                        } else {
                                                dropdown.append('<option value="' + dev.id + '">' + dev.name + '</option>');
                                        }
                                });
                },

		accountBindEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#account_timezone'), data.account.timezone);
			template.find('#account_timezone').chosen({ search_contains: true, width: '220px' });

			language.populateDropdown(template.find('#account_language'), data.account.language);
			template.find('#account_language').chosen({ search_contains: true, width: '220px' });

			// regional dialplan
			dialplan.regional.populateDropdown(template.find('#account_regiodialplan'), data.account.regiodialplan);
			template.find('#account_regiodialplan').chosen({ search_contains: true, width: '220px' });

			// emergency dialplan
			dialplan.emergency.populateDropdown(template.find('#account_emergencyplan'), data.account.emergencyplan);
			template.find('#account_emergencyplan').chosen({ search_contains: true, width: '220px' });

			if(typeof data.account.provision == "object")
				self.devicesDropdown(data, template.find('#account_keytemplate'), data.account.provision.keytemplate||'inherit', {inherit: ''});
			template.find('#account_keytemplate').chosen({ search_contains: true, width: '220px' });

			//Temporary button design fix until we redesign the Accounts Manager
			template.find('#accountsmanager_carrier_save')
					.removeClass('btn btn-success')
					.addClass('monster-button-success');

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		},

		accountGetNoMatch: function(callback) {
			var self = this;

			self.callApi({
				resource: 'callflow.list',
				data: {
					accountId: self.accountId,
					filters: {
						filter_numbers: 'no_match'
					}
				},
				success: function(listCallflows) {
					if(listCallflows.data.length === 1) {
						self.callApi({
							resource: 'callflow.get',
							data: {
								callflowId: listCallflows.data[0].id,
								accountId: self.accountId
							},
							success: function(callflow) {
								callback(callflow.data);
							}
						});
					}
					else {
						callback({});
					}
				}
			});
		},

		accountGetData: function(globalCallback) {
			var self = this;

			monster.parallel(
				{
					account: function(callback) {
						self.callApi({
							resource: 'account.get',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								callback && callback(null, data.data);
							}
						});
					},
					noMatch: function(callback) {
						self.accountGetNoMatch(function(data) {
							callback && callback(null, data);
						})
					},
                                        devices: function(callback) {
                                            self.callApi({
                                                resource: 'device.list',
                                                data: {
                                                        accountId: self.accountId,
                                                        filters: {
                                                                paginate: 'false'
                                                        }
                                                },
                                                success: function(dataDevices) {
                                                        callback(null, dataDevices.data);
                                                }
                                            });
                                        },
                                        fraud: function(callback) {
                                            self.callApi({
                                                resource: 'balance.getFraud',
                                                data: {
                                                        accountId: self.accountId
                                                },
                                                success: function(dataFraud) {
                                                        callback(null, dataFraud.data);
                                                }
                                            });
                                        }
                                },
				function(err, results) {
					self.accountFormatData(results, globalCallback);
				}
			);
		},

		accountFormatData: function(data, globalCallback) {
			var self = this;

			globalCallback && globalCallback(data);
		}
	};

	return account;
});