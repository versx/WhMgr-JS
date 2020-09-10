'use strict';

const path = require('path');
const FileUtils = require('../utils/FileUtils.js');
const { GeofenceService } = require('../services/geofence.js');
const svc = new GeofenceService();
const filters = require('../services/filters.js');

const AlarmsFolder = path.resolve(__dirname, '../../alarms');
const AlertsFolder = path.resolve(__dirname, '../../alerts');
const FiltersFolder = path.resolve(__dirname, '../../filters');
const GeofencesFolder = path.resolve(__dirname, '../../geofences');

const DiscordController = require('./DiscordController.js');
const discordController = new DiscordController();

class WebhookController {
    static Alarms = [];

    constructor() {
        this.buildAlarms().then(x => { this.Alarms = x; });
    }

    /*
    {
        pokemon_id: 13,
        costume: 0,
        form: 616,
        pokestop_id: '8aa73d9b89eb4165a44f383e94dd56de.16',
        weather: 4,
        display_pokemon_id: null,
        latitude: 33.642399,
        longitude: -117.595703,
        capture_1: 0,
        capture_2: 0,
        capture_3: 0,
        move_1: null,
        move_2: null,
        height: null,
        weight: null,
        gender: 1,    
        pokemon_level: null,
        shiny: null,
        individual_attack: null,
        individual_defense: null,
        individual_stamina: null,
        pvp_rankings_great_league: null,
        pvp_rankings_ultra_league: null,
        first_seen: 1592682954,
        disappear_time: 1592684154,
        disappear_time_verified: false,
        last_modified_time: 1592682954,
        spawnpoint_id: 'None',
        encounter_id: '10921882670488025322',
        username: 'B0dTC5pgHpu'
    }
    */
    parsePokemon(message) {
        const alarms = this.Alarms.filter(x => x.filters.pokemon);
        const geofence = svc.getGeofence(message.latitude, message.longitude);
        for (let i = 0; i < alarms.length; i++) {
            const alarm = alarms[i];
            if (!alarm.filters)
                continue;
            
            if (alarm.filters.pokemon && !alarm.filters.pokemon.enabled)
                continue;

            const inGeofence = svc.inGeofence(alarm.geofence, message.latitude, message.longitude);
            if (!inGeofence)
                continue;

            if (alarm.filters.pokemon.type === 'Exclude' && alarm.filters.pokemon.pokemon.includes(message.pokemon_id)) {
                //console.log(`[${alarm.name}] [${geofence.name}] Skipping pokemon ${message.pokemon_id}: filter ${alarm.filters.pokemon.type}.`);
                continue;
            }

            if (alarm.filters.pokemon.type === 'Include' && alarm.filters.pokemon.pokemon.length > 0 && !alarm.filters.pokemon.pokemon.includes(message.pokemon_id)) {
                //console.log(`[${alarm.name}] [${geofence.name}] Skipping pokemon ${message.pokemon_id}: filter ${alarm.filters.pokemon.type}.`);
                continue;
            }

            if (alarm.filters.pokemon.ignoreMissing !== false && isMissingStats(message)) {
                //console.log(`[${alarm.name}] [${geofence.name}] Skipping pokemon ${message.pokemon_id}: IgnoreMissing=true.`);
                continue;
            }

            // Skip PVP for now.
            let skip = false;
            const skipList = ['pvp1500cp', 'pvp2500cp', 'great', 'ultra'];
            for (let j = 0; j < skipList.length; j++) {
                const skipItem = skipList[j];
                if (alarm.name.includes(skipItem)) {
                    skip = true;
                }
            }
            if (skip)
                continue;

            const filter = alarm.filters.pokemon;
            const minIV = (filter.min_iv || 0).toString() || 0;
            const maxIV = (filter.max_iv || 0).toString() || 100;
            const minCP = filter.min_cp || 0;
            const maxCP = filter.max_cp || 99999;
            const minLvl = filter.min_lvl || 0;
            const maxLvl = filter.max_lvl || 35;
            const minRank = filter.min_rank || 0;
            const maxRank = filter.max_rank || 25;

            message.iv = calcIV(message.individual_attack, message.individual_defense, message.individual_stamina);
            const matchesIV = filters.matches(message.iv, minIV, maxIV);
            if (!matchesIV)
                continue;

            const matchesCP = filters.matches(message.cp, minCP, maxCP);
            if (!matchesCP)
                continue;

            const matchesLvl = filters.matches(message.pokemon_level, minLvl, maxLvl);
            if (!matchesLvl)
                continue;

            //const matchesGreat = message.pvp_rankings_great_league && message.pvp_rankings_great_league.find(x => filters.matches(x.rank || 4096, minRank, maxRank) && x.cp >= 1400 && x.cp <= 1500) !== undefined;
            //if (!matchesGreat)
            //    continue;
            //const matchesUltra = message.pvp_rankings_ultra_league && message.pvp_rankings_ultra_league.find(x => filters.matches(x.rank || 4096, minRank, maxRank) && x.cp >= 2400 && x.cp <= 2500) !== undefined;
            //if (!matchesUltra)
            //    continue;
            if (matchesIV !== false && matchesCP !== false && matchesLvl !== false) {//&& matchesGreat !== false && matchesUltra !== false) {
                // TODO: Send to DiscordController
                const geofence = svc.getGeofence(message.latitude, message.longitude);
                message.geofence = geofence;
                console.log(
                    'Pokemon:', message.pokemon_id,
                    /*
                    'CP:', message.cp,
                    'Min CP:', minCP,
                    'Max CP:', maxCP,
                    */
                    'IV:', message.iv + '%',
                    'Min IV:', minIV,
                    'Max IV:', maxIV,
                    'Level:', message.pokemon_level,
                    'Min Lvl:', minLvl,
                    'Max Lvl:', maxLvl,
                    'Missing:', isMissingStats(message),
                    'IgnoreMissing:', filter.ignoreMissing,
                    'Alarm:', alarm.name,
                    'Geofence:', geofence.name,
                );
                discordController.sendWebhook(alarm.webhook, 'pokemon', message);
            }

            //console.log("Pokemon:", message.pokemon_id, message.iv, message.pokemon_level, message.gender, geofence.name, alarm.name);
            //if (!filters.matchesGender(message.gender, filter.gender))
            //{
            //    //_logger.Info($"[{alarm.Name}] [{geofence.Name}] Skipping pokemon {pkmn.Id}: DesiredGender={filter.gender} and Gender={pkmn.Gender}.");
            //    continue;
            //}

            //if (float.TryParse(pkmn.Height, out var height) && float.TryParse(pkmn.Weight, out var weight) &&
            //    !Filters.MatchesSize(pkmn.Id.GetSize(height, weight), alarm.Filters?.Pokemon?.Size)) {
            //    continue;
            //}
        }
    }

