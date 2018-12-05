
'use strict';

// Observer stuff
var observerOptions = {
      childList: true,
      attributes: true,
      subtree: true
}

var all_pokemon = {
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
    "user":{

    }
    "opponent":{

    }
}


var battle_node = null
function bs_callback(mutationList, observer) {

    var do_parse = false
    mutationList.forEach((mutation) => {
        console.log(mutation)
        if (mutation.type == 'childList'){
            if (mutation.addedNodes.length){
                mutation.addedNodes.forEach((node)=>{
                    if (node.id && node.id.includes("room-battle-gen7ou") && node.tagName == "DIV"){
                        console.log(node)
                        startup_parse_battle(node)
                    }
                })
            }
        }else if (mutation.type == 'attributes') {
            // look for weather here in mutation.target.div.weather
            break
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


// right bar


function startup_parse_battle(battle_room_div){
    // TODO: anything that needs to happen before the battle fully loads.
    console.log(inner_battle)
    battle_node = battle_room_div
    // hazards
    // ignore Gender, should be grabbed only during move calcs
    //
    // Pokemon name --> get confirmed stats from battle log

    // 'return': save battle data to storage as {battle ID}
}

// Load up our observers
$(document.body).ready(function(){
    console.log("Running the thing");
    var battle_start_obs = new MutationObserver(bs_callback)
    console.log(document.body)

    battle_start_obs.observe(document.body,observerOptions)
    $("div", $("body")).each(function(){
        // console.log(this)
        if (this.id && this.id.includes("room-battle-gen7ou") && this.tagName == "DIV"){
            console.log(this)
            startup_parse_battle(this)
        }
    })
    console.log("done body")
});