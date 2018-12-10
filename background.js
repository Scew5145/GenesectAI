
'use strict';

// The 'room' node for the battle. should be  a div matching the id=room-battle-gen7ou-{id}
var room = null
// Observer stuff
var observerOptions = {
      childList: true,
      attributes: true,
      subtree: true
}

var pokemon_confirmed = {
/* example version of the team objects
{
    "user":{
        "Tapu Bulu":{
            name: string (actual pokedex name)
            // These are post-calc stats
            rawStats: {
                sd: 10,
                sa: 11,
                at: 12,
                df: 13,
                sp: 14,
            },
            boosts: { // Must be filled out
                sd: 1,
                at: 1.5,
                ...
            },
            evs: {
                sd: 0-252
                ...
            },

            maxHP: int,
            curHP: int,
            type1: ??? string?,
            type2: ??? (null case?),
            level: 100,
            HPEVs: 0-252,
            stats: {}, // This is empty, should be filled by damage calc
            nature: string?,
            ability: almost certainly a string,
            status: "Healthy" by default, psn --> Poisoned, brn --> Burned, etc.,
            item: string,
            moves: [move_object, move_object2...4],
            weight: float,
            gender: male/female/genderless? need to check, only use if absolutely necessary b/c annoying to parse,
        },
        ...
    }
    "opponent":{
        ...
    }
}*/
    user:{
        "Heatran":{
            name: "Heatran",
            moves:[
                MOVES_SM["Earth Power"],
                MOVES_SM["Taunt"],
                MOVES_SM["Nature Power"],
                MOVES_SM["Magma Storm"]
            ],
            rawStats: {
                at: 166,
                df: 248,
                sa: 359,
                sd: 249,
                sp: 278
            },
            evs: {
                at: 0,
                df: 0,
                sa: 252,
                sd: 4,
                sp: 252
            },
            boosts: {
                at: 1,
                df: 1,
                sa: 1,
                sd: 1,
                sp: 1
            },
            HPEVs: 0,
            nature: "Timid",
            ability: "Flash Fire",
            item: "Firium Z",
            maxHP: 323,
            curHP: 323,
            level: 100,
            status: "Healthy",
            type1: "Fire",
            type2: "Steel",
            weight: 430
        },
        "Landorus-Therian":{
            name: "Landorus-Therian",
            rawStats: {
                at: 355,
                df: 243,
                sa: 221,
                sd: 196,
                sp: 293
            },
            evs: {
                at: 116,
                df: 108,
                sa: 0,
                sd: 0,
                sp: 196
            },
            boosts: {
                at: 1,
                df: 1,
                sa: 1,
                sd: 1,
                sp: 1
            },
            nature: "Jolly",
            HPEVs: 88,
            ability: "Intimidate",
            item: "Choice Scarf",
            maxHP: 341,
            curHP: 341,
            level: 100,
            status: "Healthy",
            type1: "Ground",
            type2: "Flying",
            weight: 68
        },
        "Reuniclus":{
            name: "Reuniclus",
            rawStats: {
                at: 121,
                df: 262,
                sa: 286,
                sd: 206,
                sp: 110
            },
            evs: {
                at: 0,
                df: 212,
                sa: 0,
                sd: 0,
                sp: 56
            },
            boosts: {
                at: 1,
                df: 1,
                sa: 1,
                sd: 1,
                sp: 1
            },
            nature: "Bold",
            HPEVs: 240,
            item: "Leftovers",
            ability: "Magic Guard",
            maxHP: 421,
            curHP: 421,
            level: 100,
            status: "Healthy",
            type1: "Psychic",
            type2: undefined,
            weight: 20.1
        },
        "Tapu Bulu":{
            name: "Tapu Bulu",
            rawStats: {
                at: 296,
                df: 266,
                sa: 185,
                sd: 302,
                sp: 210
            },
            evs: {
                at: 0,
                df: 0,
                sa: 0,
                sd: 196,
                sp: 96
            },
            boosts: {
                at: 1,
                df: 1,
                sa: 1,
                sd: 1,
                sp: 1
            },
            nature: "Careful",
            HPEVs: 216,
            item: "Leftovers",
            maxHP: 335,
            curHP: 335,
            level: 100,
            status: "Healthy",
            type1: "Grass",
            type2: "Fairy",
            weight: 45.5
        },
        "Toxapex":{
            name: "Toxapex",
            rawStats: {
                at: 117,
                df: 431,
                sa: 142,
                sd: 333,
                sp: 106
            },
            evs: {
                at: 0,
                df: 208,
                sa: 0,
                sd: 52,
                sp: 0
            },
            boosts: {
                at: 1,
                df: 1,
                sa: 1,
                sd: 1,
                sp: 1
            },
            nature: "Bold",
            HPEVs: 248,
            ability: "Regenerator",
            maxHP: 303,
            curHP: 303,
            level: 100,
            item: "Black Sludge",
            status: "Healthy",
            type1: "Poison",
            type2: "Water",
            weight: 14.5
        },
        "Tyranitar":{
            name: "Tyranitar-Mega",
            rawStats: {
                at: 469,
                df: 336,
                sa: 203,
                sd: 276,
                sp: 216
            },
            evs: {
                at: 252,
                df: 0,
                sa: 0,
                sd: 0,
                sp: 152
            },
            boosts: {
                at: 1,
                df: 1,
                sa: 1,
                sd: 1,
                sp: 1
            },
            nature: "Adamant",
            HPEVs: 104,
            item: "Tyranitarite",
            ability: "Sand Stream",
            maxHP: 367,
            curHP: 367,
            level: 100,
            status: "Healthy",
            type1: "Rock",
            type2: "Dark",
            weight: 202
        }
    },
    opponent:{

    }
}
var pokemon_model = {
    user: {},
    opponent : {}
} // Same as above, but is only values that don't exist but need to. "Unconfirmed"
var battle_info = {
    turn: 0,
    weather: null,
    terrain: null,
    trick_room: false,
    stealth_rock: false, // Might not use entry hazards until first pass finishes
    spikes: 0,
    toxic_spikes: 0,
    active_pokemon: {
        user: null, // pokedex name so that you can go pokemon_confirmed.opponent[battle_info.active_pokemon.opponent]
        opponent: null
    },
    nicknames:  {
        user: { //battle_info.nicknames.user[name] is a little clumsy but whatever
            //nickname: pokedex name
            "asdsda/sss":"Toxapex",
            "asdasddsadaf":"Reuniclus",
            "butt":"Heatran",
            "Tapu Bulu":"Tapu Bulu",
            "Landorus":"Landorus-Therian",
            "Tyranitar":"Tyranitar"

        },
        opponent: {}
    },
    username: {
        user: "aephids", // Avoids a race condition on page reload that's important (for now). TODO: better fix
        opponent: null
    }
}
var usage_stats = {} // Format is  pokemon: {stats}
var usage_key_links = {}


