define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var blacklist = {

		requests: {
		},

		subscribe: {
			'common.blacklist.renderPopup': 'blacklistEdit'
		},

		blacklistRender: function(dataNumber, callbacks) {
			var self = this;
			var	tmplData = {
					blacklist: dataNumber.blacklist,
					phoneNumber: dataNumber.id
				},
				popupHtml = $(monster.template(self, 'blacklist-dialog', tmplData)),
				popup;

				var weight_blacklist = dataNumber.blacklist_weight > 0 ? dataNumber.blacklist_weight : 0;
                                popupHtml.find('.slider-value').html(self.i18n.active().blacklist["step_"+ weight_blacklist]);
                                popupHtml.find('.header', this).css("background-image", "url(apps/common/style/static/images/blacklist_"+ weight_blacklist +".png)");

                                monster.ui.tooltips(popupHtml);
                                popupHtml.find('#slider_blacklist').slider({
                                        min: 0,
                                        max: 3,
                                        range: 'min',
                                        value: weight_blacklist,
                                        slide: function( event, ui ) {
                                                popupHtml.find('.slider-value').html(self.i18n.active().blacklist["step_"+ ui.value]);
                                                popupHtml.find('.slider-value').css('left', popupHtml.find('#slider_blacklist .ui-slider-handle').css('left'));
                                        },
                                        change: function(event, ui) {
                                                popupHtml.find('.slider-value').css('left', popupHtml.find('#slider_blacklist .ui-slider-handle').css('left'));
                                                popupHtml.find('.header', this).css("background-image", "url(apps/common/style/static/images/blacklist_"+ ui.value +".png)");
                                        }
                                });

                                popupHtml.find('.submit_btn').on('click', function(ev) {
                                        ev.preventDefault();
                                        dataNumber.blacklist_weight = popupHtml.find('#slider_blacklist').slider('value'),
                                        self.blacklistUpdateNumber(dataNumber.id, dataNumber,
                                                function(data) {
                                                        var phoneNumber = monster.util.formatPhoneNumber(dataNumber.id),
                                                                template = monster.template(self, '!' + self.i18n.active().blacklist.successBlacklist, { phoneNumber: phoneNumber });
                                                        toastr.success(template);
                                                        popup.dialog('destroy').remove();
                                                        callbacks.success && callbacks.success(data);
                                                },
                                                function(data) {
                                                        callbacks.error && callbacks.error(data);
                                                }
                                        );
                                });

                                popupHtml.find('.cancel-link').on('click', function(e) {
                                        e.preventDefault();
                                        popup.dialog('destroy').remove();
                                });

			popup = monster.ui.dialog(popupHtml, {
				title: self.i18n.active().blacklist.blacklistTitle,
				width: '500px'
			});
		},

		blacklistEdit: function(args) {
			var self = this;

			self.blacklistGetNumber(args.phoneNumber, function(dataNumber) {
				self.blacklistRender(dataNumber.data, args.callbacks);
			});
		},

		blacklistGetNumber: function(phoneNumber, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.get',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber)
				},
				success: function(_data, status) {
					if(typeof success === 'function') {
						success(_data);
					}
				},
				error: function(_data, status) {
					if(typeof error === 'function') {
						error(_data);
					}
				}
			});
		},

		blacklistUpdateNumber: function(phoneNumber, data, success, error) {
			var self = this;

			self.callApi({
				resource: 'numbers.update',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(phoneNumber),
					data: data
				},
				success: function(_data, status) {
					if(typeof success === 'function') {
						success(_data);
					}
				},
				error: function(_data, status) {
					if(typeof error === 'function') {
						error(_data);
					}
				}
			});
		}
	};

	return blacklist;
});
