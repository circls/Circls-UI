/* 
	Left to do:
		- URL needs to be present in Webhook Summary so that it can
		be accessed quickly and efficiently
		- Info Bar needs the Webhooks Picture
		- Webhook History API needs to be fixed and then added to be
		part of this UI, the request and util are commented out
*/

define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		name: 'webhooks',

		css: [ 'app' ],

		i18n: { 
			'en-US': { customCss: false },
			'es-ES': { customCss: false },
                        'de-DE': { customCss: false },
                        'dk-DK': { customCss: false },
                        'it-IT': { customCss: false },
                        'fr-FR': { customCss: false },
                        'ro-RO': { customCss: false },
                        'ru-RU': { customCss: false },
                        'pt-PT': { customCss: false },
                        'zh-CN': { customCss: false },
                        'nl-NL': { customCss: false }
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

			/* Used to init the auth token and account id */
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(args) {
			var self = this,
				args = args || {},
				container = args.container,
				webhookId = args.webhookId || '';
                                self.accountId = monster.apps.auth.accountId;

			self.getWebhooks(function(data) {
				var webhookListI18n = self.i18n.active().webhooks.webhookList;

				for (var i in data) {
					data[i].hook = data[i].hook in webhookListI18n ? webhookListI18n[data[i].hook].name : data[i].hook;
				}

				var templateData = self.formatWebhooksData(data),
					webhooksTemplate = $(monster.template(self, 'webhooks-layout', templateData)),
					parent = _.isEmpty(container) ? $('#monster-content') : container;

				self.bindEvents(webhooksTemplate);

				(parent)
					.empty()
					.append(webhooksTemplate);

				if(webhookId) {
					var cells = parent.find('.grid-row[data-id=' + webhookId + ']');

					monster.ui.highlight(cells);
				}
			});
		},

		formatWebhooksData: function(webhooksData) {
			var self = this,
				templateData = {
					isEmpty: (webhooksData.length === 0),
					groupedWebhooks: [],
					ungroupedWebhooks: [],
					counters: _.countBy(webhooksData, function(webhook) {
						return webhook.enabled ? 'active' : (webhook.disable_reason ? 'error' : 'disabled');
					})
				},
				groups = {};

			_.each(webhooksData, function(webhook) {
				if(webhook.group) {
					if(!groups.hasOwnProperty(webhook.group)) {
						groups[webhook.group] = {
							groupName: webhook.group,
							webhooks: []
						};
					}
					groups[webhook.group].webhooks.push(webhook);
				} else {
					templateData.ungroupedWebhooks.push(webhook);
				}
			});
			templateData.groupedWebhooks = _.map(groups, function(val, key) {
				monster.util.sort(val.webhooks, 'name');
				return val;
			});
			monster.util.sort(templateData.ungroupedWebhooks, 'name');
			monster.util.sort(templateData.groupedWebhooks, 'groupName');
			return templateData;
		},

		bindEvents: function(template) {
			var self = this;

			setTimeout(function() { template.find('.search-query').focus(); });

			monster.ui.tooltips(template);
			
			template.find('.new-webhook').on('click', function(e){
				self.renderWebhookEdit(template);
			});

			template.find('.reenable-button').on('click', function() {
				self.enableAllWebhooks(function() {
					self.render();
				});
			});
			
			template.find('.edit').on('click', function(e){
				var webhookId = $(this).data('id');
				self.renderWebhookEdit(template, webhookId);
			});

			template.find('.history').on('click', function(e) {
				var parentRow = $(this).parents('.grid-row');
				self.renderAttemptsHistory(template, parentRow.data('id'), parentRow.hasClass('error'));
			});

			template.find('.delete').on('click', function(e) {
				$(this).parents('.grid-row').find('.grid-row-delete').fadeIn();
			});

			template.find('.confirm-delete').on('click', function(e) {
				var webhookId = $(this).parents('.grid-row').data('id');
				self.deleteWebhook(webhookId, function(data) {
					self.render();
					toastr.success(monster.template(self, '!' + self.i18n.active().webhooks.toastr.deleteSuccess + data.name ));
				});
			});

			template.find('.cancel-delete').on('click', function(e) {
				$(this).parents('.grid-row-delete').fadeOut();
			});
			
			template.find('.search-query').on('keyup', function() {
				var searchString = $(this).val().toLowerCase(),
					rows = template.find('.webhooks-grid .grid-row:not(.title)'),
					emptySearch = template.find('.webhooks-grid .empty-search-row').toggleClass(".show");

				_.each(rows, function(row) {
					var $row = $(row),
						rowGroup = $row.parents('.grid-row-group');
					if($row.data('search').toLowerCase().indexOf(searchString) < 0) {
						$row.hide();
						if(rowGroup.length > 0 && rowGroup.find('.grid-row:not(.title):visible').length === 0) {
							rowGroup.hide();
						}
					} else {
						$row.show();
						if(rowGroup.length > 0) {
							rowGroup.show();
						}
					}
				});

				if(rows.size() > 0) {
					rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
				}
			});

			template.find('.webhook-toggle').on('change', function() {
				var $this = $(this),
					webhookId = $this.data('id'),
					enabled = $this.is(':checked');
				self.getWebhookDetails(webhookId, function(webhookData) {
					webhookData.enabled = enabled;
					self.updateWebhook(webhookId, webhookData, function() {
						var activeCounter = template.find('.counter-active .count'),
							disabledCounter = template.find('.counter-disabled .count'),
							errorsCounter = template.find('.counter-errors .count');

						if(enabled) {
							activeCounter.html(parseInt(activeCounter.html())+1);
							disabledCounter.html(parseInt(disabledCounter.html())-1);
						} else {
							disabledCounter.html(parseInt(disabledCounter.html())+1);
							activeCounter.html(parseInt(activeCounter.html())-1);
						}
						$this.parents('.grid-row').toggleClass('disabled');
					});
				});
			});
		},

		renderWebhookEdit: function(parent, webhookId) {
			var self = this,
				getWebhookData = function(webhookId, callback) {
					monster.parallel({
						webhookList: function(parallelCallback) {
							self.getAvailableWebhooks(function(data) {
								parallelCallback && parallelCallback(null, data);
							});
						},
						webhookDetails: function(parallelCallback) {
							if(webhookId) {
								self.getWebhookDetails(webhookId, function(webhookData) {
									parallelCallback && parallelCallback(null, webhookData);
								});
							} else {
								parallelCallback && parallelCallback(null, {});
							}
						}
					}, function(err, results) {
						callback && callback(results);
					})
				};

			getWebhookData(webhookId, function(webhookData) {0
				var webhookListI18n = self.i18n.active().webhooks.webhookList;
					webhookList = monster.util.sort(_.map(webhookData.webhookList, function(val) {
						return {
							id: val.id,
							name: val.id in webhookListI18n ? webhookListI18n[val.id].name : val.name,
							description: val.id in webhookListI18n ? webhookListI18n[val.id].description : val.description
						}
					})).concat({
						id: 'all',
							name: webhookListI18n.all.name,
							description: webhookListI18n.all.description
					}),
					template = $(monster.template(self, 'webhooks-edit', {
						webhookList: webhookList,
						webhook: webhookData.webhookDetails,
						groups: (Object.keys(self.uiFlags.account.get('groups') || {})).sort()
					}));
				// Iterate through custom_data to print current custom_data
				if(webhookData.webhookDetails.custom_data) {
					_.each(webhookData.webhookDetails.custom_data, function(val, key) {
						var customDataTemplate = monster.template(self, 'webhooks-customDataRow', {
							key: key,
							value: val
						});

						template.find('.custom-data-container')
								.append(customDataTemplate);
					});
				}

				monster.ui.validate(template.find('#webhook_edition_form'), {
					rules: {
						'uri': {
							url: true
						}
					}
				});

				self.bindWebhookEditEvents(template, webhookData.webhookDetails);
				parent
					.find('.webhooks-container')
					.empty()
					.append(template);
			});
		},

		bindWebhookEditEvents: function(template, webhookData) {
			var self = this,
				webhookGroups = self.uiFlags.account.get('groups') || {};

			template.find('.select-group').on('change', function() {
				if($(this).val() === 'new') {
					template.find('.new-group-container').show();
				} else {
					template.find('.new-group-container').hide();
				}
			});

			template.find('.custom-data-link').on('click', function() {
				template.find('.custom-data-container')
						.append(monster.template(self, 'webhooks-customDataRow'));
			});

			template.find('.custom-data-container').on('click', '.delete-custom-data', function() {
				$(this).parent().remove();
			});

			//Displaying tooltips for each option. Currently not working on Chrome & IE
			// template.find('.select-hook').on('mouseover', function(e) {
			// 	var $e = $(e.target); 
			// 	if ($e.is('option')) {
			// 		template.find('.select-hook').popover('destroy');
			// 		template.find('.select-hook').popover({
			// 			trigger: 'manual',
			// 			placement: 'right',
			// 			title: $e.val(),
			// 			content: $e.data('tooltip-content')
			// 		}).popover('show');
			// 	}
			// });
			// template.find('.select-hook').on('mouseleave', function(e) {
			// 	template.find('.select-hook').popover('destroy');
			// });

			template.find('.action-bar .cancel').on('click', function() {
				self.render();
			});

			template.find('.action-bar .save').on('click', function() {
				if(monster.ui.valid(template.find('#webhook_edition_form'))) {
					self.getFormData(template, function(formData) {
						if(_.isEmpty(webhookData)) {
							self.addWebhook(formData, function(data) {
								if(formData.group) {
									webhookGroups[formData.group] = (webhookGroups[formData.group] || 0)+1;
									self.updateWebhookGroups(webhookGroups, function() {
										self.render({ webhookId: data.id });
									})
								} else {
									self.render({ webhookId: data.id });
								}
								toastr.success(monster.template(self, '!' + self.i18n.active().webhooks.toastr.addSuccess + data.name ));
							});
						} else {
							self.updateWebhook(webhookData.id, formData, function(data) {
								if(formData.group) {
									if(formData.group !== webhookData.group) {
										webhookGroups[formData.group] = (webhookGroups[formData.group] || 0)+1;
										webhookGroups[webhookData.group] = (webhookGroups[webhookData.group] || 0)-1;
										if(webhookGroups[webhookData.group] <= 0) {
											delete webhookGroups[webhookData.group];
										}
										self.updateWebhookGroups(webhookGroups, function() {
											self.render({ webhookId: data.id });
										})
									} else {
										self.render({ webhookId: data.id });
									}
								} if(webhookData.group) {
									webhookGroups[webhookData.group] = (webhookGroups[webhookData.group] || 0)-1;
									if(webhookGroups[webhookData.group] <= 0) {
										delete webhookGroups[webhookData.group];
									}
									self.updateWebhookGroups(webhookGroups, function() {
										self.render({ webhookId: data.id });
									})
								} else {
									self.render({ webhookId: data.id });
								}
								toastr.success(monster.template(self, '!' + self.i18n.active().webhooks.toastr.editSuccess + data.name ));
							});
						}
					});
				}
			});
		},

		renderAttemptsHistory: function(parent, webhookId, isError) {
			var self = this;
			
			monster.parallel({
				webhook: function(parallelCallback) {
					self.getWebhookDetails(webhookId, function(data) {
						parallelCallback && parallelCallback(null, data);
					});
				},
				attempts: function(parallelCallback) {
					self.getWebhookHistory(webhookId, function(data) {
						parallelCallback && parallelCallback(null, data);
					});
				}
			}, function(err, results) {
				var dataTemplate = self.formatAttemptsHistoryData(results, isError),
					attemptsTemplate = $(monster.template(self, 'webhooks-attempts', dataTemplate));

				self.bindAttemptsHistoryEvents(attemptsTemplate, results.webhook);
				parent
					.find('.webhooks-container')
					.empty()
					.append(attemptsTemplate);
			});
		},

		formatAttemptsHistoryData: function(data, isError) {
			var self = this,
				result = {
					name: data.webhook.name ? monster.template(self, '!' + self.i18n.active().webhooks.webhookAttempts.header, {webhookName:data.webhook.name}) : '',
					url: data.webhook.uri,
					isError: isError
				};

			result.attempts = _.map(data.attempts, function(attempt) {
				var dateTime = monster.util.toFriendlyDate(attempt.timestamp).split(' - ');
				return {
					date: dateTime[0],
					time: dateTime[1],
					sent: data.webhook.http_verb.toUpperCase(),
					received: attempt.reason,
					attempts: (parseInt(data.webhook.retries)-attempt.retries_left),
					error: (attempt.result === 'failure')
				};
			});

			return result;
		},

		bindAttemptsHistoryEvents: function(template, webhookData) {
			var self = this;

			template.find('.top-action-bar .back-button').on('click', function() {
				self.render();
			});

			template.find('.top-action-bar .enable-button').on('click', function() {
				self.enableWebhook(webhookData.id, function() {
					self.render();
				});
			});
		},

		getFormData: function(template, callback) {
			var self = this,
				customData = {},
				isValid = true,
				groupSelect = template.find('.select-group').val(),
				newGroup = template.find('.new-group').val();
				
			template.find('.custom-data-row').each(function(index){
				var cdName = $(this).find('.custom-data-key').val(),
					cdValue = $(this).find('.custom-data-value').val();
				
				if (customData.hasOwnProperty(cdName)) {
					isValid = false;
					return false;
				} else {
					customData[cdName] = cdValue;
				}
			});

			if(isValid) {
				var formData = monster.ui.getFormData('webhook_edition_form');
				formData.custom_data = customData;
				delete formData.extra;
				if(groupSelect === 'new') {
					formData.group = newGroup;
				} else if(groupSelect !== 'none') {
					formData.group = groupSelect.replace('group_', '');
				}
				callback && callback(formData);
			} else {
				monster.ui.alert('warning', self.i18n.active().webhooks.warning);
			}
		},

		//utils
		getWebhooks: function(callback){
			var self = this;
			
			self.callApi({
				resource: 'webhooks.list',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		getAvailableWebhooks: function(callback){
			var self = this;

			self.callApi({
				resource: 'webhooks.listAvailable',
				data: {},
				success: function(data) {
					callback(data.data);
				}
			});
		},
		
		getWebhookDetails: function(webhookId, callback){
			var self = this;
			
			self.callApi({
				resource: 'webhooks.get',
				data: {
					accountId: self.accountId,
					webhookId: webhookId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		getWebhookHistory: function(webhookId, callback){
			var self = this;
			
			self.callApi({
				resource: 'webhooks.listAttempts',
				data: {
					accountId: self.accountId,
					webhookId: webhookId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},
		
		addWebhook: function(data, callback){
			var self = this;
			
			self.callApi({
				resource: 'webhooks.create',
				data: {
					accountId: self.accountId,
					data: data
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},
		
		updateWebhook: function(webhookId, data, callback){
			var self = this;
			
			self.callApi({
				resource: 'webhooks.update',
				data: {
					accountId: self.accountId,
					webhookId: webhookId,
					data: data
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},
		
		deleteWebhook: function(webhookId, callback){
			var self = this;
			self.callApi({
				resource: 'webhooks.delete',
				data: {
					accountId: self.accountId,
					webhookId: webhookId,
					data: {}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},
		
		enableWebhook: function(webhookId, callback){
			var self = this;
			self.callApi({
				resource: 'webhooks.patch',
				data: {
					accountId: self.accountId,
					webhookId: webhookId,
					data: {
						enabled: true
					}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},
		
		//Note: only re-enable webhooks disabled by the server
		enableAllWebhooks: function(callback){
			var self = this;
			self.callApi({
				resource: 'webhooks.patchAll',
				data: {
					accountId: self.accountId,
					data: {
						"re-enable": true
					}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},
		
		updateWebhookGroups: function(webhookGroups, callback){
			var self = this,
				account = self.uiFlags.account.set('groups', webhookGroups);
			
			self.callApi({
				resource: 'account.update',
				data: {
					accountId: account.id,
					data: account
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		}
	};
	return app;
});