function import_relevant_usage_stats(usage_json){
    // Function for doing the initial json pull and storing it to usage_stats.
    // This should only ever be called once (partially because the usage json is FAT)
    const url = chrome.runtime.getURL('data/lower_to_upper.json');
    // console.log(usage_json)
    for (var key in pokemon_confirmed.opponent){
        usage_stats[key] = usage_json.data[key]
    }
    console.log(usage_stats)
    fetch(url).then((response) => response.json()).then((json) => {
        usage_key_links = json
        console.log(usage_key_links)
    });
}


function get_turn(node){
    /*
    gets the above header of the battle-history node given. returns 0 if no turns were executed before this node.
    return: int
    */
    if(node.nodeName == 'H2'){
        return parseInt(node.innerText.substr(5))
    }
    var current = $(node).prev()[0]
    while (current.nodeName != 'H2' || current.className != "battle-history"){
    	current = $(current).prev()
    	if(!current.length){
    	    return 0
    	}
    	current = current[0]
    }
    return parseInt(current.innerText.substr(5))

}


function damage_analysis(name,move){
    // TODO: function for inferring information from the incoming move
    // Low priority
    /*
    2a: It was a z-move
        * confirm item as z-crystal corresponding to move, remove the z move from possible moves (if it exists in model)
        * for now, don't do any calcs on possible z moves from incoming damage, just break;
    2b: It did damage and it was above expected range
        * all of these cases should be qualified by "if the thing is confirmed, skip those cases"
        * for each ability, try damage calc again. If we find a suitable range, change model ability. break;
        * If it was more and ability didn't change, check EV spread + nature.
            * Iterate down spreads until we hit a match or a maximized one
            * if it's maximized, use this spread instead.
            * Otherwise, if we're in range, break;
        * go through the following cases. DON'T recalculate EVs after.
        * if model item isn't life orb, look for life orb text.
            * if life orb text existed, confirm item as life orb. break;
        * if model item isn't corresponding type plate, calc damage with type plate
            * within temp range, set model item to type plate (don't confirm, could be specs)
            * break;
        * if model item isn't specs
            * try specs. if in range, yes. Else, no.
    2c: Less than expected range
        * check faint case, ignore if it happened
        * check abilities, break if found
        * check EVs until 0 EV, neutral or less nature or a match found
        * check if positive item in model, decrement in terms of power until we find one that matches
    */
    return
}


