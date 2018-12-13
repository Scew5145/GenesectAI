'use strict';

console.log("In predict_turn")
var step = function (model, battle_info, action){
    // return: [model, battle_info]
    // Note: both model and battle_info should be completely new dicts. This is so that the previous models don't get messed up.
    // Pokemon is a bit special in that both users must make their move before a turn can be evaluated.
    /*
    actions can be either switch or move, and their case should be as follows:
    action:{
        user: ["switch",(string:pokemon_name)]
        opponent: ["move", move object]
    }
    in the case of u-turn/volt-switch, the input should be ["move", (int:move_index), "switch", (string:"pokemon")]
    same with anything that needs chained inputs.
    battle_info & model are the format of pokemon_model and battle_info.
    */
    //console.log("started step function")
    var output_model = JSON.parse(JSON.stringify(model));
    var output_battle_info = JSON.parse(JSON.stringify(battle_info));

    
    
    var event_order = []
    //console.log("Getting Active pokemon")
    var user_poke = output_model.user[battle_info.active_pokemon.user]
    var opponent_poke = output_model.opponent[battle_info.active_pokemon.opponent]
    //console.log(user_poke)
    //console.log(opponent_poke)
    var user_speed_literal = getFinalSpeed(user_poke, battle_info.weather)
    var opponent_speed_literal = getFinalSpeed(opponent_poke, battle_info.weather)
    calcStats(user_poke, opponent_poke)

    if(action.opponent[0] == "move"){
        // Opponent might have revealed some information!
        if(!opponent_poke.moves){
            // Case: haven't seen any moves at all.
            opponent_poke.moves = []
            opponent_poke.moves.push(action.opponent[1])
        }
        else if(opponent_poke.moves.indexOf(action.opponent[1]) == -1){
            console.assert(opponent_poke.moves.length <= 4)
            opponent_poke.moves.push(action.opponent[1])
        }
    }

    if((action.user[0] === "switch") && (action.opponent[0] === "switch")){
        if(user_speed_literal > opponent_speed_literal){
            event_order.push(action.user)
            event_order.push(action.opponent)
        }else{ // Play as if speed ties are always lost
            event_order.push(action.opponent)
            event_order.push(action.user)
        }
    }
    else if((action.user[0] === "move") && (action.opponent[0] === "switch")){
        if(MOVES_SM["Pursuit"] === action.user[1]){
            event_order.push(action.user)
            event_order.push(action.opponent)
        }else{
            event_order.push(action.opponent)
            event_order.push(action.user)
        }
    }
    else if((action.user[0] === "switch") && (action.opponent[0] === "move")){
        if(MOVES_SM["Pursuit"] === MOVES_SM[opponent_poke.moves[action.opponent[1]]]){
            event_order.push(action.opponent)
            event_order.push(action.user)
        }else{
            event_order.push(action.user)
            event_order.push(action.opponent)
        }
    }
    else if((action.user[0] === "move") && (action.opponent[0] === "move")){
        var user_prio = getPriority(action.user[1])
        var opponent_prio = getPriority(action.opponent[1])
        if(user_prio > opponent_prio){
            event_order.push(action.user)
            event_order.push(action.opponent)
        }else if(user_prio < opponent_prio){
             event_order.push(action.opponent)
             event_order.push(action.user)
        }else{
            if(user_speed_literal > opponent_speed_literal){
                event_order.push(action.user)
                event_order.push(action.opponent)
            }else{
                event_order.push(action.opponent)
                event_order.push(action.user)
            }
        }
    }

    //console.log("Doing events")
    while(event_order.length){
        var user_poke = output_model.user[output_battle_info.active_pokemon.user]
        var opponent_poke = output_model.opponent[output_battle_info.active_pokemon.opponent]
        calcStats(user_poke, opponent_poke)
        var event = event_order.shift()
        var me_or_them = event === action.user ? "user" : "opponent"
        //console.log(event)
        //console.log(me_or_them)
        if(event[0] == "move"){
            if([MOVES_SM["Volt Switch"], MOVES_SM["U-Turn"], MOVES_SM["Baton Pass"]].indexOf(event[1]) != -1){
                event_order.unshift([event[2], event[3]])
            }
            var attacker = me_or_them == "user" ? user_poke : opponent_poke
            var defender = me_or_them == "user" ? opponent_poke : user_poke
            //console.log(event)
            doAttack(attacker, defender, output_model, output_battle_info, event[1], me_or_them)
        }
        if(event[0] == "switch"){
            doOnSwitch(output_model, output_battle_info, event, me_or_them)
            // TODO: Set active poke on deep copied battle_info.
        }
    }
    //doPostTurn(model, battle_info) // TODO: status damage, any cooldown effects
    return {model:output_model, battle_info:output_battle_info}

}

