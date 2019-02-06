// This file will contain all 'secondary effects' for a move.

// Cases for secondary effects (non damage):
/*
  Case 1, Guaranteed: Eval function should evaluate the situation as if the outcome will happen no matter what
  Case 2, Potential: Need to split off into two separate Eval situations
    * Methods for doing this
        * Before damage is applied, if the move has a 'potential' clause, split into two separate situations with each
        containing the literal case, expectimax over them
        * Most obvious case is something like scald, one case burn, another case no burn
        * Might be better to ignore this case until I get multiple depth working
*/

// Main (non-damaging) effects are applied using the nonDamagingEffect() function
// Secondary 'possible' effects are applied using the potentialEffect() function
/*
    nonDamagingEffect(model, battle_info, attacker, defender) --> none
        Should edit the model and battle_info objects with the guaranteed outcomes that happen when the option is executed
    potentialEffect(model, battle_info, attacker, defender) --> [(new_model_0, new_bi_0, chance_0), (new_model_1, new_bi_1, chance_1)...]
        Should create a deep copied battle_info and model for each potential situation.
        chance is a float between 0 & 1 that represents the chance of that outcome occurring.

    attacker/defender should be a tuple with two strings, user/opponent and Pokemon name.
    target for the 'common effect' functions should be the same
*/

// Common Effects
function Burn(model, battle_info, target, chance=1){
    if (chance != 1){
        var burned_model = JSON.parse(JSON.stringify(model));
        var burned_bi = JSON.parse(JSON.stringify(battle_info));
        burned_model[target[0]][target[1]]['status'] = "Burned"
        var unburned_model = JSON.parse(JSON.stringify(model));
        var unburned_bi = JSON.parse(JSON.stringify(battle_info));
        return [(unburned_model, unburned_bi, 1-chance), (burned_model, burned_bi, chance)]
    }else{
        model[target[0]][target[1]]['status'] = "Burned"
        return [(model, battle_info)]
    }
}

function Paralyze(model, battle_info, target, chance=1){
    if (chance != 1){
        var para_model = JSON.parse(JSON.stringify(model));
        var para_bi = JSON.parse(JSON.stringify(battle_info));
        para_model[target[0]][target[1]]['status'] = "Paralyzed"
        var unpara_model = JSON.parse(JSON.stringify(model));
        var unpara_bi = JSON.parse(JSON.stringify(battle_info));
        return [(unpara_model, unpara_bi, 1-chance), (para_model, para_bi, chance)]
    }else{
        model[target[0]][target[1]]['status'] = "Paralyzed"
        return [(model, battle_info)]
    }
}

function Poison(model, battle_info, target, chance=1){
    if (chance != 1){
        var poisoned_model = JSON.parse(JSON.stringify(model));
        var poisoned_bi = JSON.parse(JSON.stringify(battle_info));
        poisoned_model[target[0]][target[1]]['status'] = "Poisoned"
        var unpoisoned_model = JSON.parse(JSON.stringify(model));
        var unpoisoned_bi = JSON.parse(JSON.stringify(battle_info));
        return [(unpoisoned_model, unpoisoned_bi, 1-chance), (poisoned_model, poisoned_bi, chance)]
    }else{
        model[target[0]][target[1]]['status'] = "Poisoned"
        return [(model, battle_info)]
    }
}

function Toxic(model, battle_info, target, chance=1){
    if (chance != 1){
        var poisoned_model = JSON.parse(JSON.stringify(model));
        var poisoned_bi = JSON.parse(JSON.stringify(battle_info));
        poisoned_model[target[0]][target[1]]['status'] = "Badly Poisoned"
        var unpoisoned_model = JSON.parse(JSON.stringify(model));
        var unpoisoned_bi = JSON.parse(JSON.stringify(battle_info));
        return [(unpoisoned_model, unpoisoned_bi, 1-chance), (poisoned_model, poisoned_bi, chance)]
    }else{
        model[target[0]][target[1]]['status'] = "Badly Poisoned"
        return [(model, battle_info)]
    }
}