function get_turn_information(turn_end_header){
    // Information gain, update our enemy team model
    // Case 0: Mega evolve. Confirm item, change pokemon, keep moves
    // Case 1: Enemy used a move we know about. decrement PP.
    // Case 2: Enemy used a move we haven't seen before. Run a movepool update (separate function?)
    // Basically, the battle log is first saved from the perspective of player_1, regardless of who is on each side, and then
    // transformed afterward. This basically means I NEED a username at the very least before parsing a line.
    // Yay. Double the parsing.
    // Go to the top of the turn, iterate through actions
    var history = $(turn_end_header).prevUntil("h2.battle-history",".battle-history").not(".spacer")
    var rev_history = $(history.get().reverse())
    console.log("History before node:")
    console.log(turn_end_header)
    console.log(rev_history)
    console.log(history)
    // TODO: make sure to grab nicknames / active data in general

    $(rev_history).each(function(){
        var info_string = this.innerText
        // Start with move model don't bother with the other stuff until completed predictor
        if (this.className == "chat battle-history") {
            // Case: We loaded turn 0, AKA "no information" state.
            // chat battle-history nodes only show up when both users first enter the battle.
            // They contain the user's username, and the teams, separated by spaced forward slashes

            var temp_username = $(this).find("strong").text().slice(0, -8).trim()
            // console.log(temp_username + " temp user")
            if (battle_info.username.user != temp_username && battle_info.username.user){
                battle_info.username.opponent = temp_username
                var team_string = $(this).find("em").text()
                // console.log(team_string)
                var team_split = team_string.split("/") // Don't need to worry about nicknames here
                team_split = team_split.map(s => s.trim())
                team_split.forEach(function(enemy_poke){
                    // Confirmed Data first
                    var pokedex_entry = POKEDEX_SM[enemy_poke]
                    var output_poke_confirmed = {}
                    output_poke_confirmed['name'] = enemy_poke
                    output_poke_confirmed['type1'] = pokedex_entry['t1']
                    output_poke_confirmed['type2'] = pokedex_entry['t2']
                    output_poke_confirmed['weight'] = pokedex_entry['w']
                    output_poke_confirmed['status'] = "Healthy"
                    pokemon_confirmed.opponent[enemy_poke] = output_poke_confirmed
                    pokemon_model.opponent[enemy_poke] = {}
                    // Time to make some guesses
                    var output_poke_model = {}

                })
                const url = chrome.runtime.getURL('data/gen7ou-1500.json');
                fetch(url)
                    .then((response) => response.json())
                    .then((json) => import_relevant_usage_stats(json));
                console.log(pokemon_confirmed)
                console.assert(team_split.length == 6)

            }else{
                // TODO: Blank username race condition fix
                // console.log("Not opponent username or blank user.username:")
                // console.log(temp_username)
                // console.log(battle_info.username.user)
            }
        }
        else if (info_string.startsWith("The opposing")){
            // Case: move from opponent. Add to confirmed movepool & do damage hypothesis stuff
            // Form: The opposing {nickname} used {move}!
            // TODO: This startsWith isn't enough to confirm that a move is being used.
            //      For example, intimidate hitting the opponent is enough to trigger this state right now
            // TODO: This runs into errors if nickname contains " used ". fix eventually when bored
            var move = {}
            var nickname = info_string.substring(13, info_string.indexOf(" used "))

            var move_name = $(this).find("strong").text()
            move = MOVES_SM[move_name]

            var subtext = ''
            if($(this).next().text() == "A critical hit!"){
                subtext = $(this).next().next().text()
                move['isCrit'] = true
            }else{
                subtext = $(this).next().text()
            }
            damage_analysis(battle_info.nicknames.opponent[nickname], move)
        }
        else if (info_string.startsWith(battle_info.username.opponent + " sent out ")){
            // Case: Nickname revealed, save it properly
            var poke_name = $(this).find("strong").text()
            var parsed_nick = info_string.replace(battle_info.username.opponent + " sent out ", '')
            if (parsed_nick == (poke_name + "!\n")){
                parsed_nick = parsed_nick.slice(0, -2)
            }
            else{
                console.log("("+parsed_nick+")")
                parsed_nick = parsed_nick.replace('(' +poke_name+ ')', '').slice(0,-3)
            }
            battle_info.nicknames.opponent[parsed_nick] = poke_name
            console.log("Did nickname parse")
            console.log(battle_info.username.opponent)
            console.log(battle_info)
        }
        else {
            console.log($(this).text())
        }
    })
    console.log(pokemon_confirmed)
    // Once we're done parsing the battle history, we can guarantee we have a nickname for each pokemon shown, so
    // active field won't break (probably)
    get_active_field()

    // Finished the "known" info parsing. Start making guesses
    fill_model()
    return
    /*

        2d: before we expected them to go by speed (us - them)*(our speed - their speed)< 0:
            * if it's a priority move, ignore
            * check EV spreads until maximized, break if we find a spread
            * if it's still bad, try scarf w/ original, then with maximized
        2d: slower than expected (ignore iron ball case for now):
            * if model item is scarf, change
            * try EVs until minimized or within range
    */
    // Case 3: Enemy switch happened. do nothing until we get a field update
    // Case 4: Enemy Ability information was given. set ability of pokemon
}


