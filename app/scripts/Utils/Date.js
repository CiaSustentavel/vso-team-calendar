define(["require", "exports", "q", "VSS/Service", "VSS/WebApi/Constants", "TFS/Work/RestClient"], function (require, exports, Q, Service, WebApi_Constants, Work_Client) {
    function ensureDate(date) {
        if (typeof date === "string") {
            return new Date(date);
        }
        return date;
    }
    function isBetween(date, startDate, endDate) {
        var ticks = date.getTime();
        return ticks >= startDate.getTime() && ticks <= endDate.getTime();
    }
    exports.isBetween = isBetween;
    function eventIn(event, query) {
        if (!query || !query.startDate || !query.endDate) {
            return false;
        }
        if (isBetween(ensureDate(event.startDate), query.startDate, query.endDate)) {
            return true;
        }
        if (isBetween(ensureDate(event.endDate), query.startDate, query.endDate)) {
            return true;
        }
        return false;
    }
    exports.eventIn = eventIn;
    var _iterations;
    var _iterationsDeferred = Q.defer();
    var _iterationsLoaded = _iterationsDeferred.promise;
    function getIterationId(dayOff) {
        var deferred = Q.defer();
        if (!_iterations) {
            loadIterations();
        }
        _iterationsLoaded.then(function () {
            _iterations.some(function (value, index, array) {
                if (value && value.attributes && value.attributes.startDate && value.attributes.finishDate) {
                    if (dayOff >= value.attributes.startDate && dayOff <= value.attributes.finishDate) {
                        deferred.resolve(value.id);
                        return true;
                    }
                }
                return false;
            });
        });
        return deferred.promise;
    }
    exports.getIterationId = getIterationId;
    function loadIterations() {
        _iterations = [];
        var webContext = VSS.getWebContext();
        var teamContext = { projectId: webContext.project.id, teamId: webContext.team.id, project: "", team: "" };
        var workClient = Service.VssConnection
            .getConnection()
            .getHttpClient(Work_Client.WorkHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
        workClient.getTeamIterations(teamContext).then(function (iterations) {
            iterations.forEach(function (iteration, index, array) {
                _iterations.push(iteration);
            });
            _iterationsDeferred.resolve([]);
        }, function (e) {
            _iterationsDeferred.resolve([]);
        });
    }
});
