define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		requests: {},

		subscribe: {
			'callflows.fetchActions': 'queuesDefineActions',
			'callflows.queues.edit': '_queuesEdit'
		},

		queuesRender: function(data, target, callbacks){
			var self = this;

			queues_html = $(monster.template(self, 'queues-edit', data)),
			queuesForm = queues_html.find('#queues-form');
			if(data.data)
				if(typeof data.data.id !== "string" || typeof monster.appsStore.callcenter.id !== "string")
					$('#callcenterlink', queues_html).hide();

			self.queuesRenderUserList(data, queues_html);

			monster.ui.validate(queuesForm, {
				rules: {
					'min_dtmf': { digits: true },
					'max_dtmf': { digits: true }
				}
			});

			$('*[rel=popover]:not([type="text"])', queues_html).popover({
				trigger: 'hover'
			});

			$('*[rel=popover][type="text"]', queues_html).popover({
				trigger: 'focus'
			});

			self.winkstartTabs(queues_html);

			$('.queues-save', queues_html).click(function(ev) {
				ev.preventDefault();

				if(monster.ui.valid(queuesForm)) {
					var form_data = monster.ui.getFormData('queues-form');
					self.queuesCleanFormData(form_data);

					var old_list = {},
						new_list = [];

					var i=0;
					$('.rows .row:not(#row_no_data)', queues_html).each(function() {
						new_list[i] = $(this).data('id');
						i++;
					});

					data.field_data.user_list = {
						old_list: data.field_data.old_list,
						new_list: new_list
					};

					self.queuesSave(form_data, data, callbacks.save_success);
				}
				else {
                                        toastr.error(self.i18n.active().callflows.queues.there_were_errors_on_the_form, '', {"timeOut": 10000});
				}
			});

			$('.queues-delete', queues_html).click(function(ev) {

				monster.ui.confirm(self.i18n.active().callflows.queues.are_you_sure_you_want_to_delete, function() {

					data.data.agents = [];
                                        self.agentsUpdate(data.data, function(_data, status) {
                                                    if(typeof success == 'function') {
                                                            success(_data, status, 'update');
                                                    }
                                            },
                                            function(_data, status) {
                                                    if(typeof error == 'function') {
                                                            error(_data, status, 'update');
                                                    }
                                            }
                                        );
                                        self.queuesDelete(data.data, callbacks.delete_success);
                                        toastr.success(monster.template(self, '!' + self.i18n.active().callflows.queues.deletedQueue, { queue: data.data.name }));
				});
			});

                        if(!$('#music_on_hold_media_id', queues_html).val()) {
                                $('#edit_link_media', queues_html).hide();
                        }

                        $('#music_on_hold_media_id', queues_html).change(function() {
                                !$('#music_on_hold_media_id option:selected', queues_html).val() ? $('#edit_link_media', queues_html).hide() : $('#edit_link_media', queues_html).show();
                        });
                        $('.moh_action_media', queues_html).click(function(ev) {
                                var _data = ($(this).data('action') == 'edit') ? { id: $('#music_on_hold_media_id', queues_html).val() } : {},
                                        _id = _data.id;
                                ev.preventDefault();
                                monster.pub('callflows.media.editPopup', {
                                        data: _data,
                                        callback: function(media) {
                                                /* Create */
                                                if(!_id) {
                                                        $('#music_on_hold_media_id', queues_html).append('<option id="'+ media.id  +'" value="'+ media.id +'">'+ media.name +'</option>')
                                                        $('#music_on_hold_media_id', queues_html).val(media.id);
                                                        $('#edit_link_media', queues_html).show();
                                                }
                                                else {
                                                        /* Update */
                                                        if(media.hasOwnProperty('id')) {
                                                                $('#music_on_hold_media_id #'+ media.id, queues_html).text(media.name);
                                                        }
                                                        /* Delete */
                                                        else {
                                                                $('#music_on_hold_media_id #'+_id, queues_html).remove();
                                                                $('#edit_link_media', queues_html).hide();
                                                        }
                                                }
                                        }
                                });
                        });

                        if(!$('#annouce_media_id', queues_html).val()) {
                                $('#announce_edit_link_media', queues_html).hide();
                        }

                        $('#announce_media_id', queues_html).change(function() {
                                !$('#announce_media_id option:selected', queues_html).val() ? $('#announce_link_media', queues_html).hide() : $('#announce_link_media', queues_html).show();
                        });

                        $('.announce_action_media', queues_html).click(function(ev) {
                                var _data = ($(this).data('action') == 'edit') ? { id: $('#announce_media_id', queues_html).val() } : {},
                                        _id = _data.id;
                                ev.preventDefault();
                                monster.pub('callflows.media.editPopup', {
                                        data: _data,
                                        callback: function(media) {
                                                /* Create */
                                                if(!_id) {
                                                        $('#announce_media_id', queues_html).append('<option id="'+ media.id  +'" value="'+ media.id +'">'+ media.name +'</option>')
                                                        $('#announce_media_id', queues_html).val(media.id);
                                                        $('#edit_link_media', queues_html).show();
                                                }
                                                else {
                                                        /* Update */
                                                        if(media.hasOwnProperty('id')) {
                                                                $('#announce_media_id #'+ media.id, queues_html).text(media.name);
                                                        }
                                                        /* Delete */
                                                        else {
                                                                $('#announce_media_id #'+_id, queues_html).remove();
                                                                $('#edit_link_media', queues_html).hide();
                                                        }
                                                }
                                        }
                                });
                        });

                        $('#select_user_id', queues_html).change(function() {
                                !$('#select_user_id', queues_html).val() ? $('#select_user_id', queues_html).queuesRender() : $('#select_user_id', queues_html).show();
                        });

			$('.add_user_div', queues_html).click(function() {
				var $user = $('#select_user_id', queues_html);
				var $callflow = $('#callflow_id', queues_html);

				if($user.val() != 'empty_option_user' && $callflow.val() != 'empty_option_callflow') {
					var user_id = $user.val(),
						user_data = {
							user_id: user_id,
							user_name: $('#option_user_'+user_id, queues_html).text(),
							callflow_id: $callflow.val(),
							field_data: {
								callflows: data.field_data.callflows
							},
							_t: function(param){
								return window.translate['queues'][param];
							}
						};

					if($('#row_no_data', queues_html).size() > 0) {
						$('#row_no_data', queues_html).remove();
					}

					$('.rows', queues_html).prepend(monster.template(self, 'queues-userRow', user_data));
					$('#option_user_'+user_id, queues_html).hide();

					$user.val('empty_option_user');
					$callflow.val('empty_option_callflow');
				}
				else {
					toastr.error(self.i18n.active().callflows.queues.noDataSelected, '', {"timeOut": 10000});
				}
			});

			$(queues_html).delegate('.action_user.delete', 'click', function() {
				var user_id = $(this).data('id');
				//removes it from the grid
				$('#row_user_'+user_id, queues_html).remove();
				//re-add it to the dropdown
				$('#option_user_'+user_id, queues_html).show();
				//if grid empty, add no data line
				if($('.rows .row', queues_html).size() == 0) {
					$('.rows', queues_html).append(monster.template(self, 'queues-userRow'));
				}
			});

			(target)
				.empty()
				.append(queues_html);
		},

		queuesRenderUserList: function(data, parent) {
			var self = this;
			if(data.data.id) {
				if('agents' in data.data && data.data.agents.length > 0) {
					var user_item;
					$.each(data.field_data.users, function(k, v) {
						if(v.id in data.field_data.old_list) {
							user_item = {
								user_id: v.id,
								user_name: v.first_name + ' ' + v.last_name
							};
							$('.rows', parent).append(monster.template(self, 'queues-userRow', user_item));
							$('#option_user_'+v.id, parent).hide();
						}
					});
				}
				else {
					$('.rows', parent).empty()
									  .append(monster.template(self, 'queues-userRow'));
				}
			}
			else {
				$('.rows', parent).empty()
								  .append(monster.template(self,'queues-userRow'));
			}
		},

		// Added for the subscribed event to avoid refactoring queuesEdit
		_queuesEdit: function(args) {
			var self = this;
			self.queuesEdit(args.data, args.parent, args.target, args.callbacks, args.data_defaults);
		},

                queuesEdit: function(data, _parent, _target, _callbacks, data_defaults){
                    var self = this,
                    parent = _parent || $('#queue-content'),
                    target = _target || $('#queue-view', parent),
                    _callbacks = _callbacks || {},
                    callbacks = {
                        save_success: _callbacks.save_success || function(_data) {
                            self.render_list(parent);
                            self.edit_queue({ id: _data.data.id }, parent, target, callbacks);
                        },
                        save_error: _callbacks.save_error,
                        delete_success: _callbacks.delete_success || function() {
                            target.empty();
                            self.render_list(parent);
                        },
                        delete_error: _callbacks.delete_error,
                        after_render: _callbacks.after_render
                    },
                    defaults = {
                        data: $.extend(true, {
                            connection_timeout: 0,
                            member_timeout: 5,
                            agent_wrapup_time: 30,
                            record_caller: true,
                            moh: '',
                            announce: '',
                            notifications: {},
                            max_queue_size: 0,
                            max_priority: 99,
                            caller_exit_key: '#',
                            ring_simultaneously: 2,
                            agent_ring_timeout: 15,
                            announcements_timer: 5,
                        }, data_defaults || {}),
                        field_data: {
                            /*sort_by: {
                                'first_name': 'First Name',
                                'last_name': 'Last Name'
                            }*/
                        }
                    };
			monster.parallel({
                                        media_list: function(callback) {
                                                self.callApi({
                                                        resource: 'media.list',
                                                        data: {
                                                                accountId: self.accountId
                                                        },
                                                        success: function(_data, status) {
                                                                if(_data.data) {
                                                                        _data.data.unshift(
                                                                                {
                                                                                        id: '',
                                                                                        name: self.i18n.active().callflows.user.silence
                                                                                }
                                                                        );
                                                                }
                                                                defaults.field_data.media = _data.data;
                                                                callback(null, _data);
                                                        }
                                                });
                                        },
					user_list: function(callback) {
						self.callApi({
							resource: 'user.list',
							data: {
								accountId: self.accountId
							},
							success: function(users) {
								users.data.sort(function(a,b) {
									var aName = (a.first_name + ' ' + a.last_name).toLowerCase(),
										bName = (b.first_name + ' ' + b.last_name).toLowerCase();
									return aName > bName;
								});
								defaults.field_data.users = users.data;
								callback(null, users);
							}
						});
					},
					queues_get: function(callback) {
						if(typeof data === 'object' && data.id) {
							self.queuesGet(data.id, function(queues, status) {
									defaults.field_data.old_list = Array();
									if('agents' in queues) {
										$.each(queues.agents, function(k, v) {
											defaults.field_data.old_list[v] = v;
										});
									}
									callback(null, queues);
								}
							);
						}
						else {
							callback(null, {});
						}
					}
				},
				function(err, results) {
					var render_data = defaults;
					if(typeof data === 'object' && data.id) {
						render_data = $.extend(true, defaults, { data: results.queues_get });
					}
					self.queuesRender(render_data, target, callbacks);
					if(typeof callbacks.after_render == 'function') {
						callbacks.after_render();
					}
				}
			);
		},

		queuesPopupEdit: function(args) {
			var self = this,
				popup, 
				popup_html,
				data = args.data,
				callback = args.callback,
				data_defaults = args.data_defaults;

			popup_html = $('<div class="inline_popup callflows-port"><div class="inline_content main_content"/></div>');

			self.queuesEdit(data, popup_html, $('.inline_content', popup_html), {
				save_success: function(_data) {
					popup.dialog('close');

					if(typeof callback == 'function') {
						callback(_data);
					}
				},
				delete_success: function() {
					popup.dialog('close');

					if(typeof callback == 'function') {
						callback({ data: {} });
					}
				},
				after_render: function() {
					popup = monster.ui.dialog(popup_html, {
						title: (data.id) ? self.i18n.active().callflows.queues.edit_queues : self.i18n.active().callflows.queues.create_queues
					});
				}
			}, data_defaults);
		},

		queuesCleanFormData: function(form_data) {
			if(!(form_data.max_dtmf > 0)) {
				delete form_data.max_dtmf;
			}

			delete form_data.user_callflow_id;
			delete form_data.user_id;
			delete form_data.callflow_id;
		},

		queuesSave: function(form_data, data, success) {
			var self = this;
			form_data.agents = data.field_data.user_list.new_list;
			form_data.id = data.data.id;
			delete form_data.select_user_id;

                        if(typeof data.data == 'object' && data.data.id) {
                                self.queuesUpdate(form_data, function(_data, status) {
                                                if(typeof success == 'function') {
                                                        success(_data, status, 'update');
                                                }
                                        },
                                        function(_data, status) {
                                                if(typeof error == 'function') {
                                                        error(_data, status, 'update');
                                                }
                                        }
                                );
                                self.agentsUpdate(form_data, function(_data, status) {
                                                if(typeof success == 'function') {
                                                        success(_data, status, 'update');
                                                }
                                        },
                                        function(_data, status) {
                                                if(typeof error == 'function') {
                                                        error(_data, status, 'update');
                                                }
                                        }
                                );
                        }
                        else {
                                self.queuesCreate(form_data, function(_data, status) {
                                                if(typeof success == 'function') {
                                                    success(_data, status, 'create');
                                                    form_data.id = _data.id;
                                                    self.agentsUpdate(form_data, function(_data, status) {
                                                        if(typeof success == 'function') {
                                                            success(_data, status, 'update');
                                                        }
                                                    });
                                                }
                                        }
                                );
                        }
		},

		queuesDefineActions: function(args) {
			var self = this,
				callflow_nodes = args.actions;

			$.extend(callflow_nodes, {
				'acdc_member[id=*]': {
					name: self.i18n.active().callflows.queues.queues,
					icon: 'queue',
					category: self.i18n.active().callflows.queues.call_center_category,
					module: 'acdc_member',
					tip: self.i18n.active().callflows.queues.queue_tip,
					data: {
						id: 'null'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 160,
					caption: function(node, caption_map) {
						var id = node.getMetadata('id'),
							returned_value = '';

						if(id in caption_map) {
							returned_value = caption_map[id].name;
						}

						return returned_value;
					},
					edit: function(node, callback) {
						var _this = this;

						self.queuesList(function(directories) {
							var popup, popup_html;

							popup_html = $(monster.template(self, 'queues-callflowEdit', {
								items: monster.util.sort(directories),
								selected: node.getMetadata('id') || ''
							}));

							if($('#queues_selector option:selected', popup_html).val() == undefined) {
								$('#edit_link', popup_html).hide();
							}

							$('.inline_action', popup_html).click(function(ev) {
								var _data = ($(this).data('action') == 'edit') ?
								{ id: $('#queues_selector', popup_html).val() } : {};
								ev.preventDefault();
								self.queuesPopupEdit({
									data: _data,
									callback: function(_data) {
									    if(typeof _data.data == "object") {
										node.setMetadata('id', _data.data.id || 'null');
										node.caption = _data.data.name || '';
										popup.dialog('close');
									    }
									}
								});
							});

							$('#add', popup_html).click(function() {
								node.setMetadata('id', $('#queues_selector', popup).val());
								node.caption = $('#queues_selector option:selected', popup).text();
								popup.dialog('close');
							});

							popup = monster.ui.dialog(popup_html, {
								title: self.i18n.active().callflows.queues.queues_title,
								beforeClose: function() {
									if(typeof callback == 'function') {
										callback();
									}
								}
							});

							if(typeof callback == 'function') {
								callback();
							}

						});
					},
					listEntities: function(callback) {
						self.callApi({
							resource: 'queues.queues_list',
							data: {
								accountId: self.accountId,
								filters: { paginate:false }
							},
							success: function(data, status) {
								callback && callback(data.data);
							}
						});
					},
					editEntity: 'callflows.queues.edit'
				},

				'acdc_queue[id=*,action=login]': {
					name: self.i18n.active().callflows.queues.queue_login,
					icon: 'queue',
					category: self.i18n.active().callflows.queues.call_center_category,
					module: 'acdc_queue',
					tip: self.i18n.active().callflows.queues.queue_login_tip,
					data: {
						id: 'null'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 160,
					caption: function(node, caption_map) {
						var id = node.getMetadata('id'),
							returned_value = '';

						if(id in caption_map) {
							returned_value = caption_map[id].name;
						}

						return returned_value;
					},
					edit: function(node, callback) {
						var _this = this;

						self.queuesList(function(directories) {
							var popup, popup_html;

							popup_html = $(monster.template(self, 'queues-callflowEdit', {
								items: monster.util.sort(directories),
								selected: node.getMetadata('id') || ''
							}));

							if($('#queues_selector option:selected', popup_html).val() == undefined) {
								$('#edit_link', popup_html).hide();
							}

							$('.inline_action', popup_html).click(function(ev) {
								var _data = ($(this).data('action') == 'edit') ?
								{ id: $('#queues_selector', popup_html).val() } : {};
								ev.preventDefault();
								self.queuesPopupEdit({
									data: _data,
									callback: function(_data) {
									    if(typeof _data.data == "object") {
										node.setMetadata('id', _data.data.id || 'null');
										node.caption = _data.data.name || '';
										popup.dialog('close');
									    }
									}
								});
							});

							$('#add', popup_html).click(function() {
									node.setMetadata('id', $('#queues_selector', popup).val());
									node.caption = $('#queues_selector option:selected', popup).text();
									popup.dialog('close');
							});

							popup = monster.ui.dialog(popup_html, {
								title: self.i18n.active().callflows.queues.queue_login,
								beforeClose: function() {
									if(typeof callback == 'function') {
										callback();
									}
								}
							});

							if(typeof callback == 'function') {
								callback();
							}

						});
					}
				},

				'acdc_queue[id=*,action=logout]': {
					name: self.i18n.active().callflows.queues.queue_logout,
					icon: 'queue',
					category: self.i18n.active().callflows.queues.call_center_category,
					module: 'acdc_queue',
					tip: self.i18n.active().callflows.queues.queue_logout_tip,
					data: {
						id: 'null'
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 160,
					caption: function(node, caption_map) {
						var id = node.getMetadata('id'),
							returned_value = '';

						if(id in caption_map) {
							returned_value = caption_map[id].name;
						}

						return returned_value;
					},
					edit: function(node, callback) {
						var _this = this;

						self.queuesList(function(directories) {
							var popup, popup_html;

							popup_html = $(monster.template(self, 'queues-callflowEdit', {
								items: monster.util.sort(directories),
								selected: node.getMetadata('id') || ''
							}));

							if($('#queues_selector option:selected', popup_html).val() == undefined) {
								$('#edit_link', popup_html).hide();
							}

							$('.inline_action', popup_html).click(function(ev) {
								var _data = ($(this).data('action') == 'edit') ?
								{ id: $('#queues_selector', popup_html).val() } : {};

								ev.preventDefault();

								self.queuesPopupEdit({
									data: _data,
									callback: function(_data) {
										node.setMetadata('id', _data.data.id || 'null');
										node.caption = _data.data.name || '';
										popup.dialog('close');
									}
								});
							});

							$('#add', popup_html).click(function() {
								node.setMetadata('id', $('#queues_selector', popup).val());
								node.caption = $('#queues_selector option:selected', popup).text();
								popup.dialog('close');
							});

							popup = monster.ui.dialog(popup_html, {
								title: self.i18n.active().callflows.queues.queue_logout,
								beforeClose: function() {
									if(typeof callback == 'function') {
										callback();
									}
								}
							});

							if(typeof callback == 'function') {
								callback();
							}

						});
					}
				},

				'acdc_agent[action=pause]': {
					name: self.i18n.active().callflows.queues.agent_pause,
					icon: 'rightarrow',
					category: self.i18n.active().callflows.queues.call_center_category,
					module: 'acdc_agent',
					tip: self.i18n.active().callflows.queues.agent_pause_tip,
                                        data: {
                                                action: 'pause',
                                                timeout: '900',
                                                presence_id: ''
                                        },
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 160,
                                        caption: function(node, caption_map) {
                                            var id = node.getMetadata('timeout');
                                                return (id) + ' ' + self.i18n.active().callflows.queues.seconds;
                                        },

                                        edit: function(node, callback) {
                                                var popup, popup_html;

                                                popup_html = $(monster.template(self, 'agent_pause_callflow', {
                                                    'timeout': node.getMetadata('timeout') || '900',
                                                    'presence_id': node.getMetadata('presence_id')
                                                }));

                                                $('#add', popup_html).click(function() {
                                                        var timeout = parseInt($('#timeout', popup_html).val()),
                                                        presence_id = $('#presence_id', popup_html).val();

                                                        if(timeout > 0) {
                                                            node.setMetadata('timeout', timeout);
                                                            node.setMetadata('presence_id', presence_id);
                                                            node.caption = timeout + ' ' + self.i18n.active().callflows.queues.seconds;
                                                            popup.dialog('close');
                                                        }
                                                        else {
                                                            toastr.error(self.i18n.active().callflows.queues.please_enter_a_valid_number_of_seconds, '', {"timeOut": 10000});
                                                        }

                                                });

                                                popup = monster.ui.dialog(popup_html, {
                                                        title: self.i18n.active().callflows.queues.pause_agent_title,
                                                        minHeight: '0',
                                                        beforeClose: function() {
                                                                if(typeof callback == 'function') {
                                                                         callback();
                                                                }
                                                        }
                                                });

                                                if(typeof callback == 'function') {
                                                    callback();
                                                }
					}
				},

				'acdc_agent[action=resume]': {
					name: self.i18n.active().callflows.queues.agent_resume,
					icon: 'user',
					category: self.i18n.active().callflows.queues.call_center_category,
					module: 'acdc_agent',
					tip: self.i18n.active().callflows.queues.agent_resume_tip,
					data: {
						action: 'resume',
						presence_id: ''
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 160,
                                        caption: function(node, caption_map) {
                                            var id = node.getMetadata('presence_id');
                                                return (id);
                                        },
					edit: function(node, callback) {
						var _this = this;

						var popup, popup_html;

                                                popup_html = $(monster.template(self, 'agent_presence_callflow', {
                                                    'presence_id': node.getMetadata('presence_id')
                                                }));

                                                $('#add', popup_html).click(function() {
                                                        presence_id = $('#presence_id', popup_html).val();
                                                        node.setMetadata('presence_id', presence_id);
                                                        node.caption = presence_id;
                                                        popup.dialog('close');
                                                });


						$('.inline_action', popup_html).click(function(ev) {
							var _data = ($(this).data('action') == 'edit') ?
							{ id: $('#queues_selector', popup_html).val() } : {};
							ev.preventDefault();
							self.queuesPopupEdit({
								data: _data,
								callback: function(_data) {
									node.setMetadata('id', _data.data.id || 'null');
									node.caption = _data.data.name || '';
									popup.dialog('close');
								}
							});
						});

						popup = monster.ui.dialog(popup_html, {
							title: self.i18n.active().callflows.queues.presence_id,
							beforeClose: function() {
								if(typeof callback == 'function') {
									callback();
								}
							}
						});

						if(typeof callback == 'function') {
							callback();
						}
					}
				},

				'acdc_agent[action=login]': {
					name: self.i18n.active().callflows.queues.login_agent_title,
					icon: 'user',
					category: self.i18n.active().callflows.queues.call_center_category,
					module: 'acdc_agent',
					tip: self.i18n.active().callflows.queues.login_agent_tip,
					data: {
						action: 'login',
						presence_id: ''
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 160,
                                        caption: function(node, caption_map) {
                                            var id = node.getMetadata('presence_id');
                                                return (id);
                                        },
					edit: function(node, callback) {
						var _this = this;

						var popup, popup_html;

                                                popup_html = $(monster.template(self, 'agent_presence_callflow', {
                                                    presence_id: node.getMetadata('presence_id')
                                                }));

                                                $('#add', popup_html).click(function() {
                                                        presence_id = $('#presence_id', popup_html).val();
                                                        node.setMetadata('presence_id', presence_id);
                                                        node.caption = presence_id;
                                                        popup.dialog('close');
                                                });

						popup = monster.ui.dialog(popup_html, {
							title: self.i18n.active().callflows.queues.presence_id,
							beforeClose: function() {
								if(typeof callback == 'function') {
									callback();
								}
							}
						});

						if(typeof callback == 'function') {
							callback();
						}
					}
				},

				'acdc_agent[action=logout]': {
					name: self.i18n.active().callflows.queues.logout_agent_title,
					icon: 'user',
					category: self.i18n.active().callflows.queues.call_center_category,
					module: 'acdc_agent',
					tip: self.i18n.active().callflows.queues.logout_agent_tip,
					data: {
						action: 'logout',
						presence_id: ''
					},
					rules: [
						{
							type: 'quantity',
							maxSize: '1'
						}
					],
					isUsable: 'true',
					weight: 160,
                                        caption: function(node, caption_map) {
                                            var id = node.getMetadata('presence_id');
                                                return (id);
                                        },
					edit: function(node, callback) {
						var _this = this;

						var popup, popup_html;

                                                popup_html = $(monster.template(self, 'agent_presence_callflow', {
                                                    presence_id: node.getMetadata('presence_id')
                                                }));

                                                $('#add', popup_html).click(function() {
                                                        presence_id = $('#presence_id', popup_html).val();
                                                        node.setMetadata('presence_id', presence_id);
                                                        node.caption = presence_id;
                                                        popup.dialog('close');
                                                });

						popup = monster.ui.dialog(popup_html, {
							title: self.i18n.active().callflows.queues.presence_id,
							beforeClose: function() {
								if(typeof callback == 'function') {
									callback();
								}
							}
						});

						if(typeof callback == 'function') {
							callback();
						}
					}
				}
			});
		},

		queuesList: function(callback) {
			var self = this;

			self.callApi({
				resource: 'queues.queues_list',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		queuesGet: function(queuesId, callback) {
			var self = this;

			self.callApi({
				resource: 'queues.queues_get',
				data: {
					accountId: self.accountId,
					queuesId: queuesId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		queuesCreate: function(data, callback) {
			var self = this;

			self.callApi({
				resource: 'queues.queues_create',
				data: {
					accountId: self.accountId,
					data: data
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		queuesUpdate: function(data, callback) {
			var self = this;

			self.callApi({
				resource: 'queues.queues_update',
				data: {
					accountId: self.accountId,
					queuesId: data.id,
					data: data
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		agentsUpdate: function(data, callback) {
			var self = this;

			self.callApi({
				resource: 'agents.agents_update',
				data: {
					accountId: self.accountId,
					queuesId: data.id,
					data: data.agents
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		queuesDelete: function(queues, callback) {
			var self = this;

			self.callApi({
				resource: 'queues.queues_delete',
				data: {
					accountId: self.accountId,
					queuesId: queues.id,
					data: {}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		}
	};

	return app;
});
