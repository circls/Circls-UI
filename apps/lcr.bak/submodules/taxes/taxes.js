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
                "lcrrates.taxes.render": "taxesRender"
            },
            appFlags: {
                tableData: []
            },
            taxesRender: function(content) {
                var self = this,
                    content = content || {},
                    index = content.parent || $(".right-content"),
                    template = $(monster.template(self, "taxes-layout"));
                self.taxesInitTable(template, function() {
                    self.taxesBindEvents(template), index.empty().append(template)
                })
            }, taxesBindEvents: function(container) {
                var self = this;

                // upload taxes
                container.on("click", "#upload-link", function() {
                    var data = $(this),
                        detail = $(monster.template(self, "upload", {
                            metadata: data
                        }));
                    detail.find(".cancel-link").on("click", function() {
                        edit.dialog("close").remove()

                    });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().taxes.uploadDialog.popupTitle,
                        position: ["center", 20]
                    });
                }),
                // delete entry
                container.on("click", "#delete-taxes-link", function() {
                    var data = $(this);
                        var checkedValues = $("input:checkbox:checked", "#taxes_grid").map(function() {
                            return $(this).val();
                        }).get(); delete checkedValues['on'];
                        $.each(checkedValues, function(i, id) {
                                var entry = {};
                                entry.id = encodeURIComponent(id);
                                self.taxesDelete(entry, function(data) {
                                });
                        });
                        if(checkedValues.length > 0) {
                            self.taxesRender();
                            toastr.success(monster.template(self, '!' + self.i18n.active().taxes.deleteSuccess ))
                        }
                }),
                // add entry
                container.on("click", "#add-taxes-link", function() {
                    var data = $(this),
                        sList = {};
                        $.each(['id','name', 'rate', 'description', 'group', 'view'], function(i, v) {
                                sList[v] = {
                                    name: 'metadata.' + v,
                                    id: 'metadata.'+ v,
                                    key: 'metadata.' + v,
                                    value: '',
                                    label: self.i18n.active().taxes.tableTitles[v],
                                    type: self.gettaxesType(v)
                                }
                        });
//                        console.log(sList);
                        detail = $(monster.template(self, "taxes-edit", {
                            metadata: '',
                            editlist: sList
                        }));
                    detail.find("#cancel").on("click", function() {
                        edit.dialog("close").remove()

                    }), detail.find("#book-detail-add").on("click", function() {
                        var formData = monster.ui.getFormData('taxes_detail_dialog');
                        self.taxesAdd(formData.metadata, function(data) {
                                toastr.success(monster.template(self, '!' + self.i18n.active().taxes.addSuccess + data.id ));
                                self.render();
                                edit.dialog('close').remove();
                        });
                    });
                    flags.populateDropdown(detail.find('#metadata_country'), 'inherit', {inherit: ''});
                    detail.find('#metadata_country').chosenImage({ search_contains: true, width: '220px' });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().taxes.detailDialog.popupTitle,
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
                                    label: self.i18n.active().taxes.tableTitles[i],
                                    type: self.gettaxesType(i)
                                }
                        });
                        detail = $(monster.template(self, "taxes-edit", {
                            metadata: sData,
                            editlist: sList
                        }));
                    detail.find("#cancel").on("click", function() {
                        edit.dialog("close").remove()
                    }), detail.find("#book-detail-delete").on("click", function() {
                        var formData = monster.ui.getFormData('taxes_detail_dialog');
                        formData.metadata.id = encodeURIComponent(formData.metadata.id);
                        self.taxesDelete(formData.metadata, function(data) {
                                self.render();
                                edit.dialog('close').remove();
                                toastr.success(monster.template(self, '!' + self.i18n.active().taxes.deleteSuccess + data.id ));
                        });

                    }), detail.find("#book-detail-update").on("click", function() {
                        var formData = monster.ui.getFormData('taxes_detail_dialog');
                        formData.metadata.id = encodeURIComponent(formData.metadata.id);
                        self.taxesUpdate(formData.metadata, function(data) {
                                self.render();
                                edit.dialog('close').remove();
                                toastr.success(monster.template(self, '!' + self.i18n.active().taxes.addSuccess + data.id ));
                        });
                    }),
                    flags.populateDropdown(detail.find('#metadata_country'), self.appFlags.tableData[row][1]||'inherit', {inherit: ''});
                    detail.find('#metadata_country').chosenImage({ search_contains: true, width: '220px' });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().taxes.detailDialog.popupTitle,
                        position: ["center", 20]
                    });
                })
            }, gettaxesType: function(idx) {
                switch (idx) {
                    case 'id': return "hidden"; break; 
                    case 'view': return "boolean"; break; 
                    case 'group': return "select"; break; 
                    default: return "text";
                }
            }, taxesInitTable: function(template, func) {
                var self = this;
                    table = [
                    {
                        sTitle: '<input type="checkbox" id="select_all_bookentrys"/>',
                        sWidth: "40px",
                        bSortable: false,
                        fnRender: function(data) {
                            return '<input type="checkbox" class="select-checkbox" value="' + data.aData[6] + '"/>'
                        }
                    }, {
                        sTitle: self.i18n.active().taxes.tableTitles.id,
                    }, {
                        sTitle: self.i18n.active().taxes.tableTitles.name
                    }, {
                        sTitle: self.i18n.active().taxes.tableTitles.rate
                    }, {
                        sTitle: self.i18n.active().taxes.tableTitles.group
                    }, {
                        sTitle: self.i18n.active().taxes.tableTitles.view
                    }, {
                        sTitle: self.i18n.active().taxes.tableTitles.action,
                        bSortable: false,
                        fnRender: function(data) {
                            return '<a href="#" class="detail-link monster-link blue" data-row="' + data.iDataRow +'"><i class="fa fa-edit"></i></a>'
                        }
                    }, {
                        bVisible: !1
                    }];
                self.taxesGetData(function(data) {
//                    console.log(data),
                    monster.ui.table.create("taxes", template.find("#taxes_grid"), table, data, {
                        sDom: '<"actions_taxes">frtlip',
                        aaSorting: [
                            [3, "asc"]
                        ]
                }),
                $.fn.dataTableExt.afnFiltering.pop(),func && func(),
                $("div.actions_taxes", template).html('</button><button id="add-taxes-link" class="monster-button monster-button-success" data-action="addd">' +
                self.i18n.active().taxes.add +  '</button><button id="delete-taxes-link" class="monster-button monster-button-danger" data-action="deleted">' +
                self.i18n.active().taxes.delete + '</button><button id="upload-link" type="button" class="monster-button monster-button-success upload-action'+
                ' upload-submit"><i class="fa fa-upload"></i></button>'),
                $('#select_all_bookentrys').click(function (e) {
                    $(this).closest('table').find('td input:checkbox').prop('checked', this.checked);
                });
            })
            },
            taxesFormatDataTable: function(data) {
                var ret = [];
                return $.each(data, function() {
                    ret.push(['', this.id||'', this.name||'', this.rate||'', this.group||'', this.view||'', this||'', this.id||''])
                }), ret
            },
            taxesGetData: function(callback) {
                var self = this;
                self.callApi({
                    resource: "taxes.list",
                    data: {
                        accountId: self.accountId,
                        filters: { paginate:false }
                    },
                    success: function(data) {
                        var ret = self.taxesFormatDataTable(data.data);
                        self.appFlags.tableData = ret, callback && callback(ret)
                    }
                })
            },
            taxesAdd: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'taxes.create',
                            data: {
                                    accountId: self.accountId,
                                    data: data
                            },
                            success: function(data) {
                                    callback(data.data);
                            }
                    });
            },

            taxesUpdate: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'taxes.update',
                            data: {
                                    accountId: self.accountId,
                                    data: data
                            },
                            success: function(data) {
                                    callback && callback(data.data);
                            }
                    });
            },

            taxesDelete: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'taxes.delete',
                            data: {
                                    accountId: self.accountId,
                                    taxesId: data.id,
                                    data: {}

                            },
                            success: function(data) {
                                    callback && callback(data.data);
                            }
                    });
            },

        };
    return app
});