/// <reference path='../ref/VSS/VSS.d.ts' />
/// <reference path='../ref/fullCalendar/fullCalendar.d.ts' />
/// <reference path='../ref/moment/moment.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "Calendar/Calendar", "Calendar/Dialogs", "Calendar/Utils/Guid", "VSS/Controls", "VSS/Controls/Common", "VSS/Controls/Menus", "VSS/Controls/Navigation", "q", "VSS/Service", "TFS/Core/RestClient", "VSS/Utils/Core", "VSS/Utils/Date", "VSS/WebApi/Constants", "TFS/Work/RestClient"], function (require, exports, Calendar, Calendar_Dialogs, Calendar_Utils_Guid, Controls, Controls_Common, Controls_Menus, Controls_Navigation, Q, Service, Tfs_Core_WebApi, Utils_Core, Utils_Date, WebApi_Constants, Work_Client) {
    function newElement(tag, className, text) {
        return $("<" + tag + "/>")
            .addClass(className || "")
            .text(text || "");
    }
    var EventSourceCollection = (function () {
        function EventSourceCollection(sources) {
            var _this = this;
            this._collection = [];
            this._map = {};
            this._collection = sources || [];
            $.each(this._collection, function (index, source) {
                _this._map[source.id] = source;
            });
        }
        EventSourceCollection.prototype.getById = function (id) {
            return this._map[id];
        };
        EventSourceCollection.prototype.getAllSources = function () {
            return this._collection;
        };
        EventSourceCollection.create = function () {
            var _this = this;
            if (!this._deferred) {
                this._deferred = Q.defer();
                VSS.getServiceContributions(VSS.getExtensionContext().namespace + "#eventSources").then(function (contributions) {
                    var servicePromises = $.map(contributions, function (contribution) { return contribution.getInstance(contribution.id); });
                    Q.allSettled(servicePromises).then(function (promiseStates) {
                        var services = [];
                        promiseStates.forEach(function (promiseState, index) {
                            if (promiseState.value) {
                                services.push(promiseState.value);
                            }
                            else {
                                console.log("Failed to get calendar event source instance for: " + contributions[index].id);
                            }
                        });
                        _this._deferred.resolve(new EventSourceCollection(services));
                    });
                });
            }
            return this._deferred.promise;
        };
        return EventSourceCollection;
    })();
    exports.EventSourceCollection = EventSourceCollection;
    var CalendarView = (function (_super) {
        __extends(CalendarView, _super);
        function CalendarView(options) {
            _super.call(this, options);
            this._calendarEventSourceMap = {};
            this._eventSources = new EventSourceCollection([]);
            this._defaultEvents = options.defaultEvents || [];
        }
        CalendarView.prototype.initialize = function () {
            var _this = this;
            this._setupToolbar();
            this._calendar = Controls.create(Calendar.Calendar, this._element.find('.calendar-container'), $.extend({}, {
                fullCalendarOptions: {
                    aspectRatio: this._getCalendarAspectRatio(),
                    handleWindowResize: false
                }
            }, this._options));
            EventSourceCollection.create().then(function (eventSources) {
                _this._eventSources = eventSources;
                _this._calendar.addEvents(_this._defaultEvents);
                _this._addDefaultEventSources();
                _this._calendar.addCallback(Calendar.FullCalendarCallbackType.eventAfterRender, _this._eventAfterRender.bind(_this));
                _this._calendar.addCallback(Calendar.FullCalendarCallbackType.dayClick, _this._dayClick.bind(_this));
                _this._calendar.addCallback(Calendar.FullCalendarCallbackType.eventClick, _this._eventClick.bind(_this));
            });
            var setAspectRatio = Utils_Core.throttledDelegate(this, 300, function () {
                this._calendar.setOption("aspectRatio", this._getCalendarAspectRatio());
            });
            window.addEventListener("resize", function () {
                setAspectRatio();
            });
            this._updateTitle();
            this._fetchIterationData().then(function (iterations) {
                _this._iterations = iterations;
            });
        };
        CalendarView.prototype._isInIteration = function (date) {
            var inIteration = false;
            this._iterations.forEach(function (iteration, index, array) {
                if (date >= iteration.attributes.startDate && date <= iteration.attributes.finishDate) {
                    inIteration = true;
                    return;
                }
            });
            return inIteration;
        };
        CalendarView.prototype._getCalendarAspectRatio = function () {
            var leftPane = this._element.closest(".splitter>.leftPane");
            var titleBar = this._element.find("div.calendar-title");
            var toolbar = this._element.find("div.menu-container");
            return leftPane.width() / (leftPane.height() - toolbar.height() - titleBar.height() - 20);
        };
        CalendarView.prototype._setupToolbar = function () {
            this._toolbar = Controls.BaseControl.createIn(Controls_Menus.MenuBar, this._element.find('.menu-container'), {
                items: this._createToolbarItems(),
                executeAction: Utils_Core.delegate(this, this._onToolbarItemClick)
            });
            this._element.find('.menu-container').addClass('toolbar');
        };
        CalendarView.prototype._createToolbarItems = function () {
            return [
                { id: "new-item", text: "New Item", title: "Add event", icon: "icon-add-small", showText: false },
                { separator: true },
                { id: "refresh-items", title: "Refresh", icon: "icon-refresh", showText: false },
                { id: "move-today", text: "Today", title: "Today", noIcon: true, showText: true, cssClass: "right-align" },
                { id: "move-next", text: "Next", icon: "icon-drop-right", title: "Next", noIcon: false, showText: false, cssClass: "right-align" },
                { id: "move-prev", text: "Prev", icon: "icon-drop-left", showText: false, title: "Previous", noIcon: false, cssClass: "right-align" }
            ];
        };
        CalendarView.prototype._onToolbarItemClick = function (e) {
            var command = e ? e.get_commandName() : '';
            var result = false;
            switch (command) {
                case "refresh-items":
                    this._calendar.refreshEvents();
                    break;
                case "new-item":
                    this._addEventClicked();
                    break;
                case "move-prev":
                    this._calendar.prev();
                    this._updateTitle();
                    break;
                case "move-next":
                    this._calendar.next();
                    this._updateTitle();
                    break;
                case "move-today":
                    this._calendar.showToday();
                    this._updateTitle();
                    break;
                default:
                    result = true;
                    break;
            }
            return result;
        };
        CalendarView.prototype._updateTitle = function () {
            var formattedDate = this._calendar.getFormattedDate('MMMM YYYY');
            $('.calendar-title').text(formattedDate);
        };
        CalendarView.prototype._addEventClicked = function () {
            var addEventSources = $.grep(this._eventSources.getAllSources(), function (eventSource) { return !!eventSource.addEvents; });
            var event = {
                title: "",
                startDate: Utils_Date.shiftToUTC(new Date()),
                eventId: Calendar_Utils_Guid.newGuid()
            };
            this._addEvent(event, addEventSources[0]);
        };
        CalendarView.prototype._addDefaultEventSources = function () {
            var _this = this;
            var eventSources = $.map(this._eventSources.getAllSources(), function (eventSource) {
                var sourceAndOptions = {
                    source: eventSource,
                    callbacks: {}
                };
                sourceAndOptions.callbacks[Calendar.FullCalendarCallbackType.eventRender] = _this._eventRender.bind(_this, eventSource);
                if (eventSource.background) {
                    sourceAndOptions.options = { rendering: "background" };
                }
                return sourceAndOptions;
            });
            var calendarEventSources = this._calendar.addEventSources(eventSources);
            calendarEventSources.forEach(function (calendarEventSource, index) {
                _this._calendarEventSourceMap[eventSources[index].source.id] = calendarEventSource;
            });
        };
        CalendarView.prototype._getCalendarEventSource = function (eventSourceId) {
            return this._calendarEventSourceMap[eventSourceId];
        };
        CalendarView.prototype._eventRender = function (eventSource, event, element, view) {
            var _this = this;
            if (event.rendering !== 'background') {
                var commands = [];
                if (eventSource.updateEvents) {
                    commands.push({ rank: 5, id: "Edit", text: "Edit", icon: "icon-edit" });
                }
                if (eventSource.removeEvents) {
                    commands.push({ rank: 10, id: "Delete", text: "Delete", icon: "icon-delete" });
                }
                if (commands.length > 0) {
                    var menuOptions = {
                        items: commands,
                        executeAction: function (e) {
                            var command = e.get_commandName();
                            switch (command) {
                                case "Edit":
                                    _this._editEvent(event);
                                    break;
                                case "Delete":
                                    _this._deleteEvent(event);
                                    break;
                            }
                        }
                    };
                    var $element = $(element);
                    $element.on("contextmenu", function (e) {
                        if (_this._popupMenu) {
                            _this._popupMenu.dispose();
                            _this._popupMenu = null;
                        }
                        _this._popupMenu = Controls.BaseControl.createIn(Controls_Menus.PopupMenu, _this._element, $.extend({
                            align: "left-bottom"
                        }, menuOptions, {
                            items: [{ childItems: Controls_Menus.sortMenuItems(commands) }]
                        }));
                        Utils_Core.delay(_this, 10, function () {
                            this._popupMenu.popup(this._element, $element);
                        });
                        e.preventDefault();
                    });
                }
            }
        };
        CalendarView.prototype._eventAfterRender = function (event, element, view) {
            if (event.rendering === "background") {
                element.addClass("sprint-event");
                element.data("event", event);
                var contentCellIndex = 0;
                var $contentCells = element.closest(".fc-row.fc-widget-content").find(".fc-content-skeleton table tr td");
                element.parent().children().each(function (index, child) {
                    if ($(child).data("event") && $(child).data("event").title === event.title) {
                        return false;
                    }
                    contentCellIndex += parseInt($(child).attr("colspan"));
                });
                if (event["sprintProcessedFor"] === undefined || event["sprintProcessedFor"] !== view["renderId"]) {
                    event["sprintProcessedFor"] = view["renderId"];
                    $contentCells.eq(contentCellIndex).append($("<span/>").addClass("sprint-label").text(event.title));
                }
            }
        };
        CalendarView.prototype._dayClick = function (date, jsEvent, view) {
            var _this = this;
            var addEventSources;
            addEventSources = $.grep(this._eventSources.getAllSources(), function (eventSource) { return !!eventSource.addEvents; });
            if (addEventSources.length > 0) {
                var event = {
                    title: "",
                    startDate: Utils_Date.shiftToUTC(new Date(date.valueOf())),
                    eventId: Calendar_Utils_Guid.newGuid()
                };
                var commands = [];
                commands.push({ rank: 5, id: "addEvent", text: "Add event", icon: "icon-add" });
                commands.push({ rank: 10, id: "addDayOff", text: "Add day off", icon: "icon-tfs-build-reason-schedule", disabled: !this._isInIteration(date) });
                var menuOptions = {
                    items: commands,
                    executeAction: function (e) {
                        var command = e.get_commandName();
                        switch (command) {
                            case "addEvent":
                                _this._addEvent(event, addEventSources[0]);
                                break;
                            case "addDayOff":
                                _this._addDayOff(event, addEventSources[1]);
                                break;
                        }
                    }
                };
                var dataDate = Utils_Date.format(Utils_Date.shiftToUTC(new Date(date.valueOf())), "yyyy-MM-dd");
                var $element = $("td.fc-day-number[data-date='" + dataDate + "']");
                if (this._popupMenu) {
                    this._popupMenu.dispose();
                    this._popupMenu = null;
                }
                this._popupMenu = Controls.BaseControl.createIn(Controls_Menus.PopupMenu, this._element, $.extend(menuOptions, {
                    align: "left-bottom",
                    items: [{ childItems: Controls_Menus.sortMenuItems(commands) }]
                }));
                Utils_Core.delay(this, 10, function () {
                    this._popupMenu.popup(this._element, $element);
                });
            }
        };
        CalendarView.prototype._eventClick = function (event, jsEvent, view) {
            this._editEvent(event);
        };
        CalendarView.prototype._addEvent = function (event, eventSource) {
            var _this = this;
            var query = this._calendar.getViewQuery();
            Controls_Common.Dialog.show(Calendar_Dialogs.EditFreeFormEventDialog, {
                event: event,
                title: "Add Event",
                resizable: false,
                okCallback: function (calendarEvent) {
                    eventSource.addEvents([calendarEvent]).then(function (calendarEvents) {
                        var calendarEventSource = _this._getCalendarEventSource(eventSource.id);
                        calendarEventSource.state.dirty = true;
                        _this._calendar.renderEvent(calendarEvent, eventSource.id);
                    });
                },
                categories: this._eventSources.getById("freeForm").getCategories(query).then(function (categories) { return categories.map(function (category) { return category.title; }); })
            });
        };
        CalendarView.prototype._addDayOff = function (event, eventSource) {
            var _this = this;
            var webContext = VSS.getWebContext();
            event.member = { displayName: webContext.user.name, id: webContext.user.id, imageUrl: "", uniqueName: "", url: "" };
            Controls_Common.Dialog.show(Calendar_Dialogs.EditCapacityEventDialog, {
                event: event,
                title: "Add Days Off",
                resizable: false,
                okCallback: function (calendarEvent) {
                    eventSource.addEvents([calendarEvent]).then(function (calendarEvents) {
                        var calendarEventSource = _this._getCalendarEventSource(eventSource.id);
                        calendarEventSource.state.dirty = true;
                        calendarEvent.category = "DaysOff";
                        _this._calendar.renderEvent(calendarEvent, eventSource.id);
                    });
                },
                membersPromise: this._getTeamMembers()
            });
        };
        CalendarView.prototype._getTeamMembers = function () {
            var deferred = Q.defer();
            var webContext = VSS.getWebContext();
            var workClient = Service.VssConnection
                .getConnection()
                .getHttpClient(Tfs_Core_WebApi.CoreHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            workClient.getTeamMembers(webContext.project.name, webContext.team.name).then(function (members) {
                deferred.resolve(members);
            });
            return deferred.promise;
        };
        CalendarView.prototype._editEvent = function (event) {
            var _this = this;
            var calendarEvent = {
                startDate: Utils_Date.addDays(new Date(event.start.valueOf()), 1),
                endDate: event.end,
                title: event.title,
                eventId: event.id,
                category: event.category,
                member: event.member
            };
            var calendarEventSource;
            var eventSource;
            if (event.source) {
                calendarEventSource = event.source.events;
                if (calendarEventSource) {
                    eventSource = calendarEventSource.eventSource;
                }
            }
            else if (event.eventType) {
                eventSource = this._eventSources.getById(event.eventType);
            }
            if (eventSource && eventSource.updateEvents) {
                if (eventSource.id === "freeForm") {
                    var query = this._calendar.getViewQuery();
                    Controls_Common.Dialog.show(Calendar_Dialogs.EditFreeFormEventDialog, {
                        event: calendarEvent,
                        title: "Edit Event",
                        resizable: false,
                        okCallback: function (calendarEvent) {
                            eventSource.updateEvents([calendarEvent]).then(function (calendarEvents) {
                                var originalEventSource = _this._getCalendarEventSource(eventSource.id);
                                originalEventSource.state.dirty = true;
                                event.title = calendarEvent.title;
                                event.category = calendarEvent.category;
                                var end = Utils_Date.addDays(new Date(calendarEvent.endDate.valueOf()), 1);
                                event.end = end;
                                event.start = calendarEvent.startDate;
                                _this._calendar.updateEvent(event);
                            });
                        },
                        categories: this._eventSources.getById("freeForm").getCategories(query).then(function (categories) { return categories.map(function (category) { return category.title; }); })
                    });
                }
                else if (eventSource.id === "daysOff") {
                    Controls_Common.Dialog.show(Calendar_Dialogs.EditCapacityEventDialog, {
                        event: calendarEvent,
                        title: "Edit Days Off",
                        resizable: false,
                        isEdit: true,
                        okCallback: function (calendarEvent) {
                            eventSource.updateEvents([calendarEvent]).then(function (calendarEvents) {
                                var originalEventSource = _this._getCalendarEventSource(eventSource.id);
                                originalEventSource.state.dirty = true;
                                var end = Utils_Date.addDays(new Date(calendarEvent.endDate.valueOf()), 1);
                                event.end = end;
                                event.start = calendarEvent.startDate;
                                _this._calendar.updateEvent(event);
                            });
                        }
                    });
                }
            }
        };
        CalendarView.prototype._deleteEvent = function (event) {
            var _this = this;
            var start = new Date(event.start.valueOf());
            var calendarEvent = {
                startDate: start,
                title: event.title,
                eventId: event.id,
                category: event.category,
                member: event.member
            };
            var calendarEventSource;
            var eventSource;
            if (event.source) {
                calendarEventSource = event.source.events;
                if (calendarEventSource) {
                    eventSource = calendarEventSource.eventSource;
                }
            }
            else if (event.eventType) {
                eventSource = this._eventSources.getById(event.eventType);
            }
            if (eventSource && eventSource.removeEvents) {
                if (confirm("Are you sure you want to delete the event?")) {
                    eventSource.removeEvents([calendarEvent]).then(function (calendarEvents) {
                        var originalEventSource = _this._getCalendarEventSource(eventSource.id);
                        originalEventSource.state.dirty = true;
                        _this._calendar.removeEvent(event.id);
                    });
                }
            }
        };
        CalendarView.prototype._fetchIterationData = function () {
            var deferred = Q.defer();
            var iterationPath;
            var iterationPromises = [];
            var result = [];
            var webContext = VSS.getWebContext();
            var teamContext = { projectId: webContext.project.id, teamId: webContext.team.id, project: "", team: "" };
            var workClient = Service.VssConnection
                .getConnection()
                .getHttpClient(Work_Client.WorkHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            workClient.getTeamIterations(teamContext).then(function (iterations) {
                iterations.forEach(function (iteration, index, array) {
                    result.push(iteration);
                });
                deferred.resolve(result);
            }, function (e) {
                deferred.reject(e);
            });
            return deferred.promise;
        };
        return CalendarView;
    })(Controls_Navigation.NavigationView);
    exports.CalendarView = CalendarView;
    var SummaryView = (function (_super) {
        __extends(SummaryView, _super);
        function SummaryView() {
            _super.apply(this, arguments);
        }
        SummaryView.prototype.initialize = function () {
            var _this = this;
            _super.prototype.initialize.call(this);
            this._rendering = false;
            this._calendar = Controls.Enhancement.getInstance(Calendar.Calendar, $(".vss-calendar"));
            this._calendar.addCallback(Calendar.FullCalendarCallbackType.eventAfterAllRender, function () {
                EventSourceCollection.create().then(function (eventSources) {
                    if (!_this._rendering) {
                        _this._rendering = true;
                        _this._loadSections(eventSources);
                    }
                });
            });
        };
        SummaryView.prototype._loadSections = function (eventSources) {
            var _this = this;
            this.getElement().children().remove();
            var sources = eventSources.getAllSources().slice(0).sort(function (es1, es2) {
                return es1.order - es2.order;
            });
            var categoryPromises = [];
            $.each(sources, function (index, source) {
                categoryPromises.push(_this._renderSection(source));
            });
            Q.all(categoryPromises).then(function () {
                _this._rendering = false;
            });
        };
        SummaryView.prototype._renderSection = function (source) {
            var _this = this;
            var deferred = Q.defer();
            var query = this._calendar.getViewQuery();
            source.getCategories(query).then(function (categories) {
                if (categories.length > 0) {
                    var $sectionContainer = newElement("div", "category").appendTo(_this.getElement());
                    newElement("h3", "", source.name).appendTo($sectionContainer);
                    $.each(categories, function (index, category) {
                        var $titleContainer = newElement("div", "category-title").appendTo($sectionContainer);
                        if (category.imageUrl) {
                            newElement("img", "category-icon").attr("src", category.imageUrl).appendTo($titleContainer);
                        }
                        if (category.color) {
                            newElement("div", "category-color").css("background-color", category.color).appendTo($titleContainer);
                        }
                        newElement("span", "category-titletext", category.title).appendTo($titleContainer);
                        newElement("div", ["category-subtitle", (category.color ? "c-color" : ""), (category.imageUrl ? "c-icon" : "")].join(" "), category.subTitle).appendTo($sectionContainer);
                    });
                }
                deferred.resolve(source);
            });
            return deferred.promise;
        };
        return SummaryView;
    })(Controls.BaseControl);
    exports.SummaryView = SummaryView;
});

//# sourceMappingURL=../Calendar/Views.js.map