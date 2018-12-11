'use strict';

function step(model, battle_info, action){
    // return: [model, battle_info]
    // Note: both model and battle_info should be completely new dicts. This is so that the previous models don't get messed up.
    // Pokemon is a bit special in that both users must make their move before a turn can be evaluated.
    /* Turn order
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
    /*
    actions can be either switch or move, and their case should be as follows:
    action:{
        user: ["switch",(string:pokemon_name)]
        opponent: ["move", (int:move_index)]
    }
    in the case of u-turn/volt-switch, the input should be ["move", (int:move_index), "switch", (string:"pokemon")]
    same with anything that needs chained inputs.
    battle_info & model are the format of pokemon_model and battle_info.
    */
    var output_model = JSON.parse(JSON.stringify(model));
    var output_battle_info = JSON.parse(JSON.stringify(battle_info));

    var event_order = []
    var user_poke = model.user[battle_info.active_pokemon.user]
    var opponent_poke = model.opponent[battle_info.opponent_poke.user]
    var user_speed_literal = getFinalSpeed(user_poke, battle_info.weather)
    var opponent_speed_literal = getFinalSpeed(opponent_poke, battle_info.weather)
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
        if(MOVES_SM["Pursuit"] === MOVES_SM[user_poke.moves[action.user[1]]]){
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

    for(var event in event_order){
        var me_or_them = event === action.user ? "user" : "opponent"
        var i = 0
        while(i < event.length - 1){
            if(event[i][0] == "move"){
                var attacker = me_or_them == "user" ? user_poke : opponent_poke
                var defender = me_or_them == "user" ? user_poke : opponent_poke
                // TODO: Damage calc, get the int. apply the damage to the deep copied model/battle_info
                var field = construct_field_object(attacker, defender, event[i][1], battle_info)
                var d_output = getDamageResult(attacker, defender, move, field)
                if(move == MOVES_SM["Pursuit"]){
                    // TODO: This case when I'm more confident with how it works
                    if((event.length - 1) < i+1 && event[i+1] == "switch"){
                        d_output = 2*d_output // This will break until I do it element-wise
                    }
                    //d_output['damage'] = damage*2
                }
            }
            if(event[i][0] == "switch"){
                doOnSwitch(output_model, output_battle_info, event[i], me_or_them)
                // TODO: Set active poke on deep copied battle_info.
            }
            i += 1
        }
    }

}

function doOnSwitch(model, battle_info, event, me_or_them){
    // Modify the model based on the given switch
    output_battle_info.active_pokemon[me_or_them] = event[i][1]
    // TODO: Apply hazards to switching pokemon
    // TODO: Apply abilities
}

function getPriority(move){
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

function getWeather() {
    return weather;
};
this.getSide = function (i) {
    return new Side(format, terrain, weather, isGravity, isSR[i], spikes[i], isReflect[i], isLightScreen[i], isProtected[i], isSeeded[1 - i], isSeeded[i], isForesight[i], isHelpingHand[i], isFriendGuard[i], isAuroraVeil[i]);
};