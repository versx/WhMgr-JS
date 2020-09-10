'use strict';

const axios = require('axios');
const express = require('express');
const app = express();

const WebhookController = require('./controllers/WebhookController.js');
const controller = new WebhookController();

const config = require('./config.json');

// TODO: Add clustering

function sendTestWebhook() {
    const pokemon = {
        pokemon_id: 0,
        form: 0,
        gender: 2,
        iv: 100,
        cp: 10000,
        individual_attack: 15,
        individual_defense: 15,
        individual_stamina: 15,
        pokemon_level: 25,
        expire_timestamp: '11:11:11 PM',
        geofence: {
            name: 'Test'
        }
    }
    let content = `${pokemon.pokemon_id} ${pokemon.form}${pokemon.gender} ${pokemon.iv}% (${pokemon.individual_attack}/${pokemon.individual_defense}/${pokemon.individual_stamina}) L${pokemon.pokemon_level}<br>**Despawn:** ${pokemon.expire_timestamp} (<time_left> left)<br>**Details:** CP: ${pokemon.cp} IV: ${pokemon.iv}% LV: ${pokemon.pokemon_level}<br>**Types:** <types_emoji> | **Size:** <size><#has_weather> | <weather_emoji><#is_weather_boosted> (Boosted)</is_weather_boosted></has_weather><br>**Moveset:** <moveset><br><#near_pokestop>**Near Pokestop:** [<pokestop_name>](<pokestop_url>)<br></near_pokestop><#is_ditto>**Catch Pokemon:** <original_pkmn_name><br></is_ditto><#is_pvp><br><pvp_stats></is_pvp>**[[Google Maps](<gmaps_url>)] [[Apple Maps](<applemaps_url>)] [[Waze Maps](<wazemaps_url>)]**`;
    content = content.replace(/<br>/g, '\r\n');
    const embeds = createEmbed(pokemon.geofence.name, content, 0x00ff00, 'versx | ' + new Date(), null, null, null, 'https://google.com');
    const data = {
        content: 'Test',//content,
        username: '#' + pokemon.pokemon_id,
        avatar_url: '',
        embeds: [embeds]
    };
    console.log('Embed:', embeds);
    
    function createEmbed(title, description, color, footer, footerIconUrl, thumbnail, image, url) {
        const data = {
            title: title,
            description: description,
            color: color,
            //fields: "",
            footer: {
                text: footer,
                //icon_url: footerIconUrl
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
    
    const options = {
        url: 'https://discordapp.com/api/webhooks/635418239438028811/yx4V0TG2AZq',
        method: 'POST',
        data: data,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    axios(options)
        .then((response) => {
            console.log(response.status);
        })
        .catch((error) => {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                //console.error('Data:', error.response);
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

sendTestWebhook();

// Body parser middlewares
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
    res.send('OK');
});

app.post('/', (req, res) => {
    if (Array.isArray(req.body)) {
        const payload = req.body;
        console.log('Received', payload.length, 'items from payload');
        for (let i = 0; i < payload.length; i++) {
            const message = payload[i];
            switch (message.type) {
                case 'pokemon':
                    controller.parsePokemon(message.message);
                    break;
                case 'gym':
                    break;
                case 'gym_details':
                    break;
                case 'raid':
                    controller.parseRaid(message.message);
                    break;
                case 'quest':
                    controller.parseQuest(message.message);
                    break;
                case 'pokestop':
                case 'invasion':
                    break;
                case 'weather':
                    break;
            }
        }
    }
    res.send('OK');
});

app.listen(config.port, config.interface, () => console.log(`Listening on port ${config.port}...`));