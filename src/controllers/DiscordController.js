'use strict';

const axios = require('axios');
const ReplaceEngine = require('../services/ReplaceEngine.js');

class DiscordController {
    constructor() {
    }

    createPokemonEmbed(pokemon) {
        const content = `${pokemon.pokemon_id} ${pokemon.form}${pokemon.gender} ${pokemon.iv}% (${pokemon.individual_attack}/${pokemon.individual_defense}/${pokemon.individual_stamina}) L${pokemon.pokemon_level}<br>**Despawn:** ${pokemon.expire_timestamp} (<time_left> left)<br>**Details:** CP: ${pokemon.cp} IV: ${pokemon.iv}% LV: ${pokemon.pokemon_level}<br>**Types:** <types_emoji> | **Size:** <size><#has_weather> | <weather_emoji><#is_weather_boosted> (Boosted)</is_weather_boosted></has_weather><br>**Moveset:** <moveset><br><#near_pokestop>**Near Pokestop:** [<pokestop_name>](<pokestop_url>)<br></near_pokestop><#is_ditto>**Catch Pokemon:** <original_pkmn_name><br></is_ditto><#is_pvp><br><pvp_stats></is_pvp>**[[Google Maps](<gmaps_url>)] [[Apple Maps](<applemaps_url>)] [[Waze Maps](<wazemaps_url>)]**`;
        pokemon.is_pvp = false;
        pokemon.has_weather = false;
        pokemon.is_weather_boosted = false;
        pokemon.is_ditto = false;
        pokemon.near_pokestop = false;
        content = ReplaceEngine.replaceText(content, pokemon);
        const data = {
            //content: content,
            username: '#' + pokemon.pokemon_id,
            avatar_url: '',
            embeds: this.createEmbed(pokemon.geofence.name, content, '00ff00', '#' + pokemon.pokemon_id, null, 'versx | Test', null, null, null, 'https://google.com')
        };
        return data;
    }

    createRaidEmbed(raid) {
    }

    createQuestEmbed(quest) {
    }

    createEmbed(title, description, color, author, authorIconUrl, footer, footerIconUrl, thumbnail, image, url) {
        const data = {
            title: title,
            description: description,
            color: color,
            author: {
                name: author,
                icon_url: authorIconUrl
            },
            //fields: "",
            footer: {
                text: footer,
                icon_url: footerIconUrl
            },
            thumbnail: {
                url: thumbnail
            },
            image: {
                url: image
            },
            url: url
        }
        return data;
    }

    sendWebhook(url, type, payload) {
        url = 'https://discordapp.com/api/webhooks/635418239438028811/yx4V0TG2AZq';
        let data;
        switch (type) {
            case 'pokemon':
                data = [this.createPokemonEmbed(payload)];
                break;
            case 'raid':
            case 'egg':
                data = [this.createRaidEmbed(payload)];
                break;
            case 'quest':
                data = [this.createQuestEmbed(payload)];
                break;
        }
        axios({
            url: url,
            method: 'POST',
            data: data,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Data:', error.response.data.message);
                    //console.log('Status:', error.response.status);
                    //console.log('Headers:', error.response.headers);
                    switch (error.response.status) {
                        case 429: // Rate Limited
                            // error.response.data.retry_after
                            const sleep = error.response.headers['retry-after'];
                            console.error('Rate limited, retry after', sleep, 'seconds...');
                            setTimeout(() => this.sendWebhook(url, type, payload), parseInt(sleep) * 1000);
                            break;
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.error('Request:', error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error:', error.message);
                }
                //console.log('Config:', error.config);
                // TODO: Check rate limit header and sleep then resend
            });
    }
}

module.exports = DiscordController;