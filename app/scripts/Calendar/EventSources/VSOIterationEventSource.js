/// <reference path='../../ref/VSS/VSS.d.ts' />
define(["require", "exports", "Calendar/Utils/Color", "Calendar/Utils/Date", "q", "VSS/Service", "VSS/Utils/Date", "VSS/Utils/String", "VSS/WebApi/Constants", "TFS/Work/RestClient"], function (require, exports, Calendar_ColorUtils, Calendar_DateUtils, Q, Service, Utils_Date, Utils_String, WebApi_Constants, Work_Client) {
    var VSOIterationEventSource = (function () {
        function VSOIterationEventSource() {
            this.id = "iterations";
            this.name = "Iterations";
            this.order = 20;
            this.background = true;
        }
        VSOIterationEventSource.prototype.getEvents = function (query) {
            var _this = this;
            var result = [];
            var deferred = Q.defer();
            this._events = null;
            var webContext = VSS.getWebContext();
            var teamContext = { projectId: webContext.project.id, teamId: webContext.team.id, project: "", team: "" };
            var workClient = Service.VssConnection
                .getConnection()
                .getHttpClient(Work_Client.WorkHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            workClient.getTeamIterations(teamContext).then(function (iterations) {
                iterations.forEach(function (iteration, index, array) {
                    if (iteration && iteration.attributes && iteration.attributes.startDate) {
                        var event = {};
                        event.startDate = Utils_Date.shiftToUTC(iteration.attributes.startDate);
                        if (iteration.attributes.finishDate) {
                            event.endDate = Utils_Date.shiftToUTC(iteration.attributes.finishDate);
                        }
                        event.title = iteration.name;
                        if (_this._isCurrentIteration(event)) {
                            event.category = iteration.name;
                        }
                        result.push(event);
                    }
                });
                result.sort(function (a, b) { return a.startDate.valueOf() - b.startDate.valueOf(); });
                _this._events = result;
                deferred.resolve(result);
            }, function (e) {
                deferred.reject(e);
            });
            return deferred.promise;
        };
        VSOIterationEventSource.prototype.getCategories = function (query) {
            var _this = this;
            var deferred = Q.defer();
            if (this._events) {
                deferred.resolve(this._getCategoryData(this._events.slice(0), query));
            }
            else {
                this.getEvents().then(function (events) {
                    deferred.resolve(_this._getCategoryData(events, query));
                });
            }
            return deferred.promise;
        };
        VSOIterationEventSource.prototype._getCategoryData = function (events, query) {
            var categories = [];
            $.each(events.splice(0).sort(function (e1, e2) {
                if (!e1.startDate || !e2.endDate) {
                    return 0;
                }
                return e1.startDate.getTime() - e2.startDate.getTime();
            }), function (index, event) {
                if (Calendar_DateUtils.eventIn(event, query)) {
                    var category = {
                        title: event.title,
                        subTitle: Utils_String.format("{0} - {1}", Utils_Date.format(event.startDate, "M"), Utils_Date.format(event.endDate, "M"))
                    };
                    if (event.category) {
                        category.color = Calendar_ColorUtils.generateBackgroundColor(event.title);
                    }
                    else {
                        category.color = "#FFFFFF";
                    }
                    categories.push(category);
                }
            });
            return categories;
        };
        VSOIterationEventSource.prototype._isCurrentIteration = function (event) {
            if (event.startDate && event.endDate) {
                var today = Utils_Date.shiftToUTC(new Date());
                return today >= event.startDate && today <= event.endDate;
            }
            return false;
        };
        return VSOIterationEventSource;
    })();
    exports.VSOIterationEventSource = VSOIterationEventSource;
});

//# sourceMappingURL=../../Calendar/EventSources/VSOIterationEventSource.js.map