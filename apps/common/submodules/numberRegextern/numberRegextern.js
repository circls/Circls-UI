define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr'),
                chosenImage = require('chosenImage'),
                flags = require('monster-flags');

	var numberRegextern = {

		requests: {
		},

		subscribe: {
			'common.numberRegextern.renderPopup': 'numberRegexternEdit'
		},

		numberRegexternEdit: function(args) {
			var self = this;

                        if(monster.apps.auth.isReseller == true && monster.apps.auth.currentUser.priv_level === "admin") {
				self.numberRegexternResellerGetNumber(args.phoneNumber, function(dataNumber) {
				self.numberRegexternRenderReseller(dataNumber.data, args.callbacks);
                                });
                        } else {
				self.numberRegexternGetNumber(args.phoneNumber, function(dataNumber) {
				self.numberRegexternRender(dataNumber.data, args.callbacks);
                                });
			};
		},


		numberRegexternRenderReseller: function(dataNumber, callbacks) {
			var self = this;
                        if(! dataNumber.regextern) dataNumber.regextern = {};
                        if(typeof dataNumber.force_outbound == "undefined" ) dataNumber.force_outbound = false;

                        self.getresource(function(data) {
                                var resource = {};
                                _.each(data, function(res) {
                                        resource[res.id] = {};
                                        resource[res.id]['id'] = res.id;
                                        resource[res.id]['name'] = res.name;
                                        if(dataNumber.regextern.didprovider == res.id)
                                                resource[res.id]['selected'] = "SELECTED";
                                        else
                                                resource[res.id]['selected'] = "";
                                });

                                popup_html = $(monster.template(self, 'numberRegextern-reseller-layout', { data: dataNumber, resource: resource })),
                                monster.pub('common.buyNumbersGetAvailableCountries', {
                                       callback: function(countries, callbackCommonSuccess) {
                                        monster.availableCountries = countries;
                                    }
                                });

                                if(! dataNumber.regextern.didcountry) dataNumber.regextern.didcountry = "";
                                if(monster.availableCountries)
                                    flags.availableDropdown(popup_html.find('#regextern_didcountry'), {available: monster.availableCountries, selected: dataNumber.regextern.didcountry||self.i18n.active().buyNumbers.defaultCountry});
                                else
                                    flags.populateDropdown(popup_html.find('#regextern_didcountry'), dataNumber.regextern.didcountry||self.i18n.active().buyNumbers.defaultCountry);
                                popup_html.find('#regextern_didcountry').chosenImage({ search_contains: true, width: '200px' });

				popup_html.find('.save').on('click', function(ev) {
					ev.preventDefault();
					var regexternFormData = monster.ui.getFormData('number_regextern');
					regexternFormData.regextern.enabled = (regexternFormData.name && regexternFormData.regextern.name.length > 0) ? true : false,
					regexternFormData.regextern.pvt_modified = parseInt(Number(62167219200) + parseInt(Date.now())/1000);
                                if(typeof dataNumber.regextern !== "undefined") {
                                    if(typeof dataNumber.regextern.pvt_changed == "numbers") regexternFormData.regextern.pvt_changed = dataNumber.regextern.pvt_changed;
                                    if(typeof dataNumber.regextern.pvt_changed == "numbers") regexternFormData.regextern.pvt_number_state = dataNumber.regextern.pvt_number_state;
                                    if(typeof dataNumber.regextern.reged_state == "string") regexternFormData.regextern.reged_state = dataNumber.regextern.reged_state;
                                    if(typeof dataNumber.regextern.reged_status == "string") regexternFormData.regextern.reged_status = dataNumber.regextern.reged_status;
                                }
				if(regexternFormData.force_outbound == false) regexternFormData.force_outbound = true; else regexternFormData.force_outbound = false;
					self.numberRegexternUpdateNumber(dataNumber.id, regexternFormData,
						function(data) {
							var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
								template = monster.template(self, '!' + self.i18n.active().regextern.successUpdate, { phoneNumber: phoneNumber });

							toastr.success(template);

							popup.dialog('destroy').remove();

							callbacks.success && callbacks.success(data);
						},
						function(data) {
							callbacks.error && callbacks.error(data);
						}
					);

				});

				popup_html.find('.cancel-link').on('click', function(e) {
					e.preventDefault();
					popup.dialog('destroy').remove();
				});

				popup = monster.ui.dialog(popup_html, {
					title: self.i18n.active().regextern.dialogTitle
				});
			});
		},

		numberRegexternResellerGetNumber: function(phoneNumber, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.get',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber)
				},
				success: function(_data, status) {
					success && success(_data);
				},
				error: function(_data, status) {
					error && error(_data);
				}
			});
		},

		numberRegexternRender: function(dataNumber, callbacks) {
			var self = this,
				popup_html = $(monster.template(self, 'numberRegextern-layout', dataNumber.regextern || {})),
				popup;

			popup_html.find('.save').on('click', function(ev) {
				ev.preventDefault();
				var regexternFormData = monster.ui.getFormData('number_regextern');
				regexternFormData.enabled = (regexternFormData.name && regexternFormData.name.length > 0) ? true : false;
				regexternFormData.pvt_modified = parseInt(Number(62167219200) + parseInt(Date.now())/1000);

				$.extend(true, dataNumber, { regextern: regexternFormData });

				self.numberRegexternUpdateNumber(dataNumber.id, dataNumber,
					function(data) {
						var phoneNumber = monster.util.formatPhoneNumber(data.data.id),
							template = monster.template(self, '!' + self.i18n.active().regextern.successUpdate, { phoneNumber: phoneNumber });

						toastr.success(template);

						popup.dialog('destroy').remove();

						callbacks.success && callbacks.success(data);
					},
					function(data) {
						callbacks.error && callbacks.error(data);
					}
				);

			});

			popup_html.find('.cancel-link').on('click', function(e) {
				e.preventDefault();
				popup.dialog('destroy').remove();
			});

			popup = monster.ui.dialog(popup_html, {
				title: self.i18n.active().regextern.dialogTitle
			});
		},

		numberRegexternGetNumber: function(phoneNumber, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.get',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber)
				},
				success: function(_data, status) {
					success && success(_data);
				},
				error: function(_data, status) {
					error && error(_data);
				}
			});
		},

		numberRegexternUpdateNumber: function(phoneNumber, data, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.update',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber),
					data: data
				},
				success: function(_data, status) {
					success && success(_data);
				},
				error: function(_data, status) {
					error && error(_data);
				}
			});
		},

                getresource: function(callback){
                        var self = this;
                        self.callApi({
                                resource: "globalResources.list",
                                data: {
                                    accountId: self.accountId
                                },
                                    success: function(data) {
                                        callback(data.data)
                                }
                        });
                }

	};

	return numberRegextern;
});
