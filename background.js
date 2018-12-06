
'use strict';

// The 'room' node for the battle. should be  a div matching the id=room-battle-gen7ou-{id}
var room = null
// Observer stuff
var observerOptions = {
      childList: true,
      attributes: true,
      subtree: true
}

var all_pokemon_confirmed = {
/* example version of the all_pokemon object
{
    "user":{
        "Tapu Bulu":{
            name: string (actual pokedex name)
            // These are base stats
            rawStats: {
                SD: 10,
                SA: 11,
                AT: 12,
                DF: 13,
                SP: 14,
            },
            boosts: { // Must be filled out
                SD: 1,
                AT: 1.5,
                ...
            },
            evs: {
                SD: 0-252
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
            moves: [string, string...?],
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

    },
    opponent:{

    }
}

var all_pokemon_model = {} // Same as above, but is only values that don't exist but need to. "Unconfirmed"
var battle_info = {
    turn: 0,
    weather: null,
    terrain: null,
    trick_room: false,
    stealth_rock: false, // Might not use entry hazards until first pass finishes
    spikes: 0,
    toxic_spikes: 0,
    active_pokemon: {
        user: null, // pokedex name so that you can go all_pokemon_confirmed.opponent[battle_info.active_pokemon.opponent]
        opponent: null
    },
    nicknames:  {
        user: { //battle_info.nicknames.user[name] is a little clumsy but whatever
            //nickname: pokedex name
        },
        opponent: {}
    }
}

var turn_log = {
    /*
        format example
        new information should be shown as the info dicts keys so that a replacing union can be done on each var
        1: {
            all_pokemon: {
                opponent: {
                    ...
                }
            }
            battle_info: {
                ...
            }
        }
    */
}

function get_turn(node){
    // TODO: iterate backwards through battle history until we hit a h2 node (jquery?), return it's turn number
    //console.log("call from get_turn")
    //console.log(node)
    //console.log($(node).prevUntil('h2.battle-history').prev())
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
function parse_bh_node(node){
    // Parse a battle history node
    // TODO: If the opponent reveals
    // h2 nodes are "New turn" nodes.
    if (get_turn(node) < battle_info['turn']){
        // This case may never come up if everything is always ordered properly. Can check and delete if not important
        console.log("Hit a bad turn node! Info:")
        console.log(node)
        console.log("Perceived turn: "+ get_turn(node))
        console.log("Actual turn: "+ battle_info['turn'])
        return
    }else if (get_turn(node) > battle_info['turn']){
        battle_info['turn'] = get_turn(node)
        if (node.nodeName == "H2"){ // Case: just started a new turn
            // TODO: active field update called here
            // TODO: check where a new turn is considered in the case of a faint
            // Store turn info from the last round
            console.log("Updating turn info before")
            console.log(node)
            battle_info['turn'] = get_turn(node)
            get_turn_information(node)
            return
        }
    }
}
function offensive_move_analysis(name,move){
    return
}
function get_turn_information(turn_end_header){
    // Information gain, update our enemy team model
    // Case 0: Mega evolve. Confirm item, change pokemon, keep moves
    // Case 1: Enemy used a move we know about. decrement PP.
    // Case 2: Enemy used a move we haven't seen before. Run a movepool update (separate function?)

    // Go to the top of the turn, iterate through actions
    var rev_history = $(turn_end_header).prevUntil("h2.battle-history",".battle-history").not(".spacer")
    console.log("History before node:")
    console.log(turn_end_header)
    console.log(rev_history)
    var history = rev_history.get().reverse()
    $(history).each(function(){
        var info_string = this.innerText
        // TODO: Regex matches for each of the info messages to simplify stuff
        // Start with move model don't bother with the other stuff until completed predictor
        if (info_string.startsWith("The opposing")){
            // Case: move from opponent. Add to confirmed movepool & do
            // Form: The opposing {nickname} used {move}!
            // TODO: This runs into errors if nickname contains " used ". fix eventually when bored
            var move = {}
            var nickname = info_string.substring(13, info_string.indexOf(" used "))
            move['name'] = info_string.substring(info_string.indexOf(" used ")+6, info_string.length - 2)
            console.assert(battle_info.nicknames.opponent[nickname] == battle_info.active_pokemon.opponent)
            // TODO: right here, add the move to the confirmed model
            var subtext = ''
            if($(this).next().text() == "A critical hit!"){
                subtext = $(this).next().next().text()
                move['isCrit'] = true
            }else{
                subtext = $(this).next().text()
            }

            // TODO: get base move data from data/moves (bp/type/etc), write the following function
            // See below super comment
            offensive_move_analysis(battle_info.nicknames.opponent[nickname], move)

            console.log("sub" + subtext)
            console.log(nickname)
            console.log(MOVES_XY[move['name']])
        }else{
            console.log($(this).text())
        }
    })
    return
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
    // TODO: Transform the battle info divs from the last turn into an array of strings
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
                battle_info['weather'] = 'sun'
                break;
            case 'sandstormweather':
                battle_info['weather'] = 'sand'
                break;
            case 'raindanceweather':
            case 'primordialseaweather': // This might need to be different, or ignored for now
            case 'rainweather':
                battle_info['weather'] = 'rain'
                break;
            case 'mistyterrainweather':
                battle_info['terrain'] = 'misty'
                break;
            case 'electricterrainweather':
                battle_info['terrain'] = 'electric'
                break;
            case 'grassyterrainweather':
                battle_info['terrain'] = 'grassy'
                break;
            case 'psychicterrainweather':
                battle_info['terrain'] = 'psychic'
                break;
            case 'pseudoweather': // Trick room
                battle_info['trick_room'] = true
                break;
        }
    })
}


var battle_node = null
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
                mutation.addedNodes.forEach((node)=>{
                    if (node.id && node.id.includes("room-battle-gen7ou") && node.tagName == "DIV"){
                        console.log(node)
                        room = node
                    }

                    if (node.className && node.className.includes('battle-history')){
                        //console.log(node)
                        //console.log("mut")
                        parse_bh_node(node)
                    }
                })
            }

        }else if (mutation.type == 'attributes') {
            // look for weather here in mutation.target.div.weather
            if (mutation.target.className.includes("weather")){
            // Case: our blank weather node got a new secondary class of '{type_of_weather}weather'
                mutation.target
            }
        }
        // TODO: cross off parsed info for opponent as this is parsed
        // TODO: get the pokemon info for the team that will be used. (find HO team because it's easier)
        // TODO: check if mutation in battle_node, if so, parse it accordingly

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

// Load up our observers
$(document.body).ready(function(){
    console.log("Running the thing");
    var battle_start_obs = new MutationObserver(bs_callback)
    console.log(document.body)
    // TODO: Remove the random shit right here
    console.log("TESTING IMPORTS")
    console.log(POKEDEX_XY["Venusaur"])
    battle_start_obs.observe(document.body,observerOptions)
    $("div", $("body")).each(function(){
        // console.log(this)
        if (this.id && this.id.includes("room-battle-gen7ou") && this.tagName == "DIV"){
            console.log(this)
        }
    })
    console.log("done body")
});