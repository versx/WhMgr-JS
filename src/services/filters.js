function matchesCP(cp, minCP = 0, maxCP = 9999) {
    const min = parseInt(minCP);
    const max = parseInt(maxCP);
    const missing = cp === "?" || cp === null || cp === undefined;
    if (!missing) {
        const cpValue = parseInt(cp);
        return cpValue >= min && cpValue <= max;
    }
    return missing && min === 0;
}

function matchesIV(iv, minIV = 0, maxIV = 100) {
    const min = parseInt(minIV);
    const max = parseInt(maxIV);
    const missing = iv == "?" || iv == null || iv == undefined;
    if (!missing) {
        //console.log('Missing:', missing, 'IV:', iv, 'Min:', min, 'Max:', max, 'Matches:', iv >= min && iv <= max);
        return iv >= min && iv <= max;
    }
    return missing && min === 0;
}

function matchesLevel(level, minLevel = 0, maxLevel = 35) {
    const min = parseInt(minLevel);
    const max = parseInt(maxLevel);
    const missing = level === "?" || level === null || level === undefined;
    if (!missing) {
        const lvlValue = parseInt(level);
        return lvlValue >= min && lvlValue <= max;
    }
    return missing && min === 0;
}

function matches(value, minValue, maxValue) {
    const min = parseInt(minValue);
    const max = parseInt(maxValue);
    const missing = value === "?" || value === null || value === undefined;
    if (!missing) {
        const result = parseInt(value);
        if (result) {
            return result >= min && result <= max;
        }
    }
    return missing && min === 0;
}

module.exports = {
    matchesCP,
    matchesIV,
    matchesLevel,
    matches
}