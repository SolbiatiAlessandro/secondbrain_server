import { EMOJIS } from "./constants";
//
// TODO: when have internet check how to do this
export function mergeDictionaries(dict1, dict2){
	let res = {}
	Object.keys(dict1).map(k => res[k] = dict1[k]);
	Object.keys(dict2).map(k => res[k] = dict2[k]);
	return res
}

function uglyStringCount(str: string, match: string): number {
	return Object.entries(str).map((val) => (val[1])).filter((letter) => (letter == match)).length
}

export abstract class EmojisUtils {
	static parse(mdfile_content: string): string{
		const lines = mdfile_content.split("\n");
		let emojiString = "";
		Object.entries(EMOJIS).forEach((name_emoji) => {
			const emoji_name = name_emoji[0];
			const emoji = name_emoji[1];
			const lines_with_emojis = lines.filter((line) => {return line.includes(emoji)});
			lines_with_emojis.forEach((line) => {
				emojiString += uglyStringCount(line, emoji);
				emojiString += emoji_name;
			});
		})
		return emojiString;
	}
}