function get_active_field(){
    if (!room) {
        return console.error("No active battle room. Can't do active field parse.")
    }
    console.log("inner battle parsing")
    var innerbattle = $(room).find(".innerbattle")
    innerbattle.children().each(function(){
        //console.log('ibp')
        //console.log(this)
        if (this.className.includes("weather")) {
            parse_weather_node(this)
        }else if (this.className == 'leftbar' || this.className == 'rightbar') {
            parse_team_list(this)
        }else{
            var statbar_search = $(this).children(".statbar")
            if(statbar_search.length){
                //console.log("Found statbar nodes")
                statbar_search.each(function(){parse_statbar_node(this)})
            }
        }
    })
}


function parse_weather_node(node){
    // For parsing the weather field nodes
    node.classList.forEach((c) =>{
        switch(c){ // switch because it's easier to read
        // TODO: Set wherever I'm setting weather to the right things
        // TODO: snow hail stuff
            case 'sunweather': // fallthrough multiple statements is basically or operator
            case 'desolatelandweather': // same as below
            case 'sunnydayweather':
                battle_info['weather'] = 'Sun'
                break;
            case 'sandstormweather':
                battle_info['weather'] = 'Sand'
                break;
            case 'raindanceweather':
            case 'primordialseaweather': // This might need to be different (heavy rain), or ignored for now
            case 'rainweather':
                battle_info['weather'] = 'Rain'
                break;
            case 'mistyterrainweather':
                battle_info['terrain'] = 'Misty'
                break;
            case 'electricterrainweather':
                battle_info['terrain'] = 'Electric'
                break;
            case 'grassyterrainweather':
                battle_info['terrain'] = 'Grassy'
                break;
            case 'psychicterrainweather':
                battle_info['terrain'] = 'Psychic'
                break;
            case 'pseudoweather': // Trick room
                battle_info['trick_room'] = true
                break;
        }
    })
}


