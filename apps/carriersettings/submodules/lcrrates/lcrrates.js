define(["require", "jquery", "underscore", "monster", "toastr", "monster-flags", "chosenImage"], function(require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        monster = require("monster"),
        toastr = require("toastr"),
        flags = require('monster-flags'),
        chosenImage = require('chosenImage'),

        app = {
            requests: {},
            subscribe: {
                "carriersettings.lcrrates.render": "lcrratesRender"
            },
            appFlags: {
                tableData: []
            },
            lcrratesRender: function(content) {
                var self = this,
                content = content || {},
                    index = content.parent || $(".right-content"),
                    template = $(monster.template(self, "lcrrates-layout"));
                self.lcrratesInitTable(template, function() {
                    self.lcrratesBindEvents(template), index.empty().append(template)
                })

            }, lcrratesBindEvents: function(container) {
                var self = this;

                // upload lcrrates
                container.on("click", "#upload-link", function() {
                    var data = $(this),
                        detail = $(monster.template(self, "upload", {
                            metadata: data
                        }));
                    detail.find(".cancel-link").on("click", function() {
                        edit.dialog("close").remove()

                    });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().lcrrates.uploadDialog.popupTitle,
                        position: ["center", 20]
                    });
                }),
                // delete entry
                container.on("click", "#delete-lcrrates-link", function() {
                    var data = $(this);
                        var checkedValues = $("input:checkbox:checked", "#lcrrates_grid").map(function() {
                            return $(this).val();
                        }).get(); delete checkedValues['on'];
                        $.each(checkedValues, function(i, id) {
                                var entry = {};
                                entry.id = encodeURIComponent(id);
                                self.lcrratesDelete(entry, function(data) {
                                });
                        });
                        if(checkedValues.length > 0) {
                            self.lcrratesRender();
                            toastr.success(monster.template(self, '!' + self.i18n.active().lcrrates.deleteSuccess ))
                        }
                }),
                // add entry
                container.on("click", "#add-lcrrates-link", function() {
                    var data = $(this),
                        sList = {};
                        $.each(['id','carrierid','routes','iso_country_code','rate_name','rate_cost',
                            'direction','flatrate','options','prefix','rate_increment','rate_minimum',
                            'rate_surcharge','weight'], function(i, v) {
                                sList[v] = {
                                    name: 'metadata.' + v,
                                    id: 'metadata.'+ v,
                                    key: 'metadata.' + v,
                                    value: '',
                                    label: self.i18n.active().lcrrates.tableTitles[v],
                                    type: self.getlcrratesType(v),
                                    resource: self.getlcrratesResource(v)
                                }
                        });
                        detail = $(monster.template(self, "lcrrates-edit", {
                            metadata: '',
                            editlist: sList
                        }));
                    detail.find("#cancel").on("click", function() {
                        edit.dialog("close").remove()

                    }), detail.find("#book-detail-add").on("click", function() {
                        var formData = monster.ui.getFormData('lcrrates_detail_dialog');
                        self.lcrratesAdd(formData.metadata, function(data) {
                                toastr.success(monster.template(self, '!' + self.i18n.active().lcrrates.addSuccess + data.id ));
                                self.lcrratesRender();
                                edit.dialog('close').remove();
                        });
                    });
                    flags.populateDropdown(detail.find('#metadata_country'), 'inherit', {inherit: ''});
                    detail.find('#metadata_country').chosenImage({ search_contains: true, width: '220px' });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().lcrrates.detailDialog.popupTitle,
                        position: ["center", 20]
                    });
                }),
                // edit entry
                container.on("click", ".detail-link", function() {
                    var data = $(this),
                        row = data.context.dataset.row,
                        sData = self.appFlags.tableData[row][6],
                        sList = {};
                        $.each(sData, function(i, id) {
                                sList[i] = {
                                    name: 'metadata.' + i,
                                    id: 'metadata.' + i,
                                    key: 'metadata.' + i,
                                    value: id,
                                    label: self.i18n.active().lcrrates.tableTitles[i],
                                    type: self.getlcrratesType(i),
                                    resource: self.getlcrratesResource(i)
                                }
                        });
                        detail = $(monster.template(self, "lcrrates-edit", {
                            metadata: sData,
                            editlist: sList
                        }));
                    detail.find("#cancel").on("click", function() {
                        edit.dialog("close").remove()
                    }), detail.find("#book-detail-delete").on("click", function() {
                        var formData = monster.ui.getFormData('lcrrates_detail_dialog');
                        formData.metadata.id = encodeURIComponent(formData.metadata.id);
                        self.lcrratesDelete(formData.metadata, function(data) {
                                self.lcrratesRender();
                                edit.dialog('close').remove();
                                toastr.success(monster.template(self, '!' + self.i18n.active().lcrrates.deleteSuccess + data.id ));
                        });

                    }), detail.find("#book-detail-update").on("click", function() {
                        var formData = monster.ui.getFormData('lcrrates_detail_dialog');
                        formData.metadata.id = encodeURIComponent(formData.metadata.id);
                        self.lcrratesUpdate(formData.metadata, function(data) {
                                self.lcrratesRender();
                                edit.dialog('close').remove();
                                toastr.success(monster.template(self, '!' + self.i18n.active().lcrrates.addSuccess + data.id ));
                        });
                    }),
                    flags.populateDropdown(detail.find('#metadata_country'), self.appFlags.tableData[row][1]||'inherit', {inherit: ''});
                    detail.find('#metadata_country').chosenImage({ search_contains: true, width: '220px' });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().lcrrates.detailDialog.popupTitle,
                        position: ["center", 20]
                    });
                })
            }, getlcrratesType: function(idx) {
                switch (idx) {
                    case 'id': return "hidden"; break; 
                    case 'carrierid': return "select"; break; 
                    case 'direction': return "boolean"; break; 
                    case 'flatrate': return "boolean"; break; 
                    default: return "text";
                }
            }, getlcrratesResource: function(v) {
            switch (v) {
                    case 'carrierid': return monster.resource; break; 
                    case 'direction': var a = {},
                        a = { id: 'outbound', name: v, 'off': 'inbound', 'on': 'outbound', labelon: 'outbound', labeloff: 'inbound'},
                        a = { id: 'inbound', name: v, 'off': 'inbound', 'on': 'outbound', labelon: 'outbound', labeloff: 'inbound'}; return a; break; 
                    case 'flatrate': return ['false', 'true']; break; 
                }
            }, getRes: function(res) {
                    var resource = {};
                        _.each(monster.resource, function(res) {
                            resource[res.id] = {};
                            resource[res.id]['id'] = res.id;
                            resource[res.id]['name'] = res.name;
                            if(data.carrierid == res.id)
                                    resource[res.id]['selected'] = "SELECTED";
                            else
                                    resource[res.id]['selected'] = "";
                    });
            }, lcrratesInitTable: function(template, func) {
                var self = this;
                    table = [
                    {
                        sTitle: '<input type="checkbox" id="select_all_bookentrys"/>',
                        sWidth: "40px",
                        bSortable: false,
                        fnRender: function(data) {
                            return '<input type="checkbox" class="select-checkbox" value="' + data.aData[7] + '"/>'
                        }
                    }, {
                        sTitle: self.i18n.active().lcrrates.tableTitles.iso_country_code,
                        bSortable: false,
                        fnRender: function(data) {
                            return '<img src="css/assets/flags/24/' + data.aData[1] + '.png">'
                        }
                    }, {
                        sTitle: self.i18n.active().lcrrates.tableTitles.carrierid,
                        fnRender: function(data) {
                            return monster.resource_ids[data.aData[2]]['name'];
                        }
                    }, {
                        sTitle: self.i18n.active().lcrrates.tableTitles.ratename
                    }, {
                        sTitle: self.i18n.active().lcrrates.tableTitles.prefix
                    }, {
                        sTitle: self.i18n.active().lcrrates.tableTitles.rate_cost
                    }, {
                        sTitle: self.i18n.active().lcrrates.tableTitles.action,
                        bSortable: false,
                        fnRender: function(data) {
                            return '<a href="#" class="detail-link monster-link blue" data-row="' + data.iDataRow +'"><i class="fa fa-edit"></i></a>'
                        }
                    }, {
                        bVisible: !1
                    }];
                self.lcrratesGetData(function(data) {
                    var lcrratesArray = {};
                        lcrratesArray.resource = {};
                        _.each(monster.resource, function(res) {
                                lcrratesArray.resource[res.id] = {};
                                lcrratesArray.resource[res.id]['id'] = res.id;
                                lcrratesArray.resource[res.id]['name'] = res.name;
                        });
                    lcrratesArray.lcrrates = data;
                    monster.resource_ids = lcrratesArray.resource;
                    monster.ui.table.create("lcrrates", template.find("#lcrrates_grid"), table, data, {
                        sDom: '<"actions_lcrrates">frtlip',
                        aaSorting: [
                            [3, "asc"]
                        ]
                }),
                $.fn.dataTableExt.afnFiltering.pop(),func && func(),
                $("div.actions_lcrrates", template).html('</button><button id="add-lcrrates-link" class="monster-button monster-button-success" data-action="addd">' +
                self.i18n.active().lcrrates.add +  '</button><button id="delete-lcrrates-link" class="monster-button monster-button-danger" data-action="deleted">' +
                self.i18n.active().lcrrates.delete + '</button><button id="upload-link" type="button" class="monster-button monster-button-success upload-action'+
                ' upload-submit"><i class="fa fa-upload"></i></button>'),
                $('#select_all_bookentrys').click(function (e) {
                    $(this).closest('table').find('td input:checkbox').prop('checked', this.checked);
                });
            })
            },
            lcrratesFormatDataTable: function(data) {
                var ret = [];
                return $.each(data, function() {
                    ret.push(['', this.prefix.substring(0,2)||'', this.carrierid||'', this.rate_name||'', this.prefix||'', this.rate_cost||'', this||'', this.id||''])
                }), ret
            },
            lcrratesGetData: function(callback) {
                var self = this;
                self.callApi({
                    resource: "lcrrates.list",
                    data: {
                        accountId: self.accountId,
                        filters: { paginate:false }
                    },
                    success: function(data) {
                        var ret = self.lcrratesFormatDataTable(data.data);
                        self.appFlags.tableData = ret, callback && callback(ret)
                    }
                })
            },
            lcrratesAdd: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'lcrrates.create',
                            data: {
                                    accountId: self.accountId,
                                    data: data
                            },
                            success: function(data) {
                                    callback(data.data);
                            }
                    });
            },

            lcrratesUpdate: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'lcrrates.update',
                            data: {
                                    accountId: self.accountId,
                                    data: data
                            },
                            success: function(data) {
                                    callback && callback(data.data);
                            }
                    });
            },

            lcrratesDelete: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'lcrrates.delete',
                            data: {
                                    accountId: self.accountId,
                                    lcrratesId: data.id,
                                    data: {}

                            },
                            success: function(data) {
                                    callback && callback(data.data);
                            }
                    });
            }

        };
    return app
});