function Freeze(model, battle_info, target, chance=1){
    if (chance != 1){
        var frozen_model = JSON.parse(JSON.stringify(model));
        var frozen_bi = JSON.parse(JSON.stringify(battle_info));
        frozen_model[target[0]][target[1]]['status'] = "Frozen"
        var unfrozen_model = JSON.parse(JSON.stringify(model));
        var unfrozen_bi = JSON.parse(JSON.stringify(battle_info));
        return [(unfrozen_model, unfrozen_bi, 1-chance), (frozen_model, frozen_bi, chance)]
    }else{
        model[target[0]][target[1]]['status'] = "Frozen"
        return [(model, battle_info)]
    }
}

function Boost(model, battle_info, target, boost_array, chance=1){
    function do_boost(b_obj, boosts){
        // boost stages 2/8	2/7	2/6	2/5	2/4	2/3	2/2	3/2	4/2	5/2	6/2	7/2	8/2
        // TODO: Need to do one for accuracy when I'm not bored of this
        var current_b = boosts[b_obj[0]]
        if((current_b == 4 && b_obj[1] > 0) || (current_b == 0.25 && b_obj[1] < 0)){
            return
        }
        var numerator = 2
        var denominator = 2
        if(current_b < 1){
            denominator = 2/current_b
        }else{
            numerator = 2*current_b
        }
        var stage = numerator - denominator
        stage += b_obj[1]
        if(stage < 0){
            boosts[b_obj[0]] = Math.max(0.25, 2/(2 - stage))
        }else{
            boosts[b_obj[0]] = Math.min(4, (2+stage)/2)
        }
    }
    if (chance != 1){
        var unboosted_model = JSON.parse(JSON.stringify(model));
        var unboosted_bi = JSON.parse(JSON.stringify(battle_info));
        var boosted_model = JSON.parse(JSON.stringify(model));
        var boosted_bi = JSON.parse(JSON.stringify(battle_info));
        for(boost in boost_array){
            var b_obj = boost_array[boost]
            var boosts = boosted_model[target[0]][target[1]]['boosts']
            do_boost(b_obj, boost)
        }
        return [(unboosted_model, unboosted_bi, 1-chance), (boosted_model, boosted_bi, chance)]
    }else{
        for(boost in boost_array){
            var b_obj = boost_array[boost]
            var boosts = model[target[0]][target[1]]['boosts']
            do_boost(b_obj, boost)
        }
        return [(model, battle_info)]
    }
}

var MOVES_EXTENDED = $.extend(true, {}, MOVES_SM, {
    'Fire Punch' : {
        potentialEffect: function(model, battle_info, attacker, defender){
            return Burn(model, battle_info, defender, .1)
        }
    },
    'Ice Punch' : {
        potentialEffect: function(model, battle_info, attacker, defender){
            return Freeze(model, battle_info, defender, .1)
        }
    },
    'Thunder Punch' : {
        potentialEffect: function(model, battle_info, attacker, defender){
            return Paralyze(model, battle_info, defender, .1)
        }
    },
    'Swords Dance' : {
        nonDamagingEffect: function(model, battle_info, attacker, defender){
            Boost(model, battle_info, attacker, [("at",2)])
        }
    },
    'Whirlwind' : {
        potentialEffect: function(model, battle_info, attacker, defender){
            def_mons = model[defender[0]]
            potential_switches = []
            for(def_mon in def_mons){
                if(def_mons[def_mon].status != "Fainted"){
                    var temp_model = JSON.parse(JSON.stringify(model));
                    var temp_bi = JSON.parse(JSON.stringify(battle_info));
                    doOnSwitch(temp_model, temp_bi, ['switch', defender[1]], defender[0])
                    potential_switches.push(temp_model, temp_bi)
                }
            }
            switch_chance = 1/potential_switches.length
            for(i in potential_switches){
                potential_switches[i] = (potential_switches[i][0],potential_switches[i][1], switch_chance)
            }
            return potential_switches
        }
    }
    'Jump Kick' : {
        onMiss: function(model, battle_info, attacker, defender){
            // TODO: Damage user by 50% curHP
            return
        }
    }
    'Sand Attack' : {
        nonDamagingEffect: function(model, battle_info, attacker, defender){
            Boost(model, battle_info, defender, [("ac", -1)])
        }
    }
})