    /*
    {
        sponsor_id: 0,
        level: 1,
        gender: 0,
        move_2: 0,
        start: 1592699023,
        longitude: -117.63682,
        pokemon_id: 0,
        team_id: 2,
        move_1: 0,
        gym_name: 'The Olive Tree',
        is_exclusive: false,
        gym_url: 'http://lh3.googleusercontent.com/w3S_NAx0TE-8-QtsNGuUlOdY7gBB1yQu9mKYZ-pwzlvJlU20xzWXlsDhEBkMyG2X5_1P7p5ReFW2q9wgM0a0sJthMA',
        cp: 0,
        gym_id: '374755449ae143c0807430d42ce6e2ff.16',
        form: 0,
        latitude: 34.101501,
        spawn: 1592695423,
        end: 1592701723,
        ex_raid_eligible: false
    }
    */
    parseRaid(message) {
        const alarms = this.Alarms;
        const geofence = svc.getGeofence(message.latitude, message.longitude);
        for (let i = 0; i < alarms.length; i++) {
            const alarm = alarms[i];
            const inGeofence = svc.inGeofence(alarm.geofence, message.latitude, message.longitude);
            if (!inGeofence)
                continue;

            if (!alarm.filters)
                continue;

            const isEgg = !(message.pokemon_id > 0);
            const isEx = message.ex_raid_eligible !== undefined && message.ex_raid_eligible !== null && message.ex_raid_eligible !== false;
            if (isEgg) {
                // Egg
                const filter = alarm.filters.eggs;
                if (!filter)
                    continue;

                const level = parseInt(message.level);
                if (filter && !filter.enabled) {
                    //console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid egg: raids filter not enabled.`);
                    continue;
                }

                if (!(level >= parseInt(filter.min_lvl) && level <= parseInt(filter.max_lvl))) {
                    //console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid egg: not within min: ${filter.min_lvl} and max: ${filter.max_lvl}.`);
                    // Not a valid raid level
                    continue;
                }

                if (filter.onlyEx && !isEx) {
                    //console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid egg: only ex ${filter.onlyEx}.`);
                    continue;
                }

                if (filter.team) {
                    const team = getTeam(message.team_id);
                    if (filter.team !== 'All' && filter.team !== team) {
                        console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid egg: '${team}' does not meet Team=${filter.team} filter.`);
                        continue;
                    }
                }

                console.log(
                    'Egg Level:', level,
                    'Min Lvl:', filter.min_lvl,
                    'Max Lvl:', filter.max_lvl,
                    'Ex:', message.ex_raid_eligible,
                    'Alarm:', alarm.name,
                    'Geofence:', geofence.name,
                );
            } else {
                // Raid
                const filter = alarm.filters.raids;
                if (!filter)
                    continue;

                const level = parseInt(message.level);
                if (filter && !filter.enabled) {
                    //console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid egg: raids filter not enabled.`);
                    continue;
                }

                if (filter.type === 'Exclude' && filter.pokemon.includes(message.pokemon_id)) {
                    //_logger.Info($"[{alarm.Name}] [{geofence.Name}] Skipping raid boss {raid.PokemonId}: filter {alarm.Filters.Raids.FilterType}.");
                    continue;
                }

                if (filter.type === 'Include' && (!filter.pokemon.includes(message.pokemon_id) && filter.pokemon.length > 0)) {
                    //_logger.Info($"[{alarm.Name}] [{geofence.Name}] Skipping raid boss {raid.PokemonId}: filter {alarm.Filters.Raids.FilterType}.");
                    continue;
                }

                if (filter.onlyEx && !isEx) {
                    console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid egg: only ex ${filter.onlyEx}.`);
                    continue;
                }

                if (filter.team) {
                    const team = getTeam(message.team_id);
                    if (filter.team !== 'All' && filter.team !== team) {
                        console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid: '${team}' does not meet Team=${filter.eam} filter.`);
                        continue;
                    }
                }

                console.log(
                    'Raid Level:', level,
                    'Ex:', isEx,
                    'Alarm:', alarm.name,
                    'Geofence:', geofence.name,
                );

                // TODO: isMissingStats for raid
                /*
                if (filter.ignoreMissing && raid.IsMissingStats) {
                    console.log(`[${alarm.name}] [${geofence.name}] Skipping raid boss ${message.pokemon_id}: IgnoreMissing=true.`);
                    continue;
                }
                */
                // TODO: Send to DiscordController
            }
        }
    }

    /*
    */
    parseQuest(message) {
        const alarms = this.Alarms.filter(x => x.filters.quests);
        const geofence = svc.getGeofence(message.latitude, message.longitude);
        for (let i = 0; i < alarms.length; i++) {
            const alarm = alarms[i];
            if (!alarm.filters)
                continue;

            const inGeofence = svc.inGeofence(alarm.geofence, message.latitude, message.longitude);
            if (!inGeofence)
                continue;

            const filter = alarm.filters.quests;
            const level = parseInt(message.level);
            if (filter && !filter.enabled) {
                //console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid egg: raids filter not enabled.`);
                continue;
            }

            // TODO: getQuestReward

            // TODO: Check if reward list contains reward keyword
            const contains = filter.reward.filter(x => x.toLowerCase()).find(x => reward.toLowerCase().includes(x.ToLower())) !== null;
            if (filter.type === 'Exclude' && contains) {
                console.log(`[${alarm.name}] [${geofence.name}] Skipping quest PokestopId=${message.pokestop_id}, Type=${message.type}: filter ${filter.type}.`);
                continue;
            }

            if (!(filter.type === 'Include' && (contains || filter.rewards === null || filter.rewards.length === 0))) {
                console.log(`[${alarm.name}] [${geofence.name}] Skipping quest PokestopId=${message.pokestop_id}: filter ${filter.type}.`);
                continue;
            }

            if (!contains && filter.rewards && filter.rewards.length > 0) {
                console.log(`[${alarm.name}] [${geofence.name}] Skipping quest PokestopId=${quest.pokestop_id}, Type=${quest.type}: rewards does not match reward keywords.`);
                continue;
            }

            if (filter.isShiny && !message.is_shiny) {
                console.log(`[${alarm.name}] [${geofence.name}] Skipping quest PokestopId=${quest.pokestop_id}, Type=${quest.type}: filter IsShiny=${filter.isShiny} Quest=${message.is_shiny}.`);
                continue;
            }

            if (filter.team) {
                const team = getTeam(message.team_id);
                if (filter.team !== 'All' && filter.team !== team) {
                    console.log(`[${alarm.name}] [${geofence.name}] Skipping level ${level} raid egg: '${team}' does not meet Team=${filter.eam} filter.`);
                    continue;
                }
            }
            // TODO: Check rewards
            // TODO: Check Include/Exclude
            // TODO: Check isShiny

            console.log(
                'Egg Level:', level,
                'Min Lvl:', filter.min_lvl,
                'Max Lvl:', filter.max_lvl,
                'Ex:', message.ex_raid_eligible,
                'Alarm:', alarm.name,
                'Geofence:', geofence.name,
            );
         }
    }

    async buildAlarms() {
        const list = [];
        const alarms = await FileUtils.readDir(AlarmsFolder);
        if (alarms) {
            for (let i = 0; i < alarms.length; i++) {
                const areaAlarms = alarms[i].alarms;
                for (let j = 0; j < areaAlarms.length; j++) {
                    const alarm = areaAlarms[j];
                    const filterPath = path.resolve(FiltersFolder, alarm.filters);
                    const filter = await FileUtils.readFile(filterPath);
                    const alertsPath = path.resolve(AlertsFolder, alarm.alerts);
                    const alerts = await FileUtils.readFile(alertsPath);
                    const geofencePath = path.resolve(GeofencesFolder, alarm.geofence);
                    const geofence = svc.loadGeofence(geofencePath);
                    list.push({
                        name: alarm.name,
                        alerts: alerts,
                        filters: filter,
                        geofence: geofence,
                        webhook: alarm.webhook,
                    });
                }
            }
        }
        return list;
    }
}

