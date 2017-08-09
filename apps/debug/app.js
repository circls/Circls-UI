define(["require", "jquery", "underscore", "monster"], function(e) {
    var t = (e("jquery"), e("underscore"), e("monster")),
        n = {
            name: "debug",
            css: ["app"],
            i18n: {
                "en-US": {customCss: !1},
                "fr-FR": {customCss: !1},
                "ro-RO": {customCss: !1},
                "nl-NL": {customCss: !1},
                "it-IT": {customCss: !1},
                "de-DE": {customCss: !1},
                "dk-DK": {customCss: !1},
                "es-ES": {customCss: !1},
                "pt-PT": {customCss: !1},
                "ru-RU": {customCss: !1},
                "zh-CN": {customCss: !1}
            },
            requests: {},
            subscribe: {},
            subModules: ["registrations", "smtpLogs", "callInspector", "presence", "channels", "faxLogs"],
            load: function(e) {
                var t = this;
                t.initApp(function() {
                    e && e(t)
                })
            },
            initApp: function(e) {
                var n = this;
                t.pub("auth.initApp", {
                    app: n,
                    callback: e
                })
            },
            render: function(e) {
                var n = this;
                t.ui.generateAppLayout(n, {
                    appName: n.i18n.active().title,
                    menus: [{
                        tabs: [{
                            text: n.i18n.active().menuTitles.registrations,
                            callback: n.registrationsRender
                        }, {
                            text: n.i18n.active().menuTitles.smtpLogs,
                            callback: n.smtpLogsRender
                        }, {
                            text: n.i18n.active().menuTitles.faxLogs,
                            callback: n.faxLogsRender
                        }, {
                            text: n.i18n.active().menuTitles.callInspector,
                            callback: n.callInspectorRender
                        }, {
                            text: n.i18n.active().menuTitles.presence,
                            callback: n.presenceRender
                        }, {
                            text: n.i18n.active().menuTitles.channels,
                            callback: n.channelsRender
                        }]
                    }]
                })
            }
        };
    return n
});