function doOnSwitch(model, battle_info, event, me_or_them){
    // Modify the model based on the given switch
    battle_info.active_pokemon[me_or_them] = event[1]
    // TODO: Apply hazards to switching pokemon
    // TODO: Apply abilities, etc.
}
function getField(battle_info, me_or_them){
    var i = me_or_them == "user" ? 0 : 1
    var field = {
        format: battle_info.format,
        terrain: battle_info.terrain,
        weather: battle_info.weather,
        isGravity: battle_info.isGravity,
        isSR: battle_info.isSR[i],
        spikes: battle_info.spikes[i],
        isReflect: battle_info.isReflect[i],
        isLightScreen: battle_info.isLightScreen[i],
        isProtected: battle_info.isProtected[i],
        isForesight: battle_info.isForesight[i],
        isHelpingHand: battle_info.isHelpingHand[i],
        isFriendGuard: battle_info.isFriendGuard[i],
        isAuroraVeil: battle_info.isAuroraVeil[i]
    }
    field.getWeather= function() {
        return this.weather;
    };
    return field
}
function doAttack(attacker, defender, model, battle_info, move, me_or_them){
    // TODO: define pass on apply guaranteed for all moves
    if(move.bp === 0){
        if(move.applyGuaranteedEffects){
            return move.applyGuaranteedEffects(attacker, defender, model, battle_info, move, me_or_them)
        }
    }
    var isProtected = false
    if(me_or_them == "user"){
        isProtected = battle_info.isProtected[0]
    }else{
        isProtected = battle_info.isProtected[1]
    }
    if(isProtected && !move.isZ){
        // TODO: spiky shield / kings shield cases
        return
    }
    if(move.makesContact){
        // doContact(attacker, defender, model, battle_info, move, me_or_them)
        // TODO: doContact stuff:
        // apply ability, item (other stuff?) that occur when contact happens
        // Makes the most sense to attach them to the items/abilities themselves if this gets bigger
    }

    // TODO: more edge cases. onFaint (aftermath, beast boost), onDamaged (color change), attacker onUseMove (e.g protean)
    //console.log(move)
    //console.log(getField(battle_info))
    var damage_output = getDamageResult(attacker, defender, move, getField(battle_info))["damage"]
    //console.log(damage_output)
    // TODO: get mean here, use that as damage output and eventually * acc
    // TODO: for items with acc, may make more sense to PIMC over the possible outcomes instead, just return both with chance
    var sum = 0
    for(var i in damage_output){
        //console.log(damage_output[i])
        sum += damage_output[i]
    }
    //console.log("SUM")
    //console.log(sum)
    var damage_mean = sum/damage_output.length
    if(defender.curHP < damage_mean){
        //console.log(defender.name + "Fainted!")
        /*console.log("Circumstances: (a,d,m,b,move,me_or_them)")
        console.log(attacker)
        console.log(defender)
        console.log(battle_info)
        console.log(model)
        console.log(move)
        console.log(me_or_them)*/
        defender.status = "Fainted"
        defender.curHP = 0
    }else{
        defender.curHP = defender.curHP - damage_mean
    }
}

