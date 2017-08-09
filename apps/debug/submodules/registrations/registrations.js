define(["require", "jquery", "underscore", "monster", "toastr"], function(t) {
    var i = t("jquery"),
        e = t("underscore"),
        a = t("monster"),
        n = (t("toastr"), {
            requests: {},
            subscribe: {
                "debug.registrations.render": "registrationsRender"
            },
            appFlags: {
                tableData: []
            },
            registrationsRender: function(t) {
                var e = this,
                    n = t || {},
                    s = n.container || i("#debug_app_container .app-content-wrapper"),
                    r = i(a.template(e, "registrations-layout"));
                e.registrationsInitTable(r, function() {
                    e.registrationsBindEvents(r), s.fadeOut(function() {
                        i(this).empty().append(r).fadeIn()
                    })
                })
            },
            registrationsFormatDataTable: function(t) {
                var n = [],
                    s = {};
                return e.each(t.users, function(t) {
                    s[t.id] = t
                }), i.each(t.registrations, function() {
                    var t = a.util.toFriendlyDate(this.event_timestamp, "MM/DD/year - hh:mm:ss");
                    this.contact = this.contact.replace(/"/g, ""), this.contact = this.contact.replace(/'/g, "\\'"), this.friendlyUsername = s.hasOwnProperty(this.owner_id) ? s[this.owner_id].first_name + " " + s[this.owner_id].last_name : "-", this.presenceId = s.hasOwnProperty(this.owner_id) ? s[this.owner_id].presence_id || "-" : "-", n.push([this.username, this.friendlyUsername, this.presenceId, this.contact_ip, this.contact_port, t, this, this.event_timestamp])
                }), n
            },
            registrationsBindEvents: function(t) {
                var e = this;
                t.on("click", ".detail-link", function() {
                    var t = i(this),
                        n = t.data("row"),
                        s = e.appFlags.tableData[n][6],
                        r = i(a.template(e, "registrations-detail", {
                            metadata: s
                        }));
                    a.ui.renderJSON(s, r.find(".json-viewer")), r.find("#close").on("click", function() {
                        o.dialog("close").remove()
                    }), r.find(".technical-details").on("click", function() {
                        r.find(".technical-data, .technical-details-hide").show(), r.find(".technical-details").hide()
                    }), r.find(".technical-details-hide").on("click", function() {
                        r.find(".technical-details").show(), r.find(".technical-data, .technical-details-hide").hide()
                    });
                    var o = a.ui.dialog(r, {
                        title: e.i18n.active().registrations.detailDialog.popupTitle,
                        position: ["center", 20]
                    })
                })
            },
            registrationsInitTable: function(t, e) {
                var n = this,
                    s = [{
                        sTitle: n.i18n.active().registrations.tableTitles.username
                    }, {
                        sTitle: n.i18n.active().registrations.tableTitles.name
                    }, {
                        sTitle: n.i18n.active().registrations.tableTitles.presenceId
                    }, {
                        sTitle: n.i18n.active().registrations.tableTitles.ip
                    }, {
                        sTitle: n.i18n.active().registrations.tableTitles.port
                    }, {
                        sTitle: n.i18n.active().registrations.tableTitles.date
                    }, {
                        sTitle: n.i18n.active().registrations.tableTitles.details,
                        fnRender: function(t) {
                            return '<a href="#" class="detail-link monster-link blue" data-row="' + t.iDataRow + '"><i class="fa fa-eye"></i></a>'
                        }
                    }, {
                        bVisible: !1
                    }];
                n.registrationsGetData(function(n) {
                    a.ui.table.create("registrations", t.find("#registrations_grid"), s, n, {
                        sDom: '<"table-custom-actions">frtlip',
                        aaSorting: [
                            [7, "desc"]
                        ]
                    }), i.fn.dataTableExt.afnFiltering.pop(), e && e()
                })
            },
            registrationsGetData: function(t) {
                var i = this;
                a.parallel({
                    registrations: function(t) {
                        i.callApi({
                            resource: "registrations.list",
                            data: {
                                accountId: i.accountId
                            },
                            success: function(i) {
                                t(null, i.data)
                            }
                        })
                    },
                    users: function(t) {
                        i.callApi({
                            resource: "user.list",
                            data: {
                                accountId: i.accountId
                            },
                            success: function(i) {
                                t(null, i.data)
                            }
                        })
                    }
                }, function(e, a) {
                    var n = i.registrationsFormatDataTable(a);
                    i.appFlags.tableData = n, t && t(n)
                })
            }
        });
    return n
});