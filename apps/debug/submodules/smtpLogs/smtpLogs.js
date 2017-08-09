define(["require", "jquery", "underscore", "monster", "toastr"], function(t) {
    var e = t("jquery"),
        a = t("underscore"),
        s = t("monster"),
        o = (t("toastr"), {
            requests: {},
            subscribe: {
                "debug.smtpLogs.render": "smtpLogsRender"
            },
            smtpLogsRender: function(t) {
                var a = this,
                    o = t || {},
                    n = o.container || e("#debug_app_container .app-content-wrapper");
                a.smtpLogsGetData(function(t) {
                    var o = a.smtpLogsFormatDataTable(t),
                        i = e(s.template(a, "smtpLogs-layout", o));
                    s.ui.footable(i.find(".footable")), a.smtpLogsBindEvents(i), n.fadeOut(function() {
                        e(this).empty().append(i).fadeIn()
                    })
                })
            },
            smtpLogsBindEvents: function(t) {
                var a = this;
                t.on("click", ".detail-link", function() {
                    var t = e(this).data("id");
                    a.smtpLogsRenderDetailPopup(t)
                })
            },
            smtpLogsRenderDetailPopup: function(t) {
                var a = this;
                a.smtpLogsGetDetails(t, function(t) {
                    var o = e(s.template(a, "smtpLogs-detail", t));
                    o.find("#close").on("click", function() {
                        n.dialog("close").remove()
                    });
                    var n = s.ui.dialog(o, {
                        title: a.i18n.active().smtpLogs.detailDialog.popupTitle,
                        position: ["center", 20]
                    })
                })
            },
            smtpLogsFormatDataTable: function(t) {
                var e = {
                    logs: []
                };
                return a.each(t, function(t) {
                    console.log(t),
//                    t.hasErrors = -1 === t.receipt.indexOf("Ok"),
                    e.logs.push(t)
                }), e
            },
            smtpLogsFormatDetailData: function(t) {
                var e = this,
                    s = {
                        metadata: {},
                        errors: []
                    },
                    o = "";
                return a.each(t, function(t, a) {
                    "errors" === a ? s.errors = t : (o = e.i18n.active().smtpLogs.detailDialog.apiKeys.hasOwnProperty(a) ? e.i18n.active().smtpLogs.detailDialog.apiKeys[a] : a.replace(/_/g, " "), s.metadata[a] = {
                        friendlyKey: o,
                        value: t
                    })
                }), s
            },
            smtpLogsGetData: function(t) {
                var e = this;
                e.callApi({
                    resource: "smtpLogs.list",
                    data: {
                        accountId: e.accountId
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            smtpLogsGetDetails: function(t, e) {
                var a = this;
                a.callApi({
                    resource: "smtpLogs.get",
                    data: {
                        accountId: a.accountId,
                        logId: t
                    },
                    success: function(t) {
                        var s = a.smtpLogsFormatDetailData(t.data);
                        e && e(s)
                    }
                })
            }
        });
    return o
});