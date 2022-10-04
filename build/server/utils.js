import { EMOJIS } from "./constants.js";
//
// TODO: when have internet check how to do this
export function mergeDictionaries(dict1, dict2) {
    var res = {};
    Object.keys(dict1).map(function (k) { return res[k] = dict1[k]; });
    Object.keys(dict2).map(function (k) { return res[k] = dict2[k]; });
    return res;
}
function uglyStringCount(str, match) {
    // @ts-ignore
    var iterator = str.matchAll(match);
    var done = iterator.next().done;
    ;
    var count = 0;
    while (!done) {
        done = iterator.next().done;
        count += 1;
    }
    return count;
}
var EmojisUtils = /** @class */ (function () {
    function EmojisUtils() {
    }
    EmojisUtils.parse = function (mdfile_content) {
        var lines = mdfile_content.split("\n");
        var emojiString = "|";
        Object.entries(EMOJIS).forEach(function (name_emoji) {
            var emoji_name = name_emoji[0];
            var emoji = name_emoji[1];
            var lines_with_emojis = lines.filter(function (line) { return line.includes(emoji); });
            lines_with_emojis.forEach(function (line) {
                emojiString += uglyStringCount(line, emoji);
                emojiString += ",";
                emojiString += emoji_name;
                emojiString += "|";
            });
        });
        return emojiString;
    };
    return EmojisUtils;
}());
export { EmojisUtils };
