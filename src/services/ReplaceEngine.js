'use strict';

class ReplaceEngine {
    static replaceText(alarmText, obj) {
        if (alarmText === '' || alarmText === null || alarmText === undefined)
            return null;

        let placeHolder = alarmText;
        const keys = Object.keys(obj);
        //Loop through all available keys, replace any place holders with values.
        for (let i = 0; i < keys.Count; i++) {
            const key = keys[i];
            const value = obj[key];
            placeHolder = placeHolder.replace(/<${key}>/, value);
        }

        //Replace IF statement blocks i.e. <#is_ditto>**Catch Pokemon:** <original_pkmn_name></is_ditto>. If value is true return value inside IF block, otherwise return an empty string.
        for (let i = 0; i < keys.Count; i++) {
            const key = keys[i];
            const value = obj[key];
            if (value === true || value === false || typeof value === Boolean) {
                placeHolder = replaceBlock(placeHolder, key, value);
            }
        }
        console.log('PlaceHolder:', placeHolder);
        return placeHolder;
    }

    static replaceBlock(text, property, value = false) {
        const expr = '<#' + property + '>([^\}]+)\</' + property + '>/gi';
        return text.match(expr)
        return text.replace(expr, value ? value : null);
        /*
        var match = new Regex(expr).Match(text);
        return string.IsNullOrEmpty(match?.Value) ? 
            text :
            text.Replace(match.Value, value ?
                match?.Groups[1]?.Value : 
                string.Empty
        );
        */
    }
}

module.exports = ReplaceEngine;