function parse_team_list(list_node){
    // This function is only really important if we're in a situation where we're loading from an unknown state.
    var me_or_them = ""
    if ($(list_node).find("strong").text() == battle_info.username.opponent){
        me_or_them = "opponent"
    }else{
        me_or_them = "user"
    }
    //console.log("Parsing team list for " + me_or_them)
    //console.log($(list_node).find(".picon"))
    var icons = $(list_node).find(".picon").each(function(){
        // console.log(this)
        var icon_text = this.title
        // First, parse HP or active status
        var last_parens = icon_text.slice(icon_text.lastIndexOf("(")+1,icon_text.lastIndexOf(")"))
        var hp_reg = /[0-9]+%(\|(tox|brn|par))?/
        var hp_float = -1
        var active_poke = false
        var hp_split = []
        if(last_parens == "active"){
            //console.log(" Active pokemon. Trimming")
            icon_text = icon_text.slice(0, icon_text.lastIndexOf("(")-1)
            last_parens = icon_text.slice(icon_text.lastIndexOf("(")+1,icon_text.lastIndexOf(")"))
            active_poke = true
        }else if(["psn","par","brn", "slp", "tox"].includes(last_parens)){
            hp_split = ["100%",last_parens]
        }else if(hp_reg.test(last_parens)){
            //console.log("Matches HP regex. doing current HP routine")
            //console.log(last_parens)
            hp_split = last_parens.split("|")
            hp_float = parseFloat(hp_split[0].slice(0,-1))*0.01

            icon_text = icon_text.slice(0, icon_text.lastIndexOf("(")-1)
            last_parens = icon_text.slice(icon_text.lastIndexOf("(")+1,icon_text.lastIndexOf(")"))
        }

        var poke_text = ""
        if(pokemon_confirmed[me_or_them][last_parens]){
            poke_text = last_parens
        }else if (pokemon_confirmed[me_or_them][icon_text]){
            poke_text = icon_text
        }else{
            console.error("Something is broken with parsing pokemon name for user list. i_t, l_p")
            console.log(icon_text)
            console.log(last_parens)
            console.log(me_or_them)
        }
        if(!active_poke){
            console.log(pokemon_confirmed[me_or_them][poke_text])
            console.log(me_or_them + " " + poke_text)
            pokemon_confirmed[me_or_them][poke_text].boosts = {
                at: 1,
                df: 1,
                sa: 1,
                sd: 1,
                sp: 1
            }
            battle_info.active_pokemon[me_or_them] = poke_text
        }

        if(hp_float != -1){
            if(pokemon_confirmed[me_or_them][poke_text].maxHP){
                pokemon_confirmed[me_or_them][poke_text].curHP = pokemon_confirmed[me_or_them][poke_text].maxHP*hp_float
            }else{
                pokemon_model[me_or_them][poke_text].curHP = pokemon_model[me_or_them][poke_text].maxHP*hp_float
            }
        }

        if(hp_split.length == 2){
            switch (hp_split[1]){
                case "tox":
                    pokemon_confirmed[me_or_them][poke_text].status = "Badly Poisoned"
                case "psn":
                    pokemon_confirmed[me_or_them][poke_text].status = "Poisoned"
                    break;
                case "brn":
                    pokemon_confirmed[me_or_them][poke_text].status = "Burned"
                    break;
                case "par":
                    pokemon_confirmed[me_or_them][poke_text].status = "Paralyzed"
                    break;
                case "slp":
                    pokemon_confirmed[me_or_them][poke_text].status = "Asleep"
                    break;
            }
        }
        //console.log(hp_float +",pc,pm")
        //console.log(pokemon_confirmed)
        //console.log(pokemon_model)


    })

}


