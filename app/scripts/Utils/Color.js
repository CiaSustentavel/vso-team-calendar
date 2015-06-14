define(["require", "exports", "VSS/Utils/String"], function (require, exports, Utils_String) {
    var allColors = [
        "D6252E",
        "4AB63F",
        "40BD95",
        "859A52",
        "3267B8",
        "613DB4",
        "A34E78",
        "C4CCDD",
        "8C9CBD",
        "AF1E25",
        "B14F0D",
        "AB7B05",
        "999400",
        "35792B",
        "2E7D64",
        "5F6C3A",
        "2A5191",
        "50328F",
        "82375F"
    ];
    var daysOffColor = "#F06C15";
    var nonWorkingDayColor = "#F5F5F5";
    var currentIterationColor = "#C1E6FF";
    function generateColor(name) {
        name = name.toLowerCase();
        if (name === "daysoff") {
            return daysOffColor;
        }
        var value = 0;
        for (var i = 0; i < (name || "").length; i++) {
            value += name.charCodeAt(i) * (i + 1);
        }
        return Utils_String.format("#{0}", allColors[value % allColors.length]);
    }
    exports.generateColor = generateColor;
    function generateBackgroundColor(name) {
        return currentIterationColor;
    }
    exports.generateBackgroundColor = generateBackgroundColor;
});
