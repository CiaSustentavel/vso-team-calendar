/// <reference path='../ref/VSS/VSS.d.ts' />
/// <reference path='../ref/fullCalendar/fullCalendar.d.ts' />
/// <reference path='../ref/moment/moment.d.ts' />
/// <reference path='../ref/VSS/jquery.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "Calendar/Utils/Color", "Calendar/Utils/Guid", "VSS/Controls", "q", "VSS/Utils/Date", "VSS/Utils/String"], function (require, exports, Calendar_ColorUtils, Calendar_Utils_Guid, Controls, Q, Utils_Date, Utils_String) {
    (function (FullCalendarCallbackType) {
        FullCalendarCallbackType[FullCalendarCallbackType["viewRender"] = 0] = "viewRender";
        FullCalendarCallbackType[FullCalendarCallbackType["viewDestroy"] = 1] = "viewDestroy";
        FullCalendarCallbackType[FullCalendarCallbackType["dayRender"] = 2] = "dayRender";
        FullCalendarCallbackType[FullCalendarCallbackType["windowResize"] = 3] = "windowResize";
        FullCalendarCallbackType[FullCalendarCallbackType["dayClick"] = 4] = "dayClick";
        FullCalendarCallbackType[FullCalendarCallbackType["eventClick"] = 5] = "eventClick";
        FullCalendarCallbackType[FullCalendarCallbackType["eventMouseover"] = 6] = "eventMouseover";
        FullCalendarCallbackType[FullCalendarCallbackType["eventMouseout"] = 7] = "eventMouseout";
        FullCalendarCallbackType[FullCalendarCallbackType["select"] = 8] = "select";
        FullCalendarCallbackType[FullCalendarCallbackType["unselect"] = 9] = "unselect";
        FullCalendarCallbackType[FullCalendarCallbackType["eventRender"] = 10] = "eventRender";
        FullCalendarCallbackType[FullCalendarCallbackType["eventAfterRender"] = 11] = "eventAfterRender";
        FullCalendarCallbackType[FullCalendarCallbackType["eventDestroy"] = 12] = "eventDestroy";
        FullCalendarCallbackType[FullCalendarCallbackType["eventAfterAllRender"] = 13] = "eventAfterAllRender";
        FullCalendarCallbackType[FullCalendarCallbackType["eventDragStart"] = 14] = "eventDragStart";
        FullCalendarCallbackType[FullCalendarCallbackType["eventDragStop"] = 15] = "eventDragStop";
        FullCalendarCallbackType[FullCalendarCallbackType["eventDrop"] = 16] = "eventDrop";
        FullCalendarCallbackType[FullCalendarCallbackType["eventResizeStart"] = 17] = "eventResizeStart";
        FullCalendarCallbackType[FullCalendarCallbackType["eventResizeStop"] = 18] = "eventResizeStop";
        FullCalendarCallbackType[FullCalendarCallbackType["eventResize"] = 19] = "eventResize";
        FullCalendarCallbackType[FullCalendarCallbackType["drop"] = 20] = "drop";
        FullCalendarCallbackType[FullCalendarCallbackType["eventReceive"] = 21] = "eventReceive";
    })(exports.FullCalendarCallbackType || (exports.FullCalendarCallbackType = {}));
    var FullCalendarCallbackType = exports.FullCalendarCallbackType;
    (function (FullCalendarEventRenderingCallbackType) {
    })(exports.FullCalendarEventRenderingCallbackType || (exports.FullCalendarEventRenderingCallbackType = {}));
    var FullCalendarEventRenderingCallbackType = exports.FullCalendarEventRenderingCallbackType;
    var Calendar = (function (_super) {
        __extends(Calendar, _super);
        function Calendar(options) {
            _super.call(this, $.extend({ cssClass: "vss-calendar" }, options));
            this._callbacks = {};
            this._calendarSources = [];
        }
        Calendar.prototype.initialize = function () {
            var _this = this;
            _super.prototype.initialize.call(this);
            var aspectRatio = $('.leftPane').width() / ($('.leftPane').height() - 85);
            aspectRatio = parseFloat(aspectRatio.toFixed(1));
            this._element.fullCalendar($.extend({
                eventRender: this._getComposedCallback(FullCalendarCallbackType.eventRender),
                eventAfterRender: this._getComposedCallback(FullCalendarCallbackType.eventAfterRender),
                eventAfterAllRender: this._getComposedCallback(FullCalendarCallbackType.eventAfterAllRender),
                eventDestroy: this._getComposedCallback(FullCalendarCallbackType.eventDestroy),
                viewRender: function (view, element) { return _this._viewRender(view, element); },
                viewDestroy: this._getComposedCallback(FullCalendarCallbackType.viewDestroy),
                dayRender: this._getComposedCallback(FullCalendarCallbackType.dayRender),
                windowResize: this._getComposedCallback(FullCalendarCallbackType.windowResize),
                dayClick: this._getComposedCallback(FullCalendarCallbackType.dayClick),
                eventClick: this._getComposedCallback(FullCalendarCallbackType.eventClick),
                eventMouseover: this._getComposedCallback(FullCalendarCallbackType.eventMouseover),
                eventMouseout: this._getComposedCallback(FullCalendarCallbackType.eventMouseout),
                select: this._getComposedCallback(FullCalendarCallbackType.select),
                unselect: this._getComposedCallback(FullCalendarCallbackType.unselect),
                eventDragStart: this._getComposedCallback(FullCalendarCallbackType.eventDragStart),
                eventDragStop: this._getComposedCallback(FullCalendarCallbackType.eventDragStop),
                eventDrop: this._getComposedCallback(FullCalendarCallbackType.eventDrop),
                eventResizeStart: this._getComposedCallback(FullCalendarCallbackType.eventResizeStart),
                eventResizeStop: this._getComposedCallback(FullCalendarCallbackType.eventResizeStop),
                eventResize: this._getComposedCallback(FullCalendarCallbackType.eventResize),
                drop: this._getComposedCallback(FullCalendarCallbackType.drop),
                eventReceive: this._getComposedCallback(FullCalendarCallbackType.eventReceive),
                header: false,
                aspectRatio: aspectRatio,
                columnFormat: "dddd"
            }, this._options.fullCalendarOptions));
        };
        Calendar.prototype.addEventSource = function (source, options, callbacks) {
            this.addEventSources([{ source: source, options: options, callbacks: callbacks }]);
        };
        Calendar.prototype.addEventSources = function (sources) {
            var _this = this;
            sources.forEach(function (source) {
                var calendarSource = _this._createEventSource(source.source, source.options || {});
                _this._calendarSources.push(calendarSource);
                _this._element.fullCalendar("addEventSource", calendarSource);
                if (source.callbacks) {
                    var callbackTypes = Object.keys(source.callbacks);
                    for (var i = 0; i < callbackTypes.length; ++i) {
                        var callbackType = parseInt(callbackTypes[i]);
                        if (callbackType === FullCalendarCallbackType.eventAfterAllRender) {
                            continue;
                        }
                        _this.addCallback(callbackType, _this._createFilteredCallback(source.callbacks[callbackTypes[i]], function (event) { return event["eventType"] === source.source.id; }));
                    }
                }
            });
            this.refreshEvents();
            return this._calendarSources;
        };
        Calendar.prototype.getViewQuery = function () {
            var view = this._element.fullCalendar("getView");
            return {
                startDate: Utils_Date.shiftToUTC(new Date(view.start.valueOf())),
                endDate: Utils_Date.shiftToUTC(new Date(view.end.valueOf()))
            };
        };
        Calendar.prototype.next = function () {
            this._element.fullCalendar("next");
        };
        Calendar.prototype.prev = function () {
            this._element.fullCalendar("prev");
        };
        Calendar.prototype.showToday = function () {
            this._element.fullCalendar("today");
        };
        Calendar.prototype.getFormattedDate = function (format) {
            var currentDate = this._element.fullCalendar("getDate");
            return currentDate.format(format);
        };
        Calendar.prototype.renderEvent = function (event, eventType) {
            var end = Utils_Date.addDays(new Date(event.endDate.valueOf()), 1);
            var calEvent = {
                id: event.eventId,
                title: event.title,
                allDay: true,
                start: event.startDate,
                end: end,
                eventType: eventType,
                category: event.category
            };
            if (eventType === 'daysOff') {
                calEvent.member = event.member;
                calEvent.title = event.member.displayName + " Day Off";
            }
            var color = Calendar_ColorUtils.generateColor((event.category || "uncategorized").toLowerCase());
            calEvent.backgroundColor = color;
            calEvent.borderColor = color;
            this._element.fullCalendar("renderEvent", calEvent, false);
        };
        Calendar.prototype.updateEvent = function (event) {
            var color = Calendar_ColorUtils.generateColor((event.category || "uncategorized").toLowerCase());
            event.backgroundColor = color;
            event.borderColor = color;
            this._element.fullCalendar("updateEvent", event);
        };
        Calendar.prototype.setOption = function (key, value) {
            this._element.fullCalendar("option", key, value);
        };
        Calendar.prototype.refreshEvents = function (eventSource) {
            if (!eventSource) {
                $('.sprint-label').remove();
                this._element.fullCalendar("refetchEvents");
            }
            else {
                this._element.fullCalendar("removeEventSource", eventSource);
                this._element.fullCalendar("addEventSource", eventSource);
            }
        };
        Calendar.prototype.removeEvent = function (id) {
            if (id) {
                this._element.fullCalendar("removeEvents", id);
            }
        };
        Calendar.prototype._viewRender = function (view, element) {
            view["renderId"] = Math.random();
        };
        Calendar.prototype._createFilteredCallback = function (original, filter) {
            return function (event, element, view) {
                if (filter(event)) {
                    return original(event, element, view);
                }
            };
        };
        Calendar.prototype._createEventSource = function (source, options) {
            var state = {};
            var getEventsMethod = function (start, end, timezone, callback) {
                if (!state.dirty && state.cachedEvents) {
                    callback(state.cachedEvents);
                    return;
                }
                var getEventsPromise = source.getEvents();
                Q.timeout(getEventsPromise, 2000, "Could not load event source " + source.name + ". Request timed out.")
                    .then(function (results) {
                    var calendarEvents = results.map(function (value, index) {
                        var end = value.endDate ? Utils_Date.addDays(new Date(value.endDate.valueOf()), 1) : value.startDate;
                        var event = {
                            id: value.eventId || Calendar_Utils_Guid.newGuid(),
                            title: value.title,
                            allDay: true,
                            start: value.startDate,
                            end: end,
                            eventType: source.id,
                            rendering: options.rendering || '',
                            category: value.category,
                            member: value.member
                        };
                        if ($.isFunction(source.addEvents)) {
                            var color = Calendar_ColorUtils.generateColor((event.category || "uncategorized").toLowerCase());
                            event.backgroundColor = color;
                            event.borderColor = color;
                        }
                        if (options.rendering === "background" && value.category) {
                            var color = Calendar_ColorUtils.generateBackgroundColor((event.category || "uncategorized").toLowerCase());
                            event.backgroundColor = color;
                            event.borderColor = color;
                        }
                        return event;
                    });
                    state.dirty = false;
                    state.cachedEvents = calendarEvents;
                    callback(calendarEvents);
                }, function (reason) {
                    console.error(Utils_String.format("Error getting event data.\nEvent source: {0}\nReason: {1}", source.name, reason));
                    callback([]);
                });
            };
            var calendarEventSource = getEventsMethod;
            calendarEventSource.eventSource = source;
            calendarEventSource.state = state;
            return calendarEventSource;
        };
        Calendar.prototype.addCallback = function (callbackType, callback) {
            if (!this._callbacks[callbackType]) {
                this._callbacks[callbackType] = [];
            }
            this._callbacks[callbackType].push(callback);
        };
        Calendar.prototype._getComposedCallback = function (callbackType) {
            var _this = this;
            var args = arguments;
            return function (event, element, view) {
                var fns = _this._callbacks[callbackType];
                if (!fns) {
                    return undefined;
                }
                var broken = false;
                var updatedElement = element;
                for (var i = 0; i < fns.length; ++i) {
                    var fn = fns[i];
                    var result = fn(event, updatedElement, view);
                    if (callbackType === FullCalendarCallbackType.eventRender && result === false) {
                        broken = true;
                        break;
                    }
                    if (callbackType === FullCalendarCallbackType.eventRender && result instanceof jQuery) {
                        updatedElement = result;
                    }
                }
                if (broken) {
                    return false;
                }
                return updatedElement;
            };
        };
        Calendar.prototype.addEvents = function (events) {
            var _this = this;
            events.forEach(function (event) {
                _this._element.fullCalendar("renderEvent", event, true);
            });
        };
        Calendar.prototype.removeEvents = function (filter) {
            var clientEvents = this._element.fullCalendar("clientEvents", filter);
            this._element.fullCalendar("removeEvents", filter);
            return clientEvents;
        };
        Calendar.prototype.getDate = function () {
            return this._element.fullCalendar("getDate").toDate();
        };
        return Calendar;
    })(Controls.Control);
    exports.Calendar = Calendar;
});

//# sourceMappingURL=../Calendar/Calendar.js.map