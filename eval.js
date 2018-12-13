// License information can be found in the repository's LICENSE file.

"use strict";

function choose_action(pokemon_confirmed, battle_info, eval_depth){
    // Takes the known information and the battle state to evaluate the possible moves using the given eval function.
    /*
        This can be considered the "upper level" evaluation function. Ala minimax or something similar.
        This is my implementation of the Perfect Information Monte Carlo algorithm

    */
    // TODO: More edge cases because apparently there's more of those than non-exceptions in pokemon
    // (Mega Evolutions, Z-moves)
    // For now, ignore them because this isn't an environment building class
    console.log("Doing prediction")
    console.log(pokemon_confirmed)
    console.log(battle_info)
    console.log(score(pokemon_confirmed,battle_info))
    var possible_user_actions = []
    for(var i = 0; i < 4; i++){
        var action = ["move", pokemon_confirmed.user[battle_info.active_pokemon.user].moves[i]]
        possible_user_actions.push(action)
    }
    for (var pokemon in pokemon_confirmed.user){
        if(pokemon == battle_info.active_pokemon.user){
            continue
        }else if(pokemon_confirmed.user[pokemon].status != "Fainted" || pokemon_confirmed.user[pokemon].curHP != 0){
            var action = ["switch", pokemon]
            possible_user_actions.push(action)
        }
    }

    // Now, calculating the opponent's possible actions.
    var possible_opponent_actions = []
    // We know for a fact that the opponent can switch to any non-fainted pokemon.
    for (var pokemon in pokemon_confirmed.opponent){
        if(pokemon == battle_info.active_pokemon.opponent){
            continue
        }else if(pokemon_confirmed.opponent[pokemon].status != "Fainted" || pokemon_confirmed.user[pokemon].curHP != 0){
            var action = ["switch", pokemon]
            possible_opponent_actions.push(action)
        }
    }

    // Moves are a little more complicated. We might know some of the user's moves, but we may not.
    // For those we do:
    if("moves" in pokemon_confirmed.opponent){
        for(var i = 0; i < pokemon_confirmed.opponent[battle_info.active_pokemon.opponent].moves.length-1; i++){
            var action = ["move", pokemon_confirmed.opponent[battle_info.active_pokemon.opponent].moves[i]]
            possible_opponent_actions.push(action)
        }
    }

    var possible_hidden_actions = []
    var hidden_action_probabilities = []
    var probability_sum = 0
    console.log("Active "+battle_info.active_pokemon.opponent)
    console.log(pokemon_confirmed.opponent[battle_info.active_pokemon.opponent])
    if(!("moves" in pokemon_confirmed.opponent[battle_info.active_pokemon.opponent]) || pokemon_confirmed.opponent[battle_info.active_pokemon.opponent].moves.length != 4){
        var opp_poke_usage = usage_stats[battle_info.active_pokemon.opponent]
        for(var move_lower in opp_poke_usage["Moves"]){
            //console.log(move_lower)
            var h_move = MOVES_SM[usage_key_links[move_lower]]
            //console.log(h_move)
            //console.log(pokemon_confirmed.opponent[battle_info.active_pokemon.opponent].moves)
            if("moves" in pokemon_confirmed.opponent[battle_info.active_pokemon.opponent] && h_move){
                var move_exists = false
                for(var move in pokemon_confirmed.opponent[battle_info.active_pokemon.opponent].moves){
                    if(pokemon_confirmed.opponent[battle_info.active_pokemon.opponent].moves[move].name == h_move.name){
                        //console.log("yup")
                        move_exists = true
                    }
                }
                if(move_exists){
                    //console.log("Skipping move due to it already existing in the model")
                    continue
                }

            }
            if(h_move){
                // Some of the items in the array don't exist in my dataset right now, so I'm ignoring them if they aren't
                probability_sum += opp_poke_usage["Moves"][move_lower]
                //console.log(probability_sum)
                possible_hidden_actions.push(["move", h_move])
                hidden_action_probabilities.push(opp_poke_usage["Moves"][move_lower])
            }

        }
    }

    console.log("Action arrays in ", eval_depth)
    console.log(possible_user_actions)
    console.log(possible_opponent_actions)
    console.log(possible_hidden_actions)

    var action_scores = []
    for(var user_action_iter in possible_user_actions){
        console.log("User action:")
        console.log(possible_user_actions[user_action_iter])
        var min_known_action = null
        var min_score = Infinity
        for(var opponent_action_iter in possible_opponent_actions){
            var step_actions = {
                opponent: possible_opponent_actions[opponent_action_iter],
                user: possible_user_actions[user_action_iter]
            }
            //console.log(step_actions)
            var step_res = step(pokemon_confirmed, battle_info, step_actions)
            var temp_model = step_res["model"]
            var temp_battle_info = step_res["battle_info"]
            //console.log(step_res)
            var temp_score = eval_turn(temp_model, temp_battle_info, eval_depth, 1)
            //console.log(temp_score)
            if(temp_score < min_score){
                min_score = temp_score
                min_known_action = opponent_action_iter
            }
        }
        //console.log("Finised scores for action")
        //console.log(possible_user_actions[min_known_action])
        //console.log(min_known_action)

        var hidden_score_sum = 0
        //console.log("hidden score")
        for(var hidden_action_iter in possible_hidden_actions){
            var step_actions = {
                opponent: possible_hidden_actions[hidden_action_iter],
                user: possible_user_actions[user_action_iter]
            }
            /*console.log("Doing hidden action:")
            console.log(step_actions)
            console.log(hidden_action_probabilities[hidden_action_iter])*/
            var step_res = step(pokemon_confirmed, battle_info, step_actions)
            var temp_model = step_res["model"]
            var temp_battle_info = step_res["battle_info"]
            hidden_score_sum += eval_turn(temp_model, temp_battle_info, eval_depth, 1)*hidden_action_probabilities[hidden_action_iter]
        }
        /*console.log("Hidden action sum for player action:")
        console.log(possible_user_actions[user_action_iter])
        console.log((hidden_score_sum/probability_sum))*/
        if((probability_sum != 0) && ((hidden_score_sum/probability_sum) < min_score)){
            // Case: opponent probably has a move that's better than their revealed moves.
            action_scores.push(hidden_score_sum/probability_sum)
            console.log("Worst outcome is with expectimax action:")
            console.log(hidden_score_sum/probability_sum)
            console.log(possible_opponent_actions[min_known_action])
            console.log(min_score)
            console.log(hidden_score_sum)
            console.log(probability_sum)
        }else{
            // Case: an existing option is probably better than any existing hidden option.
            console.log("Worst outcome is with the following opponent action:")
            console.log(possible_opponent_actions[min_known_action])
            action_scores.push(min_score)
        }
    }

    var action_score_pairs = []
    for(var i in action_scores){
        action_score_pairs.push([possible_user_actions[i],action_scores[i]])
    }
    return action_score_pairs
    // TODO: Pair up player actions and opponent actions, create step() the environment.
    // This is both the min and max nodes. Return the current state's eval function if terminal
    // https://moodle.cs.colorado.edu/pluginfile.php/112678/mod_resource/content/1/csci3202_lecture10_Games.pdf
    // If non-terminal, step into this function for real. eval the expectimax node, each of the
    // For those we don't, return a sum of each possible move's score weighted by their probability.
    // denote this as score_other.
    // The opponent

}