function parse_statbar_node(statbar_node){
    //console.log("Parsing statbar")
    //console.log(statbar_node)
    var nickname = ""
    var nick_node = $(statbar_node).children("strong")
    var gender = ""

    if($(nick_node).find("img").length){
        gender = $(nick_node).find("img")[0].alt
        nickname = nick_node.text().slice(0,-1)
    }else{
        nickname = nick_node.text()
    }
    var me_or_them = $(statbar_node).hasClass("rstatbar") ? "user" : "opponent"
    var poke_name = battle_info["nicknames"][me_or_them][nickname]
    //console.log(nickname +" "+ me_or_them)
    //console.log(statbar_node)
    if(!pokemon_confirmed[me_or_them][poke_name]){
        console.log("Read before the client window was set correctly. Returning early.")
        return
    }
    pokemon_confirmed[me_or_them][poke_name].gender = gender == "M" ? "male" : gender == "F" ? "female" : "genderless"

    // Active pokemon health
    var hp_percent = parseFloat($(statbar_node).find("hptext").text().slice(0,-1))
    if(pokemon_confirmed[me_or_them][poke_name].maxHP){
        pokemon_confirmed[me_or_them][poke_name].curHP = hp_percent*0.01*pokemon_confirmed[me_or_them][poke_name].maxHP
    }else{
        pokemon_model[me_or_them][poke_name].curHP = hp_percent*0.01*pokemon_model[me_or_them][poke_name].maxHP
    }

    // Status and boosts
    var statused = false
    var boosts = {
         at: 1,
         df: 1,
         sa: 1,
         sd: 1,
         sp: 1
    }
    $(statbar_node).find(".status").children().each(function(){
        // Good / Bad is probably a boost
        // TODO: Taunt / other possible statuses (protean, torment, etc.)
        var boost_reg = /[0-9]?.?[0-9]?[0-9]× (Atk|Spe|SpD|SpA|Def)/
        if(boost_reg.test($(this).text())){
            var abbrev_map = {"Atk":"at","Def":"df","SpA":"sa","SpD":"sd","Spe":"sp"}
            var boost_val = parseFloat($(this).text().slice(0,$(this).text().indexOf("×")))
            var boost_stat = $(this).text().slice($(this).text().indexOf("×")+2)
            boosts[abbrev_map[boost_stat]] = boost_val
        }
        switch($(this).text()){
            case "BRN":
                pokemon_confirmed[me_or_them][poke_name].status = "Burned"
                statused = true
            case "PAR":
                pokemon_confirmed[me_or_them][poke_name].status = "Paralyzed"
                statused = true
            case "PSN":
                pokemon_confirmed[me_or_them][poke_name].status = "Poisoned"
                statused = true
                break;
            case "TOX":
                pokemon_confirmed[me_or_them][poke_name].status = "Badly Poisoned"
                statused = true
                break;
        }

    })
    pokemon_confirmed[me_or_them][poke_name].boosts = boosts
    if(!statused){
        pokemon_confirmed[me_or_them][poke_name].status = "Healthy"
    }
    console.log(pokemon_confirmed)
    console.log(pokemon_model)
}

