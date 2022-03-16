var app = Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        this._getStoryFields();
        //this._generateStoryData('_objectVersion');
    },

    _getStoryFields: function() {
        var storyFields = [];
        var modelFactory = Rally.data.ModelFactory.getModel({
            type: 'User Story',
            success: function(model) {
                Ext.Array.each(model.getFields(), function(field) {
                    storyFields.push({'field': field.name});
                });
                this._generateFieldComboBox(storyFields);
            }, 
            scope: this
        });
    },


    _generateFieldComboBox: function(fields) {

        var myStore = Ext.create('Rally.data.custom.Store', {
            pageSize: fields.length,
            data: fields
        });

        var fieldComboBox = Ext.create('Rally.ui.combobox.ComboBox', {
            store: myStore,
            displayField: 'field',
            listeners: {
                //select doesn't work for some reason...
                beforeselect: function(combobox, selected) {
                    this._generateStoryData(selected.data.field);
                }, 
                scope: this
            }
        });
        this.add(fieldComboBox);
    },

    _generateStoryData: function(selectedField) {

        // var storyStore = Ext.create('Rally.data.WsapiDataStore', {
        //     model: 'User Story',
        //     autoLoad: true,
        //     fetch: ['ScheduleState', selectedField],
        //     listeners: {
        //         load: function(store, stories) {
        //             if (stories.length !== 0) {
        //                 this._generateChartDataArray(stories, selectedField);
        //             }
        //             else {
        //                 console.log('No stories at all...');
        //             }
        //         }, 
        //         scope: this
        //     }
        // });
        var lookbackStore = Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            fetch: [selectedField, 'ScheduleState'],
            hydrate: ['ScheduleState'],
            filters: [
                { property: '_TypeHierarchy', operator: '=', value: 'HierarchicalRequirement' },
                { property: '__At', value: 'current' },
                {
                    property: '_ProjectHierarchy',
                    operator: '=',
                    value: this.getContext().getProject().ObjectID
                }

            ],
            listeners: {
                load: function(store, stories) {
                    if (stories.length !== 0) {
                        this._generateChartDataArray(stories, selectedField);
                    }
                    else {
                        console.log('No stories at all...');
                    }
                },
                scope: this
            }
        });
    },

    _generateChartDataArray: function(stories, selectedField)
    {
        var chartData = [];
        Ext.Array.each (stories, function (story) {

            var fieldValue = story.get(selectedField);
            var scheduleStateValue = story.get('ScheduleState');


            if (chartData[fieldValue] === undefined) {
                chartData[fieldValue] = {};
                chartData[fieldValue][scheduleStateValue] = 1;
            }
            else {

                if (chartData[fieldValue][scheduleStateValue] === undefined) {

                    chartData[fieldValue][scheduleStateValue] = 1;
                }
                else {
                    chartData[fieldValue][scheduleStateValue] += 1;
                }
            }
        });
        this._generateSeries(chartData, selectedField);
    },

    _generateSeries: function(chartData, selectedField)
    {

        var mySeries = [];
        for(var key in chartData){
            var tobj = {'name': '', 'data': []};
            var tdata = [0, 0, 0, 0, 0, 0];
            tobj.name = key;
            for (var key2 in chartData[key]) {
                if (key2 == 'Idea') { tdata[0] += chartData[key][key2]; }
                else if (key2 == 'Defined') { tdata[1] += chartData[key][key2]; }
                else if (key2 == 'In-Progress') { tdata[2] += chartData[key][key2]; }
                else if (key2 == 'Completed') { tdata[3] += chartData[key][key2]; }
                else if (key2 == 'Accepted') { tdata[4] += chartData[key][key2]; }
                else { tdata[5] += chartData[key][key2]; }
            }
            tobj.data = tdata;
            mySeries.push(tobj); 
        }
        this._updateChart(mySeries, selectedField);
    },

    _updateChart: function(mySeries, selectedField) {
        if (this.myChart !== undefined) {
            this.remove(this.myChart);
        }
        this._generateChart(mySeries, selectedField);

    },

    _generateChart: function(mySeries, selectedField) {

        this.myChart = Ext.create('Rally.ui.chart.Chart', {
            chartConfig: {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Stories by Schedule State by ' + selectedField + ' Field'
                },
                xAxis: {
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Number of Stories'
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y}</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                }
            },
            chartData: {
                series: mySeries,
                categories: [
                        'Idea',
                        'Defined',
                        'In-Progress',
                        'Completed',
                        'Accepted',
                        'Released'
                    ]
            }
        });

        this.add(this.myChart);
    }

});