function calcIV(atkIV, defIV, staIV) {
    if (atkIV === undefined || atkIV === null ||
        defIV === undefined || defIV === null ||
        staIV === undefined ||  staIV === null) {
        return null;
    }
    const atk = parseInt(atkIV || 0);
    const def = parseInt(defIV || 0);
    const sta = parseInt(staIV || 0);
    if (atk === 0 && def === 0 && sta === 0) {
        return 0;
    }
    return Math.round((sta + atk + def) * 100.0 / 45.0);
}

function isMissingStats(message) {
    return message.pokemon_level === null || message.pokemon_level === undefined;
}

function getTeam(teamId) {
    switch (parseInt(teamId)) {
        case 1:
            return 'Mystic';
        case 2:
            return 'Valor';
        case 3:
            return 'Instinct';
    }
    return 'Neutral';
}

module.exports = WebhookController;

/*
  message: {
    pokemon_id: 13,
    costume: 0,
    form: 616,
    pokestop_id: '8aa73d9b89eb4165a44f383e94dd56de.16',
    weather: 4,
    display_pokemon_id: null,
    latitude: 33.642399,
    longitude: -117.595703,
    capture_1: 0,
    capture_2: 0,
    capture_3: 0,
    move_1: null,
    move_2: null,
    height: null,
    weight: null,
    gender: 1,    
    pokemon_level: null,
    shiny: null,
    individual_attack: null,
    individual_defense: null,
    individual_stamina: null,
    pvp_rankings_great_league: null,
    pvp_rankings_ultra_league: null,
    first_seen: 1592682954,
    disappear_time: 1592684154,
    disappear_time_verified: false,
    last_modified_time: 1592682954,
    spawnpoint_id: 'None',
    encounter_id: '10921882670488025322',
    username: 'B0dTC5pgHpu'
  },
  type: 'pokemon'
}
*/