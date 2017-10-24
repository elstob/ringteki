const _ = require('underscore');

const CardSelector = require('../CardSelector.js');

class AbilityTargetCard {
    constructor(name, properties) {
        this.name = name;
        this.properties = properties;
        this.selector = CardSelector.for(properties);
    }

    canResolve(context) {
        return this.selector.hasEnoughTargets(context);
    }

    resolve(context, pretarget = false) {
        let otherProperties = _.omit(this.properties, 'cardCondition');
        let result = { resolved: false, name: this.name, value: null, costsFirst: false };
        let player = context.player;
        if(this.properties.player && this.properties.player === 'opponent') {
            if(pretarget) {
                result.costsFirst = true;
                return result;
            }
            player = player.opponent;
        }
        let buttons = [];
        if(this.properties.optional) {
            buttons.push({ text: 'No more targets', arg: 'noMoreTargets' });
        }
        if(pretarget) {
            buttons.push({ text: 'Pay costs first', arg: 'costsFirst' });
            buttons.push({ text: 'Cancel', arg: 'done' });
        } else {
            buttons.push({ text: 'Done', arg: 'done' });
        }
        let promptProperties = {
            context: context,
            source: context.source,
            selector: this.selector,
            buttons: buttons,
            onSelect: (player, card) => {
                result.resolved = true;
                result.value = card;
                return true;
            },
            onCancel: () => {
                result.resolved = true;
                return true;
            },
            onMenuCommand: (player, arg) => {
                if(arg === 'costsFirst') {
                    result.costsFirst = true;
                    return true;
                }
                result.resolved = true;
                result.value = arg;
                return true;
            }
        };
        context.game.promptForSelect(player, _.extend(promptProperties, otherProperties));
        return result;
    }
    
    checkTarget(context) {
        if(this.properties.optional || context.targets[this.name] === 'noMoreTargets') {
            return true;
        }
        let cards = context.targets[this.name];
        if(!_.isArray(cards)) {
            cards = [cards];
        }
        return (_.all(cards, card => this.selector.canTarget(card, context)) &&
                this.selector.hasEnoughSelected(cards) &&
                !this.selector.hasExceededLimit(cards));
    }
}

module.exports = AbilityTargetCard;