function getPriority(move){
    /* Turn order
        +6  Switching
        +5	Helping Hand
        +4	Baneful Bunker, Detect, Endure, King's Shield, Magic Coat, Protect, Spiky Shield, Snatch
        +3	Crafty Shield, Fake Out, Quick Guard, Wide Guard, Spotlight
        +2	Ally Switch, Extreme Speed, Feint, First Impression, Follow Me, Rage Powder
        +1	Accelerock, Aqua Jet, Baby-Doll Eyes, Bide, Bullet Punch, Ice Shard, Ion Deluge, Mach Punch,
        Powder, Quick Attack, Shadow Sneak, Sucker Punch, Vacuum Wave, Water Shuriken
        0	All other moves
        -1	Vital Throw
        -2	None
        -3	Beak Blast, Focus Punch, Shell Trap
        -4	Avalanche, Revenge
        -5	Counter, Mirror Coat
        -6	Circle Throw, Dragon Tail, Roar, Whirlwind
        -7	Trick Room, fleeing
    */
    // Objects are stored as references in javascript so this isn't as completely terrible as it looks
    var prio = [MOVES_SM["Helping Hand"]]
    if(prio.indexOf(move) != -1){return 5}

    prio = [MOVES_SM["Baneful Bunker"], MOVES_SM["Detect"], MOVES_SM["Endure"], MOVES_SM["King\'s Shield"],
                  MOVES_SM["Magic Coat"], MOVES_SM["Protect"], MOVES_SM["Spiky Shield"], MOVES_SM["Snatch"]]
    if(prio.indexOf(move) != -1){return 4}

    prio = [MOVES_SM["Crafty Shield"], MOVES_SM["Fake Out"], MOVES_SM["Quick Guard"], MOVES_SM["Wide Guard"], MOVES_SM["Spotlight"]]
    if(prio.indexOf(move) != -1){return 3}

    prio = [MOVES_SM["Ally Switch"], MOVES_SM["Extreme Speed"], MOVES_SM["Feint"], MOVES_SM["First Impression"],
                  MOVES_SM["Follow Me"], MOVES_SM["Rage Powder"]]
    if(prio.indexOf(move) != -1){return 2}

    prio = [MOVES_SM["Accelerock"], MOVES_SM["Aqua Jet"], MOVES_SM["Baby-Doll Eyes"], MOVES_SM["Bide"],
                  MOVES_SM["Bullet Punch"], MOVES_SM["Ice Shard"], MOVES_SM["Ion Deluge"], MOVES_SM["Mach Punch"],
                  MOVES_SM["Powder"], MOVES_SM["Quick Attack"], MOVES_SM["Shadow Sneak"], MOVES_SM["Sucker Punch"],
                  MOVES_SM["Vacuum Wave"], MOVES_SM["Water Shuriken"]]
    if(prio.indexOf(move) != -1){return 1}

    prio = [MOVES_SM["Vital Throw"]]
    if(prio.indexOf(move) != -1){return -1}
    prio = [MOVES_SM["Beak Blast"], MOVES_SM["Focus Punch"], MOVES_SM["Shell Trap"]]
    if(prio.indexOf(move) != -1){return -3}
    prio = [MOVES_SM["Avalanche"], MOVES_SM["Revenge"]]
    if(prio.indexOf(move) != -1){return -4}
    prio = [MOVES_SM["Counter"], MOVES_SM["Mirror Coat"]]
    if(prio.indexOf(move) != -1){return -5}
    prio = [MOVES_SM["Circle Throw"], MOVES_SM["Dragon Tail"], MOVES_SM["Roar"], MOVES_SM["Whirlwind"]]
    if(prio.indexOf(move) != -1){return -6}
    prio = [MOVES_SM["Trick Room"]]
    if(prio.indexOf(move) != -1){return -7}
    return 0


}

function calcStats(user_poke, opponent_poke){
    //console.log(user_poke)
    //console.log(opponent_poke)
    user_poke.stats = {}
    opponent_poke.stats = {}
    user_poke.stats[DF] = getModifiedStat(user_poke.rawStats[DF], user_poke.boosts[DF]);
    user_poke.stats[SD] = getModifiedStat(user_poke.rawStats[SD], user_poke.boosts[SD]);
    user_poke.stats[SP] = getFinalSpeed(user_poke, battle_info.getWeather());
    opponent_poke.stats[DF] = getModifiedStat(opponent_poke.rawStats[DF], opponent_poke.boosts[DF]);
    opponent_poke.stats[SD] = getModifiedStat(opponent_poke.rawStats[SD], opponent_poke.boosts[SD]);
    opponent_poke.stats[SP] = getFinalSpeed(opponent_poke, battle_info.getWeather());
    user_poke.stats[AT] = getModifiedStat(user_poke.rawStats[AT], user_poke.boosts[AT]);
    user_poke.stats[SA] = getModifiedStat(user_poke.rawStats[SA], user_poke.boosts[SA]);
    opponent_poke.stats[AT] = getModifiedStat(opponent_poke.rawStats[AT], opponent_poke.boosts[AT]);
    opponent_poke.stats[SA] = getModifiedStat(opponent_poke.rawStats[SA], opponent_poke.boosts[SA]);
}