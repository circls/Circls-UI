define(["require", "jquery", "underscore", "monster", "toastr"], function(e) {
    var t = e("jquery"),
        n = e("underscore"),
        a = e("monster"),
        i = (e("toastr"), {
            requests: {},
            subscribe: {
                "debug.callInspector.render": "callInspectorRender"
            },
            callInspectorRender: function(e) {
                var n, i = this,
                    r = e || {},
                    l = r.container || t("#debug_app_container .app-content-wrapper"),
                    o = {
                        timezone: "GMT" + jstz.determine_timezone().offset()
                    },
                    s = 1,
                    c = 31,
                    d = e.to,
                    g = e.from;
                if (!d && !g) {
                    var p = a.util.getDefaultRangeDates(s);
                    g = p.from, d = p.to
                }
                delete i.lastALeg, delete i.loneBLegs, i.callInspectorListCalls(g, d, function(e, r) {
                    if (e = i.callInspectorFormatCalls(e), o.calls = e, n = t(a.template(i, "callInspector-layout", o)), e && e.length) {
                        var s = t(a.template(i, "callInspector-callList", {
                            calls: e
                        }));
                        n.find(".inspector-grid .grid-row-container").append(s)
                    }
                    var p = {
                        container: n,
                        range: c
                    };
                    a.ui.initRangeDatepicker(p), n.find("#startDate").datepicker("setDate", g), n.find("#endDate").datepicker("setDate", d), r || n.find(".inspector-loader").hide(), i.callInspectorBindEvents({
                        template: n,
                        parent: l,
                        calls: e,
                        fromDate: g,
                        toDate: d,
                        nextStartKey: r
                    }), l.fadeOut(function() {
                        t(this).empty().append(n).fadeIn(), l.find(".search-query").focus()
                    })
                })
            },
            callInspectorBindEvents: function(e) {
                function i() {
                    var e = o.find(".inspector-loader");
                    g ? (e.toggleClass("loading"), e.find(".loading-message > i").toggleClass("fa-spinner"), r.callInspectorListCalls(c, d, function(n, i) {
                        n = r.callInspectorFormatCalls(n);
                        var l = t(a.template(r, "callInspector-callList", {
                            calls: n
                        }));
                        g = i, g || o.find(".inspector-loader").hide(), o.find(".inspector-grid .grid-row-container").append(l), s = s.concat(n);
                        var c = o.find(".search-div input.search-query");
                        c.val() && c.keyup(), e.toggleClass("loading"), e.find(".loading-message > i").toggleClass("fa-spinner")
                    }, g)) : e.hide()
                }
                var r = this,
                    l = e.parent,
                    o = e.template,
                    s = e.calls,
                    c = e.fromDate,
                    d = e.toDate,
                    g = e.nextStartKey;
                o.find(".filter-div .apply-filter").on("click", function(e) {
                    var t = o.find(".filter-div input.filter-from").datepicker("getDate"),
                        n = o.find(".filter-div input.filter-to").datepicker("getDate");
                    r.callInspectorRender({
                        container: l,
                        from: t,
                        to: n
                    })
                }), o.find(".filter-div .refresh-filter").on("click", function(e) {
                    r.callInspectorRender({
                        container: l
                    })
                }), o.find(".search-div input.search-query").on("keyup", function(e) {
                    if (o.find(".grid-row-container .grid-row").length > 0) {
                        var a = t(this).val().replace(/\|/g, "").toLowerCase(),
                            i = !1;
                        a.length <= 0 ? (o.find(".grid-row-group").show(), i = !0) : n.each(s, function(e) {
                            var r = (e.callId || e.id) + (e.bLegs.length > 0 ? "|" + t.map(e.bLegs, function(e) {
                                    return e.callId || e.id
                                }).join("|") : ""),
                                l = (e.date + "|" + e.fromName + "|" + e.fromNumber + "|" + e.toName + "|" + e.toNumber + "|" + e.hangupCause + "|" + r).toLowerCase(),
                                s = o.find('.grid-row.a-leg[data-id="' + e.id + '"]').parents(".grid-row-group");
                            if (l.indexOf(a) >= 0) i = !0, s.show();
                            else {
                                var c = n.find(e.bLegs, function(e) {
                                    var t = (e.date + "|" + e.fromName + "|" + e.fromNumber + "|" + e.toName + "|" + e.toNumber + "|" + e.hangupCause).toLowerCase();
                                    return t.indexOf(a) >= 0
                                });
                                c ? (i = !0, s.show()) : s.hide()
                            }
                        }), i ? o.find(".grid-row.no-match").hide() : o.find(".grid-row.no-match").show()
                    }
                }), o.on("click", ".grid-row.has-b-legs:not(.header-row)", function(e) {
                    var n = t(this),
                        a = n.parents(".grid-row-group");
                    a.hasClass("open") ? (a.removeClass("open"), a.find(".b-leg").slideUp()) : (o.find(".grid-row-group").removeClass("open"), o.find(".b-leg").slideUp(), a.addClass("open"), a.find(".b-leg").slideDown())
                }), o.on("click", ".grid-cell.details", function(e) {
                    e.stopPropagation();
                    var n = t(this).parents(".grid-row").data("call_id");
                    r.callInspectorRenderCallDetails({
                        parent: l,
                        callId: n
                    })
                }), o.on("click", ".grid-cell.report a", function(e) {
                    e.stopPropagation()
                }), o.find(".inspector-grid").on("scroll", function(e) {
                    var n = t(this);
                    n.scrollTop() === n[0].scrollHeight - n.innerHeight() && i()
                }), o.find(".inspector-loader:not(.loading) .loader-message").on("click", function(e) {
                    i()
                })
            },
            callInspectorListCalls: function(e, t, i, r) {
                var l = this,
                    o = a.util.dateToBeginningOfGregorianDay(e),
                    s = a.util.dateToEndOfGregorianDay(t),
                    c = {
                        created_from: o,
                        created_to: s,
                        page_size: 50
                    };
                r && (c.start_key = r), l.callApi({
                    resource: "inspector.list",
                    data: {
                        accountId: l.accountId,
                        filters: c
                    },
                    success: function(e, t) {
                        var a = {},
                            r = n.groupBy(e.data, function(e) {
                                return "inbound" === e.direction ? "aLegs" : "bLegs"
                            });
                        l.lastALeg && r.aLegs.splice(0, 0, l.lastALeg), e.next_start_key && (l.lastALeg = r.aLegs.pop()), n.each(r.aLegs, function(e) {
                            var t = e.call_id || e.id;
                            a[t] = {
                                aLeg: e,
                                bLegs: {}
                            }
                        }), l.loneBLegs && l.loneBLegs.length > 0 && n.each(l.loneBLegs, function(e) {
                            "other_leg_call_id" in e && e.other_leg_call_id in a && (a[e.other_leg_call_id].bLegs[e.id] = e)
                        }), l.loneBLegs = [], n.each(r.bLegs, function(e) {
                            "other_leg_call_id" in e && (e.other_leg_call_id in a ? a[e.other_leg_call_id].bLegs[e.id] = e : l.loneBLegs.push(e))
                        }), i(a, e.next_start_key)
                    }
                })
            },
            callInspectorFormatCalls: function(e) {
                var i = [],
                    r = function(e) {
                        var t = a.util.gregorianToDate(e.timestamp),
                            n = (t.getDate() < 10 ? "0" : "") + t.getDate(),
                            i = (t.getMonth() < 9 ? "0" : "") + (t.getMonth() + 1),
                            r = t.getFullYear().toString().substr(2),
                            l = (t.getHours() < 10 ? "0" : "") + t.getHours(),
                            o = (t.getMinutes() < 10 ? "0" : "") + t.getMinutes(),
                            s = parseInt(e.duration_seconds / 60).toString(),
                            c = (e.duration_seconds % 60 < 10 ? "0" : "") + e.duration_seconds % 60;
                        return {
                            id: e.id,
                            callId: e.call_id,
                            timestamp: e.timestamp,
                            date: i + "/" + n + "/" + r,
                            time: l + ":" + o,
                            fromName: e.caller_id_name,
                            fromNumber: e.caller_id_number || e.from.replace(/@.*/, ""),
                            toName: e.callee_id_name,
                            toNumber: e.callee_id_number || "request" in e ? e.request.replace(/@.*/, "") : e.to.replace(/@.*/, ""),
                            duration: s + ":" + c,
                            hangupCause: e.hangup_cause,
                            isOutboundCall: "authorizing_id" in e
                        }
                    };
                return n.each(e, function(e, a) {
                    if ("aLeg" in e) {
                        var l = r(e.aLeg);
                        l.callIdList = l.callId, l.bLegs = [], n.each(e.bLegs, function(e, t) {
                            l.callIdList += " " + e.call_id, l.bLegs.push(r(e))
                        }), i.push(l)
                    } else n.each(e.bLegs, function(e, n) {
                        var a = r(e);
                        a.callIdList = a.callId, i.push(t.extend({
                            bLegs: []
                        }, a))
                    })
                }), i.sort(function(e, t) {
                    return t.timestamp - e.timestamp
                }), i
            },
            callInspectorRenderCallDetails: function(e) {
                var n = this,
                    i = e.parent,
                    r = e.callId;
                n.callInspectorLoadCallDetails(r, function(e) {
                    var r = e.analysis,
                        l = e.messages,
                        o = n.callInspectorFormatCallDetails({
                            destinations: e.dialog_entities,
                            analysis: r,
                            messages: l
                        }),
                        s = t(a.template(n, "callInspector-callDetails", o));
                    n.callInspectorBindCallDetailsEvents({
                        parent: i,
                        template: s,
                        callMessages: l
                    }), i.find(".inspector-listing").hide(), i.find(".inspector-details").empty().append(s)
                })
            },
            callInspectorBindCallDetailsEvents: function(e) {
                var i = e.parent,
                    r = e.template,
                    l = e.callMessages;
                r.find('td[class^="ladder-element-"] a').on("click", function() {
                    var e = t(this).data("id").toString(),
                        i = n.find(l, function(t, n) {
                            return t.ref_timestamp === e
                        });
                    a.ui.alert("info", i.raw)
                }), r.find(".back-button").on("click", function() {
                    i.find(".inspector-details").empty(), i.find(".inspector-listing").show()
                })
            },
            callInspectorLoadCallDetails: function(e, t) {
                var n = this;
                n.callApi({
                    resource: "inspector.get",
                    data: {
                        accountId: n.accountId,
                        callId: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            callInspectorFormatCallDetails: function(e) {
                var t = this,
                    a = function(t) {
                        var n = ([t[0].src, t[0].dst], []);
                        return t.forEach(function(e) {
                            n.indexOf(e["call-id"]) < 0 && n.push(e["call-id"])
                        }), {
                            destinations: e.destinations,
                            callIds: n
                        }
                    }(e.messages),
                    i = function(e) {
                        var t = [];
                        return e.forEach(function(e, n) {
                            var i = a.destinations.indexOf(e.src),
                                r = a.destinations.indexOf(e.dst),
                                l = Math.abs(r - i);
                            if (l > 0) {
                                var o = ["red", "green", "yellow", "blue"];
                                t[n] = [], e.element = !0, e.length = l, e.direction = r > i ? "right" : "left", e.position = r > i ? r : r + 1, e.color = o[a.callIds.indexOf(e["call-id"])];
                                for (var s = 0, c = a.destinations.length - 1; c > s; s++) t[n][s] = s === e.position - 1 ? e : {
                                    element: !1
                                };
                                if (e.length > 1)
                                    for (var d = "right" === e.direction ? e.position - e.length : e.position, g = e.length - 1; g > 0; g--) t[n][d] = {
                                        element: !0,
                                        color: e.color
                                    }, d++
                            }
                        }), t
                    }(e.messages),
                    r = function(e) {
                        return n.isObject(e) || (e = {}), "originate_type" in e || (e.originate_type = "cloud"), "terminate_type" in e || (e.terminate_type = "cloud"), e.originating = {
                            type: e.originate_type,
                            icon: "fa-" + ("carrier" === e.originate_type ? "globe" : e.originate_type),
                            name: t.i18n.active().callInspector.analysisTypes[e.originate_type],
                            failure: "originating" === e.failure_location
                        }, e.kazoo = {
                            type: "kazoo",
                            icon: "fa-cog",
                            name: t.i18n.active().callInspector.analysisTypes.kazoo,
                            failure: "kazoo" === e.failure_location || e.originating.failure
                        }, e.terminating = {
                            type: e.terminate_type,
                            icon: "fa-" + ("carrier" === e.terminate_type ? "globe" : e.terminate_type),
                            name: t.i18n.active().callInspector.analysisTypes[e.terminate_type],
                            failure: "terminating" === e.failure_location || e.kazoo.failure
                        }, e
                    }(e.analysis);
                return e.analysis = r, e.messages = i, e.destinations = a.destinations, e
            }
        });
    return i
});