function eval_turn(model, battle_info, eval_depth, current_depth){
    // This is a combination of the min, max, and expectimax functions for evaluating a turn, as writing them separately
    // Won't work well due to turns requiring all moves.
    //console.log("EV "+ current_depth)
    //console.log(model)
    //console.log(battle_info)
    if(eval_depth == current_depth){
        return score(model, battle_info)
    }

    var possible_user_actions = []
    for(var i = 0; i < 4; i++){
        var action = ["move", model.user[battle_info.active_pokemon.user].moves[i]]
        possible_user_actions.push(action)
    }
    for (var pokemon in model.user){
        if(pokemon == battle_info.active_pokemon.user){
            continue
        }else if(model.user[pokemon].status != "Fainted" || model.user[pokemon].curHP != 0){
            var action = ["switch", pokemon]
            possible_user_actions.push(action)
        }
    }

    // Now, calculating the opponent's possible actions.
    var possible_opponent_actions = []
    // We know for a fact that the opponent can switch to any non-fainted pokemon.
    for (var pokemon in model.opponent){
        if(pokemon == battle_info.active_pokemon.opponent){
            continue
        }else if(model.opponent[pokemon].status != "Fainted" || model.user[pokemon].curHP != 0){
            var action = ["switch", pokemon]
            possible_opponent_actions.push(action)
        }
    }

    // Moves are a little more complicated. We might know some of the user's moves, but we may not.
    // For those we do:
    if("moves" in model){
        for(var i = 0; i < model.opponent[battle_info.active_pokemon.opponent].moves.length-1; i++){
            var action = ["move", model.opponent[battle_info.active_pokemon.opponent].moves[i]]
            possible_opponent_actions.push(action)
        }
    }

    var possible_hidden_actions = []
    var hidden_action_probabilities = []
    var probability_sum = 0
    if(!("moves" in model && model.opponent[battle_info.active_pokemon].moves.length == 4)){
        var opp_poke_usage = usage_stats[battle_info.active_pokemon.opponent]
        for(var move_lower in opp_poke_usage["Moves"]){
            //console.log(move_lower)
            var h_move = MOVES_SM[usage_key_links[move_lower]]
            if(h_move){
                // Some of the items in the array don't exist in my dataset right now, so I'm ignoring them if they aren't
                probability_sum += opp_poke_usage["Moves"][move_lower]
                possible_hidden_actions.push(["move", h_move])
                hidden_action_probabilities.push(opp_poke_usage["Moves"][move_lower])
            }
        }
    }
    console.log(hidden_action_probabilities)

    /*console.log("Action arrays")
    console.log(possible_user_actions)
    console.log(possible_opponent_actions)
    console.log(possible_hidden_actions)*/

    var action_scores = []
    for(var user_action_iter in possible_user_actions){
        console.log("User action:")
        console.log(possible_user_actions[user_action_iter])
        var min_known_action = null
        var min_score = Infinity
        for(var opponent_action_iter in possible_opponent_actions){
            var step_actions = {
                opponent: possible_opponent_actions[opponent_action_iter],
                user: possible_user_actions[user_action_iter]
            }
            //console.log(step_actions)
            var step_res = step(model, battle_info, step_actions)
            var temp_model = step_res["model"]
            var temp_battle_info = step_res["battle_info"]
            //console.log(step_res)
            var temp_score = eval_turn(temp_model, temp_battle_info, eval_depth, 1)
            //console.log(temp_score)
            if(temp_score < min_score){
                min_score = temp_score
                min_known_action = opponent_action_iter
            }
        }
        //console.log("Finised scores for action")
        //console.log(possible_user_actions[min_known_action])
        //console.log(min_known_action)

        var hidden_score_sum = 0
        for(var hidden_action_iter in possible_hidden_actions){
            var step_actions = {
                opponent: possible_hidden_actions[hidden_action_iter],
                user: possible_user_actions[user_action_iter]
            }
            var step_res = step(model, battle_info, step_actions)
            var temp_model = step_res["model"]
            var temp_battle_info = step_res["battle_info"]
            hidden_score_sum += eval_turn(temp_model, temp_battle_info, eval_depth, 1)*hidden_action_probabilities[hidden_action_iter]
        }

        if((probability_sum != 0) && ((hidden_score_sum/probability_sum) < min_score)){
            // Case: opponent probably has a move that's better than their revealed moves.
            console.log("Worst outcome is an expectimax node:")
            console.log(hidden_score_sum/probability_sum)
            action_scores.push(hidden_score_sum/probability_sum)
        }else{
            // Case: an existing option is probably better than any existing hidden option.
            console.log("Worst outcome is with the following opponent action:")
            console.log(min_known_action)
            action_scores.push(min_score)
        }
    }

    return Math.max.apply(null, action_scores)
}

function score(model, battle_info){
    // A super simple evaluation function.
    var score = 0
    for(var pokemon in model.user){
        score += model.user[pokemon].curHP/model.user[pokemon].maxHP
    }
    for(var pokemon in model.opponent){
        score -= model.opponent[pokemon].curHP/model.opponent[pokemon].maxHP
    }
    return score
}