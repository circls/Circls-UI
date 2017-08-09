define(function(require){
	var $ = require('jquery')
		,_ = require('underscore')
		,monster = require('monster')
		,toastr = require('toastr')
		,chart = require('chart')
;

	var app = {
		name: 'callcenter',

		css: [ 'app', 'icons' ],

		i18n: {
			'en-US': { customCss: false },
                        'de-DE': { customCss: false },
                        'dk-DK': { customCss: false },
                        'it-IT': { customCss: false },
                        'fr-FR': { customCss: false },
                        'nl-NL': { customCss: false },
                        'ro-RO': { customCss: false },
                        'ru-RU': { customCss: false },
                        'zh-CN': { customCss: false },
                        'pt-PT': { customCss: false },
                        'es-ES': { customCss: false }
		},

		chartColors: [
			"#B588B9", // Purple ~ Mauve
			"#698BF7", // Purple ~ Dark Blue
			"#009AD6", // Blue
			"#6CC5E9", // Light Blue
			"#719B11", // Dark Green
			"#BDE55F", // Light Green
			"#F1E87C", // Pale Yellow
			"#EF8F25", // Orange
			"#6F7C7D"  // Grey
		],

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		global_timer: false,
		current_queue_id: undefined,
		hide_logout: false,
		map_timers: {
			calls_waiting: {},
			calls_in_progress: {}
		},

		initApp: function(callback) {
			var self = this;

			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

                render_global_data: function(param_data, id, _container) {
                        var self = this;
                            self.accountId = monster.apps.auth.accountId;
                            data = $.extend({}, param_data, {
                            show_queues: self.show_queues, hide_logout: self.hide_logout
                        }),

			queues_html = $(monster.template(self, 'queues_dashboard', { queues: data.queues })),
			agents_html = $(monster.template(self, 'agents_dashboard', { agents: data.agents })),
                        calls_html = $(monster.template(self, 'calls_dashboard', {waits: data.calls_waiting, progress: data.calls_in_progress} ));

			container = _container || $('#monster-content');

                        scroll_value = $('.topbar-right .list_queues_inner', container).scrollLeft() || 0;
                        container.find('#dashboard-view').empty().append(agents_html);
                        container.find('.topbar-right').empty().append(queues_html);
                        container.find('.topbar-right .list_queues_inner').animate({ scrollLeft: scroll_value }, 0);
                        container.find('#callwaiting-list').empty().append(calls_html);

                        self.bind_live_events(container);
                        self.render_timers(data);
                        $('.agent_wrapper.ready').click(function(e) {
                            self.logout(this);
                        });

                        $('.agent_wrapper.logged_out').click(function(e) {
                            self.login(this);
                        });

			if(id) {
				self.detail_stat(id, container);
			}
		},

                render_chart_data: function(param_data, id, _container) {
                        var self = this;

			chartOptions = {
				animateScale: true,
				segmentShowStroke: false,
				// segmentStrokeWidth: 1,
				animationSteps: 50,
				animationEasing: "easeOutCirc",
				percentageInnerCutout: 60
			},

			devicesChart = new Chart(template.find('#dashboard_devices_chart').get(0).getContext("2d")).Doughnut(
				myOfficeData.devicesData.totalCount > 0 ?
				$.map(myOfficeData.devicesData, function(val) {
					return typeof val === 'object' ? {
						value: val.count,
						color: val.color
					} : null;
				}).sort(function(a, b) { return b.value - a.value ; }) :
				[{ value:1, color:"#DDD" }],
				chartOptions
			)
		},

		myOfficeFormatData: function(data) {
			var self = this,
				devices = {
					"sip_device": {
						label: self.i18n.active().devices.types.sip_device,
						count: 0,
						color: self.chartColors[5]
					},
					"cellphone": {
						label: self.i18n.active().devices.types.cellphone,
						count: 0,
						color: self.chartColors[3]
					},
					"sip_uri": {
						label: self.i18n.active().devices.types.sip_uri,
						count: 0,
						color: self.chartColors[4]
					},
					totalCount: 0
				},
				totalConferences = 0,
				channelsArray = [],
				classifierRegexes = {},
				classifiedNumbers = {};

			_.each(data.numbers, function(numData, num) {
				_.find(data.classifiers, function(classifier, classifierKey) {
					if(!(classifierKey in classifierRegexes)) {
						classifierRegexes[classifierKey] = new RegExp(classifier.regex);
					}
					if(classifierRegexes[classifierKey].test(num)) {
						if(classifierKey in classifiedNumbers) {
							classifiedNumbers[classifierKey] ++;
						} else {
							classifiedNumbers[classifierKey] = 1;
						}
						return true;
					} else {
						return false;
					}
				});
			});
		},

                // API Calls
                queue_eavesdrop: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'queues.queue_eavesdrop',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(queue_eavesdrop) {
                                        callback(queue_eavesdrop.data);
                                },
                                generateError: false
                        });
                },
                listDevices: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'device.list',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(devices) {
                                        callback(devices.data);
                                },
                                generateError: false
                        });
                },

                poll_agents: function(global_data, _container) {
                    var self = this,
                        container = _container,
                        polling_interval = 6,
                        map_agents = {},
                        cpt = 0,
                        current_queue,
                        current_global_data = global_data,
                        stop_light_polling = false,
                        poll = function() {
                            var data_template = $.extend(true, {}, {agents: current_global_data.agents, queues: current_global_data.queues}); //copy without reference;
                                    if(stop_light_polling === false) {
                                            monster.parallel(
                                                {
                                                    queues_livestats: function(callback) {
                                                        self.get_queues_livestats(function(_data_live_queues) {
                                                            callback(null, _data_live_queues);
                                                        });
                                                    },
                                                    agents_livestats: function(callback) {
                                                        self.get_agents_livestats(function(_data_live_agents) {
                                                            callback(null, _data_live_agents);
                                                        });
                                                    },
                                                    agents_status: function(callback) {
                                                        self.get_agents_status(function(_data_live_status) {
                                                            	callback(null, _data_live_status);
                                                        	},
                                                        	function(_data_live_status) {
                                                        		callback(null, {});
                                                        	}
                                                        );
                                                    },
                                                },
                                                function(err, results) {
                                                    data_template = self.format_live_data(data_template,{
                                                            agents_live_stats: results.agents_livestats,
                                                            queues_live_stats: results.queues_livestats,
                                                            agents_live_status: results.agents_status
                                                    });
                                        self.render_global_data(data_template, self.current_queue_id);
                                    }
                                );
                            }
                        },
                        huge_poll = function() {
                            if($('#dashboard-content').size() === 0) {
                                self.clean_timers();
                            }
                            else {
                                if(++cpt % 30 === 0) {
                                    self.fetch_all_data(function(data) {
                                        self.render_global_data(data, self.current_queue_id);
                                        current_global_data = data;
                                            });
                                        }
                                        else {
                                    poll();
                                }
                            }
                        };

                            $.each(global_data.agents, function(k, v) {
                        map_agents[v.id] = 'logged_out';
                    });

                    self.global_timer = setInterval(huge_poll, polling_interval * 1000);
                },

                get_queues_livestats: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'queues.queues_livestats',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(queue_livestats) {
                                        callback(queue_livestats.data);
                                },
                                generateError: false
                        });
                },

                get_agents_status: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'agents.agents_status',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(agents_status) {
                                        callback(agents_status.data);
                                },
                                generateError: false
                        });
                },

                get_agents_livestats: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'agents.agents_livestats',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(agents_livestats) {
                                        callback(agents_livestats.data);
                                },
                                generateError: false
                        });
                },

                get_agents_stats: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'agents.agents_status',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(agents_status) {
                                        callback(agents_status.data);
                                },
                                generateError: false
                        });
                },

                get_queues_stats: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'queues.queues_stats',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(queues_stats) {
                                        callback(queues_stats.data);
                                },
                                generateError: false
                        });
                },

                get_queues: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'queues.queues_list',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(data) {
                                        callback && callback(data.data);
                                },
                                generateError: false
                        });
                },

                get_agents: function(callback) {
                        var self = this;

                        self.callApi({
                                resource: 'agents.agents_list',
                                data: {
                                        accountId: self.accountId
                                },
                                success: function(agents) {
                                        callback(agents.data);
                                },
                                generateError: false
                        });
                },

                render_callwaiting_list: function(_container){
                    var self = this,
                    container = _container || $('#dashboard-content');

                    $('#callwaiting-list', container).empty().listpanel({
                        label: 'Call Waiting',
                        identifier: 'callwaiting-listview',
                        data: []
                    });
                    $('.add_flow', container).empty().html('call_waiting_log');
                },

                get_time_seconds: function(seconds) {
                    var seconds = Math.floor(seconds),
                        hours = Math.floor(seconds / 3600),
                        minutes = Math.floor(seconds / 60) % 60,
                        remaining_seconds = seconds % 60,
                        display_time = (hours < 10 ? '0' + hours : '' + hours) + ':' + (minutes < 10 ? '0' + minutes : '' + minutes) + ':' + (remaining_seconds < 10 ? '0' + remaining_seconds : '' + remaining_seconds);

                    return seconds >= 0 ? display_time : '00:00:00';
                },

                start_timer: function(type, _data, _timer_type) {
                    var self = this,
                        $target,
                        id = _data.id,
                        data = _data.data,
                        timer_type = _timer_type || 'increment';

                    if(type === 'in_progress' || type === 'agent_status') {
                        $target = $('.agent_wrapper#'+id+' .call_time .data_value');
                    }
                    else if(type === 'waiting') {
                        $target = $('.call-waiting[data-call_id="'+id+'"] .timer');
                    }

                    if(!self.map_timers[type]) {
                        self.map_timers[type] = {};
                    }

                    self.map_timers[type][id] = data;

                    self.map_timers[type][id].timer = setInterval(function(){
                        if($target.size() > 0) {
                            if(timer_type === 'decrement') {
                                var new_duration = --self.map_timers[type][id].duration;
                                $target.html(self.get_time_seconds(new_duration > 0 ? new_duration : 0));
                            }
                            else {
                                $target.html(self.get_time_seconds(++self.map_timers[type][id].duration));
                            }
                        }
                        else {
                            clearInterval(self.map_timers[type][id].timer);
                            delete self.map_timers[type][id];
                        }
                    }, 1000);
                },

                render_timers: function(data) {
                    var self = this;

                    $.each(self.map_timers, function(type, list_timers) {
                        $.each(list_timers, function(k, v) {
                            clearInterval(v.timer);
                        });
                    });

                    self.map_timers = {
                        waiting: {},
                        in_progress: {}
                    };

                    if(data.calls_waiting) {
                        $.each(data.calls_waiting, function(k, v) {
                            v.duration = data.current_timestamp - v.entered_timestamp;
                            self.start_timer('waiting', {data: v, id: k});
                        });
                    }

                    if(data.calls_in_progress) {
                        $.each(data.calls_in_progress, function(k, v) {
                            v.duration = data.current_timestamp - v.handled_timestamp;
                            self.start_timer('in_progress', {data: v, id: v.agent_id});
                        });
                    }

                    if(data.agent_status) {
                        if('busy' in data.agent_status) {
                            $.each(data.agent_status.busy, function(agent_id, data_status) {
                            data_status.duration = data.current_timestamp - data_status.timestamp;
                            self.start_timer('agent_status', {data: data_status, id: agent_id});
                        });
                    }

                    if('wrapup' in data.agent_status) {
                        $.each(data.agent_status.wrapup, function(agent_id, data_status) {
                            data_status.duration = data_status.wait_time - (data.current_timestamp - data_status.timestamp);
                            self.start_timer('agent_status', {data: data_status, id: agent_id}, 'decrement');
                        });
                    }

                    if('paused' in data.agent_status) {
                        $.each(data.agent_status.paused, function(agent_id, data_status) {
                            if('pause_time' in data_status) {
                            	data_status.duration = data_status.pause_time - (data.current_timestamp - data_status.timestamp);
                            	self.start_timer('agent_status', {data: data_status, id: agent_id}, 'decrement');
                            }
                           	else {
                            	data_status.duration = data.current_timestamp - data_status.timestamp;
                            	self.start_timer('agent_status', {data: data_status, id: agent_id});
                            }
                        });
                    }
                }
            },

            format_live_data: function(formatted_data, data) {
                var self = this,

                current_agents_by_queue = {};
                formatted_data.current_timestamp = data.queues_live_stats.current_timestamp;
                formatted_data.calls_waiting = {};
                formatted_data.calls_in_progress = {};
                formatted_data.agent_status = {
                    busy: {},
                    wrapup: {},
                    paused: {}
                };

                //Reinitializing previous data;
                $.each(formatted_data.queues, function(k, queue) {
                    queue.abandoned_calls = 0;
                    queue.average_hold_time = self.get_time_seconds(0);
                    queue.current_calls = 0;
                    queue.total_calls = 0;
                    queue.total_wait_time = 0;
                });

		if(data.agents_live_status) {
            	$.each(data.agents_live_status, function(k, agent_status) {
                	if(k in formatted_data.agents) {
                    	if(agent_status.status === 'outbound') {
                        	agent_status.status = 'busy';
                    	}

                    	if(agent_status.status === 'connected') {
                        	agent_status.status = 'handling';
                    	}

                    	var current_status = agent_status.status;

                    	formatted_data.agents[k].status = current_status;
                    	formatted_data.agents[k].status_started = agent_status.timestamp;

                    	if($.inArray(current_status, ['busy', 'wrapup', 'paused']) >= 0) {
                        	formatted_data.agent_status[current_status][k] = agent_status;

                        	if(current_status === 'busy') {
                            	formatted_data.agents[k].call_time = self.get_time_seconds(formatted_data.current_timestamp - agent_status.timestamp)
                        	}
                        	else if(current_status === 'paused') {
                        		if('pause_time' in agent_status) {
                            		formatted_data.agents[k].call_time = self.get_time_seconds(agent_status.pause_time - (formatted_data.current_timestamp - agent_status.timestamp))
                        		}
                        		else {
                            		formatted_data.agents[k].call_time = self.get_time_seconds(formatted_data.current_timestamp - agent_status.timestamp)
                            	}
                        	}
                        	else {
                            	formatted_data.agents[k].call_time = self.get_time_seconds(agent_status.wait_time  - (formatted_data.current_timestamp - agent_status.timestamp));
                        	}
                    	}
                    	else if(current_status === 'connecting') {
				formatted_data.agents[k].current_call = { friendly_title: agent_status.caller_id_name || agent_status.caller_id_number || agent_status.call_id };
                    	}

                    	if(current_status !== 'logged_out') {
                        	$.each(formatted_data.agents[k].queues_list, function(queue_id, queue_data) {
                            	if(!(queue_id in current_agents_by_queue)) {
                                	current_agents_by_queue[queue_id] = 1;
                            	}
                            	else {
                                	current_agents_by_queue[queue_id]++;
                            	}
                        	});
                    	}
                	}
            	});
            }

            $.each(current_agents_by_queue, function(queue_id, count) {
                if(queue_id in formatted_data.queues) {
                    formatted_data.queues[queue_id].current_agents = count || 0;
                }
            });

            $.each(data.agents_live_stats, function(k, agent_stats) {
                if(k in formatted_data.agents) {
                    formatted_data.agents[k].missed_calls = agent_stats.missed_calls || 0;
                    formatted_data.agents[k].total_calls = agent_stats.total_calls || 0;

                    if('queues' in agent_stats) {
                        $.each(agent_stats.queues, function(queue_id, queue_stat) {
                        	if(queue_id in formatted_data.agents[k].queues_list) {
                            	formatted_data.agents[k].queues_list[queue_id] = {
                                	id: queue_id || '',
                                	missed_calls: queue_stat.missed_calls || 0,
                                	total_calls: queue_stat.total_calls || 0
                            	};
                            }
                        });
                    }
                }
            });

            if('stats' in data.queues_live_stats) {
                $.each(data.queues_live_stats.stats, function(index, queue_stats) {
                    var k = queue_stats.queue_id,
                        call_id = queue_stats.call_id;

                    if(typeof formatted_data.queues[k] == "object") {
                        formatted_data.queues[k].current_calls = formatted_data.queues[k].current_calls || 0;

                    if('wait_time' in queue_stats && queue_stats.status !== 'abandoned') {
                        formatted_data.queues[k].total_wait_time += queue_stats.wait_time;
                    }

                    if(queue_stats.status === 'abandoned') {
                        formatted_data.queues[k].abandoned_calls++;
                        formatted_data.queues[k].total_calls++;
                    }
                    else if(queue_stats.status === 'waiting') {
                        formatted_data.calls_waiting[call_id] = queue_stats;
                        formatted_data.calls_waiting[call_id].friendly_duration = self.get_time_seconds(formatted_data.current_timestamp - queue_stats.entered_timestamp);
                        formatted_data.calls_waiting[call_id].friendly_title = queue_stats.caller_id_name || queue_stats.caller_id_number || call_id;
                        formatted_data.queues[k].current_calls++;
                    }
                    else if(queue_stats.status === 'handled') {
                        formatted_data.calls_in_progress[call_id] = queue_stats;
                        formatted_data.agents[queue_stats.agent_id].call_time = self.get_time_seconds(formatted_data.current_timestamp - queue_stats.handled_timestamp);
                        formatted_data.agents[queue_stats.agent_id].current_call = queue_stats;
                        formatted_data.agents[queue_stats.agent_id].current_call.friendly_title = queue_stats.caller_id_name || queue_stats.caller_id_number || call_id;
                        formatted_data.calls_in_progress[call_id].friendly_duration = self.get_time_seconds(formatted_data.current_timestamp - queue_stats.entered_timestamp);
                        formatted_data.queues[k].total_calls++;

                        formatted_data.queues[k].current_calls++;
                    }
                    else if(queue_stats.status === 'processed') {
                        formatted_data.queues[k].total_calls++;
                    }}
                });
            }

            $.each(formatted_data.queues, function(k, v) {
                if(v.total_calls > 0) {
                	var completed_calls = v.total_calls - v.abandoned_calls;

                    v.average_hold_time = self.get_time_seconds(v.total_wait_time / completed_calls);
                }
            });
            return formatted_data;
        },

        format_data: function(data) {
            var self = this,
                formatted_data = {};
            /* Formatting Queues */
            formatted_data.queues = {};

            $.each(data.queues, function(k, v) {
                formatted_data.queues[v.id] = $.extend(true, {
                    current_calls: 0,
                    total_calls: 0,
                    current_agents: 0,
                    max_agents: 0,
                    average_hold_time: self.get_time_seconds(0),
                    total_wait_time: 0,
                    abandoned_calls: 0
                }, v);
            });

            /* Formatting Agents */
            formatted_data.agents = {};

            $.each(data.agents, function(k, v) {
            	if(v.queues && v.queues.length > 0) {
                	formatted_data.agents[v.id] = $.extend(true, {
                    	status: 'logged_out',
                    	missed_calls: 0,
                    	total_calls: 0,
                    	queues_list: {}
                	}, v);
                }

                $.each(v.queues, function(k, queue_id) {
                    if(queue_id in formatted_data.queues) {
                        formatted_data.queues[queue_id].max_agents++;
                        formatted_data.agents[v.id].queues_list[queue_id] = {
                            missed_calls: 0,
                            total_calls: 0
                        };
                    }
                });
            });
            formatted_data = self.format_live_data(formatted_data, data);
            return formatted_data;
        },

        render: function(_container) {
            var self = this,
            container = _container || $('#monster-content');

                // account switching for monster-ui
                self.accountId = monster.apps.auth.accountId;
                self.clean_timers();

                self.fetch_all_data(function(data) {

                    queues_html = $(monster.template(self, 'queues_dashboard', {queues: data.queues}));
                    agents_html = $(monster.template(self, 'agents_dashboard', {agents: data.agents}));
                    calls_html = $(monster.template(self, 'calls_dashboard', {progress: data.calls_in_progress, waits: data.calls_waiting} ));

                    html = $(monster.template(self, 'dashboard', {}));
                    container.empty().append(html);

                    scroll_value = $('.topbar-right .list_queues_inner', container).scrollLeft() || 0;
                    container.find('#dashboard-view').empty().append(agents_html);
                    container.find('.topbar-right').empty().append(queues_html);
                    container.find('.topbar-right .list_queues_inner').animate({ scrollLeft: scroll_value }, 0);
                    container.find('#callwaiting-list').append(calls_html);

                    self.poll_agents(data, container);
                    (container).empty().append(html);
                    self.bind_live_events(container);
                    self.render_timers(data);

                    if(typeof queue_id != 'undefined') {
                        self.detail_stat(queue_id, container);
                    }
            });
        },

        fetch_all_data: function(callback) {
            var self = this;

                monster.parallel({
                    queues_livestats: function(callback) {
                        self.get_queues_livestats(function(_data_live_queues) {
                            callback(null, _data_live_queues);
                        });
                    },
                    agents_livestats: function(callback) {
                        self.get_agents_livestats(function(_data_live_agents) {
                            callback(null, _data_live_agents);
                        });
                    },
                    agents_status: function(callback) {
                        self.get_agents_status(function(_data_live_status) {
                            	callback(null, _data_live_status);
                        	},
                        	function(_data_live_status) {
                        		callback(null, {});
                        	}
                        );
                    },
                    queues: function(callback) {
                        self.get_queues(function(_data_queues) {
                            callback(null, _data_queues);
                        });
                    },
                    agents: function(callback) {
                        self.get_agents(function(_data_agents) {
                            callback(null, _data_agents);
                        });
                    },
                },
                function(err, results) {
                    var _data = {
                        queues: results.queues,
                        agents: results.agents,
                        agents_live_stats: results.agents_livestats,
                        queues_live_stats: results.queues_livestats,
                        agents_live_status: results.agents_status
                    };

                    _data = self.format_data(_data);

                    if(typeof callback === 'function') {
                        callback(_data);
                    }
                }
            );
        },

        bind_live_events: function(container) {
            var self = this;

            // hide show agents
            $('#hide_logout_agents', container).on('click', function(event) {
                var checked = $(this).is(':checked');
                self.hide_logout = checked;
                checked ? $('#agents-view', container).addClass('hide-logout') : $('#agents-view', container).removeClass('hide-logout');
            });

            // toolbar top for active agents and queues
            $('.toggle-button', container).on('click', function(event) {
                var $topbar = $('.topbar-right', container),
                $listpanel = $('.list-panel-anchor', container),
                new_height;

                if($topbar.is(':hidden')) {
                    new_height = $listpanel.outerHeight() - $topbar.outerHeight() + 'px';
                    $('.toggle-button', container).html("Hide"+self.i18n.active().hide_queues_html);
                }
                else {
                    new_height = $listpanel.outerHeight() + $topbar.outerHeight() + 'px';
                    $('.toggle-button', container).html(self.i18n.active().show_queues_html);
                }

                $listpanel.css({'min-height': new_height, 'height': new_height });
                $listpanel.data('jsp').reinitialise();
                $topbar.toggle();
            });

            // list of queues
            $('.list_queues_inner > li', container).on('click', function(event) {

                    queue_id = this.id;
                    var $self_queue = $(self);

                    if($self_queue.hasClass('active')) {
                        self.current_queue_id = undefined;
                        $('.agent_wrapper', container).css('display', 'inline-block');
                        $('.all_data', container).show();
                        $('.queue_data', container).hide();
                        $('#callwaiting-list li', container).show();
                        $('.icon.edit_queue', container).hide();
                        $('.icon.eavesdrop_queue', container).hide();
                        $('.list_queues_inner > li', container).removeClass('active');
                    }
                    else {
                        self.detail_stat(queue_id, container);
                    }
            });

            // edit button in queues
            $('.list_queues_inner > li .edit_queue', container).on('click',function(event) {
                queue_id = $('.list_queues_inner > li.active', container.id).attr('id');
//                monster.pub('callflows.fetchActions', { actions: 'queues.activate' });
//console.log(queue_id);
                monster.pub('queues.activate', {
                    container: $('#monster-content'), callback: function() {
                        monster.pub('callflow.queues.edit', { id: queue_id });
                    }
                });
            });
        },
        detail_stat: function(queue_id, container) {
            var self = this,
                $self_queue = $('#'+queue_id, container);

            self.current_queue_id = queue_id;

            $('.list_queues_inner > li', container).removeClass('active');
            $('.icon.edit_queue', container).hide();
            $('.icon.eavesdrop_queue', container).hide();

            $('.icon.edit_queue', $self_queue).show();
            $('.icon.eavesdrop_queue', $self_queue).show();
            $self_queue.addClass('active');

            $('#callwaiting-list li', container).each(function(k, v) {
                var $v = $(v);

                if(v.getAttribute('data-queue_id') !== queue_id) {
                    $v.hide();
                }
                else {
                    $v.show();
                }
            });

            $('.agent_wrapper', container).each(function(k, v) {
                var $v = $(v);

                if(v.getAttribute('data-queues').indexOf(queue_id) < 0) {
                    $v.hide();
                }
                else {
                    if(!self.hide_logout) {
                        $v.css('display', 'inline-block');
                    }
                    $('.all_data', $v).hide();
                    $('.queue_stat', $v).hide();
                    $('.queue_stat[data-id='+queue_id+']', $v).show();
                    $('.queue_data', $v).show();
                }
            });
        },

        clean_timers: function() {
            var self = this;

                if(self.global_timer !== false) {
                    clearInterval(self.global_timer);
                    self.global_timer = false;
                }

                $.each(self.map_timers, function(type, list_timers) {
                    $.each(list_timers, function(k, v) {
                        clearInterval(v.timer);
                    });
                });

                self.map_timers = {};
            },

            activate_queue_stat: function(args) {
                //TODO check render global data
                var self = this,
                container = args.container || $('#monster-content');
                container.empty();
                self.render(container, function() {
                    var $self_queue = $('#'+args.id, container);
                    self.detail_stat(args.id, container);
                });
            },

            activate: function(_container) {
                var self = this,
                container = _container || $('#monster-content');
                container.empty();
                self.current_queue_id = undefined;
                self.hide_logout = false;
                //TODO check render global data
                self.render(container);
            },

            login: function(agent, callback) {
                var self = this,
                agentId = $(agent).attr('id');
                self.callApi({
                        resource: 'agents.agents_toggle',
                        data: {
                            accountId: self.accountId,
                            agentId: agentId,
                            data: {status: 'login'}
                        },
                        generateError: false
                });
            },

            logout: function(agent, callback) {
                var self = this,
                agentId = $(agent).attr('id');
                self.callApi({
                        resource: 'agents.agents_toggle',
                        data: {
                            accountId: self.accountId,
                            agentId: agentId,
                            data: {status: 'logout'}
                        },
                        generateError: false
                });
            }
        }
        return app;
});
