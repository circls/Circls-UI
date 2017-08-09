define(["require", "jquery", "underscore", "monster", "toastr", "monster-flags", "chosenImage"], function(require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        monster = require("monster"),
        toastr = require("toastr"),
        quickcalldevice = require('monster-quickcalldevice'),
        flags = require('monster-flags'),
        chosenImage = require('chosenImage'),

        app = {
            requests: {},
            subscribe: {
                "debug.channels.render": "channelsRender"
            },
            appFlags: {
                tableData: []
            },
            channelsRender: function(content) {
                var self = this,
                    content = content || {},
                    index = content.container || $("#debug_app_container .app-content-wrapper"),
                    template = $(monster.template(self, "channels-layout"));
                self.channelsInitTable(template, function() {
                    self.channelsBindEvents(template), index.fadeOut(function() {
                        $(this).empty().append(template).fadeIn()
                    })
                })
            },
            channelsFormatDataTable: function(data) {
                var datas = [],
                    row = {};
                return _.each(data.users, function(data) {
                    row[data.id] = data
                }), $.each(data.channels, function() {
                    monster.util.toFriendlyDate(this.timestamp, "MM/DD/year - hh:mm:ss");
                    this.friendlyUsername = row.hasOwnProperty(this.owner_id) ? row[this.owner_id].first_name + " " + row[this.owner_id].last_name : "-", this.humanTime = monster.util.toFriendlyDate(this.timestamp, "MM/DD/year - hh:mm:ss"), datas.push([this.uuid, this.destination, this.direction, this.other_leg, this, this.timestamp])
                }), datas
            },
            channelsBindEvents: function(container) {
                var self = this;
                container.on("click", ".detail-link", function() {
                    var datas = $(this),
                        row = datas.data("row"),
                        data = self.appFlags.tableData[row][4],
                        detail = $(monster.template(self, "channels-detail", {
                            metadata: data
                        }));
                    detail.find("#close").on("click", function() {
                        edit.dialog("close").remove()
                    });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().channels.detailDialog.popupTitle,
                        position: ["center", 20]
                    })
                }),

                container.on("click", ".transfer-popup", function() {
                    var datas = $(this),
                        row = datas.data("row"),
                        data = self.appFlags.tableData[row][4],
                        detail = $(monster.template(self, "channels-transfer", {
                            metadata: data
                        }));
                    detail.find("#close").on("click", function() {
                        edit.dialog("close").remove()
                    });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().channels.transferDialog.popupTitle,
                        position: ["center", 20]
                    })
                }),

                container.on("click", ".transfer-button", function() {
                    var datas = $(this),
                        row = datas.data("row"),
                        metadata = self.appFlags.tableData[row][4];
                        if(metadata.uuid !== false) {
                            self.callApi({
                                resource: "channel.action",
                                data: {
                                    accountId: self.accountId,
                                    callId: metadata.uuid,
                                    data: {
                                        action: 'tranfer',
                                        target: datas.target
                                    },
                                    generateError: false
                                },
                                success: function(data) { console.log(metadata), toastr.success(self.i18n.active().channels.transfer + metadata.destination) }
                            });
                        } else
                            console.log(metadata), toastr.warning(self.i18n.active().channels.transferProblem + metadata.destination)
                })

                container.on("click", ".hangup-link", function() {
                    var datas = $(this),
                        row = datas.data("row"),
                        metadata = self.appFlags.tableData[row][4];
                        if(metadata.uuid !== false) {
                            self.callApi({
                                resource: "channel.action",
                                data: {
                                    accountId: self.accountId,
                                    callId: metadata.uuid,
                                    data: {
                                        action: 'hangup'
                                    },
                                    generateError: false
                                },
                                success: function(data) { console.log(metadata), toastr.success(self.i18n.active().channels.hangup + metadata.destination) }
                            });
                        } else
                            console.log(metadata), toastr.warning(self.i18n.active().channels.hangupProblem + metadata.destination)
                })

            },
            channelsInitTable: function(container, callback) {
                var self = this,
                    lines = [{
                        sTitle: self.i18n.active().channels.tableTitles.uuid
                    }, {
                        sTitle: self.i18n.active().channels.tableTitles.destination
                    }, {
                        sTitle: self.i18n.active().channels.tableTitles.direction
                    }, {
                        sTitle: self.i18n.active().channels.tableTitles.otherLeg
                    }, {
                        sTitle: self.i18n.active().channels.tableTitles.details,
                        bSortable: false,
                        fnRender: function(container) {
                            return console.log(container), '<a href="#" class="detail-link monster-link blue" data-row="' + container.iDataRow + '"><i class="fa fa-eye"></i></a>'
                        }
                    }, {
                        sTitle: self.i18n.active().channels.tableTitles.action,
                        bSortable: false,
                        fnRender: function(container) {
                            return console.log(container), '<a href="#" class="transfer-popup monster-link blue" data-row="' + container.iDataRow + '"><i class="fa fa-phone"></i></a>'+
                                    '<a href="#" class="hangup-link monster-link blue" data-row="' + container.iDataRow + '"><i class="fa fa-level-down"></i></a>'
                        }
                    }, {
                        bVisible: !1
                    }];
                self.channelsGetData(function(data) {
                    monster.ui.table.create("channels", container.find("#channels_grid"), lines, data, {
                        sDom: '<"table-custom-actions">frtlip',
                        aaSorting: [
                            [5, "desc"]
                        ]
                    }), $.fn.dataTableExt.afnFiltering.pop(), callback && callback()
                })
            },
            channelsGetData: function(callback) {
                var self = this;
                monster.parallel({
                    channels: function(callback) {
                        self.callApi({
                            resource: "channel.list",
                            data: {
                                accountId: self.accountId,
                                filters: { paginate:false }
                            },
                            success: function(data) {
                                callback(null, data.data)
                            }
                        })
                    },
                    users: function(callback) {
                        self.callApi({
                            resource: "user.list",
                            data: {
                                accountId: self.accountId
                            },
                            success: function(data) {
                                callback(null, data.data)
                            }
                        })
                    }
                }, function(err, result) {
                    var table = self.channelsFormatDataTable(result);
                    self.appFlags.tableData = table, callback && callback(table)
                })
            }
        };
    return app
});