function fill_model(){
    // All of the keys I'll need for any pokemon I want to do damage calcs on.
    // If it isn't in pokemon_confirmed, we need to guess it here.
    var needed_values = {
        rawStats: null,
        evs: null,
        maxHP: null,
        curHP: null,
        level: 100,
        HPEVs: null,
        stats: {},
        nature: null,
        ability: null,
        item: null,
        moves: [null,null,null,null],
        gender: "genderless" // Only important for rivalry / (eventually) attract. Might make sense to randomize it in the future
    }
    for(var pokemon in pokemon_confirmed.opponent){
        for(var key in needed_values){
            if(pokemon_confirmed.opponent[pokemon][key]){
                if(!key == "moves" || pokemon_confirmed.opponent[pokemon][key].length == 4){
                    console.log(pokemon + " has a confirmed "+key+". Skipping")
                    continue
                }
            }
            if(key == "rawStats"){
                // Do calcs for EVs, rawStats, maxHP, curHP, HPEVs, nature
                // Damage analysis should delete keys from our usage stats as current data is invalidated, so we should
                // always take the "most used" for each item.
                var most_used_spread = max_key(usage_stats[pokemon]["Spreads"])
                var split_spread = most_used_spread.split(":")
                pokemon_model.opponent[pokemon].nature = split_spread[0]
                split_spread = split_spread[1].split("/")
                var abbrevs = ["at","df","sa","sd","sp"]
                for(var i in abbrevs){
                    pokemon_model.opponent[pokemon].evs[abbrevs[i]] = split_spread[i+1]
                    var base = POKEDEX_SM[pokemon]['bs'][abbrevs[i]]
                    var level = pokemon_confirmed.opponent[pokemon].level
                    var natureMods = NATURES[pokemon_model.opponent[pokemon].nature]
                    var nature = natureMods[0] === statName ? 1.1 : natureMods[1] === statName ? 0.9 : 1;
                    var total = Math.floor((Math.floor((base * 2 + 31 + Math.floor(evs / 4)) * level / 100) + 5) * nature);
                    pokemon_model.opponent[pokemon].rawStats[abbrevs[i]] = total
                }
                if(!pokemon_confirmed.opponent[pokemon]["maxHP"]){
                    var prev_hp = false
                    if(pokemon_model.opponent[pokemon].curHP){
                        prev_hp = pokemon_model.opponent[pokemon].curHP/pokemon_model.opponent[pokemon].maxHP
                    }else if(pokemon_confirmed.opponent[pokemon].curHP){
                        prev_hp = pokemon_confirmed.opponent[pokemon].curHP/pokemon_confirmed.opponent[pokemon].maxHP
                    } // TODO: Fainted case leads to strange things here (because 0 hp)

                    pokemon_model.opponent[pokemon].HPEVs = split_spread[0]
                    var base_hp = POKEDEX_SM[pokemon]['bs']['hp']
                    if (base_hp === 1){
                        pokemon_confirmed.opponent[pokemon].maxHP = 1;
                        pokemon_confirmed.opponent[pokemon].curHP = 1;
                    }else{
                        pokemon_model.opponent[pokemon].maxHP =  Math.floor((base_hp * 2 + 31 + Math.floor(evs / 4)) * level / 100) + level + 10;
                        pokemon_model.opponent[pokemon].curHP = pokemon_model.opponent[pokemon].maxHP*prev_hp
                    }
                }
            }
            else if(key == "ability"){
                var most_used_abil = usage_key_links[max_key(usage_stats[pokemon]["Abilities"])]
                if(max_key(usage_stats[pokemon]["Abilities"]).length == 1){
                    pokemon_confirmed.opponent[pokemon].ability = most_used_abil
                }else{
                    pokemon_model.opponent[pokemon].ability = most_used_abil
                }
            }else if(key == "item"){
                pokemon_model.opponent[pokemon].item = usage_key_links[max_key(usage_stats[pokemon]["Items"])]
            }else if(key == "moves"){
                var move_array = []
                if(pokemon_confirmed.opponent[pokemon].moves){
                    move_array = pokemon_confirmed.opponent[pokemon].moves
                }
                var move_list = usage_stats[pokemon]["Moves"]
                if(!usage_stats[pokemon]["moves_sorted"]){
                    //TODO: When removing moves from the usage stats, remember to remove them from here too
                    usage_stats[pokemon]["moves_sorted"] = Object.keys(move_list).sort(function(a,b){return move_list[a]-move_list[b]}).reverse()
                }
                var moves_needed = 4 - move_list.length
                for(var i in usage_stats[pokemon]["moves_sorted"]){
                    if(!moves_needed){
                        break;
                    }
                    var move_name = usage_key_links[usage_stats[pokemon]["moves_sorted"][i]]
                    if(move_array.indexOf(MOVES_SM[move_name]) == -1){
                        // Objects are passed as references, so these should be literal matches, not just "looks the same" matches
                        move_array.push(MOVES_SM[move_name])
                        moves_needed -= 1
                    }
                }
                pokemon_model.opponent[pokemon].moves = move_array


            }
            else{
                pokemon_confirmed.opponent[pokemon][key] = needed_values[key]
            }
        }
    }
}

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

function max_key(dict){
    var count = -Infinity
    var max_key = null
    for(var key in dict){
        if(dict[key] > count){
            max_key = spread
            count = dict[key]
        }
    }
    return key
}


function bs_callback(mutationList, observer) {
    //console.log("new mutation")
    //console.log(mutationList)
    var do_parse = false
    mutationList.forEach((mutation) => {
    // TODO: Tests to make sure the ordering is coming in correctly.
        // This log 100% needs to be removed eventually. It spits every time body updates, which is a lot
        //console.log(mutation)

        if (mutation.type == 'childList'){
            if (mutation.addedNodes.length){
                // TODO: Teardown for battle finish when necessary
                mutation.addedNodes.forEach((node)=>{
                    if (node.id && node.id.includes("room-battle-gen7ou") && node.tagName == "DIV"){
                        console.log(node)
                        room = node
                    }
                    else if (node.className && node.className.includes('battle-history')){
                        //console.log(node)
                        //console.log("mut")
                        if (node.nodeName == "H2"){ // Case: just started a new turn
                            battle_info['turn'] = get_turn(node)
                            get_turn_information(node)
                        }
                    }
                    else if (mutation.target.className == 'userbar' && node.nodeName == "SPAN" && node.className == "username"){
                        battle_info.username.user = $(node).text().trim()
                        console.log("Loaded user ("+battle_info.username.user+")")


                    }
                })
            }

        }
        // TODO: cross off parsed info for opponent as this is parsed
        // TODO: get the pokemon info for the team that will be used. (find HO team because it's easier)

        // Important info seen
        /*
            TODO: Parse enemy team, assign to all_pokemon dict as pokemon_name: { pokemon class }
            div.chat.battle-history is always the team lists without nicknames in the format:
            <div class="chat battle-history">
                <strong>{player}'s team:</strong>
                <em style="color:#445566;display:block;">p1 / p2 / p3 / p4 / p5 / p6</em>
            </div>
            where p{number} is one of the pokemon.

            TODO: Parse statbar.rstatbar for both users
            Info and where it should go
            hp% --> pokemon
            <div class="statbar rstatbar" style="display: block; left: 130px; top: 120px; opacity: 1;">
                <strong>Tapu Bulu</strong>
                <div class="hpbar">
                    <div class="hptext">88%</div>
                    <div class="hptextborder"></div>
                    <div class="prevhp" style="width: 133px;">
                        <div class="hp" style="width: 132px; border-right-width: 1px;"></div>
                    </div>
                    <div class="status">
                        <span class="psn">PSN</span>
                        <span class="good">3×&nbsp;Def</span>
                        <span class="good">2.5×&nbsp;SpA</span>
                        <span class="good">2.5×&nbsp;SpD</span>
                        <span class="bad">0.67×&nbsp;Atk</span>
                        <span class="bad">0.75×&nbsp;Evasion</span>
                    </div>
                </div>
            </div>



            TODO: Parse Entry Hazards - can ignore this for later
        */

    });
}

$(document.body).ready(function(){
    console.log("Init state");
    var battle_start_obs = new MutationObserver(bs_callback)

    console.log(battle_info)
    /*for(var key in ITEMS_SM){
        var lower = ITEMS_SM[key].replace(/[^A-Z0-9]/ig, "").toLowerCase()
        usage_key_links[lower] = ITEMS_SM[key]
    }
    for(var key in MOVES_SM){
        var lower = key.replace(/[^A-Z0-9]/ig, "").toLowerCase()
        usage_key_links[lower] = key
    }
    for(var key in ABILITIES_SM){
        var lower = ABILITIES_SM[key].replace(/[^A-Z0-9]/ig, "").toLowerCase()
         usage_key_links[lower] = ABILITIES_SM[key]
    }*/
    //console.log(usage_key_links)


    battle_start_obs.observe(document.body,observerOptions)
    $("div", $("body")).each(function(){
        // console.log(this)
        if (this.id && this.id.includes("room-battle-gen7ou") && this.tagName == "DIV"){
            room = this
            console.log(this)
        }
    })
    console.log("done body")
});